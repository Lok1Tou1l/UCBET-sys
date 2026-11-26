from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, BeforeValidator, EmailStr, Field, StringConstraints, model_validator

from ..models.enums import ContractorStatus
from .common import OptionalText, ORMModel, RequiredText, blank_to_none, reject_explicit_nulls


def _normalize_registration(value: object) -> object:
    return value.strip().upper() if isinstance(value, str) else value


RegistrationNumber = Annotated[
    str,
    BeforeValidator(_normalize_registration),
    StringConstraints(min_length=3, max_length=50, pattern=r"^[A-Z0-9][A-Z0-9/\- ]*$"),
]
OptionalEmail = Annotated[EmailStr | None, BeforeValidator(blank_to_none)]
PhoneNumber = Annotated[str, StringConstraints(strip_whitespace=True, pattern=r"^\+?[0-9][0-9 \-]{5,19}$")]


class ContractorCreate(BaseModel):
    company_name: RequiredText(2, 200)
    registration_number: RegistrationNumber = Field(
        description="Trade registry number; stored upper-cased and must be unique."
    )
    contact_name: OptionalText(150) = None
    email: OptionalEmail = None
    phone: PhoneNumber
    address: OptionalText(300) = None
    city: OptionalText(100) = None
    specialty: OptionalText(100) = None
    status: ContractorStatus = ContractorStatus.ACTIVE
    notes: OptionalText(2000) = None


class ContractorUpdate(BaseModel):
    company_name: RequiredText(2, 200) | None = None
    registration_number: RegistrationNumber | None = None
    contact_name: OptionalText(150) = None
    email: OptionalEmail = None
    phone: PhoneNumber | None = None
    address: OptionalText(300) = None
    city: OptionalText(100) = None
    specialty: OptionalText(100) = None
    status: ContractorStatus | None = None
    notes: OptionalText(2000) = None

    @model_validator(mode="after")
    def required_fields_not_null(self) -> "ContractorUpdate":
        reject_explicit_nulls(self, "company_name", "registration_number", "phone", "status")
        return self


class ContractorBrief(ORMModel):
    id: int
    company_name: str
    registration_number: str
    status: ContractorStatus


class ContractorRead(ORMModel):
    id: int
    company_name: str
    registration_number: str
    contact_name: str | None
    email: str | None
    phone: str
    address: str | None
    city: str | None
    specialty: str | None
    status: ContractorStatus
    notes: str | None
    created_by: str
    created_at: datetime
    updated_at: datetime


class ContractorDetail(ContractorRead):
    active_project_count: int
    total_assignment_count: int
