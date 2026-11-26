from datetime import datetime

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..db.base import TABLE_PREFIX, Base
from ..db.types import UTCDateTime
from ..utils.time import utcnow


class ActivityLog(Base):
    """Append-only module audit trail. project_id has no FK so entries survive project deletion."""

    __tablename__ = f"{TABLE_PREFIX}activity_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    actor_id: Mapped[str] = mapped_column(String(64), index=True)
    action: Mapped[str] = mapped_column(String(50), index=True)
    entity_type: Mapped[str] = mapped_column(String(30))
    entity_id: Mapped[int] = mapped_column(Integer)
    project_id: Mapped[int | None] = mapped_column(Integer, index=True)
    summary: Mapped[str] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, index=True)
