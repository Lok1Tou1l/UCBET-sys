from typing import Annotated, Any

from pydantic import BaseModel, BeforeValidator, ConfigDict, StringConstraints


def blank_to_none(value: Any) -> Any:
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


def RequiredText(min_length: int, max_length: int) -> Any:  # noqa: N802
    return Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=min_length, max_length=max_length)
    ]


def OptionalText(max_length: int) -> Any:  # noqa: N802
    return Annotated[
        Annotated[str, StringConstraints(max_length=max_length)] | None,
        BeforeValidator(blank_to_none),
    ]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Page[T](BaseModel):
    items: list[T]
    total: int
    page: int
    page_size: int


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Any = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"model": ErrorResponse, "description": "Missing or invalid token"},
    403: {"model": ErrorResponse, "description": "Missing permission"},
    404: {"model": ErrorResponse, "description": "Resource not found"},
    409: {"model": ErrorResponse, "description": "Conflict or invalid state transition"},
    422: {"model": ErrorResponse, "description": "Validation failed"},
}


def reject_explicit_nulls(model: BaseModel, *field_names: str) -> None:
    for name in field_names:
        if name in model.model_fields_set and getattr(model, name) is None:
            raise ValueError(f"'{name}' cannot be null")
