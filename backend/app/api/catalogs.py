from __future__ import annotations

from app.api.crud import make_crud_router
from app.models import Component, Entity, Service
from app.schemas import (
    ComponentCreate,
    ComponentOut,
    ComponentUpdate,
    EntityCreate,
    EntityOut,
    EntityUpdate,
    ServiceCreate,
    ServiceOut,
    ServiceUpdate,
)

services_router = make_crud_router(
    prefix="/services",
    tag="services",
    model=Service,
    out_schema=ServiceOut,
    create_schema=ServiceCreate,
    update_schema=ServiceUpdate,
    label="Сервис",
    search_fields=("name", "description", "url"),
)

components_router = make_crud_router(
    prefix="/components",
    tag="components",
    model=Component,
    out_schema=ComponentOut,
    create_schema=ComponentCreate,
    update_schema=ComponentUpdate,
    label="Компонент",
    search_fields=("name", "description"),
)

entities_router = make_crud_router(
    prefix="/entities",
    tag="entities",
    model=Entity,
    out_schema=EntityOut,
    create_schema=EntityCreate,
    update_schema=EntityUpdate,
    label="Сущность",
    search_fields=("name", "description"),
)
