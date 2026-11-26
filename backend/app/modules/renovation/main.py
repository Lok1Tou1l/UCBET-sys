import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.router import api_router
from .api.v1.endpoints import health
from .core.config import Settings, get_settings
from .core.errors import register_exception_handlers
from .core.security import load_role_permissions
from .db.session import Database
from .services.storage import FileStorage

logger = logging.getLogger(__name__)

API_DESCRIPTION = """
Renovation & Contractor Management for PROGRES 2.0.

Tracks contractors, renovation projects, contractor assignments, status changes, progress
history and project documents, with dashboard aggregates. Every endpoint except `/health`
requires a bearer token; permissions are resolved from the token's roles through a
configurable role mapping.
"""

OPENAPI_TAGS = [
    {"name": "auth", "description": "Token inspection and development token issuing"},
    {"name": "contractors", "description": "Contractor directory"},
    {"name": "projects", "description": "Renovation projects and status lifecycle"},
    {"name": "assignments", "description": "Contractor ↔ project assignment history"},
    {"name": "progress", "description": "Append-only progress reports"},
    {"name": "documents", "description": "Project attachments"},
    {"name": "dashboard", "description": "Aggregates for the renovation dashboard"},
    {"name": "health", "description": "Liveness and database connectivity"},
]


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    database = Database(settings.database_url, echo=settings.database_echo)
    load_role_permissions(settings.role_permissions_file)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        settings.storage_dir.mkdir(parents=True, exist_ok=True)
        if settings.auth_dev_login_enabled:
            logger.warning(
                "Development token endpoint is enabled; do not use this configuration in production"
            )
        yield
        database.dispose()

    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description=API_DESCRIPTION,
        openapi_tags=OPENAPI_TAGS,
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.state.database = database
    app.state.storage = FileStorage(settings.storage_dir, settings.max_upload_size_bytes)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"],
    )
    register_exception_handlers(app)
    app.include_router(health.router)
    app.include_router(api_router, prefix=settings.api_prefix)
    return app


app = create_app()
