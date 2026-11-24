import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useParams } from "react-router-dom";
import { BookText, Layers3 } from "lucide-react";
import { useApi, useDocumentTitle } from "../api/hooks";
import type {
  Characteristic,
  Constraint,
  InfoCategory,
  InfoValue,
  InterpretedValue,
  ListResponse,
  Scale,
} from "../api/types";
import {
  DATA_TYPE_LABELS,
  SCALE_TYPE_LABELS,
} from "../lib/format";
import { CatalogTable } from "../ui/CatalogTable";
import type { FieldDef } from "../ui/CatalogTable";
import type { Column } from "../ui/DataTable";
import {
  Badge,
  Checkbox,
  PageHeader,
  cx,
} from "../ui/primitives";

const TABS = [
  { key: "categories", label: "Категории" },
  { key: "characteristics", label: "Характеристики" },
  { key: "scales", label: "Шкалы" },
  { key: "values", label: "Значения" },
  { key: "interpreted-values", label: "Интерпретируемые значения" },
  { key: "constraints", label: "Ограничения" },
];

type InfoRow = InfoCategory | Characteristic | Scale | InfoValue | InterpretedValue | Constraint;

interface TabConfig {
  title: string;
  endpoint: string;
  columns: Column<InfoRow>[];
  fields: FieldDef[];
  emptyTitle: string;
  emptyText: string;
  preview: (row: InfoRow, context: { scales: Scale[]; categories: InfoCategory[] }) => ReactNode;
}

export function InfoModel() {
  const { tab } = useParams();
  const activeTab = TABS.some((item) => item.key === tab) ? (tab as string) : "categories";
  const [selected, setSelected] = useState<InfoRow | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [rowCount, setRowCount] = useState(0);

  useDocumentTitle(`Информационная модель · ${TABS.find((item) => item.key === activeTab)?.label ?? ""}`);

  const { data: categoriesData } = useApi<ListResponse<InfoCategory>>(
    "/info-model/categories?limit=500",
  );
  const { data: scalesData } = useApi<ListResponse<Scale>>("/info-model/scales?limit=500");

  const categories = categoriesData?.items ?? [];
  const scales = scalesData?.items ?? [];

  const categoryOptions = categories.map((item) => ({ value: item.id, label: item.name }));
  const scaleOptions = scales.map((item) => ({ value: item.id, label: item.name }));

  useEffect(() => {
    setSelected(null);
    setRowCount(0);
  }, [activeTab]);

  const configs: Record<string, TabConfig> = {
      categories: {
        title: "Категории",
        endpoint: "/info-model/categories",
        emptyTitle: "Категорий пока нет",
        emptyText: "Создайте категорию, чтобы сгруппировать характеристики.",
        columns: [
          { key: "name", header: "Название", primary: true },
          { key: "description", header: "Описание" },
          {
            key: "characteristics_count",
            header: "Характеристик",
            width: "130px",
            render: (row) => (
              <Badge tone="gray" noDot>
                {(row as InfoCategory).characteristics_count}
              </Badge>
            ),
          },
        ],
        fields: [
          { name: "name", label: "Название", required: true },
          { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
        ],
        preview: (row) => {
          const category = row as InfoCategory;
          return (
            <>
              <div className="preview-field">
                <div className="k">Описание</div>
                <div className="v">{category.description || "Не заполнено"}</div>
              </div>
              <div className="preview-field">
                <div className="k">Характеристик</div>
                <div className="v">{category.characteristics_count}</div>
              </div>
              <div className="preview-field">
                <div className="k">Создана</div>
                <div className="v">{new Date(category.created_at).toLocaleDateString("ru-RU")}</div>
              </div>
            </>
          );
        },
      },
      characteristics: {
        title: "Характеристики",
        endpoint: "/info-model/characteristics",
        emptyTitle: "Характеристик пока нет",
        emptyText: "Опишите свойства категорий: тип, обязательность, описание.",
        columns: [
          { key: "name", header: "Название", primary: true },
          { key: "description", header: "Описание" },
          {
            key: "category_name",
            header: "Категория",
            render: (row) => (row as Characteristic).category_name ?? <span className="muted">—</span>,
          },
          {
            key: "data_type",
            header: "Тип",
            width: "110px",
            render: (row) => (
              <Badge tone="blue" noDot>
                {DATA_TYPE_LABELS[(row as Characteristic).data_type] ?? (row as Characteristic).data_type}
              </Badge>
            ),
          },
          {
            key: "required",
            header: "Обязательность",
            width: "130px",
            render: (row) =>
              (row as Characteristic).required ? (
                <Badge tone="amber">Обязательна</Badge>
              ) : (
                <span className="muted tiny">Нет</span>
              ),
          },
        ],
        fields: [
          { name: "name", label: "Название", required: true },
          { name: "category_id", label: "Категория", type: "select", options: categoryOptions },
          {
            name: "data_type",
            label: "Тип данных",
            type: "select",
            options: Object.entries(DATA_TYPE_LABELS).map(([value, label]) => ({ value, label })),
            defaultValue: "string",
          },
          { name: "required", label: "Обязательная характеристика", type: "checkbox" },
          { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
        ],
        preview: (row, context) => {
          const item = row as Characteristic;
          return (
            <>
              <div className="preview-field">
                <div className="k">Категория</div>
                <div className="v">{item.category_name ?? "Не указана"}</div>
              </div>
              <div className="preview-field">
                <div className="k">Тип данных</div>
                <div className="v">{DATA_TYPE_LABELS[item.data_type] ?? item.data_type}</div>
              </div>
              <div className="preview-field">
                <div className="k">Обязательность</div>
                <div className="v">{item.required ? "Обязательна" : "Необязательна"}</div>
              </div>
              <div className="preview-field">
                <div className="k">Описание</div>
                <div className="v">{item.description || "Не заполнено"}</div>
              </div>
              <div className="preview-field">
                <div className="k">Всего категорий</div>
                <div className="v">{context.categories.length}</div>
              </div>
            </>
          );
        },
      },
      scales: {
        title: "Шкалы",
        endpoint: "/info-model/scales",
        emptyTitle: "Шкал пока нет",
        emptyText: "Создайте шкалу, чтобы задать допустимые значения.",
        columns: [
          { key: "name", header: "Название", primary: true },
          { key: "description", header: "Описание" },
          {
            key: "scale_type",
            header: "Тип шкалы",
            width: "140px",
            render: (row) => (
              <Badge tone="violet" noDot>
                {SCALE_TYPE_LABELS[(row as Scale).scale_type] ?? (row as Scale).scale_type}
              </Badge>
            ),
          },
        ],
        fields: [
          { name: "name", label: "Название", required: true },
          {
            name: "scale_type",
            label: "Тип шкалы",
            type: "select",
            options: Object.entries(SCALE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
            defaultValue: "numeric",
          },
          { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
        ],
        preview: (row) => {
          const item = row as Scale;
          return (
            <>
              <div className="preview-field">
                <div className="k">Тип шкалы</div>
                <div className="v">{SCALE_TYPE_LABELS[item.scale_type] ?? item.scale_type}</div>
              </div>
              <div className="preview-field">
                <div className="k">Описание</div>
                <div className="v">{item.description || "Не заполнено"}</div>
              </div>
            </>
          );
        },
      },
      values: {
        title: "Значения",
        endpoint: "/info-model/values",
        emptyTitle: "Значений пока нет",
        emptyText: "Добавьте допустимые значения и привяжите их к шкале.",
        columns: [
          { key: "name", header: "Название", primary: true },
          { key: "description", header: "Описание" },
          {
            key: "scale_id",
            header: "Шкала",
            width: "190px",
            render: (row) => {
              const scale = scales.find((entry) => entry.id === (row as InfoValue).scale_id);
              return scale ? (
                <Badge tone="gray" noDot>
                  {scale.name}
                </Badge>
              ) : (
                <span className="muted">—</span>
              );
            },
          },
        ],
        fields: [
          { name: "name", label: "Название", required: true },
          { name: "scale_id", label: "Шкала", type: "select", options: scaleOptions },
          { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
        ],
        preview: (row) => {
          const item = row as InfoValue;
          const scale = scales.find((entry) => entry.id === item.scale_id);
          return (
            <>
              <div className="preview-field">
                <div className="k">Шкала</div>
                <div className="v">{scale?.name ?? "Не указана"}</div>
              </div>
              <div className="preview-field">
                <div className="k">Описание</div>
                <div className="v">{item.description || "Не заполнено"}</div>
              </div>
            </>
          );
        },
      },
      "interpreted-values": {
        title: "Интерпретируемые значения",
        endpoint: "/info-model/interpreted-values",
        emptyTitle: "Интерпретаций пока нет",
        emptyText: "Опишите, что означает техническое значение для пользователя.",
        columns: [
          { key: "name", header: "Название", primary: true },
          { key: "description", header: "Описание" },
          {
            key: "raw_value",
            header: "Техническое значение",
            width: "180px",
            render: (row) => (
              <span className="code-inline">{(row as InterpretedValue).raw_value || "—"}</span>
            ),
          },
        ],
        fields: [
          { name: "name", label: "Название", required: true },
          { name: "raw_value", label: "Техническое значение" },
          { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
        ],
        preview: (row) => {
          const item = row as InterpretedValue;
          return (
            <>
              <div className="preview-field">
                <div className="k">Техническое значение</div>
                <div className="v">
                  <span className="code-inline">{item.raw_value || "—"}</span>
                </div>
              </div>
              <div className="preview-field">
                <div className="k">Интерпретация</div>
                <div className="v">{item.description || "Не заполнено"}</div>
              </div>
            </>
          );
        },
      },
      constraints: {
        title: "Ограничения",
        endpoint: "/info-model/constraints",
        emptyTitle: "Ограничений пока нет",
        emptyText: "Задайте правила проверки данных в виде выражений.",
        columns: [
          { key: "name", header: "Название", primary: true },
          { key: "description", header: "Описание" },
          {
            key: "expression",
            header: "Выражение",
            width: "240px",
            render: (row) => (
              <span className="code-inline">{(row as Constraint).expression || "—"}</span>
            ),
          },
        ],
        fields: [
          { name: "name", label: "Название", required: true },
          { name: "expression", label: "Выражение", placeholder: "amount > 0" },
          { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
        ],
        preview: (row) => {
          const item = row as Constraint;
          return (
            <>
              <div className="preview-field">
                <div className="k">Выражение</div>
                <div className="v">
                  <span className="code-inline">{item.expression || "—"}</span>
                </div>
              </div>
              <div className="preview-field">
                <div className="k">Описание</div>
                <div className="v">{item.description || "Не заполнено"}</div>
              </div>
            </>
          );
        },
      },
  };

  const config = configs[activeTab];

  return (
    <>
      <PageHeader
        title="Информационная модель"
        subtitle="Категории, характеристики, шкалы и ограничения, на которых строятся сущности платформы."
      />

      <div className="tabs-row">
        <nav className="pill-tabs">
          {TABS.map((item) => (
            <NavLink
              key={item.key}
              to={`/info-model/${item.key}`}
              className={({ isActive }) => cx("pill-tab", isActive && "active")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="info-layout">
        <aside className="card filter-card">
          <h3>Фильтры</h3>
          <div className="filter-group">
            <Checkbox
              checked={onlyMine}
              onChange={setOnlyMine}
              disabled
              label="Показывать только мои записи"
            />
            <span className="field-hint">
              Авторство записей появится вместе с расширенными ролями.
            </span>
          </div>
          <div className="divider" style={{ margin: "14px 0" }} />
          <div className="filter-group">
            <span className="filter-label">Раздел</span>
            <div className="row" style={{ gap: 7 }}>
              <span className="chip" style={{ height: 32, fontSize: 12 }}>
                <Layers3 size={14} /> {config.title}
              </span>
            </div>
            <span className="tiny muted">Записей на странице: {rowCount}</span>
          </div>
          <div className="divider" style={{ margin: "14px 0" }} />
          <div className="filter-group">
            <span className="filter-label">Подсказка</span>
            <span className="tiny muted" style={{ lineHeight: 1.5 }}>
              Выберите строку в таблице, чтобы увидеть карточку записи справа.
            </span>
          </div>
        </aside>

        <section>
          <CatalogTable<InfoRow>
            key={activeTab}
            endpoint={config.endpoint}
            title={config.title}
            subtitle="Данные доступны всем процессам платформы"
            columns={config.columns}
            fields={config.fields}
            createLabel="Добавить"
            searchPlaceholder="Поиск"
            emptyTitle={config.emptyTitle}
            emptyText={config.emptyText}
            pageSize={10}
            minWidth={430}
            compactActions
            selectedKey={selected?.id ?? null}
            onSelect={(row) => setSelected(row)}
            onLoaded={(rows) => {
              setRowCount(rows.length);
            }}
          />
        </section>

        <aside className="card preview-card-panel">
          <h3>Превью записи</h3>
          {selected ? (
            <>
              <div className="info-preview-title">{selected.name}</div>
              <div className="info-preview-sub">
                {(selected as { description?: string }).description || "Без описания"}
              </div>
              <div className="divider" style={{ margin: "0 0 14px" }} />
              <div className="preview-fields">
                {config.preview(selected, { scales, categories })}
              </div>
            </>
          ) : (
            <div className="preview-empty">
              <BookText />
              <span>Выберите запись для просмотра данных</span>
              <span className="tiny" style={{ maxWidth: 210 }}>
                Карточка покажет описание и связи выбранной записи.
              </span>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
