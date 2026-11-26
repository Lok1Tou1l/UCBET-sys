from typing import Annotated

from fastapi import APIRouter, Depends

from ....core.config import Settings
from ....core.errors import BusinessValidationError, NotFoundError
from ....core.security import Principal, RolePermissionMap, create_access_token
from ....schemas.auth import DevTokenRequest, PrincipalRead, TokenResponse
from ...deps import get_current_principal, get_role_map, get_settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/dev-token",
    response_model=TokenResponse,
    summary="Issue a development token (disabled unless M4_AUTH_DEV_LOGIN_ENABLED=true)",
)
def issue_dev_token(
    payload: DevTokenRequest,
    settings: Annotated[Settings, Depends(get_settings)],
    role_map: Annotated[RolePermissionMap, Depends(get_role_map)],
) -> TokenResponse:
    if not settings.auth_dev_login_enabled:
        raise NotFoundError("Not found")
    unknown = sorted(set(payload.roles) - role_map.roles)
    if unknown:
        raise BusinessValidationError(
            "Unknown roles for this module's role mapping",
            details={"unknown": unknown, "available": sorted(role_map.roles)},
        )
    token = create_access_token(settings, user_id=payload.user_id, roles=payload.roles, name=payload.name)
    return TokenResponse(access_token=token, expires_in=settings.auth_dev_token_ttl_minutes * 60)


@router.get("/me", response_model=PrincipalRead, summary="Current user and resolved module permissions")
def current_user(principal: Annotated[Principal, Depends(get_current_principal)]) -> PrincipalRead:
    return PrincipalRead(
        user_id=principal.user_id,
        display_name=principal.display_name,
        roles=sorted(principal.roles),
        permissions=sorted(principal.permissions),
    )
