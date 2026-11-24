import { useState } from "react";
import { Boxes, Cog } from "lucide-react";
import { useDocumentTitle } from "../api/hooks";
import type { Component, Service } from "../api/types";
import { useProject } from "../layout/ProjectLayout";
import {
  COMPONENT_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
} from "../lib/format";
import { CatalogTable } from "../ui/CatalogTable";
import { Badge, StatusBadge, cx } from "../ui/primitives";

type Tab = "components" | "services";

export function ProjectResources() {
  const { project } = useProject();
  const [tab, setTab] = useState<Tab>("components");
  useDocumentTitle(`${project.name} · Компоненты и сервисы`);

  return (
    <>
      <div className="row between" style={{ alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h1 className="project-content-title">Компоненты и сервисы</h1>
          <p className="project-content-sub" style={{ marginBottom: 0 }}>
            Блоки интерфейса и внешние подключения, привязанные к проекту.
          </p>
        </div>
        <div className="segmented">
          <button
            type="button"
            className={cx(tab === "components" && "active")}
            onClick={() => setTab("components")}
          >
            Компоненты
          </button>
          <button
            type="button"
            className={cx(tab === "services" && "active")}
            onClick={() => setTab("services")}
          >
            Сервисы
          </button>
        </div>
      </div>

      {tab === "components" ? (
        <CatalogTable<Component>
          key="components"
          endpoint="/components"
          query={{ project_id: project.id }}
          defaults={{ project_id: project.id }}
          title="Компоненты проекта"
          subtitle="Формы, таблицы, карточки и коннекторы"
          columns={[
            {
              key: "name",
              header: "Компонент",
              primary: true,
              render: (row) => (
                <span className="row" style={{ gap: 9 }}>
                  <Boxes size={16} color="var(--blue)" />
                  {row.name}
                </span>
              ),
            },
            { key: "description", header: "Описание" },
            {
              key: "component_type",
              header: "Тип",
              width: "140px",
              render: (row) => (
                <Badge tone="gray" noDot>
                  {COMPONENT_TYPE_LABELS[row.component_type] ?? row.component_type}
                </Badge>
              ),
            },
            {
              key: "status",
              header: "Статус",
              width: "120px",
              render: (row) => <StatusBadge status={row.status} />,
            },
          ]}
          fields={[
            { name: "name", label: "Название", required: true },
            {
              name: "component_type",
              label: "Тип",
              type: "select",
              options: Object.entries(COMPONENT_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
              defaultValue: "widget",
            },
            {
              name: "status",
              label: "Статус",
              type: "select",
              options: [
                { value: "active", label: "Активен" },
                { value: "draft", label: "Черновик" },
                { value: "archived", label: "Архив" },
              ],
              defaultValue: "active",
            },
            { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
          ]}
          createLabel="Добавить компонент"
          searchPlaceholder="Поиск по компонентам"
          emptyTitle="Компонентов пока нет"
          emptyText="Добавьте компонент, чтобы использовать его в интерфейсе проекта."
          pageSize={10}
          minWidth={680}
        />
      ) : (
        <CatalogTable<Service>
          key="services"
          endpoint="/services"
          query={{ project_id: project.id }}
          defaults={{ project_id: project.id }}
          title="Сервисы проекта"
          subtitle="API, вебхуки и MCP-серверы, подключённые к контуру"
          columns={[
            {
              key: "name",
              header: "Сервис",
              primary: true,
              render: (row) => (
                <span className="row" style={{ gap: 9 }}>
                  <Cog size={16} color="var(--blue)" />
                  {row.name}
                </span>
              ),
            },
            { key: "description", header: "Описание" },
            {
              key: "service_type",
              header: "Тип",
              width: "120px",
              render: (row) => (
                <Badge tone="gray" noDot>
                  {SERVICE_TYPE_LABELS[row.service_type] ?? row.service_type}
                </Badge>
              ),
            },
            {
              key: "status",
              header: "Статус",
              width: "120px",
              render: (row) => <StatusBadge status={row.status} />,
            },
          ]}
          fields={[
            { name: "name", label: "Название", required: true },
            { name: "url", label: "Адрес вызова", placeholder: "https://api.example.ru/v1" },
            {
              name: "service_type",
              label: "Тип",
              type: "select",
              options: [
                { value: "api", label: "API" },
                { value: "webhook", label: "Вебхук" },
                { value: "mcp", label: "MCP-сервер" },
                { value: "builtin", label: "Встроенный" },
              ],
              defaultValue: "api",
            },
            {
              name: "status",
              label: "Статус",
              type: "select",
              options: [
                { value: "active", label: "Активен" },
                { value: "draft", label: "Черновик" },
                { value: "archived", label: "Архив" },
              ],
              defaultValue: "active",
            },
            { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
          ]}
          createLabel="Добавить сервис"
          searchPlaceholder="Поиск по сервисам"
          emptyTitle="Сервисов пока нет"
          emptyText="Подключите первый сервис, чтобы использовать его в сценариях."
          pageSize={10}
          minWidth={680}
        />
      )}
    </>
  );
}
