
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.errors import ApiError
from app.models import User
from app.schemas import AgentRoadmap, RoadmapItem

router = APIRouter(tags=["agents"])


def _not_implemented(feature: str) -> ApiError:
    return ApiError(
        501,
        "NOT_IMPLEMENTED",
        "agents_module_planned",
        f"{feature}: подсистема агентов будет подключена отдельным модулем. "
        "Каркас платформы и реестр инструментов уже готовы.",
    )


@router.get("/agents/roadmap", response_model=AgentRoadmap)
def agent_roadmap(_: User = Depends(get_current_user)) -> AgentRoadmap:
    return AgentRoadmap(
        title="Подсистема ИИ-агентов",
        summary=(
            "Каркас платформы готов: проекты, каталоги, реестр инструментов и API "
            "уже на месте. Вкладка агентов подключается следующим модулем без "
            "изменения ядра."
        ),
        items=[
            RoadmapItem(
                id="agent-editor",
                title="Конструктор агента",
                description=(
                    "Роль и инструкция, выбор модели, лимиты шагов, токенов и "
                    "времени, граф сценария с узлами «AI Agent» и «Вызов инструмента»."
                ),
                status="planned",
                footprint="Экран «Ассистенты» → редактор агента (React Flow)",
            ),
            RoadmapItem(
                id="tool-permissions",
                title="Инструменты и права агента",
                description=(
                    "Реестр инструментов уже ведётся в разделе «Промпт-инжиниринг → "
                    "Инструменты»: версии, статусы, проверка манифеста и флаг "
                    "подтверждения опасных действий."
                ),
                status="ready",
                footprint="GET /api/v1/tools · POST /api/v1/tools/{id}/validate",
            ),
            RoadmapItem(
                id="runs",
                title="Запуск задачи и трассировка",
                description=(
                    "Синхронный и асинхронный запуск, шаги планирования, вызова и "
                    "ответа с аргументами, длительностью и расходом токенов."
                ),
                status="planned",
                footprint="POST /api/v1/runs · GET /api/v1/runs/{id}/trace",
            ),
            RoadmapItem(
                id="approvals",
                title="Подтверждение опасных действий",
                description=(
                    "Шаг с побочным эффектом приостанавливается, оператор видит "
                    "аргументы и ожидаемый эффект, отказ возвращается агенту как "
                    "результат шага."
                ),
                status="planned",
                footprint="POST /api/v1/runs/{id}/approve",
            ),
            RoadmapItem(
                id="journal",
                title="Журнал запусков и метрики",
                description=(
                    "История запусков, доля успешных, средняя длительность, расход "
                    "токенов, выгрузка в CSV и разбор инцидентов по трассировке."
                ),
                status="planned",
                footprint="GET /api/v1/metrics/summary",
            ),
            RoadmapItem(
                id="process-node",
                title="Агент как узел процесса",
                description=(
                    "Публикация агента в редактор сценариев с входами и выходами, "
                    "доступная из конструктора как обычный блок."
                ),
                status="planned",
                footprint="Редактор сценариев → узел «AI Agent»",
            ),
        ],
        endpoints=[
            "GET /api/v1/agents",
            "POST /api/v1/agents",
            "PATCH /api/v1/agents/{id}",
            "POST /api/v1/runs",
            "GET /api/v1/runs/{id}",
            "GET /api/v1/runs/{id}/trace",
            "POST /api/v1/runs/{id}/approve",
            "GET /api/v1/metrics/summary",
        ],
        data_model=["agents", "tools", "tool_versions", "agent_tools", "runs", "run_steps"],
        ready_building_blocks=[
            "Проекты, роли и сессии",
            "Реестр инструментов, версии и проверка манифеста",
            "Поиск инструментов по описанию задачи",
            "Единый формат ошибок и устойчивые идентификаторы записей",
            "Docker-контур и seed-данные для демонстрации",
        ],
    )


@router.get("/agents", include_in_schema=True)
def list_agents(_: User = Depends(get_current_user)):
    raise _not_implemented("Список агентов")


@router.post("/agents")
def create_agent(_: User = Depends(get_current_user)):
    raise _not_implemented("Создание агента")


@router.post("/runs")
def create_run(_: User = Depends(get_current_user)):
    raise _not_implemented("Запуск задачи")


@router.get("/runs/{run_id}")
def get_run(run_id: str, _: User = Depends(get_current_user)):
    raise _not_implemented("Состояние запуска")


@router.get("/runs/{run_id}/trace")
def get_run_trace(run_id: str, _: User = Depends(get_current_user)):
    raise _not_implemented("Трассировка запуска")


@router.post("/runs/{run_id}/approve")
def approve_step(run_id: str, _: User = Depends(get_current_user)):
    raise _not_implemented("Подтверждение шага")
