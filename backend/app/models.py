from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="analyst")
    password_hash: Mapped[str] = mapped_column(String(255))
    avatar_color: Mapped[str] = mapped_column(String(16), default="#1a4bff")


class Session(Base):
    __tablename__ = "sessions"

    token: Mapped[str] = mapped_column(String(128), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(32), default="draft")
    owner_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class Service(Base, TimestampMixin):
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    url: Mapped[str] = mapped_column(String(512), default="")
    service_type: Mapped[str] = mapped_column(String(32), default="api")
    status: Mapped[str] = mapped_column(String(32), default="active")
    project_id: Mapped[str | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True
    )


class Component(Base, TimestampMixin):
    __tablename__ = "components"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    component_type: Mapped[str] = mapped_column(String(32), default="widget")
    status: Mapped[str] = mapped_column(String(32), default="active")
    project_id: Mapped[str | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True
    )


class Entity(Base, TimestampMixin):
    __tablename__ = "entities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    fields_count: Mapped[int] = mapped_column(Integer, default=0)
    project_id: Mapped[str] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )


class Prompt(Base, TimestampMixin):
    __tablename__ = "prompts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    content: Mapped[str] = mapped_column(Text, default="")
    topics: Mapped[str] = mapped_column(String(512), default="")
    tools: Mapped[str] = mapped_column(String(512), default="")
    task: Mapped[str] = mapped_column(String(512), default="")
    status: Mapped[str] = mapped_column(String(32), default="draft")
    project_id: Mapped[str | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True
    )


class PromptElement(Base, TimestampMixin):
    __tablename__ = "prompt_elements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    element_type: Mapped[str] = mapped_column(String(32), default="instruction")
    content: Mapped[str] = mapped_column(Text, default="")


class Theme(Base, TimestampMixin):
    __tablename__ = "prompt_themes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")


class PromptTask(Base, TimestampMixin):
    __tablename__ = "prompt_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(32), default="draft")


class PromptVariable(Base, TimestampMixin):
    __tablename__ = "prompt_variables"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    value_type: Mapped[str] = mapped_column(String(32), default="string")
    default_value: Mapped[str] = mapped_column(String(255), default="")


class TestCase(Base, TimestampMixin):
    __tablename__ = "test_cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    input_text: Mapped[str] = mapped_column(Text, default="")
    expected_output: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(32), default="draft")


class Tool(Base, TimestampMixin):

    __tablename__ = "tools"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    tool_type: Mapped[str] = mapped_column(String(32), default="http")
    endpoint: Mapped[str] = mapped_column(String(512), default="")
    http_method: Mapped[str] = mapped_column(String(16), default="POST")
    version: Mapped[str] = mapped_column(String(32), default="1.0.0")
    status: Mapped[str] = mapped_column(String(32), default="draft")
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False)
    input_schema: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    project_id: Mapped[str | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True
    )


class InfoCategory(Base, TimestampMixin):
    __tablename__ = "info_categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")

    characteristics: Mapped[list[Characteristic]] = relationship(
        back_populates="category", cascade="all, delete-orphan"
    )


class Characteristic(Base, TimestampMixin):
    __tablename__ = "info_characteristics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    category_id: Mapped[str | None] = mapped_column(
        ForeignKey("info_categories.id", ondelete="CASCADE"), nullable=True, index=True
    )
    data_type: Mapped[str] = mapped_column(String(32), default="string")
    required: Mapped[bool] = mapped_column(Boolean, default=False)

    category: Mapped[InfoCategory | None] = relationship(back_populates="characteristics")


class Scale(Base, TimestampMixin):
    __tablename__ = "info_scales"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    scale_type: Mapped[str] = mapped_column(String(32), default="numeric")


class InfoValue(Base, TimestampMixin):
    __tablename__ = "info_values"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    scale_id: Mapped[str | None] = mapped_column(
        ForeignKey("info_scales.id", ondelete="SET NULL"), nullable=True
    )


class InterpretedValue(Base, TimestampMixin):
    __tablename__ = "info_interpreted_values"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    raw_value: Mapped[str] = mapped_column(String(255), default="")


class Constraint(Base, TimestampMixin):
    __tablename__ = "info_constraints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    expression: Mapped[str] = mapped_column(String(512), default="")


class Dictionary(Base, TimestampMixin):
    __tablename__ = "dictionaries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    dict_type: Mapped[str] = mapped_column(String(32), default="api")
    project_id: Mapped[str | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True
    )


class Library(Base, TimestampMixin):
    __tablename__ = "libraries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    version: Mapped[str] = mapped_column(String(32), default="1.0.0")


class LibraryClass(Base, TimestampMixin):
    __tablename__ = "library_classes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    library_id: Mapped[str | None] = mapped_column(
        ForeignKey("libraries.id", ondelete="SET NULL"), nullable=True
    )
