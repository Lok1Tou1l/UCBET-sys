import json

from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.repositories import audit_repository

_FORBIDDEN_KEYS = {"password", "password_hash", "token", "access_token", "secret"}


def record(
    db: Session,
    action: str,
    actor_id: int | None = None,
    entity_type: str | None = None,
    entity_id: int | str | None = None,
    details: dict | None = None,
    ip_address: str | None = None,
) -> AuditLog:
    """Write one audit entry. Sensitive keys are stripped from details."""
    safe = {k: v for k, v in (details or {}).items() if k.lower() not in _FORBIDDEN_KEYS}
    entry = AuditLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        details=json.dumps(safe, ensure_ascii=False) if safe else None,
        ip_address=ip_address,
    )
    audit_repository.add(db, entry)
    db.commit()
    return entry