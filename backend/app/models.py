from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Boolean, DateTime, JSON, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
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


class Tool(Base, TimestampMixin):
    __tablename__ = "tools"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    tool_type: Mapped[str] = mapped_column(String(32), default="http")
    endpoint: Mapped[str] = mapped_column(String(512), default="")
    http_method: Mapped[str] = mapped_column(String(16), default="POST")
    version: Mapped[str] = mapped_column(String(32), default="1.0.0")
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False)
    input_schema: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
