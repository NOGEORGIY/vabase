"""Small factory for straightforward CRUD resources.

Keeping list/create/update/delete identical across the platform catalogs means the
future agents module can add its own resources in the same shape.
"""

from typing import Any, Callable

from fastapi import APIRouter, Depends, Query, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import apply_updates, get_current_user, get_or_404, list_items, new_id
from app.database import get_db

Serializer = Callable[[Any], BaseModel]


def make_crud_router(
    *,
    prefix: str,
    tag: str,
    model: Any,
    out_schema: type[BaseModel],
    create_schema: type[BaseModel],
    update_schema: type[BaseModel],
    label: str,
    search_fields: tuple[str, ...] = ("name", "description"),
    serialize: Serializer | None = None,
) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tag])

    def to_out(item: Any) -> BaseModel:
        return serialize(item) if serialize else out_schema.model_validate(item)

    @router.get("", response_model=dict)
    def list_all(
        q: str = Query(default="", max_length=200),
        limit: int = Query(default=100, ge=1, le=500),
        offset: int = Query(default=0, ge=0),
        project_id: str | None = Query(default=None),
        db: Session = Depends(get_db),
        _: Any = Depends(get_current_user),
    ) -> dict:
        filters: list[tuple[str, Any]] = []
        if project_id and hasattr(model, "project_id"):
            filters.append(("project_id", project_id))
        items, total = list_items(
            db,
            model,
            q=q,
            search_fields=search_fields,
            limit=limit,
            offset=offset,
            filters=tuple(filters),
        )
        return {"items": [to_out(item).model_dump(mode="json") for item in items], "total": total}

    @router.get("/{item_id}", response_model=out_schema)
    def get_one(
        item_id: str,
        db: Session = Depends(get_db),
        _: Any = Depends(get_current_user),
    ) -> Any:
        return to_out(get_or_404(db, model, item_id, label))

    @router.post("", response_model=out_schema, status_code=201)
    def create(
        payload: create_schema,  # type: ignore[valid-type]
        db: Session = Depends(get_db),
        _: Any = Depends(get_current_user),
    ) -> Any:
        item = model(id=new_id(), **payload.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return to_out(item)

    @router.patch("/{item_id}", response_model=out_schema)
    def update(
        item_id: str,
        payload: update_schema,  # type: ignore[valid-type]
        db: Session = Depends(get_db),
        _: Any = Depends(get_current_user),
    ) -> Any:
        item = get_or_404(db, model, item_id, label)
        apply_updates(item, payload.model_dump(exclude_unset=True))
        db.commit()
        db.refresh(item)
        return to_out(item)

    @router.delete("/{item_id}", status_code=204)
    def delete(
        item_id: str,
        db: Session = Depends(get_db),
        _: Any = Depends(get_current_user),
    ) -> Response:
        item = get_or_404(db, model, item_id, label)
        db.delete(item)
        db.commit()
        return Response(status_code=204)

    return router
