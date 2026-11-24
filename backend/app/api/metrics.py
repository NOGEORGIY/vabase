from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models import Component, Dictionary, Project, Prompt, Service, Tool, User
from app.schemas import MetricsSummary

router = APIRouter(prefix="/metrics", tags=["metrics"])


def _count(db: Session, model) -> int:
    return int(db.scalar(select(func.count()).select_from(model)) or 0)


@router.get("/summary", response_model=MetricsSummary)
def summary(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> MetricsSummary:
    published = int(
        db.scalar(
            select(func.count())
            .select_from(Tool)
            .where(Tool.status.in_(("published", "active")))
        )
        or 0
    )
    return MetricsSummary(
        projects=_count(db, Project),
        services=_count(db, Service),
        components=_count(db, Component),
        prompts=_count(db, Prompt),
        tools=_count(db, Tool),
        published_tools=published,
        dictionaries=_count(db, Dictionary),
        # Run metrics stay at zero until the agents module is connected.
        runs=0,
        success_rate=0.0,
        avg_duration_ms=0,
        tokens_spent=0,
    )
