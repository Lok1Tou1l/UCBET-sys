from collections.abc import Iterator
from pathlib import Path

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker


def _enable_sqlite_foreign_keys(dbapi_connection, _record) -> None:
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def build_engine(database_url: str, *, echo: bool = False) -> Engine:
    is_sqlite = database_url.startswith("sqlite")
    if is_sqlite and database_url != "sqlite:///:memory:":
        Path(database_url.removeprefix("sqlite:///")).parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(
        database_url,
        echo=echo,
        connect_args={"check_same_thread": False} if is_sqlite else {},
    )
    if is_sqlite:
        event.listen(engine, "connect", _enable_sqlite_foreign_keys)
    return engine


class Database:
    def __init__(self, database_url: str, *, echo: bool = False) -> None:
        self.engine = build_engine(database_url, echo=echo)
        self.session_factory = sessionmaker(bind=self.engine, autoflush=False, expire_on_commit=True)

    def session(self) -> Iterator[Session]:
        session = self.session_factory()
        try:
            yield session
        finally:
            session.close()

    def dispose(self) -> None:
        self.engine.dispose()
