from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ToolIn(BaseModel):
    name: str
    description: str = ""
    endpoint: str = ""


class ToolOut(ORMModel):
    id: str
    name: str
    description: str
    endpoint: str


class PromptIn(BaseModel):
    name: str
    description: str = ""
    content: str = ""


class PromptOut(ORMModel):
    id: str
    name: str
    description: str
    content: str
