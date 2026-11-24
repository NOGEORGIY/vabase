from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import apply_updates, get_current_user, get_or_404, new_id
from app.database import get_db
from app.models import Component, Entity, Project, Prompt, Service, Tool, User
from app.schemas import ProjectCreate, ProjectOut, ProjectStats, ProjectSummary, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


def _stats(db: Session, project_id: str) -> ProjectStats:
    def count(model: Any) -> int:
        return int(
            db.scalar(
                select(func.count()).select_from(model).where(model.project_id == project_id)
            )
            or 0
        )

    return ProjectStats(
        assistants=0,  # the agents subsystem is a planned module
        entities=count(Entity),
        services=count(Service),
        components=count(Component),
        prompts=count(Prompt),
        tools=count(Tool),
    )


def _summary(db: Session, project: Project) -> ProjectSummary:
    data = ProjectOut.model_validate(project).model_dump()
    return ProjectSummary(**data, stats=_stats(db, project.id))


@router.get("", response_model=dict)
def list_projects(
    q: str = Query(default="", max_length=200),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    stmt = select(Project)
    if q:
        stmt = stmt.where(Project.name.ilike(f"%{q}%") | Project.description.ilike(f"%{q}%"))
    total = int(db.scalar(select(func.count()).select_from(stmt.subquery())) or 0)
    projects = list(
        db.scalars(
            stmt.order_by(Project.created_at.desc()).limit(limit).offset(offset)
        ).all()
    )
    return {
        "items": [_summary(db, project).model_dump(mode="json") for project in projects],
        "total": total,
    }


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    project = Project(id=new_id(), owner_id=user.id, **payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectSummary)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ProjectSummary:
    project = get_or_404(db, Project, project_id, "Проект")
    return _summary(db, project)


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Project:
    project = get_or_404(db, Project, project_id, "Проект")
    apply_updates(project, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Response:
    project = get_or_404(db, Project, project_id, "Проект")
    db.delete(project)
    db.commit()
    return Response(status_code=204)
