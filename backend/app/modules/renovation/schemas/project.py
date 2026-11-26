from datetime import date, datetime

from pydantic import BaseModel, Field, model_validator

from ..models.enums import ProjectStatus
from .common import OptionalText, ORMModel, RequiredText, reject_explicit_nulls
from .contractor import ContractorBrief


class ProjectCreate(BaseModel):
    title: RequiredText(3, 200)
    description: OptionalText(5000) = None
    building: RequiredText(2, 150)
    location: OptionalText(200) = None
    planned_start_date: date | None = None
    planned_end_date: date | None = Field(default=None, description="Project deadline")
    contractor_id: int | None = Field(
        default=None, gt=0, description="Optionally assign an active contractor on creation"
    )

    @model_validator(mode="after")
    def dates_in_order(self) -> "ProjectCreate":
        if (
            self.planned_start_date
            and self.planned_end_date
            and self.planned_end_date < self.planned_start_date
        ):
            raise ValueError("planned_end_date must not be before planned_start_date")
        return self


class ProjectUpdate(BaseModel):
    title: RequiredText(3, 200) | None = None
    description: OptionalText(5000) = None
    building: RequiredText(2, 150) | None = None
    location: OptionalText(200) = None
    planned_start_date: date | None = None
    planned_end_date: date | None = None

    @model_validator(mode="after")
    def required_fields_not_null(self) -> "ProjectUpdate":
        reject_explicit_nulls(self, "title", "building")
        return self


class ProjectBrief(ORMModel):
    id: int
    reference_code: str
    title: str
    building: str
    status: ProjectStatus
    progress_percent: int


class ProjectRead(ORMModel):
    id: int
    reference_code: str
    title: str
    description: str | None
    building: str
    location: str | None
    status: ProjectStatus
    planned_start_date: date | None
    planned_end_date: date | None
    actual_start_date: date | None
    actual_end_date: date | None
    progress_percent: int
    current_phase: str | None
    is_overdue: bool
    current_contractor: ContractorBrief | None
    created_by: str
    created_at: datetime
    updated_at: datetime


class StatusChangeRequest(BaseModel):
    status: ProjectStatus
    reason: OptionalText(500) = Field(
        default=None, description="Required when pausing or cancelling a project"
    )


class StatusHistoryRead(ORMModel):
    id: int
    project_id: int
    from_status: ProjectStatus | None
    to_status: ProjectStatus
    reason: str | None
    changed_by: str
    changed_at: datetime
