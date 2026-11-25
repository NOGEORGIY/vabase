from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import (
    Characteristic,
    Component,
    Constraint,
    Dictionary,
    Entity,
    InfoCategory,
    InfoValue,
    InterpretedValue,
    Library,
    LibraryClass,
    Project,
    Prompt,
    PromptElement,
    PromptTask,
    PromptVariable,
    Scale,
    Service,
    TestCase,
    Theme,
    Tool,
    User,
)
from app.security import hash_password


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _id() -> str:
    return str(uuid4())


def _schema(properties: dict, required: list[str] | None = None) -> dict:
    return {
        "type": "object",
        "properties": properties,
        "required": required or [],
    }


def seed_demo(db: Session) -> bool:
    """Populate the demo contour once. Returns True when data was inserted."""

    if db.scalar(select(func.count(User.id))) > 0:
        return False

    now = _now()
    password_hash = hash_password(settings.demo_password)

    users = [
        User(
            id=_id(),
            email="g.rasputin@vabase.ru",
            full_name="Григорий Распутин",
            role="analyst",
            password_hash=password_hash,
            avatar_color="#1a4bff",
            created_at=now - timedelta(days=30),
        ),
    ]
    db.add_all(users)
    analyst = users[0]
    db.flush()

    projects = [
        Project(
            id=_id(),
            name="рпк-тест",
            description="тестовое для рпк",
            status="active",
            owner_id=analyst.id,
            created_at=now - timedelta(hours=3),
            updated_at=now - timedelta(minutes=40),
        ),
    ]
    db.add_all(projects)
    db.flush()
    main_project = projects[0]

    services = [
        Service(
            id=_id(),
            name="OpenWeatherMapAPI",
            description="Текущая погода и прогноз по координатам",
            url="http://api.openweathermap.org/data/2.5/find",
            service_type="api",
            status="active",
            project_id=main_project.id,
        ),
        Service(
            id=_id(),
            name="openstreetmapAPI",
            description="Геокодирование адресов и построение маршрутов",
            url="https://nominatim.openstreetmap.org/search",
            service_type="api",
            status="active",
        ),
        Service(
            id=_id(),
            name="vehicle api",
            description="Данные о транспортных средствах",
            url="https://vehicle.example.ru/api/v1",
            service_type="api",
            status="draft",
        ),
        Service(
            id=_id(),
            name="Telegram Bot",
            description="Отправка уведомлений в рабочие чаты",
            url="https://api.telegram.org/bot",
            service_type="webhook",
            status="active",
        ),
        Service(
            id=_id(),
            name="Встроенный расчёт НДС",
            description="Функция платформы для расчёта налогов",
            url="platform.calc_vat",
            service_type="builtin",
            status="active",
        ),
    ]
    for index, service in enumerate(services):
        service.created_at = now - timedelta(minutes=5 * index)
        service.updated_at = service.created_at
    db.add_all(services)

    components = [
        Component(
            id=_id(),
            name="Форма заявки",
            description="Форма создания обращения с проверкой обязательных полей",
            component_type="form",
            status="active",
            project_id=main_project.id,
        ),
        Component(
            id=_id(),
            name="Таблица заказов",
            description="Список заказов с фильтрами и постраничным выводом",
            component_type="table",
            status="active",
        ),
        Component(
            id=_id(),
            name="Карточка клиента",
            description="Просмотр и редактирование данных контрагента",
            component_type="card",
            status="active",
            project_id=main_project.id,
        ),
        Component(
            id=_id(),
            name="Календарь согласований",
            description="Планирование встреч и контроль сроков",
            component_type="calendar",
            status="draft",
        ),
        Component(
            id=_id(),
            name="MCP-компонент CRM",
            description="Подключение MCP-сервера CRM к сценариям",
            component_type="connector",
            status="active",
        ),
    ]
    for index, component in enumerate(components):
        component.created_at = now - timedelta(minutes=7 * index)
        component.updated_at = component.created_at
    db.add_all(components)

    entities = [
        Entity(
            id=_id(),
            name="Заявка",
            description="Обращение клиента с темой, приоритетом и статусом",
            fields_count=8,
            project_id=main_project.id,
        ),
        Entity(
            id=_id(),
            name="Клиент",
            description="Карточка контрагента и контактные данные",
            fields_count=12,
            project_id=main_project.id,
        ),
        Entity(
            id=_id(),
            name="Договор",
            description="Договор с клиентом и связанные документы",
            fields_count=6,
            project_id=main_project.id,
        ),
    ]
    db.add_all(entities)

    prompts = [
        Prompt(
            id=_id(),
            name="Промпт на проверку чётности суммы ряда",
            description="",
            content="Проверь, является ли сумма числового ряда чётной. Ответь «да» или «нет».",
            topics="",
            tools="",
            task="",
            status="draft",
            project_id=main_project.id,
        ),
        Prompt(
            id=_id(),
            name="Классификация обращения клиента",
            description="Определяет тему и приоритет входящего обращения",
            content="Ты классификатор обращений службы поддержки...",
            topics="Поддержка, Классификация",
            tools="crm.get_contact, email.send",
            task="Разбор входящего обращения",
            status="active",
            project_id=main_project.id,
        ),
        Prompt(
            id=_id(),
            name="Извлечение реквизитов из письма",
            description="Достаёт номер договора, ИНН и сумму из текста письма",
            content="Извлеки реквизиты из письма и верни JSON...",
            topics="Документы, Извлечение данных",
            tools="erp.search_contract",
            task="Извлечение данных",
            status="active",
        ),
        Prompt(
            id=_id(),
            name="Подготовка ответа по заявке",
            description="Формирует ответ клиенту с учётом статуса заявки",
            content="Составь вежливый ответ клиенту...",
            topics="Поддержка, Коммуникация",
            tools="crm.get_contact, email.send",
            task="Формирование ответа",
            status="draft",
            project_id=main_project.id,
        ),
        Prompt(
            id=_id(),
            name="Проверка данных контрагента",
            description="Сверяет ИНН и наименование с данными справочника",
            content="Сверь реквизиты контрагента...",
            topics="Контрагенты, Проверка",
            tools="crm.get_contact",
            task="Проверка данных",
            status="draft",
        ),
    ]
    for index, prompt in enumerate(prompts):
        prompt.created_at = now - timedelta(minutes=10 * index)
        prompt.updated_at = prompt.created_at
    db.add_all(prompts)

    elements = [
        PromptElement(
            id=_id(),
            name="Системная роль",
            description="Задаёт роль и границы ответственности модели",
            element_type="system",
            content="Ты — ассистент платформы Vabase...",
        ),
        PromptElement(
            id=_id(),
            name="Контекст процесса",
            description="Данные заявки и история шагов",
            element_type="context",
            content="{{process_context}}",
        ),
        PromptElement(
            id=_id(),
            name="Инструкция по формату",
            description="Требования к структуре ответа",
            element_type="instruction",
            content="Ответь JSON с полями summary и actions.",
        ),
        PromptElement(
            id=_id(),
            name="Пример ответа",
            description="Эталон для few-shot подсказки",
            element_type="example",
            content='{"summary": "...", "actions": []}',
        ),
    ]
    db.add_all(elements)

    themes = [
        Theme(id=_id(), name="Поддержка клиентов", description="Обращения и тикеты"),
        Theme(id=_id(), name="Продажи", description="Работа с лидами и сделками"),
        Theme(id=_id(), name="Закупки", description="Заявки на закупку и поставщики"),
        Theme(id=_id(), name="Внутренние процессы", description="Согласования и регламенты"),
    ]
    db.add_all(themes)

    db.add_all(
        [
            PromptTask(id=_id(), name="Классификация", description="Определение темы обращения", status="active"),
            PromptTask(id=_id(), name="Извлечение данных", description="Разбор текста на поля", status="active"),
            PromptTask(id=_id(), name="Формирование ответа", description="Подготовка текста клиенту", status="draft"),
            PromptTask(id=_id(), name="Проверка данных", description="Сверка со справочниками", status="draft"),
        ]
    )

    db.add_all(
        [
            PromptVariable(id=_id(), name="client_name", description="Имя клиента", value_type="string", default_value="Клиент"),
            PromptVariable(id=_id(), name="order_id", description="Номер заказа", value_type="string", default_value=""),
            PromptVariable(id=_id(), name="tone", description="Тон ответа", value_type="enum", default_value="official"),
            PromptVariable(id=_id(), name="max_length", description="Ограничение длины ответа", value_type="number", default_value="800"),
        ]
    )

    tools = [
        Tool(
            id=_id(),
            name="crm.get_contact",
            description="Возвращает карточку контактного лица по идентификатору",
            tool_type="http",
            endpoint="https://crm.example.ru/api/v2/contacts/{id}",
            http_method="GET",
            version="1.2.0",
            status="published",
            requires_approval=False,
            input_schema=_schema(
                {
                    "id": {"type": "string", "description": "Идентификатор контакта"},
                    "fields": {"type": "array", "items": {"type": "string"}},
                },
                ["id"],
            ),
            project_id=main_project.id,
        ),
        Tool(
            id=_id(),
            name="crm.update_status",
            description="Меняет статус заявки в CRM. Операция изменяет данные заказчика",
            tool_type="http",
            endpoint="https://crm.example.ru/api/v2/tickets/{id}/status",
            http_method="PATCH",
            version="1.1.0",
            status="published",
            requires_approval=True,
            input_schema=_schema(
                {
                    "id": {"type": "string"},
                    "status": {"type": "string", "enum": ["new", "in_progress", "closed"]},
                },
                ["id", "status"],
            ),
            project_id=main_project.id,
        ),
        Tool(
            id=_id(),
            name="email.send",
            description="Отправляет письмо клиенту от имени службы поддержки",
            tool_type="http",
            endpoint="https://mail.example.ru/api/send",
            http_method="POST",
            version="2.0.0",
            status="published",
            requires_approval=True,
            input_schema=_schema(
                {
                    "to": {"type": "string", "format": "email"},
                    "subject": {"type": "string"},
                    "body": {"type": "string"},
                },
                ["to", "subject", "body"],
            ),
            project_id=main_project.id,
        ),
        Tool(
            id=_id(),
            name="erp.create_order",
            description="Создаёт заказ на закупку в учётной системе через MCP-сервер",
            tool_type="mcp",
            endpoint="https://mcp.example.ru/sse",
            http_method="POST",
            version="1.0.0",
            status="validated",
            requires_approval=True,
            input_schema=_schema(
                {
                    "sku": {"type": "string"},
                    "quantity": {"type": "integer", "minimum": 1},
                },
                ["sku", "quantity"],
            ),
        ),
        Tool(
            id=_id(),
            name="weather.current",
            description="Текущая погода в точке по координатам",
            tool_type="http",
            endpoint="https://api.openweathermap.org/data/2.5/weather",
            http_method="GET",
            version="1.0.0",
            status="active",
            requires_approval=False,
            input_schema=_schema(
                {"lat": {"type": "number"}, "lon": {"type": "number"}}, ["lat", "lon"]
            ),
        ),
        Tool(
            id=_id(),
            name="platform.calc_vat",
            description="Встроенная функция платформы для расчёта НДС",
            tool_type="builtin",
            endpoint="platform.calc_vat",
            http_method="POST",
            version="1.0.1",
            status="published",
            requires_approval=False,
            input_schema=_schema(
                {"amount": {"type": "number"}, "rate": {"type": "number", "default": 20}},
                ["amount"],
            ),
        ),
        Tool(
            id=_id(),
            name="hooks.notify_manager",
            description="Вебхук уведомления руководителя о новой заявке",
            tool_type="webhook",
            endpoint="https://hooks.example.ru/vabase/notify",
            http_method="POST",
            version="0.9.0",
            status="draft",
            requires_approval=False,
            input_schema=_schema(
                {"ticket_id": {"type": "string"}, "message": {"type": "string"}},
                ["ticket_id"],
            ),
        ),
    ]
    for index, tool in enumerate(tools):
        tool.created_at = now - timedelta(minutes=9 * index)
        tool.updated_at = tool.created_at
    db.add_all(tools)

    db.add_all(
        [
            TestCase(
                id=_id(),
                name="Классификация: оплата",
                description="Вопрос про оплату должен получить тему «Биллинг»",
                input_text="Не пришла квитанция на оплату за сентябрь",
                expected_output="Биллинг",
                status="active",
            ),
            TestCase(
                id=_id(),
                name="Классификация: доставка",
                description="Вопрос про сроки доставки",
                input_text="Когда доставят заказ №123?",
                expected_output="Доставка",
                status="active",
            ),
            TestCase(
                id=_id(),
                name="Ответ без галлюцинаций",
                description="Агент не должен выдумывать номер заказа",
                input_text="Где мой заказ?",
                expected_output="Уточняющий вопрос о номере заказа",
                status="draft",
            ),
        ]
    )

    categories = {
        "Геоданные": InfoCategory(
            id=_id(), name="Геоданные", description="Координаты и адреса объектов"
        ),
        "Контрагенты": InfoCategory(
            id=_id(), name="Контрагенты", description="Сведения о клиентах и поставщиках"
        ),
        "Заказы": InfoCategory(
            id=_id(), name="Заказы", description="Заказы и позиции заказов"
        ),
        "Антропометрические характеристики": InfoCategory(
            id=_id(),
            name="Антропометрические характеристики",
            description="",
        ),
        "Оборудование": InfoCategory(
            id=_id(), name="Оборудование", description="Справочник оборудования"
        ),
    }
    category_order = [
        "Антропометрические характеристики",
        "Геоданные",
        "Контрагенты",
        "Заказы",
        "Оборудование",
    ]
    for index, name in enumerate(category_order):
        categories[name].created_at = now - timedelta(minutes=11 * index)
        categories[name].updated_at = categories[name].created_at
    db.add_all(categories.values())
    db.flush()

    db.add_all(
        [
            Characteristic(id=_id(), name="Широта", description="WGS-84", category_id=categories["Геоданные"].id, data_type="number", required=True),
            Characteristic(id=_id(), name="Долгота", description="WGS-84", category_id=categories["Геоданные"].id, data_type="number", required=True),
            Characteristic(id=_id(), name="Адрес", description="Текстовый адрес", category_id=categories["Геоданные"].id, data_type="string"),
            Characteristic(id=_id(), name="ИНН", description="10 или 12 цифр", category_id=categories["Контрагенты"].id, data_type="string", required=True),
            Characteristic(id=_id(), name="Наименование", description="Полное наименование", category_id=categories["Контрагенты"].id, data_type="string", required=True),
            Characteristic(id=_id(), name="Номер заказа", description="", category_id=categories["Заказы"].id, data_type="string", required=True),
            Characteristic(id=_id(), name="Сумма", description="В рублях", category_id=categories["Заказы"].id, data_type="number"),
            Characteristic(id=_id(), name="Дата", description="", category_id=categories["Заказы"].id, data_type="date"),
            Characteristic(id=_id(), name="Статус", description="", category_id=categories["Заказы"].id, data_type="reference"),
        ]
    )

    scales = {
        "Статусы заказа": Scale(id=_id(), name="Статусы заказа", description="Жизненный цикл заказа", scale_type="enum"),
        "Тип контрагента": Scale(id=_id(), name="Тип контрагента", description="Юридическое или физическое лицо", scale_type="enum"),
        "Температура": Scale(id=_id(), name="Температура", description="Градусы Цельсия", scale_type="numeric"),
        "Дата документа": Scale(id=_id(), name="Дата документа", description="", scale_type="date"),
    }
    db.add_all(scales.values())
    db.flush()

    db.add_all(
        [
            InfoValue(id=_id(), name="Новый", description="Заказ создан", scale_id=scales["Статусы заказа"].id),
            InfoValue(id=_id(), name="В работе", description="Заказ в обработке", scale_id=scales["Статусы заказа"].id),
            InfoValue(id=_id(), name="Закрыт", description="Заказ выполнен", scale_id=scales["Статусы заказа"].id),
            InfoValue(id=_id(), name="Юридическое лицо", description="", scale_id=scales["Тип контрагента"].id),
            InfoValue(id=_id(), name="Физическое лицо", description="", scale_id=scales["Тип контрагента"].id),
        ]
    )

    db.add_all(
        [
            InterpretedValue(id=_id(), name="Новый", description="Создана заявка и отправлено уведомление", raw_value="new"),
            InterpretedValue(id=_id(), name="В работе", description="Заявка принята в обработку", raw_value="in_progress"),
            InterpretedValue(id=_id(), name="Закрыт", description="Услуга оказана, отправлен опрос", raw_value="closed"),
        ]
    )

    db.add_all(
        [
            Constraint(id=_id(), name="Сумма заказа больше нуля", description="", expression="amount > 0"),
            Constraint(id=_id(), name="ИНН из 10 или 12 цифр", description="", expression="len(inn) in (10, 12)"),
            Constraint(id=_id(), name="Дата не в будущем", description="", expression="date <= today()"),
        ]
    )

    dictionaries = [
        Dictionary(id=_id(), name="ghfhg", description="", dict_type="api"),
        Dictionary(id=_id(), name="Тест5", description="", dict_type="api"),
        Dictionary(id=_id(), name="Тестовый", description="", dict_type="file"),
        Dictionary(
            id=_id(),
            name="Статусы заявок",
            description="Справочник статусов обращения",
            dict_type="api",
            project_id=main_project.id,
        ),
        Dictionary(
            id=_id(),
            name="Единицы измерения",
            description="Справочник единиц измерения",
            dict_type="file",
        ),
    ]
    for index, dictionary in enumerate(dictionaries):
        dictionary.created_at = now - timedelta(minutes=13 * index)
        dictionary.updated_at = dictionary.created_at
    db.add_all(dictionaries)

    libraries = {
        "Стандартная библиотека Vabase": Library(
            id=_id(),
            name="Стандартная библиотека Vabase",
            description="Базовые классы сущностей и справочников",
            version="1.2.0",
        ),
        "Библиотека интеграций": Library(
            id=_id(),
            name="Библиотека интеграций",
            description="Адаптеры HTTP, MCP и вебхуков",
            version="2.0.0",
        ),
    }
    db.add_all(libraries.values())
    db.flush()

    db.add_all(
        [
            LibraryClass(id=_id(), name="Клиент", description="Класс контрагента", library_id=libraries["Стандартная библиотека Vabase"].id),
            LibraryClass(id=_id(), name="Заказ", description="Класс заказа", library_id=libraries["Стандартная библиотека Vabase"].id),
            LibraryClass(id=_id(), name="Документ", description="Базовый класс документа", library_id=libraries["Стандартная библиотека Vabase"].id),
            LibraryClass(id=_id(), name="HTTP-адаптер", description="Вызов REST-сервисов", library_id=libraries["Библиотека интеграций"].id),
            LibraryClass(id=_id(), name="MCP-клиент", description="Подключение MCP-серверов", library_id=libraries["Библиотека интеграций"].id),
        ]
    )

    db.commit()
    return True
