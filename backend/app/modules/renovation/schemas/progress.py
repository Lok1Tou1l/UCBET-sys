from datetime import datetime

from pydantic import BaseModel, Field

from .common import OptionalText, ORMModel


class ProgressCreate(BaseModel):
    percent: int = Field(ge=0, le=100)
    phase: OptionalText(100) = None
    note: OptionalText(2000) = Field(
        default=None, description="Required when the percentage is lower than the current value"
    )


class ProgressRead(ORMModel):
    id: int
    project_id: int
    percent: int
    previous_percent: int
    phase: str | None
    note: str | None
    reported_by: str
    reported_at: datetime
