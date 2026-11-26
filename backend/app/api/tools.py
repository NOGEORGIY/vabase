from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, HTTPException, Response
from sqlalchemy import select

from app.database import SessionLocal
from app.models import Tool
from app.schemas import ToolIn, ToolOut

router = APIRouter(prefix="/tools", tags=["tools"])


@router.get("", response_model=list[ToolOut])
def list_tools() -> list[ToolOut]:
    with SessionLocal() as db:
        tools = db.scalars(select(Tool).order_by(Tool.created_at.desc())).all()
        return [ToolOut.model_validate(tool) for tool in tools]


@router.post("", response_model=ToolOut, status_code=201)
def create_tool(payload: ToolIn) -> ToolOut:
    with SessionLocal() as db:
        tool = Tool(
            id=str(uuid4()),
            name=payload.name,
            description=payload.description,
            endpoint=payload.endpoint,
        )
        db.add(tool)
        db.commit()
        db.refresh(tool)
        return ToolOut.model_validate(tool)


@router.delete("/{tool_id}", status_code=204)
def delete_tool(tool_id: str) -> Response:
    with SessionLocal() as db:
        tool = db.get(Tool, tool_id)
        if tool is None:
            raise HTTPException(status_code=404, detail="Tool not found")
        db.delete(tool)
        db.commit()
        return Response(status_code=204)
