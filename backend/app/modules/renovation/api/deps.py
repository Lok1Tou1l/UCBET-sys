from collections.abc import Callable, Iterator
from typing import Annotated

from fastapi import Depends, Query, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..core.config import Settings
from ..core.errors import AuthenticationError, PermissionDeniedError
from ..core.security import (
    Permission,
    Principal,
    RolePermissionMap,
    decode_access_token,
    load_role_permissions,
    principal_from_claims,
)
from ..services.storage import FileStorage
from ..utils.pagination import PageRequest

bearer_scheme = HTTPBearer(
    auto_error=False, description="JWT issued by PROGRES 2.0 identity (or the dev token endpoint)"
)


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_db(request: Request) -> Iterator[Session]:
    yield from request.app.state.database.session()


def get_storage(request: Request) -> FileStorage:
    return request.app.state.storage


def get_role_map(settings: Annotated[Settings, Depends(get_settings)]) -> RolePermissionMap:
    return load_role_permissions(settings.role_permissions_file)


def get_current_principal(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    settings: Annotated[Settings, Depends(get_settings)],
    role_map: Annotated[RolePermissionMap, Depends(get_role_map)],
) -> Principal:
    """Integration seam: override this dependency to plug in the main project's authentication."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AuthenticationError("Authentication required")
    claims = decode_access_token(settings, credentials.credentials)
    return principal_from_claims(settings, claims, role_map)


def require(permission: Permission) -> Callable[..., Principal]:
    def dependency(principal: Annotated[Principal, Depends(get_current_principal)]) -> Principal:
        if not principal.has(permission):
            raise PermissionDeniedError(
                "You do not have permission to perform this action",
                details={"required_permission": permission.value},
            )
        return principal

    dependency.__name__ = f"require_{permission.name.lower()}"
    return dependency


def page_params(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> PageRequest:
    return PageRequest(page=page, page_size=page_size)


DbSession = Annotated[Session, Depends(get_db)]
Storage = Annotated[FileStorage, Depends(get_storage)]
Pagination = Annotated[PageRequest, Depends(page_params)]
