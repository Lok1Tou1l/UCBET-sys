from pydantic import BaseModel


class RejectedRow(BaseModel):
    line: int
    login_id: str | None = None
    reason: str


class CreatedAccount(BaseModel):
    login_id: str
    email: str
    role: str
    temp_password: str


class ImportReport(BaseModel):
    created: list[CreatedAccount]
    rejected: list[RejectedRow]