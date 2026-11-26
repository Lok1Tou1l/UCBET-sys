import logging
from collections.abc import Sequence
from pathlib import Path
from typing import BinaryIO

from sqlalchemy.orm import Session

from ..core.errors import NotFoundError
from ..core.security import Principal
from ..models import DocumentCategory, ProjectDocument
from ..repositories import activity
from ..repositories import documents as repo
from ..utils.files import safe_display_filename
from ..utils.time import utcnow
from . import projects as project_service
from .storage import FileStorage

logger = logging.getLogger(__name__)


def get_or_404(session: Session, project_id: int, document_id: int) -> ProjectDocument:
    project_service.get_or_404(session, project_id)
    document = repo.get_active(session, project_id, document_id)
    if document is None:
        raise NotFoundError(f"Document {document_id} not found for project {project_id}")
    return document


def list_documents(
    session: Session, project_id: int, category: DocumentCategory | None
) -> Sequence[ProjectDocument]:
    project_service.get_or_404(session, project_id)
    return repo.list_active(session, project_id, category)


def upload(
    session: Session,
    storage: FileStorage,
    *,
    project_id: int,
    source: BinaryIO,
    filename: str | None,
    category: DocumentCategory,
    description: str | None,
    actor: Principal,
) -> ProjectDocument:
    project = project_service.get_or_404(session, project_id)
    display_name = safe_display_filename(filename)
    stored = storage.save(project.id, source, display_name)

    document = ProjectDocument(
        project_id=project.id,
        original_filename=display_name,
        stored_filename=stored.stored_filename,
        content_type=stored.content_type,
        size_bytes=stored.size_bytes,
        sha256=stored.sha256,
        category=category,
        description=description,
        uploaded_by=actor.user_id,
    )
    try:
        session.add(document)
        session.flush()
        activity.add(
            session,
            actor_id=actor.user_id,
            action="document.uploaded",
            entity_type="document",
            entity_id=document.id,
            project_id=project.id,
            summary=f"'{display_name}' uploaded to {project.reference_code}",
        )
        session.commit()
    except Exception:
        session.rollback()
        storage.delete(project.id, stored.stored_filename)
        raise
    session.refresh(document)
    return document


def resolve_download(
    session: Session, storage: FileStorage, project_id: int, document_id: int
) -> tuple[ProjectDocument, Path]:
    document = get_or_404(session, project_id, document_id)
    path = storage.path_for(project_id, document.stored_filename)
    if not path.is_file():
        logger.error("Stored file missing for document %s (%s)", document.id, path)
        raise NotFoundError("The stored file for this document is missing")
    return document, path


def delete(
    session: Session, storage: FileStorage, project_id: int, document_id: int, actor: Principal
) -> None:
    document = get_or_404(session, project_id, document_id)
    document.deleted_at = utcnow()
    document.deleted_by = actor.user_id
    activity.add(
        session,
        actor_id=actor.user_id,
        action="document.deleted",
        entity_type="document",
        entity_id=document.id,
        project_id=project_id,
        summary=f"'{document.original_filename}' removed from {document.project.reference_code}",
    )
    session.commit()
    storage.delete(project_id, document.stored_filename)
