"""Agent API stubs.

The agent runtime is not implemented yet. Only the reserved routes remain.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.errors import ApiError
from app.models import User

router = APIRouter(tags=["agents"])


def _not_implemented() -> ApiError:
    return ApiError(
        501,
        "NOT_IMPLEMENTED",
        "not_implemented",
        "Функциональность агентов ещё не реализована",
    )


@router.get("/agents")
def list_agents(_: User = Depends(get_current_user)):
    raise _not_implemented()


@router.post("/agents")
def create_agent(_: User = Depends(get_current_user)):
    raise _not_implemented()


@router.post("/runs")
def create_run(_: User = Depends(get_current_user)):
    raise _not_implemented()
