from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models import Dictionary, InfoCategory, Project, Prompt, Service, Tool, User
from app.schemas import SearchGroup, SearchItem, SearchOut

router = APIRouter(prefix="/search", tags=["search"])

GROUP_LIMIT = 6


@router.get("", response_model=SearchOut)
def search(
    q: str = Query(min_length=2, max_length=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> SearchOut:
    like = f"%{q}%"
    groups: list[SearchGroup] = []

    projects = list(
        db.scalars(
            select(Project)
            .where(Project.name.ilike(like) | Project.description.ilike(like))
            .limit(GROUP_LIMIT)
        ).all()
    )
    if projects:
        groups.append(
            SearchGroup(
                type="project",
                title="Проекты",
                items=[
                    SearchItem(
                        id=item.id,
                        type="project",
                        title=item.name,
                        subtitle=item.description,
                        link=f"/projects/{item.id}",
                    )
                    for item in projects
                ],
            )
        )

    services = list(
        db.scalars(
            select(Service)
            .where(Service.name.ilike(like) | Service.description.ilike(like))
            .limit(GROUP_LIMIT)
        ).all()
    )
    if services:
        groups.append(
            SearchGroup(
                type="service",
                title="Сервисы",
                items=[
                    SearchItem(
                        id=item.id,
                        type="service",
                        title=item.name,
                        subtitle=item.description or item.url,
                        link="/services",
                    )
                    for item in services
                ],
            )
        )

    prompts = list(
        db.scalars(
            select(Prompt)
            .where(
                Prompt.name.ilike(like)
                | Prompt.description.ilike(like)
                | Prompt.task.ilike(like)
            )
            .limit(GROUP_LIMIT)
        ).all()
    )
    if prompts:
        groups.append(
            SearchGroup(
                type="prompt",
                title="Промпты",
                items=[
                    SearchItem(
                        id=item.id,
                        type="prompt",
                        title=item.name,
                        subtitle=item.description,
                        link="/prompt-engineering/prompts",
                    )
                    for item in prompts
                ],
            )
        )

    tools = list(
        db.scalars(
            select(Tool)
            .where(Tool.name.ilike(like) | Tool.description.ilike(like))
            .limit(GROUP_LIMIT)
        ).all()
    )
    if tools:
        groups.append(
            SearchGroup(
                type="tool",
                title="Инструменты",
                items=[
                    SearchItem(
                        id=item.id,
                        type="tool",
                        title=item.name,
                        subtitle=item.description,
                        link="/prompt-engineering/tools",
                    )
                    for item in tools
                ],
            )
        )

    dictionaries = list(
        db.scalars(
            select(Dictionary)
            .where(Dictionary.name.ilike(like) | Dictionary.description.ilike(like))
            .limit(GROUP_LIMIT)
        ).all()
    )
    if dictionaries:
        groups.append(
            SearchGroup(
                type="dictionary",
                title="Справочники",
                items=[
                    SearchItem(
                        id=item.id,
                        type="dictionary",
                        title=item.name,
                        subtitle=item.description,
                        link="/interpreted-data/dictionaries",
                    )
                    for item in dictionaries
                ],
            )
        )

    categories = list(
        db.scalars(
            select(InfoCategory)
            .where(InfoCategory.name.ilike(like) | InfoCategory.description.ilike(like))
            .limit(GROUP_LIMIT)
        ).all()
    )
    if categories:
        groups.append(
            SearchGroup(
                type="category",
                title="Категории информационной модели",
                items=[
                    SearchItem(
                        id=item.id,
                        type="category",
                        title=item.name,
                        subtitle=item.description,
                        link="/info-model/categories",
                    )
                    for item in categories
                ],
            )
        )

    total = sum(len(group.items) for group in groups)
    return SearchOut(query=q, total=total, groups=groups)
