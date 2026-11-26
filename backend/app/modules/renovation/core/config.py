from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

MODULE_ROOT = Path(__file__).resolve().parents[2]

DEV_SECRET_KEY = "dev-only-insecure-secret-change-me-0123456789"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="M4_",
        env_file=MODULE_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "PROGRES 2.0 — Renovation & Contractor Management (Module 4)"
    environment: Literal["development", "test", "production"] = "development"
    api_prefix: str = "/api/v1/renovation"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    database_url: str = "sqlite:///data/module4.db"
    database_echo: bool = False

    storage_dir: Path = Path("storage/uploads")
    max_upload_size_mb: int = Field(default=10, ge=1, le=100)

    auth_secret_key: str = DEV_SECRET_KEY
    auth_algorithm: str = "HS256"
    auth_issuer: str | None = None
    auth_audience: str | None = None
    auth_user_id_claim: str = "sub"
    auth_roles_claim: str = "roles"
    auth_name_claim: str = "name"
    auth_dev_login_enabled: bool = False
    auth_dev_token_ttl_minutes: int = Field(default=480, ge=1)
    role_permissions_file: Path = Path("config/role_permissions.dev.json")

    @field_validator("auth_issuer", "auth_audience", mode="before")
    @classmethod
    def blank_as_unset(cls, value: str | None) -> str | None:
        return value.strip() or None if isinstance(value, str) else value

    @field_validator("storage_dir", "role_permissions_file")
    @classmethod
    def resolve_against_module_root(cls, value: Path) -> Path:
        return value if value.is_absolute() else (MODULE_ROOT / value).resolve()

    @field_validator("database_url")
    @classmethod
    def resolve_sqlite_path(cls, value: str) -> str:
        prefix = "sqlite:///"
        if not value.startswith(prefix) or value == "sqlite:///:memory:":
            return value
        path = Path(value.removeprefix(prefix))
        if path.is_absolute():
            return value
        return prefix + (MODULE_ROOT / path).resolve().as_posix()

    @model_validator(mode="after")
    def refuse_unsafe_production_config(self) -> "Settings":
        if self.environment != "production":
            return self
        if self.auth_dev_login_enabled:
            raise ValueError("M4_AUTH_DEV_LOGIN_ENABLED must be false in production")
        if self.auth_secret_key == DEV_SECRET_KEY:
            raise ValueError("M4_AUTH_SECRET_KEY must be set in production")
        return self

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    return Settings()
