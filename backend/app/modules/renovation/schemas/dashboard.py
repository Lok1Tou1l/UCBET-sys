from datetime import date, datetime

from pydantic import BaseModel

from ..models.enums import ContractorStatus, ProjectStatus
from .common import ORMModel
from .contractor import ContractorBrief


class ProjectStats(BaseModel):
    total: int
    by_status: dict[ProjectStatus, int]
    overdue: int
    average_progress_active: float | None


class ContractorTotals(BaseModel):
    total: int
    by_status: dict[ContractorStatus, int]
    with_open_projects: int


class DashboardSummary(BaseModel):
    projects: ProjectStats
    contractors: ContractorTotals
    documents_total: int
    progress_updates_last_30_days: int


class ContractorStatsRow(BaseModel):
    contractor: ContractorBrief
    open_projects: int
    completed_projects: int
    total_projects: int


class ProgressOverviewRow(BaseModel):
    project_id: int
    reference_code: str
    title: str
    building: str
    status: ProjectStatus
    progress_percent: int
    current_phase: str | None
    planned_end_date: date | None
    days_remaining: int | None
    is_overdue: bool
    last_progress_at: datetime | None


class ActivityRead(ORMModel):
    id: int
    actor_id: str
    action: str
    entity_type: str
    entity_id: int
    project_id: int | None
    summary: str
    created_at: datetime
