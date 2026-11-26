# Vabase

Упрощённый прототип: агенты, инструменты и промпты. Входа по паролю нет.

## Запуск

```powershell
docker compose up -d --build
```

Порты берутся из `.env`: `WEB_PORT` и `API_PORT`. По умолчанию `8090` и `8001`.

## Интерфейс

- `Агенты` — React Flow, узлы агентов, инструментов и текста.
- `Инструменты` — список, добавление, редактирование endpoint и параметров.
- `Промпты` — список, добавление и удаление.

Кнопка `Создать текст` добавляет узел, в котором промпт выбирается из списка готовых промптов. Этот промпт получает только тот агент, к которому узел подключён. Если агент подключён к агенту, второй получает финальный ответ первого, а не исходный текст.

Нижняя панель тянется вверх. В ней есть режимы «Все шаги» и «Финальный ответ»; поля ввода вопроса в панели нет.

Если инструмент соединён с агентом, его схема передаётся в `payload["functions"]`. Системный промпт передаётся сообщением с ролью `system`.

## API

- `GET /api/v1/tools`
- `POST /api/v1/tools`
- `PATCH /api/v1/tools/{id}`
- `DELETE /api/v1/tools/{id}`
- `GET /api/v1/prompts`
- `POST /api/v1/prompts`
- `DELETE /api/v1/prompts/{id}`
- `POST /api/v1/run`
- `GET /healthz`

Swagger: `http://localhost:8001/api/docs`.

## Состав

- `backend/app/services/llm_client.py` — клиент GigaChat.
- `backend/app/tools/` — инструменты.
- `backend/app/api/tools.py`, `prompts.py` — CRUD-роуты.
- `frontend/src/Agents.tsx`, `Tools.tsx`, `Prompts.tsx` — три страницы.
