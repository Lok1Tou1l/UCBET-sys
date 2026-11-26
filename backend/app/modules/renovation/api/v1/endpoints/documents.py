from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile, status
from fastapi.responses import FileResponse

from ....core.security import Permission, Principal
from ....models import DocumentCategory
from ....schemas.common import blank_to_none
from ....schemas.document import DocumentRead
from ....services import documents as service
from ...deps import DbSession, Storage, require

router = APIRouter(prefix="/projects/{project_id}/documents", tags=["documents"])


@router.get("", response_model=list[DocumentRead])
def list_documents(
    project_id: int,
    session: DbSession,
    _: Annotated[Principal, Depends(require(Permission.DOCUMENTS_READ))],
    category: Annotated[DocumentCategory | None, Query()] = None,
) -> list[DocumentRead]:
    return service.list_documents(session, project_id, category)


@router.post(
    "",
    response_model=DocumentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a project document",
    description="Accepted: PDF, PNG, JPEG, DOCX, XLSX. The file content is checked against its "
    "extension; the stored name is generated server-side.",
)
def upload_document(
    project_id: int,
    session: DbSession,
    storage: Storage,
    principal: Annotated[Principal, Depends(require(Permission.DOCUMENTS_WRITE))],
    file: Annotated[UploadFile, File()],
    category: Annotated[DocumentCategory, Form()] = DocumentCategory.OTHER,
    description: Annotated[str | None, Form(max_length=500)] = None,
) -> DocumentRead:
    return service.upload(
        session,
        storage,
        project_id=project_id,
        source=file.file,
        filename=file.filename,
        category=category,
        description=blank_to_none(description),
        actor=principal,
    )


@router.get("/{document_id}", response_model=DocumentRead)
def get_document(
    project_id: int,
    document_id: int,
    session: DbSession,
    _: Annotated[Principal, Depends(require(Permission.DOCUMENTS_READ))],
) -> DocumentRead:
    return service.get_or_404(session, project_id, document_id)


@router.get(
    "/{document_id}/download",
    response_class=FileResponse,
    responses={200: {"content": {"application/octet-stream": {}}}},
)
def download_document(
    project_id: int,
    document_id: int,
    session: DbSession,
    storage: Storage,
    _: Annotated[Principal, Depends(require(Permission.DOCUMENTS_READ))],
    inline: Annotated[bool, Query(description="Use inline disposition for browser preview")] = False,
) -> FileResponse:
    document, path = service.resolve_download(session, storage, project_id, document_id)
    return FileResponse(
        path,
        media_type=document.content_type,
        filename=document.original_filename,
        content_disposition_type="inline" if inline else "attachment",
        headers={"X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store"},
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    project_id: int,
    document_id: int,
    session: DbSession,
    storage: Storage,
    principal: Annotated[Principal, Depends(require(Permission.DOCUMENTS_DELETE))],
) -> Response:
    service.delete(session, storage, project_id, document_id, principal)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
