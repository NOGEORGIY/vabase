from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.api.crud import make_crud_router
from app.api.deps import (
    apply_updates,
    get_current_user,
    get_or_404,
    list_items,
    new_id,
)
from app.database import get_db
from app.models import Dictionary, Library, LibraryClass
from app.schemas import (
    DictionaryCreate,
    DictionaryOut,
    DictionaryUpdate,
    LibraryClassCreate,
    LibraryClassOut,
    LibraryClassUpdate,
    LibraryCreate,
    LibraryOut,
    LibraryUpdate,
)

dictionaries_router = APIRouter(prefix="/interpreted-data/dictionaries", tags=["interpreted-data"])


@dictionaries_router.get("", response_model=dict)
def list_dictionaries(
    q: str = Query(default="", max_length=200),
    dict_type: str | None = Query(default=None),
    project_id: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: Any = Depends(get_current_user),
) -> dict:
    filters: list[tuple[str, Any]] = []
    if dict_type:
        filters.append(("dict_type", dict_type))
    if project_id:
        filters.append(("project_id", project_id))
    items, total = list_items(
        db,
        Dictionary,
        q=q,
        search_fields=("name", "description"),
        limit=limit,
        offset=offset,
        filters=tuple(filters),
    )
    return {
        "items": [DictionaryOut.model_validate(item).model_dump(mode="json") for item in items],
        "total": total,
    }


@dictionaries_router.get("/{item_id}", response_model=DictionaryOut)
def get_dictionary(
    item_id: str,
    db: Session = Depends(get_db),
    _: Any = Depends(get_current_user),
) -> Dictionary:
    return get_or_404(db, Dictionary, item_id, "Справочник")


@dictionaries_router.post("", response_model=DictionaryOut, status_code=201)
def create_dictionary(
    payload: DictionaryCreate,
    db: Session = Depends(get_db),
    _: Any = Depends(get_current_user),
) -> Dictionary:
    item = Dictionary(id=new_id(), **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@dictionaries_router.patch("/{item_id}", response_model=DictionaryOut)
def update_dictionary(
    item_id: str,
    payload: DictionaryUpdate,
    db: Session = Depends(get_db),
    _: Any = Depends(get_current_user),
) -> Dictionary:
    item = get_or_404(db, Dictionary, item_id, "Справочник")
    apply_updates(item, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(item)
    return item


@dictionaries_router.delete("/{item_id}", status_code=204)
def delete_dictionary(
    item_id: str,
    db: Session = Depends(get_db),
    _: Any = Depends(get_current_user),
) -> Response:
    item = get_or_404(db, Dictionary, item_id, "Справочник")
    db.delete(item)
    db.commit()
    return Response(status_code=204)


libraries_router = make_crud_router(
    prefix="/interpreted-data/libraries",
    tag="interpreted-data",
    model=Library,
    out_schema=LibraryOut,
    create_schema=LibraryCreate,
    update_schema=LibraryUpdate,
    label="Библиотека",
)

library_classes_router = make_crud_router(
    prefix="/interpreted-data/library-classes",
    tag="interpreted-data",
    model=LibraryClass,
    out_schema=LibraryClassOut,
    create_schema=LibraryClassCreate,
    update_schema=LibraryClassUpdate,
    label="Класс библиотеки",
)
