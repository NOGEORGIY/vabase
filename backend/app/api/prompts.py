from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, HTTPException, Response
from sqlalchemy import select

from app.database import SessionLocal
from app.models import Prompt
from app.schemas import PromptIn, PromptOut

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("", response_model=list[PromptOut])
def list_prompts() -> list[PromptOut]:
    with SessionLocal() as db:
        prompts = db.scalars(select(Prompt).order_by(Prompt.created_at.desc())).all()
        return [PromptOut.model_validate(prompt) for prompt in prompts]


@router.post("", response_model=PromptOut, status_code=201)
def create_prompt(payload: PromptIn) -> PromptOut:
    with SessionLocal() as db:
        prompt = Prompt(
            id=str(uuid4()),
            name=payload.name,
            description=payload.description,
            content=payload.content,
        )
        db.add(prompt)
        db.commit()
        db.refresh(prompt)
        return PromptOut.model_validate(prompt)


@router.delete("/{prompt_id}", status_code=204)
def delete_prompt(prompt_id: str) -> Response:
    with SessionLocal() as db:
        prompt = db.get(Prompt, prompt_id)
        if prompt is None:
            raise HTTPException(status_code=404, detail="Prompt not found")
        db.delete(prompt)
        db.commit()
        return Response(status_code=204)
