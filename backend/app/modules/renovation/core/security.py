import json
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from functools import lru_cache
from pathlib import Path
from typing import Any

import jwt

from .config import Settings
from .errors import AuthenticationError

WILDCARD = "*"


class Permission(StrEnum):
    CONTRACTORS_READ = "contractors:read"
    CONTRACTORS_WRITE = "contractors:write"
    CONTRACTORS_DELETE = "contractors:delete"
    PROJECTS_READ = "projects:read"
    PROJECTS_WRITE = "projects:write"
    PROJECTS_DELETE = "projects:delete"
    PROJECTS_STATUS = "projects:status"
    PROJECTS_ASSIGN = "projects:assign"
    PROGRESS_WRITE = "progress:write"
    DOCUMENTS_READ = "documents:read"
    DOCUMENTS_WRITE = "documents:write"
    DOCUMENTS_DELETE = "documents:delete"
    DASHBOARD_READ = "dashboard:read"


KNOWN_PERMISSIONS = frozenset(p.value for p in Permission) | {WILDCARD}


@dataclass(frozen=True)
class Principal:
    user_id: str
    roles: frozenset[str] = field(default_factory=frozenset)
    permissions: frozenset[str] = field(default_factory=frozenset)
    display_name: str | None = None

    def has(self, permission: Permission | str) -> bool:
        return WILDCARD in self.permissions or str(permission) in self.permissions


class RolePermissionMap:
    def __init__(self, mapping: Mapping[str, Iterable[str]]) -> None:
        self._mapping: dict[str, frozenset[str]] = {}
        for role, permissions in mapping.items():
            perms = frozenset(permissions)
            unknown = perms - KNOWN_PERMISSIONS
            if unknown:
                raise ValueError(f"Role '{role}' references unknown permissions: {sorted(unknown)}")
            self._mapping[role] = perms

    @classmethod
    def from_file(cls, path: Path) -> "RolePermissionMap":
        data = json.loads(path.read_text(encoding="utf-8"))
        roles = data.get("roles")
        if not isinstance(roles, dict):
            raise ValueError(f"{path} must contain a top-level 'roles' object")
        return cls(roles)

    @property
    def roles(self) -> frozenset[str]:
        return frozenset(self._mapping)

    def permissions_for(self, roles: Iterable[str]) -> frozenset[str]:
        granted: set[str] = set()
        for role in roles:
            granted |= self._mapping.get(role, frozenset())
        return frozenset(granted)


@lru_cache
def load_role_permissions(path: Path) -> RolePermissionMap:
    return RolePermissionMap.from_file(path)


def create_access_token(
    settings: Settings,
    *,
    user_id: str,
    roles: Iterable[str],
    name: str | None = None,
    expires_in: timedelta | None = None,
) -> str:
    now = datetime.now(UTC)
    expires_in = expires_in or timedelta(minutes=settings.auth_dev_token_ttl_minutes)
    claims: dict[str, Any] = {
        settings.auth_user_id_claim: user_id,
        settings.auth_roles_claim: sorted(set(roles)),
        "iat": now,
        "exp": now + expires_in,
    }
    if name:
        claims[settings.auth_name_claim] = name
    if settings.auth_issuer:
        claims["iss"] = settings.auth_issuer
    if settings.auth_audience:
        claims["aud"] = settings.auth_audience
    return jwt.encode(claims, settings.auth_secret_key, algorithm=settings.auth_algorithm)


def decode_access_token(settings: Settings, token: str) -> dict[str, Any]:
    try:
        return jwt.decode(
            token,
            settings.auth_secret_key,
            algorithms=[settings.auth_algorithm],
            issuer=settings.auth_issuer,
            audience=settings.auth_audience,
            options={"require": ["exp"], "verify_aud": settings.auth_audience is not None},
        )
    except jwt.ExpiredSignatureError as exc:
        raise AuthenticationError("Token has expired") from exc
    except jwt.InvalidTokenError as exc:
        raise AuthenticationError("Invalid authentication token") from exc


def _parse_roles(raw: Any) -> frozenset[str]:
    if raw is None:
        return frozenset()
    if isinstance(raw, str):
        return frozenset(part for part in raw.replace(",", " ").split() if part)
    if isinstance(raw, (list, tuple, set)):
        return frozenset(str(role) for role in raw)
    raise AuthenticationError("Token roles claim has an unsupported format")


def principal_from_claims(
    settings: Settings, claims: Mapping[str, Any], role_map: RolePermissionMap
) -> Principal:
    user_id = claims.get(settings.auth_user_id_claim)
    if user_id is None or str(user_id).strip() == "":
        raise AuthenticationError("Token is missing the user identifier claim")
    roles = _parse_roles(claims.get(settings.auth_roles_claim))
    return Principal(
        user_id=str(user_id),
        roles=roles,
        permissions=role_map.permissions_for(roles),
        display_name=claims.get(settings.auth_name_claim),
    )
