from fastapi import APIRouter

from ..schemas.common import ERROR_RESPONSES
from .v1.endpoints import assignments, auth, contractors, dashboard, documents, progress, projects

api_router = APIRouter(responses=ERROR_RESPONSES)
api_router.include_router(auth.router)
api_router.include_router(contractors.router)
api_router.include_router(projects.router)
api_router.include_router(assignments.router)
api_router.include_router(progress.router)
api_router.include_router(documents.router)
api_router.include_router(dashboard.router)
