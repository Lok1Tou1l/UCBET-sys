"""Seed demo users (synthetic data only). Safe to run multiple times."""
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.db import SessionLocal
from app.models.user import User

DEMO_PASSWORD = "Demo#12345"  # demo only, never use in production

DEMO_USERS = [
    ("admin01", "admin@demo.dz", "admin"),
    ("registrar01", "registrar@demo.dz", "registrar"),
    ("teacher01", "teacher@demo.dz", "teacher"),
    ("depthead01", "depthead@demo.dz", "dept_head"),
    ("renov01", "renovation@demo.dz", "renovation"),
    ("20240001", "student1@demo.dz", "student"),
    ("20240002", "student2@demo.dz", "student"),
]


def seed(db: Session) -> int:
    """Create missing demo users. Returns the number of users created."""
    created = 0
    for login_id, email, role in DEMO_USERS:
        if db.query(User).filter(User.login_id == login_id).first():
            continue
        db.add(
            User(
                login_id=login_id,
                email=email,
                role=role,
                password_hash=hash_password(DEMO_PASSWORD),
            )
        )
        created += 1
    db.commit()
    return created


if __name__ == "__main__":
    with SessionLocal() as session:
        print(f"Created {seed(session)} demo users")
