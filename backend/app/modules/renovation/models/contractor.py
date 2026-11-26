from typing import TYPE_CHECKING

from sqlalchemy import Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import TABLE_PREFIX, Base, TimestampMixin
from .enums import ContractorStatus

if TYPE_CHECKING:
    from .project import ProjectAssignment


class Contractor(TimestampMixin, Base):
    __tablename__ = f"{TABLE_PREFIX}contractors"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_name: Mapped[str] = mapped_column(String(200), index=True)
    registration_number: Mapped[str] = mapped_column(String(50), unique=True)
    contact_name: Mapped[str | None] = mapped_column(String(150))
    email: Mapped[str | None] = mapped_column(String(254))
    phone: Mapped[str] = mapped_column(String(30))
    address: Mapped[str | None] = mapped_column(String(300))
    city: Mapped[str | None] = mapped_column(String(100), index=True)
    specialty: Mapped[str | None] = mapped_column(String(100), index=True)
    status: Mapped[ContractorStatus] = mapped_column(
        Enum(
            ContractorStatus,
            name="contractor_status",
            native_enum=False,
            create_constraint=True,
            length=20,
            values_callable=lambda enum: [member.value for member in enum],
        ),
        default=ContractorStatus.ACTIVE,
        index=True,
    )
    notes: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[str] = mapped_column(String(64))

    assignments: Mapped[list["ProjectAssignment"]] = relationship(
        back_populates="contractor", passive_deletes="all"
    )
