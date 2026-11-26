from typing import Annotated

from fastapi import APIRouter, Depends, Query

from ....core.security import Permission
from ....models import ContractorStatus, ProjectStatus
from ....models.enums import OPEN_STATUSES
from ....schemas.dashboard import (
    ActivityRead,
    ContractorStatsRow,
    DashboardSummary,
    ProgressOverviewRow,
)
from ....services import dashboard as service
from ...deps import DbSession, require

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
    dependencies=[Depends(require(Permission.DASHBOARD_READ))],
)


@router.get("/summary", response_model=DashboardSummary, summary="Project and contractor totals")
def summary(session: DbSession) -> DashboardSummary:
    return service.summary(session)


@router.get(
    "/contractors",
    response_model=list[ContractorStatsRow],
    summary="Per-contractor project counts, busiest first",
)
def contractor_stats(
    session: DbSession,
    status_: Annotated[ContractorStatus | None, Query(alias="status")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> list[ContractorStatsRow]:
    return service.contractor_stats(session, status_, limit)


@router.get(
    "/progress",
    response_model=list[ProgressOverviewRow],
    summary="Progress and deadlines of open projects, nearest deadline first",
)
def progress_overview(
    session: DbSession,
    status_: Annotated[list[ProjectStatus] | None, Query(alias="status")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> list[ProgressOverviewRow]:
    statuses = tuple(status_) if status_ else tuple(sorted(OPEN_STATUSES))
    return service.progress_overview(session, statuses, limit)


@router.get("/recent-activity", response_model=list[ActivityRead])
def recent_activity(
    session: DbSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    project_id: Annotated[int | None, Query(gt=0)] = None,
) -> list[ActivityRead]:
    return service.recent_activity(session, limit, project_id)
