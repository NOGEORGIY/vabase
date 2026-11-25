from __future__ import annotations

from datetime import datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field

T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int


# --------------------------------------------------------------------------- auth


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(ORMModel):
    id: str
    email: str
    full_name: str
    role: str
    avatar_color: str


class TokenOut(BaseModel):
    token: str
    user: UserOut


class DemoAccount(BaseModel):
    role: str
    title: str
    email: str
    password: str
    description: str = ""


# ----------------------------------------------------------------------- projects


class ProjectBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    status: str = "draft"


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    status: str | None = None


class ProjectOut(ORMModel):
    id: str
    name: str
    description: str
    status: str
    owner_id: str | None
    created_at: datetime
    updated_at: datetime


class ProjectStats(BaseModel):
    assistants: int = 0
    entities: int = 0
    services: int = 0
    components: int = 0
    prompts: int = 0
    tools: int = 0


class ProjectSummary(ProjectOut):
    stats: ProjectStats = Field(default_factory=ProjectStats)


# ----------------------------------------------------------------------- services


class ServiceBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    url: str = ""
    service_type: str = "api"
    status: str = "active"
    project_id: str | None = None


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    url: str | None = None
    service_type: str | None = None
    status: str | None = None
    project_id: str | None = None


class ServiceOut(ORMModel):
    id: str
    name: str
    description: str
    url: str
    service_type: str
    status: str
    project_id: str | None
    created_at: datetime
    updated_at: datetime


class ComponentBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    component_type: str = "widget"
    status: str = "active"
    project_id: str | None = None


class ComponentCreate(ComponentBase):
    pass


class ComponentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    component_type: str | None = None
    status: str | None = None
    project_id: str | None = None


class ComponentOut(ORMModel):
    id: str
    name: str
    description: str
    component_type: str
    status: str
    project_id: str | None
    created_at: datetime
    updated_at: datetime


# ----------------------------------------------------------------------- entities


class EntityBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    fields_count: int = 0
    project_id: str


class EntityCreate(EntityBase):
    pass


class EntityUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    fields_count: int | None = None
    project_id: str | None = None


class EntityOut(ORMModel):
    id: str
    name: str
    description: str
    fields_count: int
    project_id: str
    created_at: datetime
    updated_at: datetime


# ------------------------------------------------------------------------ prompts


class PromptBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    content: str = ""
    topics: str = ""
    tools: str = ""
    task: str = ""
    status: str = "draft"
    project_id: str | None = None


class PromptCreate(PromptBase):
    pass


class PromptUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    content: str | None = None
    topics: str | None = None
    tools: str | None = None
    task: str | None = None
    status: str | None = None
    project_id: str | None = None


class PromptOut(ORMModel):
    id: str
    name: str
    description: str
    content: str
    topics: str
    tools: str
    task: str
    status: str
    project_id: str | None
    created_at: datetime
    updated_at: datetime


class PromptSearchHit(BaseModel):
    prompt: PromptOut
    score: float
    matched_terms: list[str]


class PromptSearchOut(BaseModel):
    query: str
    items: list[PromptSearchHit]


class PromptElementBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    element_type: str = "instruction"
    content: str = ""


class PromptElementCreate(PromptElementBase):
    pass


class PromptElementUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    element_type: str | None = None
    content: str | None = None


class PromptElementOut(ORMModel):
    id: str
    name: str
    description: str
    element_type: str
    content: str
    created_at: datetime
    updated_at: datetime


class ThemeBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""


class ThemeCreate(ThemeBase):
    pass


class ThemeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class ThemeOut(ORMModel):
    id: str
    name: str
    description: str
    created_at: datetime
    updated_at: datetime


class PromptTaskBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    status: str = "draft"


class PromptTaskCreate(PromptTaskBase):
    pass


class PromptTaskUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None


class PromptTaskOut(ORMModel):
    id: str
    name: str
    description: str
    status: str
    created_at: datetime
    updated_at: datetime


class PromptVariableBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    value_type: str = "string"
    default_value: str = ""


class PromptVariableCreate(PromptVariableBase):
    pass


class PromptVariableUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    value_type: str | None = None
    default_value: str | None = None


class PromptVariableOut(ORMModel):
    id: str
    name: str
    description: str
    value_type: str
    default_value: str
    created_at: datetime
    updated_at: datetime


class TestCaseBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    input_text: str = ""
    expected_output: str = ""
    status: str = "draft"


class TestCaseCreate(TestCaseBase):
    pass


class TestCaseUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    input_text: str | None = None
    expected_output: str | None = None
    status: str | None = None


class TestCaseOut(ORMModel):
    id: str
    name: str
    description: str
    input_text: str
    expected_output: str
    status: str
    created_at: datetime
    updated_at: datetime


# -------------------------------------------------------------------------- tools


class ToolBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    tool_type: str = "http"
    endpoint: str = ""
    http_method: str = "POST"
    version: str = "1.0.0"
    status: str = "draft"
    requires_approval: bool = False
    input_schema: dict[str, Any] = Field(default_factory=dict)
    project_id: str | None = None


class ToolCreate(ToolBase):
    pass


class ToolUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    tool_type: str | None = None
    endpoint: str | None = None
    http_method: str | None = None
    version: str | None = None
    status: str | None = None
    requires_approval: bool | None = None
    input_schema: dict[str, Any] | None = None
    project_id: str | None = None


class ToolOut(ORMModel):
    id: str
    name: str
    description: str
    tool_type: str
    endpoint: str
    http_method: str
    version: str
    status: str
    requires_approval: bool
    input_schema: dict[str, Any]
    project_id: str | None
    created_at: datetime
    updated_at: datetime


class ToolCheck(BaseModel):
    id: str
    label: str
    status: str
    message: str = ""


class ToolValidationOut(BaseModel):
    valid: bool
    checks: list[ToolCheck]
    tool: ToolOut


class ToolSearchHit(BaseModel):
    tool: ToolOut
    score: float
    matched_terms: list[str]


class ToolSearchOut(BaseModel):
    query: str
    items: list[ToolSearchHit]


# --------------------------------------------------------------------- info model


class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class CategoryOut(ORMModel):
    id: str
    name: str
    description: str
    created_at: datetime
    updated_at: datetime
    characteristics_count: int = 0


class CharacteristicBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    category_id: str | None = None
    data_type: str = "string"
    required: bool = False


class CharacteristicCreate(CharacteristicBase):
    pass


class CharacteristicUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category_id: str | None = None
    data_type: str | None = None
    required: bool | None = None


class CharacteristicOut(ORMModel):
    id: str
    name: str
    description: str
    category_id: str | None
    data_type: str
    required: bool
    created_at: datetime
    updated_at: datetime
    category_name: str | None = None


class ScaleBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    scale_type: str = "numeric"


class ScaleCreate(ScaleBase):
    pass


class ScaleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    scale_type: str | None = None


class ScaleOut(ORMModel):
    id: str
    name: str
    description: str
    scale_type: str
    created_at: datetime
    updated_at: datetime


class InfoValueBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    scale_id: str | None = None


class InfoValueCreate(InfoValueBase):
    pass


class InfoValueUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    scale_id: str | None = None


class InfoValueOut(ORMModel):
    id: str
    name: str
    description: str
    scale_id: str | None
    created_at: datetime
    updated_at: datetime


class InterpretedValueBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    raw_value: str = ""


class InterpretedValueCreate(InterpretedValueBase):
    pass


class InterpretedValueUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    raw_value: str | None = None


class InterpretedValueOut(ORMModel):
    id: str
    name: str
    description: str
    raw_value: str
    created_at: datetime
    updated_at: datetime


class ConstraintBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    expression: str = ""


class ConstraintCreate(ConstraintBase):
    pass


class ConstraintUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    expression: str | None = None


class ConstraintOut(ORMModel):
    id: str
    name: str
    description: str
    expression: str
    created_at: datetime
    updated_at: datetime


# --------------------------------------------------------------- interpreted data


class DictionaryBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    dict_type: str = "api"
    project_id: str | None = None


class DictionaryCreate(DictionaryBase):
    pass


class DictionaryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    dict_type: str | None = None
    project_id: str | None = None


class DictionaryOut(ORMModel):
    id: str
    name: str
    description: str
    dict_type: str
    project_id: str | None
    created_at: datetime
    updated_at: datetime


class LibraryBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    version: str = "1.0.0"


class LibraryCreate(LibraryBase):
    pass


class LibraryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    version: str | None = None


class LibraryOut(ORMModel):
    id: str
    name: str
    description: str
    version: str
    created_at: datetime
    updated_at: datetime


class LibraryClassBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    library_id: str | None = None


class LibraryClassCreate(LibraryClassBase):
    pass


class LibraryClassUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    library_id: str | None = None


class LibraryClassOut(ORMModel):
    id: str
    name: str
    description: str
    library_id: str | None
    created_at: datetime
    updated_at: datetime


# ------------------------------------------------------------------------ metrics


class MetricsSummary(BaseModel):
    projects: int
    services: int
    components: int
    prompts: int
    tools: int
    published_tools: int
    dictionaries: int
    runs: int = 0
    success_rate: float = 0.0
    avg_duration_ms: int = 0
    tokens_spent: int = 0


# ------------------------------------------------------------------------- search


class SearchItem(BaseModel):
    id: str
    type: str
    title: str
    subtitle: str = ""
    link: str


class SearchGroup(BaseModel):
    type: str
    title: str
    items: list[SearchItem]


class SearchOut(BaseModel):
    query: str
    total: int
    groups: list[SearchGroup]


# ------------------------------------------------------------------------- errors


class ErrorBody(BaseModel):
    code: str
    problem: str
    message: str
    field: str | None = None
