from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


def get_by_login_id(db: Session, login_id: str) -> User | None:
    return db.scalar(select(User).where(User.login_id == login_id))
def get_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)
def add(db: Session, user: User) -> User:
    db.add(user)
    db.flush()
    return user