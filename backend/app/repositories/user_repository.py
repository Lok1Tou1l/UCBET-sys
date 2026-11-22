from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


def get_by_login_id(db: Session, login_id: str) -> User | None:
    return db.scalar(select(User).where(User.login_id == login_id))