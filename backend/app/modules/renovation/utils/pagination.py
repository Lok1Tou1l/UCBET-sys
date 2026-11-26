from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from ..core.errors import BusinessValidationError


@dataclass(frozen=True)
class PageRequest:
    page: int = 1
    page_size: int = 20

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


def paginate(session: Session, stmt: Select[Any], page: PageRequest) -> tuple[Sequence[Any], int]:
    total = session.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    items = session.scalars(stmt.offset(page.offset).limit(page.page_size)).unique().all()
    return items, total


def apply_sort(stmt: Select[Any], sort: str | None, columns: Mapping[str, Any], default: str) -> Select[Any]:
    """`sort` is a field name, optionally prefixed with '-' for descending order."""
    key = sort or default
    descending = key.startswith("-")
    field = key.lstrip("-")
    if field not in columns:
        raise BusinessValidationError(
            f"Unsupported sort field '{field}'", details={"allowed": sorted(columns)}
        )
    column = columns[field]
    return stmt.order_by(column.desc() if descending else column.asc(), *_tiebreaker(columns))


def _tiebreaker(columns: Mapping[str, Any]) -> tuple[Any, ...]:
    return (columns["id"].desc(),) if "id" in columns else ()


def like_pattern(term: str) -> str:
    escaped = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"
