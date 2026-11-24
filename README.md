# Vabase

Прототип низкокодовой платформы конструирования решений «Vabase» по курсовому проекту
«Разработка подсистемы AI-агентов с динамическим подключением инструментов в низкокодовой
платформе конструирования».

## Старт

```powershell
cd vabase
Copy-Item .env.example .env
docker compose up -d --build
```

| Сервис                  | Адрес |
|-------------------------| --- |
| Веб-интерфейс           | http://localhost:8090 |
| API и OpenAPI (Swagger) | http://localhost:8001/api/docs |
| Проверка состояния      | http://localhost:8090/healthz |

Порты задаются переменными `WEB_PORT` и `API_PORT` в `.env`

Демо-аккаунт:
юзер: `g.rasputin@vabase.ru` 
пароль: `vabase`


### Задел под подсистему агентов

- **Реестр инструментов** (`/api/v1/tools`) — основа, из которой агент будет получать
  разрешённые вызовы:
  - статусы `draft → registered → validated → published → active`;
  - версия, HTTP-метод, адрес вызова, тип (`http`, `mcp`, `webhook`, `builtin`);
  - JSON-схема параметров;
  - флаг `requires_approval` — инструмент с побочным эффектом потребует подтверждения оператора;
  - `POST /tools/{id}/validate` — проверка манифеста с понятными результатами по каждому пункту;
  - `POST /tools/{id}/publish` — публикация после проверки;
  - `GET /tools/search?q=...` — ранжирование инструментов по описанию задачи (пока лексическое,
    контракт готов к замене на векторный поиск).
- **Роадмап** `GET /agents/roadmap` — данные для экрана «Ассистенты»: план модуля, готовые
  строительные блоки, зарезервированные маршруты и таблицы.
- **Зарезервированные маршруты** `/agents`, `/runs`, `/runs/{id}`, `/runs/{id}/trace`,
  `/runs/{id}/approve` отвечают `501 NOT_IMPLEMENTED` с единым телом ошибки. Контракт
  зафиксирован, чтобы вкладку можно было реализовать, не меняя клиентов.
- **Экран-заготовка** в проекте: план реализации, схема «Задача → ядро → инструменты →
  внешние системы → трассировка», готовые блоки, код-контракт API и модель данных.


## Архитектура

```
Браузер
   │ HTTP
   ▼
web (nginx :80) ──/api──► api (FastAPI :8000) ──► db (PostgreSQL 16)
   │                            │
   │                            └──► redis (кэш, очереди — подключён в контур)
   └── SPA (React + Vite, статика)
```

`docker compose` поднимает четыре сервиса:

| Сервис | Назначение | Порт |
| --- | --- | --- |
| `web` | nginx: статика React-приложения и reverse proxy на API | `8090` |
| `api` | FastAPI: REST, OpenAPI, бизнес-логика | `8001` |
| `db` | PostgreSQL 16, том `vabase-db` | внутри сети |
| `redis` | Redis 7, том `vabase-redis` | внутри сети |

### Структура репозитория

```
vabase/
├── docker-compose.yml
├── docker-compose.dev.yml    # публикация портов для локальной разработки
├── .env.example
├── scripts/                  # up.ps1 / down.ps1 / reset.ps1
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── app/
│   │   ├── main.py           # FastAPI, роутеры, healthz
│   │   ├── config.py         # настройки из env
│   │   ├── database.py       # engine, сессии, create_all
│   │   ├── models.py         # SQLAlchemy-модели платформы
│   │   ├── schemas.py        # Pydantic-схемы и контракты
│   │   ├── seed.py           # демо-данные
│   │   ├── security.py       # пароли, сессии
│   │   ├── errors.py         # единый формат ошибок
│   │   └── api/
│   │       ├── crud.py       # фабрика CRUD-роутеров
│   │       ├── agents.py     # заготовка подсистемы агентов
│   │       ├── tools.py      # реестр инструментов
│   │       └── ...           # projects, prompts, info_model и т.д.
│   └── tests/test_api.py     # pytest + TestClient
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── src/
    │   ├── api/              # клиент, типы, хуки
    │   ├── context/          # авторизация, тосты
    │   ├── layout/           # оболочка платформы и проекта
    │   ├── ui/               # кнопки, таблицы, модалки, CatalogTable
    │   ├── pages/            # экраны
    │   └── styles/global.css # дизайн-система
    └── package.json
```

### Модель данных

| Таблица | Назначение |
| --- | --- |
| `users`, `sessions` | пользователи и серверные сессии |
| `projects` | проекты платформы |
| `services`, `components` | каталоги сервисов и компонентов |
| `entities` | сущности проекта |
| `prompts`, `prompt_elements`, `prompt_themes`, `prompt_tasks`, `prompt_variables`, `test_cases` | промпт-инжиниринг |
| `tools` | реестр инструментов (основа агентов) |
| `info_categories`, `info_characteristics`, `info_scales`, `info_values`, `info_interpreted_values`, `info_constraints` | информационная модель |
| `dictionaries`, `libraries`, `library_classes` | интерпретируемые данные |

Планируемые таблицы подсистемы агентов: `agents`, `agent_tools`, `runs`, `run_steps`

## API

Базовый префикс — `/api/v1`, авторизация по заголовку `Authorization: Bearer <token>`.

| Метод | Путь | Назначение |
| --- | --- | --- |
| `POST` | `/auth/login` | вход, выдача токена |
| `GET` | `/auth/me` | текущий пользователь |
| `GET` | `/auth/demo-accounts` | демо-аккаунты для экрана входа |
| `GET` / `POST` | `/projects` | список и создание проектов |
| `GET` / `PATCH` / `DELETE` | `/projects/{id}` | карточка, изменение, удаление проекта |
| `GET` / `POST` | `/services`, `/components`, `/entities` | каталоги |
| `GET` / `POST` | `/prompts` | промпты |
| `GET` | `/prompts/search?q=` | ранжированный подбор промпта по задаче |
| `GET` / `POST` | `/prompt-elements`, `/prompt-themes`, `/prompt-tasks`, `/prompt-variables`, `/test-cases` | остальные каталоги промптов |
| `GET` / `POST` | `/tools` | реестр инструментов |
| `GET` | `/tools/search?q=` | подбор инструмента по описанию задачи |
| `POST` | `/tools/{id}/validate` | проверка манифеста |
| `POST` | `/tools/{id}/publish` | публикация инструмента |
| `GET` / `POST` | `/info-model/*` | категории, характеристики, шкалы, значения, ограничения |
| `GET` / `POST` | `/interpreted-data/*` | справочники, библиотеки, классы |
| `GET` | `/metrics/summary` | сводные метрики |
| `GET` | `/search?q=` | глобальный поиск |
| `GET` | `/agents/roadmap` | роадмап подсистемы агентов |
| `GET` / `POST` | `/agents` | `501` — зарезервировано |
| `POST` | `/runs` | `501` — зарезервировано |
| `GET` | `/runs/{id}/trace` | `501` — зарезервировано |
| `POST` | `/runs/{id}/approve` | `501` — зарезервировано |

## Разработка без Docker

Поднять только инфраструктуру с dev-портами `5433` (PostgreSQL) и `6380` (Redis):

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db redis
```

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
$env:DATABASE_URL = "postgresql+psycopg://vabase:vabase@localhost:5433/vabase"
$env:REDIS_URL = "redis://localhost:6380/0"
uvicorn app.main:app --reload --port 8001
```

Для локального запуска без PostgreSQL можно не задавать `DATABASE_URL`: по умолчанию
используется SQLite-файл `vabase.db`, а таблицы и демо-данные создаются автоматически.

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Vite откроется на `http://127.0.0.1:5173` и проксирует `/api` на `http://127.0.0.1:8001`.


