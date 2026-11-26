from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status

from ....core.security import Permission, Principal
from ....models import ContractorStatus
from ....repositories.contractors import ContractorFilters
from ....schemas.assignment import ContractorAssignmentRead
from ....schemas.common import Page
from ....schemas.contractor import ContractorCreate, ContractorDetail, ContractorRead, ContractorUpdate
from ....services import contractors as service
from ...deps import DbSession, Pagination, require

router = APIRouter(prefix="/contractors", tags=["contractors"])


@router.get("", response_model=Page[ContractorRead], summary="Search and filter contractors")
def list_contractors(
    session: DbSession,
    page: Pagination,
    _: Annotated[Principal, Depends(require(Permission.CONTRACTORS_READ))],
    q: Annotated[
        str | None,
        Query(max_length=100, description="Matches name, registration, contact, email, city, specialty"),
    ] = None,
    status_: Annotated[ContractorStatus | None, Query(alias="status")] = None,
    specialty: Annotated[str | None, Query(max_length=100)] = None,
    city: Annotated[str | None, Query(max_length=100)] = None,
    sort: Annotated[
        str | None,
        Query(description="company_name, city, status, created_at; prefix with '-' for descending"),
    ] = None,
) -> Page[ContractorRead]:
    filters = ContractorFilters(search=q, status=status_, specialty=specialty, city=city)
    items, total = service.list_contractors(session, filters, page, sort)
    return Page(items=items, total=total, page=page.page, page_size=page.page_size)


@router.post("", response_model=ContractorRead, status_code=status.HTTP_201_CREATED)
def create_contractor(
    payload: ContractorCreate,
    session: DbSession,
    principal: Annotated[Principal, Depends(require(Permission.CONTRACTORS_WRITE))],
) -> ContractorRead:
    return service.create(session, payload, principal)


@router.get("/{contractor_id}", response_model=ContractorDetail)
def get_contractor(
    contractor_id: int,
    session: DbSession,
    _: Annotated[Principal, Depends(require(Permission.CONTRACTORS_READ))],
) -> ContractorDetail:
    return service.get_detail(session, contractor_id)


@router.patch("/{contractor_id}", response_model=ContractorRead)
def update_contractor(
    contractor_id: int,
    payload: ContractorUpdate,
    session: DbSession,
    principal: Annotated[Principal, Depends(require(Permission.CONTRACTORS_WRITE))],
) -> ContractorRead:
    return service.update(session, contractor_id, payload, principal)


@router.delete(
    "/{contractor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a contractor that was never assigned to a project",
)
def delete_contractor(
    contractor_id: int,
    session: DbSession,
    principal: Annotated[Principal, Depends(require(Permission.CONTRACTORS_DELETE))],
) -> Response:
    service.delete(session, contractor_id, principal)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/{contractor_id}/assignments",
    response_model=Page[ContractorAssignmentRead],
    summary="Projects this contractor is or was assigned to",
)
def contractor_assignments(
    contractor_id: int,
    session: DbSession,
    page: Pagination,
    _: Annotated[Principal, Depends(require(Permission.PROJECTS_READ))],
) -> Page[ContractorAssignmentRead]:
    items, total = service.assignment_history(session, contractor_id, page)
    return Page(items=items, total=total, page=page.page, page_size=page.page_size)
