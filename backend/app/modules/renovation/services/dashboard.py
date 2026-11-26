from collections.abc import Sequence
from datetime import timedelta

from sqlalchemy.orm import Session

from ..models import ActivityLog, ContractorStatus, ProjectStatus
from ..repositories import activity
from ..repositories import dashboard as repo
from ..schemas.contractor import ContractorBrief
from ..schemas.dashboard import (
    ContractorStatsRow,
    ContractorTotals,
    DashboardSummary,
    ProgressOverviewRow,
    ProjectStats,
)
from ..utils.time import today, utcnow


def summary(session: Session) -> DashboardSummary:
    project_counts = repo.project_counts_by_status(session)
    contractor_counts = repo.contractor_counts_by_status(session)
    return DashboardSummary(
        projects=ProjectStats(
            total=sum(project_counts.values()),
            by_status={status: project_counts.get(status, 0) for status in ProjectStatus},
            overdue=repo.overdue_project_count(session),
            average_progress_active=repo.average_active_progress(session),
        ),
        contractors=ContractorTotals(
            total=sum(contractor_counts.values()),
            by_status={status: contractor_counts.get(status, 0) for status in ContractorStatus},
            with_open_projects=repo.contractors_with_open_projects(session),
        ),
        documents_total=repo.active_document_count(session),
        progress_updates_last_30_days=repo.progress_updates_since(session, utcnow() - timedelta(days=30)),
    )


def contractor_stats(
    session: Session, status: ContractorStatus | None, limit: int
) -> list[ContractorStatsRow]:
    return [
        ContractorStatsRow(
            contractor=ContractorBrief.model_validate(contractor),
            open_projects=open_projects,
            completed_projects=completed_projects,
            total_projects=total_projects,
        )
        for contractor, open_projects, completed_projects, total_projects in repo.contractor_stats(
            session, status=status, limit=limit
        )
    ]


def progress_overview(
    session: Session, statuses: tuple[ProjectStatus, ...], limit: int
) -> list[ProgressOverviewRow]:
    reference = today()
    rows = []
    for project, last_progress_at in repo.progress_overview(session, statuses=statuses, limit=limit):
        deadline = project.planned_end_date
        rows.append(
            ProgressOverviewRow(
                project_id=project.id,
                reference_code=project.reference_code,
                title=project.title,
                building=project.building,
                status=project.status,
                progress_percent=project.progress_percent,
                current_phase=project.current_phase,
                planned_end_date=deadline,
                days_remaining=(deadline - reference).days if deadline else None,
                is_overdue=project.is_overdue,
                last_progress_at=last_progress_at,
            )
        )
    return rows


def recent_activity(session: Session, limit: int, project_id: int | None) -> Sequence[ActivityLog]:
    return activity.recent(session, limit=limit, project_id=project_id)
