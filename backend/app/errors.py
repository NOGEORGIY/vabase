from __future__ import annotations

from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class ApiError(Exception):
    """Error in the unified format described in the coursework (table 3)."""

    def __init__(
        self,
        status_code: int,
        code: str,
        problem: str,
        message: str,
        field: str | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.status_code = status_code
        self.code = code
        self.problem = problem
        self.message = message
        self.field = field
        self.headers = headers or {}


def error_response(
    status_code: int,
    code: str,
    problem: str,
    message: str,
    field: str | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    body: dict[str, Any] = {
        "code": code,
        "problem": problem,
        "message": message,
    }
    if field:
        body["field"] = field
    return JSONResponse(status_code=status_code, content=body, headers=headers)


def register_error_handlers(app) -> None:
    @app.exception_handler(ApiError)
    async def _api_error(_: Request, exc: ApiError) -> JSONResponse:
        return error_response(
            exc.status_code, exc.code, exc.problem, exc.message, exc.field, exc.headers
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        first = exc.errors()[0] if exc.errors() else {}
        location = [str(part) for part in first.get("loc", []) if part != "body"]
        return error_response(
            422,
            "VALIDATION_ERROR",
            "validation_failed",
            first.get("msg", "Некорректные данные запроса"),
            ".".join(location) or None,
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        detail = exc.detail
        if isinstance(detail, dict) and "code" in detail:
            return error_response(
                exc.status_code,
                detail.get("code", "HTTP_ERROR"),
                detail.get("problem", "http_error"),
                detail.get("message", str(detail)),
                detail.get("field"),
            )
        return error_response(
            exc.status_code,
            "HTTP_ERROR",
            "http_error",
            str(detail),
        )
