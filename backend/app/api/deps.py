from __future__ import annotations

from collections.abc import Callable
from typing import Any
from uuid import uuid4

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import ApiError
from app.models import User
from app.security import get_user_by_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or not credentials.credentials:
        raise ApiError(
            401,
            "UNAUTHORIZED",
            "missing_credentials",
            "Требуется авторизация: передайте токен в заголовке Authorization",
        )
    user = get_user_by_token(db, credentials.credentials)
    if user is None:
        raise ApiError(
            401,
            "UNAUTHORIZED",
            "invalid_token",
            "Сессия не найдена или истекла, войдите заново",
        )
    return user


def require_role(*roles: str) -> Callable[..., User]:
    def dependency(user: User = Depends(get_current_user)) -> User:
        if roles and user.role not in roles:
            raise ApiError(
                403,
                "FORBIDDEN",
                "insufficient_role",
                "Недостаточно прав для выполнения операции",
            )
        return user

    return dependency


def new_id() -> str:
    return str(uuid4())


def get_or_404(db: Session, model: Any, item_id: str, label: str) -> Any:
    item = db.get(model, item_id)
    if item is None:
        raise ApiError(404, "NOT_FOUND", "not_found", f"{label} не найден")
    return item


def list_items(
    db: Session,
    model: Any,
    *,
    q: str = "",
    search_fields: tuple[str, ...] = (),
    limit: int = 100,
    offset: int = 0,
    filters: tuple[tuple[str, Any], ...] = (),
) -> tuple[list[Any], int]:
    conditions = []
    if q and search_fields:
        conditions.append(
            or_(*[getattr(model, field).ilike(f"%{q}%") for field in search_fields])
        )
    for field, value in filters:
        if value is not None:
            conditions.append(getattr(model, field) == value)

    stmt = select(model)
    count_stmt = select(func.count()).select_from(model)
    for condition in conditions:
        stmt = stmt.where(condition)
        count_stmt = count_stmt.where(condition)

    total = int(db.scalar(count_stmt) or 0)
    items = list(
        db.scalars(
            stmt.order_by(model.created_at.desc()).limit(limit).offset(offset)
        ).all()
    )
    return items, total


def apply_updates(obj: Any, payload: dict[str, Any]) -> None:
    for field, value in payload.items():
        setattr(obj, field, value)
