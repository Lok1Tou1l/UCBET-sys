from datetime import datetime

from pydantic import BaseModel, Field

from .common import OptionalText, ORMModel, RequiredText
from .contractor import ContractorBrief
from .project import ProjectBrief


class AssignmentCreate(BaseModel):
    contractor_id: int = Field(gt=0)
    note: OptionalText(500) = Field(
        default=None,
        description="Stored on the new assignment and used as the end reason of the previous one",
    )


class AssignmentEnd(BaseModel):
    reason: RequiredText(3, 500)


class AssignmentRead(ORMModel):
    id: int
    project_id: int
    contractor: ContractorBrief
    note: str | None
    assigned_at: datetime
    assigned_by: str
    ended_at: datetime | None
    ended_by: str | None
    end_reason: str | None
    is_active: bool


class ContractorAssignmentRead(ORMModel):
    id: int
    project: ProjectBrief
    assigned_at: datetime
    assigned_by: str
    ended_at: datetime | None
    end_reason: str | None
    is_active: bool
