from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/  (هذا الملف في backend/app/core/config.py)
BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",   # نتجاهل متغيرات الواجهة مثل NEXT_PUBLIC_API_URL
    )

    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'app.db'}"
    SECRET_KEY: str = "change-me"
    UPLOAD_DIR: str = str(BASE_DIR / "storage" / "uploads")


settings = Settings()