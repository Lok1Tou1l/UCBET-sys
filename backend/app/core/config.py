from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/  (this file lives at backend/app/core/config.py)
BASE_DIR = Path(__file__).resolve().parents[2]

SQLITE_PREFIX = "sqlite:///"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str = f"{SQLITE_PREFIX}{BASE_DIR / 'app.db'}"
    SECRET_KEY: str = "change-me"
    UPLOAD_DIR: str = str(BASE_DIR / "storage" / "uploads")

    @field_validator("DATABASE_URL")
    @classmethod
    def make_sqlite_path_absolute(cls, v: str) -> str:
        # sqlite:///./app.db  ->  sqlite:///C:/.../backend/app.db
        if v.startswith(SQLITE_PREFIX) and v != "sqlite://":
            raw = v[len(SQLITE_PREFIX):]
            if raw and raw != ":memory:" and not Path(raw).is_absolute():
                return f"{SQLITE_PREFIX}{(BASE_DIR / raw).resolve().as_posix()}"
        return v

    @field_validator("UPLOAD_DIR")
    @classmethod
    def make_upload_dir_absolute(cls, v: str) -> str:
        p = Path(v)
        return str(p if p.is_absolute() else (BASE_DIR / p).resolve())


settings = Settings()