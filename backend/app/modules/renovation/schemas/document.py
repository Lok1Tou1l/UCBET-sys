from datetime import datetime

from ..models.enums import DocumentCategory
from .common import ORMModel


class DocumentRead(ORMModel):
    id: int
    project_id: int
    original_filename: str
    content_type: str
    size_bytes: int
    sha256: str
    category: DocumentCategory
    description: str | None
    uploaded_by: str
    uploaded_at: datetime
