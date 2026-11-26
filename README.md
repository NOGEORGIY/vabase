# Vabase

Упрощённый прототип: агенты, инструменты и промпты. Входа по паролю нет.

## Запуск

```powershell
docker compose up -d --build
```

Порты берутся из `.env`: `WEB_PORT` и `API_PORT`. По умолчанию `8090` и `8001`.

## Интерфейс

- `Агенты` — React Flow, узлы агентов и инструментов.
- `Инструменты` — список, добавление и удаление.
- `Промпты` — список, добавление и удаление.

Для инструмента в узле агента доступен выбор из уже созданных инструментов.

## API

- `GET /api/v1/tools`
- `POST /api/v1/tools`
- `DELETE /api/v1/tools/{id}`
- `GET /api/v1/prompts`
- `POST /api/v1/prompts`
- `DELETE /api/v1/prompts/{id}`
- `GET /healthz`

Swagger: `http://localhost:8001/api/docs`.

## Состав

- `backend/app/services/llm_client.py` — клиент GigaChat.
- `backend/app/tools/` — инструменты.
- `backend/app/api/tools.py`, `prompts.py` — простые CRUD-роуты.
- `frontend/src/Agents.tsx`, `Tools.tsx`, `Prompts.tsx` — три страницы.
