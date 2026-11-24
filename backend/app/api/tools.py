from __future__ import annotations

import re
from typing import Any
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import apply_updates, get_current_user, get_or_404, list_items, new_id
from app.database import get_db
from app.errors import ApiError
from app.models import Tool, User
from app.schemas import (
    ToolCheck,
    ToolCreate,
    ToolOut,
    ToolSearchHit,
    ToolSearchOut,
    ToolUpdate,
    ToolValidationOut,
)

router = APIRouter(prefix="/tools", tags=["tools"])

_WORD_RE = re.compile(r"[0-9a-zA-Zа-яА-ЯёЁ]{3,}")


def _tokens(text: str) -> list[str]:
    return [token.lower() for token in _WORD_RE.findall(text or "")]


def _validate(tool: Tool) -> list[ToolCheck]:
    checks: list[ToolCheck] = []

    checks.append(
        ToolCheck(
            id="name",
            label="Имя инструмента заполнено",
            status="ok" if tool.name.strip() else "error",
            message="" if tool.name.strip() else "Укажите имя инструмента",
        )
    )
    checks.append(
        ToolCheck(
            id="description",
            label="Описание понятно модели",
            status="ok" if len(tool.description.strip()) >= 10 else "warning",
            message=""
            if len(tool.description.strip()) >= 10
            else "Опишите назначение инструмента подробнее (не менее 10 символов)",
        )
    )

    endpoint_ok = True
    if tool.tool_type in {"http", "webhook", "mcp"}:
        parsed = urlparse(tool.endpoint)
        endpoint_ok = parsed.scheme in {"http", "https"} and bool(parsed.netloc)
    checks.append(
        ToolCheck(
            id="endpoint",
            label="Адрес вызова доступен",
            status="ok" if endpoint_ok else "error",
            message="" if endpoint_ok else "Укажите корректный http(s)-адрес вызова",
        )
    )

    schema = tool.input_schema or {}
    schema_ok = (
        isinstance(schema, dict)
        and schema.get("type") == "object"
        and isinstance(schema.get("properties", {}), dict)
    )
    checks.append(
        ToolCheck(
            id="schema",
            label="JSON-схема параметров корректна",
            status="ok" if schema_ok else "error",
            message=""
            if schema_ok
            else 'Схема должна быть объектом: {"type": "object", "properties": {...}}',
        )
    )

    version_ok = bool(re.fullmatch(r"\d+\.\d+(\.\d+)?", tool.version or ""))
    checks.append(
        ToolCheck(
            id="version",
            label="Версия в формате semver",
            status="ok" if version_ok else "error",
            message="" if version_ok else "Используйте формат 1.0.0",
        )
    )
    return checks


@router.get("", response_model=dict)
def list_tools(
    q: str = Query(default="", max_length=200),
    tool_type: str | None = Query(default=None),
    status: str | None = Query(default=None),
    project_id: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    filters: list[tuple[str, Any]] = []
    if tool_type:
        filters.append(("tool_type", tool_type))
    if status:
        filters.append(("status", status))
    if project_id:
        filters.append(("project_id", project_id))
    items, total = list_items(
        db,
        Tool,
        q=q,
        search_fields=("name", "description", "endpoint"),
        limit=limit,
        offset=offset,
        filters=tuple(filters),
    )
    return {
        "items": [ToolOut.model_validate(tool).model_dump(mode="json") for tool in items],
        "total": total,
    }


@router.get("/search", response_model=ToolSearchOut)
def search_tools(
    q: str = Query(min_length=2, max_length=500),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ToolSearchOut:
    """Rank tools for a task description.

    This is the lookup contract the future agent dispatcher will call. The
    implementation starts with lexical matching and can be replaced by vectors
    without changing the endpoint.
    """

    query_tokens = set(_tokens(q))
    tools = list(
        db.scalars(select(Tool).where(Tool.status.in_(("published", "active", "validated")))).all()
    )
    ranked: list[tuple[float, list[str], Tool]] = []
    for tool in tools:
        matched: set[str] = set()
        score = 0.0
        for value, weight in (
            (tool.name, 3.0),
            (tool.description, 2.0),
            (" ".join(tool.input_schema.get("properties", {}).keys()), 1.0),
        ):
            overlap = set(_tokens(value)) & query_tokens
            if overlap:
                matched |= overlap
                score += weight * len(overlap) / max(len(query_tokens), 1)
        if score > 0:
            ranked.append((round(score, 3), sorted(matched), tool))
    ranked.sort(key=lambda row: row[0], reverse=True)
    return ToolSearchOut(
        query=q,
        items=[
            ToolSearchHit(
                tool=ToolOut.model_validate(tool),
                score=score,
                matched_terms=matched,
            )
            for score, matched, tool in ranked[:limit]
        ],
    )


@router.get("/{tool_id}", response_model=ToolOut)
def get_tool(
    tool_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Tool:
    return get_or_404(db, Tool, tool_id, "Инструмент")


@router.post("", response_model=ToolOut, status_code=201)
def create_tool(
    payload: ToolCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Tool:
    tool = Tool(id=new_id(), **payload.model_dump())
    db.add(tool)
    db.commit()
    db.refresh(tool)
    return tool


@router.patch("/{tool_id}", response_model=ToolOut)
def update_tool(
    tool_id: str,
    payload: ToolUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Tool:
    tool = get_or_404(db, Tool, tool_id, "Инструмент")
    apply_updates(tool, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(tool)
    return tool


@router.delete("/{tool_id}", status_code=204)
def delete_tool(
    tool_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Response:
    tool = get_or_404(db, Tool, tool_id, "Инструмент")
    db.delete(tool)
    db.commit()
    return Response(status_code=204)


@router.post("/{tool_id}/validate", response_model=ToolValidationOut)
def validate_tool(
    tool_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ToolValidationOut:
    tool = get_or_404(db, Tool, tool_id, "Инструмент")
    checks = _validate(tool)
    valid = all(check.status != "error" for check in checks)
    if valid and tool.status in {"draft", "registered"}:
        tool.status = "validated"
        db.commit()
        db.refresh(tool)
    return ToolValidationOut(valid=valid, checks=checks, tool=ToolOut.model_validate(tool))


@router.post("/{tool_id}/publish", response_model=ToolOut)
def publish_tool(
    tool_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Tool:
    tool = get_or_404(db, Tool, tool_id, "Инструмент")
    checks = _validate(tool)
    if any(check.status == "error" for check in checks):
        raise ApiError(
            422,
            "TOOL_NOT_VALID",
            "validation_failed",
            "Инструмент не прошёл проверку манифеста",
        )
    tool.status = "published"
    db.commit()
    db.refresh(tool)
    return tool
