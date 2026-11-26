from typing import Annotated

from fastapi import APIRouter, Depends, status

from ....core.security import Permission, Principal
from ....schemas.common import Page
from ....schemas.progress import ProgressCreate, ProgressRead
from ....services import progress as service
from ...deps import DbSession, Pagination, require

router = APIRouter(prefix="/projects/{project_id}/progress", tags=["progress"])


@router.get("", response_model=Page[ProgressRead], summary="Progress history, newest first")
def list_progress(
    project_id: int,
    session: DbSession,
    page: Pagination,
    _: Annotated[Principal, Depends(require(Permission.PROJECTS_READ))],
) -> Page[ProgressRead]:
    items, total = service.history(session, project_id, page)
    return Page(items=items, total=total, page=page.page, page_size=page.page_size)


@router.post(
    "",
    response_model=ProgressRead,
    status_code=status.HTTP_201_CREATED,
    summary="Report progress on an active project",
    description="Progress entries are append-only. Lowering the percentage requires a note.",
)
def report_progress(
    project_id: int,
    payload: ProgressCreate,
    session: DbSession,
    principal: Annotated[Principal, Depends(require(Permission.PROGRESS_WRITE))],
) -> ProgressRead:
    return service.record(session, project_id, payload, principal)
