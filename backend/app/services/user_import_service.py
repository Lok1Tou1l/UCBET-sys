import csv
import io
import re
import secrets

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.repositories import user_repository
from app.schemas.user_import import CreatedAccount, ImportReport, RejectedRow
from app.services import audit_service

ALLOWED_ROLES = {"student", "teacher", "registrar", "dept_head", "renovation", "admin"}
REQUIRED_COLUMNS = {"login_id", "email", "role"}
MAX_ROWS = 5000
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class ImportError_(Exception):
    pass


def import_users(db: Session, content: bytes, actor_id: int) -> ImportReport:
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise ImportError_("File must be UTF-8 encoded")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames or not REQUIRED_COLUMNS.issubset(
        {f.strip().lower() for f in reader.fieldnames}
    ):
        raise ImportError_("CSV must have columns: login_id,email,role")

    created: list[CreatedAccount] = []
    rejected: list[RejectedRow] = []
    seen: set[str] = set()

    for line, raw in enumerate(reader, start=2):
        if line - 1 > MAX_ROWS:
            raise ImportError_(f"Too many rows (max {MAX_ROWS})")
        row = {(k or "").strip().lower(): (v or "").strip() for k, v in raw.items()}
        login_id, email, role = row.get("login_id", ""), row.get("email", ""), row.get("role", "")

        reason = None
        if not login_id or len(login_id) > 30:
            reason = "Invalid login_id"
        elif not _EMAIL_RE.match(email) or len(email) > 120:
            reason = "Invalid email"
        elif role not in ALLOWED_ROLES:
            reason = "Invalid role"
        elif login_id in seen or user_repository.get_by_login_id(db, login_id):
            reason = "Duplicate login_id"

        if reason:
            rejected.append(RejectedRow(line=line, login_id=login_id or None, reason=reason))
            continue

        seen.add(login_id)
        temp = secrets.token_urlsafe(9)
        user_repository.add(
            db,
            User(login_id=login_id, email=email, role=role, password_hash=hash_password(temp)),
        )
        created.append(CreatedAccount(login_id=login_id, email=email, role=role, temp_password=temp))

    audit_service.record(
        db,
        "users.import",
        actor_id=actor_id,
        details={"created": len(created), "rejected": len(rejected)},
    )
    db.commit()
    return ImportReport(created=created, rejected=rejected)