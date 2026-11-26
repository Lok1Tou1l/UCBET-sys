from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import DocumentCategory, ProjectDocument


def get_active(session: Session, project_id: int, document_id: int) -> ProjectDocument | None:
    return session.scalar(
        select(ProjectDocument).where(
            ProjectDocument.id == document_id,
            ProjectDocument.project_id == project_id,
            ProjectDocument.deleted_at.is_(None),
        )
    )


def list_active(
    session: Session, project_id: int, category: DocumentCategory | None = None
) -> Sequence[ProjectDocument]:
    stmt = select(ProjectDocument).where(
        ProjectDocument.project_id == project_id, ProjectDocument.deleted_at.is_(None)
    )
    if category:
        stmt = stmt.where(ProjectDocument.category == category)
    return session.scalars(stmt.order_by(ProjectDocument.uploaded_at.desc(), ProjectDocument.id.desc())).all()


def stored_filenames(session: Session, project_id: int) -> Sequence[str]:
    return session.scalars(
        select(ProjectDocument.stored_filename).where(
            ProjectDocument.project_id == project_id, ProjectDocument.deleted_at.is_(None)
        )
    ).all()
