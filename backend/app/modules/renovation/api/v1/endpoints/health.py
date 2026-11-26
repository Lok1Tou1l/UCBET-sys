from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from ...deps import DbSession

router = APIRouter(tags=["health"])


@router.get("/health", summary="Service and database health check")
def health(session: DbSession) -> JSONResponse:
    try:
        session.execute(text("SELECT 1"))
        database = "ok"
    except SQLAlchemyError:
        database = "unavailable"
    healthy = database == "ok"
    return JSONResponse(
        status_code=200 if healthy else 503,
        content={"status": "ok" if healthy else "degraded", "module": "renovation", "database": database},
    )
