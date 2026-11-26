from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import ActivityLog


def add(
    session: Session,
    *,
    actor_id: str,
    action: str,
    entity_type: str,
    entity_id: int,
    summary: str,
    project_id: int | None = None,
) -> ActivityLog:
    entry = ActivityLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        project_id=project_id,
        summary=summary[:300],
    )
    session.add(entry)
    return entry


def recent(session: Session, *, limit: int, project_id: int | None = None) -> Sequence[ActivityLog]:
    stmt = select(ActivityLog)
    if project_id is not None:
        stmt = stmt.where(ActivityLog.project_id == project_id)
    return session.scalars(
        stmt.order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc()).limit(limit)
    ).all()
