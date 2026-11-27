from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.security import verify_password
from app.db.db import Base
from app.models.user import User
from app.seed import DEMO_PASSWORD, DEMO_USERS, seed


def make_db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def test_seed_creates_all_users():
    db = make_db()
    assert seed(db) == len(DEMO_USERS)
    assert db.query(User).count() == len(DEMO_USERS)


def test_seed_is_idempotent():
    db = make_db()
    seed(db)
    assert seed(db) == 0
    assert db.query(User).count() == len(DEMO_USERS)


def test_seeded_password_is_hashed_and_valid():
    db = make_db()
    seed(db)
    user = db.query(User).filter(User.login_id == "teacher01").one()
    assert user.password_hash != DEMO_PASSWORD
    assert verify_password(DEMO_PASSWORD, user.password_hash)
