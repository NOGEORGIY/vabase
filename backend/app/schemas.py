from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ToolIn(BaseModel):
    name: str
    description: str = ""
    endpoint: str = ""
    input_schema: dict[str, Any] = Field(default_factory=dict)


class ToolUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    endpoint: str | None = None
    input_schema: dict[str, Any] | None = None


class ToolOut(ORMModel):
    id: str
    name: str
    description: str
    endpoint: str
    input_schema: dict[str, Any]


class PromptIn(BaseModel):
    name: str
    description: str = ""
    content: str = ""


class PromptOut(ORMModel):
    id: str
    name: str
    description: str
    content: str
