from __future__ import annotations

from app.api.crud import make_crud_router
from app.models import Characteristic, Constraint, InfoCategory, InfoValue, InterpretedValue, Scale
from app.schemas import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    CharacteristicCreate,
    CharacteristicOut,
    CharacteristicUpdate,
    ConstraintCreate,
    ConstraintOut,
    ConstraintUpdate,
    InfoValueCreate,
    InfoValueOut,
    InfoValueUpdate,
    InterpretedValueCreate,
    InterpretedValueOut,
    InterpretedValueUpdate,
    ScaleCreate,
    ScaleOut,
    ScaleUpdate,
)


def _category_out(category: InfoCategory) -> CategoryOut:
    data = CategoryOut.model_validate(category)
    data.characteristics_count = len(category.characteristics)
    return data


def _characteristic_out(characteristic: Characteristic) -> CharacteristicOut:
    data = CharacteristicOut.model_validate(characteristic)
    data.category_name = characteristic.category.name if characteristic.category else None
    return data


categories_router = make_crud_router(
    prefix="/info-model/categories",
    tag="info-model",
    model=InfoCategory,
    out_schema=CategoryOut,
    create_schema=CategoryCreate,
    update_schema=CategoryUpdate,
    label="Категория",
    serialize=_category_out,
)

characteristics_router = make_crud_router(
    prefix="/info-model/characteristics",
    tag="info-model",
    model=Characteristic,
    out_schema=CharacteristicOut,
    create_schema=CharacteristicCreate,
    update_schema=CharacteristicUpdate,
    label="Характеристика",
    serialize=_characteristic_out,
)

scales_router = make_crud_router(
    prefix="/info-model/scales",
    tag="info-model",
    model=Scale,
    out_schema=ScaleOut,
    create_schema=ScaleCreate,
    update_schema=ScaleUpdate,
    label="Шкала",
)

values_router = make_crud_router(
    prefix="/info-model/values",
    tag="info-model",
    model=InfoValue,
    out_schema=InfoValueOut,
    create_schema=InfoValueCreate,
    update_schema=InfoValueUpdate,
    label="Значение",
)

interpreted_values_router = make_crud_router(
    prefix="/info-model/interpreted-values",
    tag="info-model",
    model=InterpretedValue,
    out_schema=InterpretedValueOut,
    create_schema=InterpretedValueCreate,
    update_schema=InterpretedValueUpdate,
    label="Интерпретируемое значение",
)

constraints_router = make_crud_router(
    prefix="/info-model/constraints",
    tag="info-model",
    model=Constraint,
    out_schema=ConstraintOut,
    create_schema=ConstraintCreate,
    update_schema=ConstraintUpdate,
    label="Ограничение",
    search_fields=("name", "description", "expression"),
)
