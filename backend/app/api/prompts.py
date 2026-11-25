from __future__ import annotations

import re
from typing import Any

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.crud import make_crud_router
from app.api.deps import apply_updates, get_current_user, get_or_404, new_id
from app.database import get_db
from app.models import Prompt, PromptElement, PromptTask, PromptVariable, TestCase, Theme, User
from app.schemas import (
    PromptCreate,
    PromptElementCreate,
    PromptElementOut,
    PromptElementUpdate,
    PromptOut,
    PromptSearchHit,
    PromptSearchOut,
    PromptTaskCreate,
    PromptTaskOut,
    PromptTaskUpdate,
    PromptUpdate,
    PromptVariableCreate,
    PromptVariableOut,
    PromptVariableUpdate,
    TestCaseCreate,
    TestCaseOut,
    TestCaseUpdate,
    ThemeCreate,
    ThemeOut,
    ThemeUpdate,
)

router = APIRouter(prefix="/prompts", tags=["prompts"])

_WORD_RE = re.compile(r"[0-9a-zA-Zа-яА-ЯёЁ]{3,}")


def _tokens(text: str) -> list[str]:
    return [token.lower() for token in _WORD_RE.findall(text or "")]


def _score_prompt(prompt: Prompt, query_tokens: set[str]) -> tuple[float, list[str]]:

    weighted_fields = (
        (prompt.name, 3.0),
        (prompt.task, 3.0),
        (prompt.description, 2.0),
        (prompt.topics, 2.0),
        (prompt.tools, 2.0),
        (prompt.content, 1.0),
    )
    score = 0.0
    matched: set[str] = set()
    for value, weight in weighted_fields:
        field_tokens = set(_tokens(value))
        overlap = field_tokens & query_tokens
        if overlap:
            matched |= overlap
            score += weight * len(overlap) / max(len(query_tokens), 1)
    return round(score, 3), sorted(matched)


@router.get("", response_model=dict)
def list_prompts(
    q: str = Query(default="", max_length=200),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    project_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    stmt = select(Prompt)
    if q:
        stmt = stmt.where(
            Prompt.name.ilike(f"%{q}%")
            | Prompt.description.ilike(f"%{q}%")
            | Prompt.task.ilike(f"%{q}%")
            | Prompt.topics.ilike(f"%{q}%")
        )
    if project_id:
        stmt = stmt.where(Prompt.project_id == project_id)
    total = int(db.scalar(select(func.count()).select_from(stmt.subquery())) or 0)
    prompts = list(
        db.scalars(
            stmt.order_by(Prompt.created_at.desc()).limit(limit).offset(offset)
        ).all()
    )
    return {
        "items": [PromptOut.model_validate(prompt).model_dump(mode="json") for prompt in prompts],
        "total": total,
    }


@router.get("/search", response_model=PromptSearchOut)
def search_prompts(
    q: str = Query(min_length=2, max_length=500),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> PromptSearchOut:
    query_tokens = set(_tokens(q))
    prompts = list(db.scalars(select(Prompt)).all())
    ranked: list[tuple[float, list[str], Prompt]] = []
    for prompt in prompts:
        score, matched = _score_prompt(prompt, query_tokens)
        if score > 0:
            ranked.append((score, matched, prompt))
    ranked.sort(key=lambda row: row[0], reverse=True)
    return PromptSearchOut(
        query=q,
        items=[
            PromptSearchHit(
                prompt=PromptOut.model_validate(prompt),
                score=score,
                matched_terms=matched,
            )
            for score, matched, prompt in ranked[:limit]
        ],
    )


@router.get("/{prompt_id}", response_model=PromptOut)
def get_prompt(
    prompt_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Prompt:
    return get_or_404(db, Prompt, prompt_id, "Промпт")


@router.post("", response_model=PromptOut, status_code=201)
def create_prompt(
    payload: PromptCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Prompt:
    prompt = Prompt(id=new_id(), **payload.model_dump())
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt


@router.patch("/{prompt_id}", response_model=PromptOut)
def update_prompt(
    prompt_id: str,
    payload: PromptUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Prompt:
    prompt = get_or_404(db, Prompt, prompt_id, "Промпт")
    apply_updates(prompt, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(prompt)
    return prompt


@router.delete("/{prompt_id}", status_code=204)
def delete_prompt(
    prompt_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Response:
    prompt = get_or_404(db, Prompt, prompt_id, "Промпт")
    db.delete(prompt)
    db.commit()
    return Response(status_code=204)


elements_router = make_crud_router(
    prefix="/prompt-elements",
    tag="prompts",
    model=PromptElement,
    out_schema=PromptElementOut,
    create_schema=PromptElementCreate,
    update_schema=PromptElementUpdate,
    label="Элемент промпта",
    search_fields=("name", "description", "content"),
)

themes_router = make_crud_router(
    prefix="/prompt-themes",
    tag="prompts",
    model=Theme,
    out_schema=ThemeOut,
    create_schema=ThemeCreate,
    update_schema=ThemeUpdate,
    label="Тема",
)

tasks_router = make_crud_router(
    prefix="/prompt-tasks",
    tag="prompts",
    model=PromptTask,
    out_schema=PromptTaskOut,
    create_schema=PromptTaskCreate,
    update_schema=PromptTaskUpdate,
    label="Задача",
)

variables_router = make_crud_router(
    prefix="/prompt-variables",
    tag="prompts",
    model=PromptVariable,
    out_schema=PromptVariableOut,
    create_schema=PromptVariableCreate,
    update_schema=PromptVariableUpdate,
    label="Переменная",
)

test_cases_router = make_crud_router(
    prefix="/test-cases",
    tag="prompts",
    model=TestCase,
    out_schema=TestCaseOut,
    create_schema=TestCaseCreate,
    update_schema=TestCaseUpdate,
    label="Тест-кейс",
    search_fields=("name", "description", "input_text", "expected_output"),
)
