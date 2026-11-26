from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import TABLE_PREFIX, Base
from ..db.types import UTCDateTime
from ..utils.time import utcnow
from .enums import DocumentCategory
from .project import RenovationProject


class ProjectDocument(Base):
    __tablename__ = f"{TABLE_PREFIX}project_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey(f"{TABLE_PREFIX}projects.id", ondelete="CASCADE"), index=True
    )
    original_filename: Mapped[str] = mapped_column(String(255))
    stored_filename: Mapped[str] = mapped_column(String(80), unique=True)
    content_type: Mapped[str] = mapped_column(String(120))
    size_bytes: Mapped[int] = mapped_column(Integer)
    sha256: Mapped[str] = mapped_column(String(64))
    category: Mapped[DocumentCategory] = mapped_column(
        Enum(
            DocumentCategory,
            name="document_category",
            native_enum=False,
            create_constraint=True,
            length=20,
            values_callable=lambda enum: [member.value for member in enum],
        ),
        default=DocumentCategory.OTHER,
    )
    description: Mapped[str | None] = mapped_column(String(500))
    uploaded_by: Mapped[str] = mapped_column(String(64))
    uploaded_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    deleted_by: Mapped[str | None] = mapped_column(String(64))

    project: Mapped[RenovationProject] = relationship(back_populates="documents")
