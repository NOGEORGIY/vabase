from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.config import settings
from app.database import get_db
from app.errors import ApiError
from app.models import User
from app.schemas import DemoAccount, LoginIn, TokenOut, UserOut
from app.security import create_session, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

DEMO_ACCOUNTS = [
    {
        "role": "analyst",
        "title": "Аналитик",
        "email": "g.rasputin@vabase.ru",
        "description": "Работает с промптами и инструментами",
    },
    {
        "role": "admin",
        "title": "Администратор",
        "email": "a.sokolova@vabase.ru",
        "description": "Управляет доступами и публикацией",
    },
    {
        "role": "developer",
        "title": "Разработчик интеграций",
        "email": "m.orlov@vabase.ru",
        "description": "Подключает HTTP и MCP-инструменты",
    },
]


@router.get("/demo-accounts", response_model=list[DemoAccount])
def demo_accounts() -> list[DemoAccount]:
    return [
        DemoAccount(
            role=account["role"],
            title=account["title"],
            email=account["email"],
            password=settings.demo_password,
            description=account["description"],
        )
        for account in DEMO_ACCOUNTS
    ]


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise ApiError(
            401,
            "UNAUTHORIZED",
            "invalid_credentials",
            "Неверная почта или пароль",
        )
    session = create_session(db, user)
    return TokenOut(token=session.token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)
