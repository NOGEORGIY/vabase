import { useEffect, useRef, useState } from "react";
import { NavLink, Navigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FlaskConical,
  Play,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useApi, useDocumentTitle } from "../api/hooks";
import type { ListResponse, TestCase } from "../api/types";
import { formatDate } from "../lib/format";
import { CatalogTable } from "../ui/CatalogTable";
import type { Column } from "../ui/DataTable";
import {
  Badge,
  Button,
  Checkbox,
  PageHeader,
  StatusBadge,
  cx,
} from "../ui/primitives";
import { PromptSearchModal } from "./PromptSearchModal";
import { ToolsPanel } from "./ToolsPanel";
import type {
  Prompt,
  PromptElement,
  PromptTask,
  PromptVariable,
  Theme,
} from "../api/types";

const TABS = [
  { key: "prompts", label: "Промпты" },
  { key: "elements", label: "Элементы промпта" },
  { key: "themes", label: "Темы" },
  { key: "tasks", label: "Задачи" },
  { key: "variables", label: "Переменные" },
  { key: "tools", label: "Инструменты" },
  { key: "test-cases", label: "Тест-кейсы" },
  { key: "testing", label: "Тестирование" },
];

const MODES = [
  { key: "implementation", label: "Реализация" },
  { key: "design", label: "Проектирование" },
] as const;

type Mode = (typeof MODES)[number]["key"];

export function PromptEngineering() {
  const { tab } = useParams();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>("implementation");
  const [searchOpen, setSearchOpen] = useState(false);
  const [vectorSearch, setVectorSearch] = useState(false);
  const autoOpenOnce = useRef(params.get("new") === "1");
  const autoOpen = autoOpenOnce.current;
  useEffect(() => {
    autoOpenOnce.current = false;
  }, []);

  const knownTab = TABS.some((item) => item.key === tab);
  useDocumentTitle(
    TABS.find((item) => item.key === tab)?.label
      ? `Промпт-инжиниринг · ${TABS.find((item) => item.key === tab)?.label}`
      : "Промпт-инжиниринг",
  );

  if (!knownTab) {
    return <Navigate to="/prompt-engineering/prompts" replace />;
  }

  const activeTab = tab ?? "prompts";

  const promptColumns: Column<Prompt>[] = [
    { key: "name", header: "Название", primary: true },
    {
      key: "description",
      header: "Описание",
      render: (row) => row.description || <span className="muted">—</span>,
    },
    {
      key: "topics",
      header: "Темы",
      render: (row) =>
        row.topics ? (
          <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
            {row.topics.split(",").map((topic) => (
              <Badge key={topic} tone="gray" noDot>
                {topic.trim()}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="muted">—</span>
        ),
    },
    {
      key: "tools",
      header: "Инструменты",
      render: (row) =>
        row.tools ? <span className="tiny">{row.tools}</span> : <span className="muted">—</span>,
    },
    {
      key: "task",
      header: "Задача",
      render: (row) => row.task || <span className="muted">—</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Промпт-инжиниринг"
        subtitle="Инструкции, элементы промпта, переменные и тест-кейсы для модели. Реестр инструментов — задел под агентов."
        actions={
          <div className="segmented">
            {MODES.map((item) => (
              <button
                key={item.key}
                type="button"
                className={cx(mode === item.key && "active")}
                onClick={() => setMode(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="tabs-row">
        <nav className="pill-tabs">
          {TABS.map((item) => (
            <NavLink
              key={item.key}
              to={`/prompt-engineering/${item.key}`}
              className={({ isActive }) => cx("pill-tab", isActive && "active")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {mode === "design" ? (
        <div className="card" style={{ marginBottom: 18, padding: 22 }}>
          <div className="row between" style={{ alignItems: "flex-start" }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 620 }}>Схема промпта</h3>
              <p className="tiny muted" style={{ marginTop: 3 }}>
                Проектирование структуры: изменения применяются к реализации после сохранения.
              </p>
            </div>
            <Badge tone="violet" noDot>
              <Sparkles size={12} /> режим проектирования
            </Badge>
          </div>
          <div className="flow">
            {["Системная роль", "Контекст процесса", "Доступные инструменты", "Формат ответа"].map(
              (node, index) => (
                <span key={node} className="row" style={{ gap: 8 }}>
                  {index > 0 ? <ArrowRight className="flow-arrow" size={15} /> : null}
                  <span className="flow-node">
                    <Sparkles /> {node}
                  </span>
                </span>
              ),
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "prompts" ? (
        <CatalogTable<Prompt>
          endpoint="/prompts"
          title="Промпты"
          subtitle="Шаблоны инструкций, привязанные к задачам и инструментам"
          columns={promptColumns}
          createLabel="Добавить"
          searchPlaceholder="Поиск по названию и тексту"
          emptyTitle="Промптов пока нет"
          emptyText="Создайте первый промпт: роль, инструкция и ожидаемый формат ответа."
          autoOpen={autoOpen}
          pageSize={10}
          minWidth={880}
          headerActions={
            <Button variant="soft" onClick={() => setSearchOpen(true)}>
              <Sparkles /> Поиск по описанию задачи
            </Button>
          }
          toolbarExtra={
            <div className="row" style={{ gap: 14 }}>
              <Checkbox
                checked={vectorSearch}
                onChange={setVectorSearch}
                label={
                  <span className="row" style={{ gap: 5 }}>
                    Векторный поиск
                    <span className="tiny muted">· точное совпадение</span>
                  </span>
                }
              />
            </div>
          }
          fields={[
            { name: "name", label: "Название", required: true },
            { name: "status", label: "Статус", type: "select", options: [
              { value: "draft", label: "Черновик" },
              { value: "active", label: "Активен" },
              { value: "archived", label: "Архив" },
            ], defaultValue: "draft" },
            { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
            { name: "content", label: "Текст промпта", type: "textarea", wide: true, rows: 6 },
            { name: "topics", label: "Темы", placeholder: "Поддержка, Классификация" },
            { name: "tools", label: "Инструменты", placeholder: "crm.get_contact, email.send" },
            { name: "task", label: "Задача", placeholder: "Разбор входящего обращения" },
          ]}
        />
      ) : null}

      {activeTab === "elements" ? (
        <CatalogTable<PromptElement>
          endpoint="/prompt-elements"
          title="Элементы промпта"
          subtitle="Переиспользуемые блоки: роль, контекст, инструкции и примеры"
          columns={[
            { key: "name", header: "Название", primary: true },
            { key: "description", header: "Описание" },
            {
              key: "element_type",
              header: "Тип",
              width: "130px",
              render: (row) => (
                <Badge tone="blue" noDot>
                  {row.element_type}
                </Badge>
              ),
            },
            {
              key: "content",
              header: "Содержимое",
              render: (row) => <span className="cell-sub">{row.content || "—"}</span>,
            },
          ]}
          fields={[
            { name: "name", label: "Название", required: true },
            { name: "element_type", label: "Тип", type: "select", options: [
              { value: "system", label: "Системный" },
              { value: "context", label: "Контекст" },
              { value: "instruction", label: "Инструкция" },
              { value: "example", label: "Пример" },
            ] },
            { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
            { name: "content", label: "Содержимое", type: "textarea", wide: true, rows: 5 },
          ]}
          emptyTitle="Элементов пока нет"
          emptyText="Соберите библиотеку блоков, из которых складываются промпты."
          autoOpen={autoOpen}
        />
      ) : null}

      {activeTab === "themes" ? (
        <CatalogTable<Theme>
          endpoint="/prompt-themes"
          title="Темы"
          subtitle="Направления, по которым группируются промпты"
          columns={[
            { key: "name", header: "Название", primary: true },
            { key: "description", header: "Описание" },
            {
              key: "updated_at",
              header: "Обновлено",
              width: "130px",
              render: (row) => <span className="tiny muted">{formatDate(row.updated_at)}</span>,
            },
          ]}
          fields={[
            { name: "name", label: "Название", required: true },
            { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
          ]}
          emptyTitle="Тем пока нет"
          emptyText="Добавьте тему, чтобы быстрее находить промпты."
          autoOpen={autoOpen}
        />
      ) : null}

      {activeTab === "tasks" ? (
        <CatalogTable<PromptTask>
          endpoint="/prompt-tasks"
          title="Задачи"
          subtitle="Типовые задачи, под которые подбирается промпт"
          columns={[
            { key: "name", header: "Название", primary: true },
            { key: "description", header: "Описание" },
            { key: "status", header: "Статус", width: "120px", render: (row) => <StatusBadge status={row.status} /> },
          ]}
          fields={[
            { name: "name", label: "Название", required: true },
            { name: "status", label: "Статус", type: "select", options: [
              { value: "draft", label: "Черновик" },
              { value: "active", label: "Активен" },
            ], defaultValue: "draft" },
            { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
          ]}
          emptyTitle="Задач пока нет"
          emptyText="Опишите типовые задачи, чтобы привязать к ним промпты."
          autoOpen={autoOpen}
        />
      ) : null}

      {activeTab === "variables" ? (
        <CatalogTable<PromptVariable>
          endpoint="/prompt-variables"
          title="Переменные"
          subtitle="Подстановки, которые используются в тексте промпта"
          columns={[
            { key: "name", header: "Название", primary: true },
            { key: "description", header: "Описание" },
            {
              key: "value_type",
              header: "Тип",
              width: "110px",
              render: (row) => <Badge tone="gray" noDot>{row.value_type}</Badge>,
            },
            {
              key: "default_value",
              header: "По умолчанию",
              render: (row) => <span className="code-inline">{row.default_value || "—"}</span>,
            },
          ]}
          fields={[
            { name: "name", label: "Название", required: true, placeholder: "client_name" },
            { name: "value_type", label: "Тип", type: "select", options: [
              { value: "string", label: "Строка" },
              { value: "number", label: "Число" },
              { value: "boolean", label: "Логический" },
              { value: "enum", label: "Перечисление" },
            ] },
            { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
            { name: "default_value", label: "Значение по умолчанию", wide: true },
          ]}
          emptyTitle="Переменных пока нет"
          emptyText="Добавьте подстановки для персонализации промптов."
          autoOpen={autoOpen}
        />
      ) : null}

      {activeTab === "tools" ? <ToolsPanel /> : null}

      {activeTab === "test-cases" ? (
        <CatalogTable<TestCase>
          endpoint="/test-cases"
          title="Тест-кейсы"
          subtitle="Проверки, которые будут прогоняться вместе с подсистемой агентов"
          columns={[
            { key: "name", header: "Название", primary: true },
            { key: "description", header: "Описание" },
            {
              key: "input_text",
              header: "Вход",
              render: (row) => <span className="cell-sub">{row.input_text || "—"}</span>,
            },
            {
              key: "expected_output",
              header: "Ожидание",
              render: (row) => <span className="cell-sub">{row.expected_output || "—"}</span>,
            },
            { key: "status", header: "Статус", width: "120px", render: (row) => <StatusBadge status={row.status} /> },
          ]}
          fields={[
            { name: "name", label: "Название", required: true },
            { name: "status", label: "Статус", type: "select", options: [
              { value: "draft", label: "Черновик" },
              { value: "active", label: "Активен" },
            ] },
            { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
            { name: "input_text", label: "Входные данные", type: "textarea", wide: true, rows: 3 },
            { name: "expected_output", label: "Ожидаемый результат", type: "textarea", wide: true, rows: 3 },
          ]}
          emptyTitle="Тест-кейсов пока нет"
          emptyText="Добавьте проверку, чтобы зафиксировать ожидаемое поведение."
          autoOpen={autoOpen}
          pageSize={10}
          minWidth={820}
        />
      ) : null}

      {activeTab === "testing" ? <TestingTab /> : null}

      <PromptSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function TestingTab() {
  const { data } = useApi<ListResponse<TestCase>>("/test-cases?limit=500");
  const items = data?.items ?? [];
  const active = items.filter((item) => item.status === "active").length;
  const drafts = items.filter((item) => item.status === "draft").length;

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="card stat-card">
          <div className="stat-top">
            <span className="stat-icon">
              <FlaskConical />
            </span>
          </div>
          <div>
            <div className="stat-value">{items.length}</div>
            <div className="stat-label">Тест-кейсов в наборе</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-top">
            <span className="stat-icon green">
              <CheckCircle2 />
            </span>
          </div>
          <div>
            <div className="stat-value">{active}</div>
            <div className="stat-label">Активных проверок</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-top">
            <span className="stat-icon amber">
              <Clock />
            </span>
          </div>
          <div>
            <div className="stat-value">{drafts}</div>
            <div className="stat-label">Черновиков</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row between" style={{ alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <h2 className="card-title">Автоматические прогоны</h2>
            <p className="card-subtitle">
              Прогон тест-кейсов включится вместе с исполнителем агента: сейчас нет цикла
              «запуск — ответ модели — оценка».
            </p>
          </div>
          <Button variant="primary" disabled title="Появится вместе с подсистемой агентов">
            <Play /> Запустить прогон
          </Button>
        </div>
        <div className="tool-note" style={{ marginBottom: 0 }}>
          <span className="icon">
            <Wrench />
          </span>
          <div>
            <div className="t">Что уже готово для тестирования</div>
            <div className="s">
              Набор тест-кейсов хранится в базе, а реестр инструментов умеет проверять манифест.
              После подключения модуля агентов прогон будет проходить по тем же записям.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
