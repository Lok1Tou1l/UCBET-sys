from enum import StrEnum


class ContractorStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class ProjectStatus(StrEnum):
    PLANNED = "planned"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


ALLOWED_STATUS_TRANSITIONS: dict[ProjectStatus, frozenset[ProjectStatus]] = {
    ProjectStatus.PLANNED: frozenset({ProjectStatus.ACTIVE, ProjectStatus.CANCELLED}),
    ProjectStatus.ACTIVE: frozenset({ProjectStatus.PAUSED, ProjectStatus.COMPLETED, ProjectStatus.CANCELLED}),
    ProjectStatus.PAUSED: frozenset({ProjectStatus.ACTIVE, ProjectStatus.CANCELLED}),
    ProjectStatus.COMPLETED: frozenset(),
    ProjectStatus.CANCELLED: frozenset(),
}

TERMINAL_STATUSES = frozenset({ProjectStatus.COMPLETED, ProjectStatus.CANCELLED})
OPEN_STATUSES = frozenset(ProjectStatus) - TERMINAL_STATUSES
STATUSES_REQUIRING_REASON = frozenset({ProjectStatus.PAUSED, ProjectStatus.CANCELLED})


class DocumentCategory(StrEnum):
    CONTRACT = "contract"
    PLAN = "plan"
    PERMIT = "permit"
    PHOTO = "photo"
    REPORT = "report"
    OTHER = "other"
