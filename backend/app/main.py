from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import (
    agents,
    auth,
    catalogs,
    info_model,
    interpreted,
    metrics,
    projects,
    prompts,
    search,
    tools,
)
from app.config import settings
from app.database import SessionLocal, engine, init_db
from app.errors import register_error_handlers
from app.seed import seed_demo


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    if settings.seed_demo:
        with SessionLocal() as db:
            seed_demo(db)
    yield


app = FastAPI(
    title="Vabase API",
    version=settings.app_version,
    description=(
        "Прототип низкокодовой платформы Vabase. Содержит каркас платформы и "
        "заготовку подсистемы ИИ-агентов (реестр инструментов, контракты, роадмап)."
    ),
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)

register_error_handlers(app)

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix=settings.api_prefix)

api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(catalogs.services_router)
api_router.include_router(catalogs.components_router)
api_router.include_router(catalogs.entities_router)
api_router.include_router(prompts.router)
api_router.include_router(prompts.elements_router)
api_router.include_router(prompts.themes_router)
api_router.include_router(prompts.tasks_router)
api_router.include_router(prompts.variables_router)
api_router.include_router(prompts.test_cases_router)
api_router.include_router(tools.router)
api_router.include_router(info_model.categories_router)
api_router.include_router(info_model.characteristics_router)
api_router.include_router(info_model.scales_router)
api_router.include_router(info_model.values_router)
api_router.include_router(info_model.interpreted_values_router)
api_router.include_router(info_model.constraints_router)
api_router.include_router(interpreted.dictionaries_router)
api_router.include_router(interpreted.libraries_router)
api_router.include_router(interpreted.library_classes_router)
api_router.include_router(metrics.router)
api_router.include_router(search.router)
api_router.include_router(agents.router)

app.include_router(api_router)


@app.get("/healthz", tags=["system"])
def healthz() -> dict:
    components: dict[str, str] = {}
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        components["database"] = "ok"
    except Exception:  # noqa: BLE001 - health endpoint reports, never raises
        components["database"] = "unavailable"

    try:
        import redis

        client = redis.Redis.from_url(settings.redis_url, socket_connect_timeout=1)
        client.ping()
        components["redis"] = "ok"
    except Exception:  # noqa: BLE001 - redis is optional for the prototype
        components["redis"] = "optional"

    healthy = components["database"] == "ok"
    return {
        "status": "ok" if healthy else "degraded",
        "version": settings.app_version,
        "components": components,
    }


@app.get("/", tags=["system"])
def root() -> dict:
    return {
        "name": "Vabase API",
        "version": settings.app_version,
        "docs": "/api/docs",
        "health": "/healthz",
    }
