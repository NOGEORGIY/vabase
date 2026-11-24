import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, useParams, useSearchParams } from "react-router-dom";
import { BookOpen, Database } from "lucide-react";
import { useApi, useDocumentTitle } from "../api/hooks";
import type {
  DictionaryItem,
  Library,
  LibraryClass,
  ListResponse,
} from "../api/types";
import { DICT_TYPE_LABELS } from "../lib/format";
import { CatalogTable } from "../ui/CatalogTable";
import type { FieldDef } from "../ui/CatalogTable";
import type { Column } from "../ui/DataTable";
import {
  Badge,
  Checkbox,
  PageHeader,
  Select,
  cx,
} from "../ui/primitives";

const TABS = [
  { key: "dictionaries", label: "Справочники" },
  { key: "libraries", label: "Библиотеки" },
  { key: "library-classes", label: "Классы библиотек" },
];

type Row = DictionaryItem | Library | LibraryClass;

interface TabConfig {
  title: string;
  endpoint: string;
  columns: Column<Row>[];
  fields: FieldDef[];
  emptyTitle: string;
  emptyText: string;
  preview: (row: Row) => ReactNode;
  filters?: boolean;
}

export function InterpretedData() {
  const { tab } = useParams();
  const [params] = useSearchParams();
  const activeTab = TABS.some((item) => item.key === tab) ? (tab as string) : "dictionaries";
  const [selected, setSelected] = useState<Row | null>(null);
  const [dictType, setDictType] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const autoOpenOnce = useRef(params.get("new") === "1");
  const autoOpen = autoOpenOnce.current;
  useEffect(() => {
    autoOpenOnce.current = false;
  }, []);

  useDocumentTitle(
    `Интерпретируемые данные · ${TABS.find((item) => item.key === activeTab)?.label ?? ""}`,
  );

  const { data: librariesData } = useApi<ListResponse<Library>>(
    "/interpreted-data/libraries?limit=500",
  );
  const libraries = librariesData?.items ?? [];
  const libraryOptions = libraries.map((item) => ({ value: item.id, label: item.name }));

  useEffect(() => {
    setSelected(null);
    setRowCount(0);
    setDictType("");
  }, [activeTab]);

  useEffect(() => {
    setSelected(null);
    setRowCount(0);
  }, [dictType]);

  const configs: Record<string, TabConfig> = {
    dictionaries: {
      title: "Справочники",
      endpoint: "/interpreted-data/dictionaries",
      filters: true,
      emptyTitle: "Справочников пока нет",
      emptyText: "Добавьте справочник из API или файла, чтобы использовать его в процессах.",
      columns: [
        { key: "name", header: "Название", primary: true },
        { key: "description", header: "Описание" },
        {
          key: "dict_type",
          header: "Тип",
          width: "100px",
          render: (row) => (
            <Badge tone="gray" noDot>
              {DICT_TYPE_LABELS[(row as DictionaryItem).dict_type] ?? (row as DictionaryItem).dict_type}
            </Badge>
          ),
        },
      ],
      fields: [
        { name: "name", label: "Название", required: true },
        {
          name: "dict_type",
          label: "Тип справочника",
          type: "select",
          options: [
            { value: "api", label: "API" },
            { value: "file", label: "Файл" },
          ],
          defaultValue: "api",
        },
        { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
      ],
      preview: (row) => {
        const item = row as DictionaryItem;
        return (
          <>
            <div className="preview-field">
              <div className="k">Тип</div>
              <div className="v">{DICT_TYPE_LABELS[item.dict_type] ?? item.dict_type}</div>
            </div>
            <div className="preview-field">
              <div className="k">Описание</div>
              <div className="v">{item.description || "Не заполнено"}</div>
            </div>
            <div className="preview-field">
              <div className="k">Подключение</div>
              <div className="v">
                {item.dict_type === "api" ? "Загрузка по API" : "Загрузка из файла"}
              </div>
            </div>
          </>
        );
      },
    },
    libraries: {
      title: "Библиотеки",
      endpoint: "/interpreted-data/libraries",
      emptyTitle: "Библиотек пока нет",
      emptyText: "Добавьте библиотеку классов, чтобы переиспользовать модели данных.",
      columns: [
        { key: "name", header: "Название", primary: true },
        { key: "description", header: "Описание" },
        {
          key: "version",
          header: "Версия",
          width: "100px",
          render: (row) => <span className="code-inline">{(row as Library).version}</span>,
        },
      ],
      fields: [
        { name: "name", label: "Название", required: true },
        { name: "version", label: "Версия", defaultValue: "1.0.0" },
        { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
      ],
      preview: (row) => {
        const item = row as Library;
        return (
          <>
            <div className="preview-field">
              <div className="k">Версия</div>
              <div className="v">{item.version}</div>
            </div>
            <div className="preview-field">
              <div className="k">Описание</div>
              <div className="v">{item.description || "Не заполнено"}</div>
            </div>
          </>
        );
      },
    },
    "library-classes": {
      title: "Классы библиотек",
      endpoint: "/interpreted-data/library-classes",
      emptyTitle: "Классов пока нет",
      emptyText: "Опишите класс и привяжите его к библиотеке.",
      columns: [
        { key: "name", header: "Название", primary: true },
        { key: "description", header: "Описание" },
        {
          key: "library_id",
          header: "Библиотека",
          width: "220px",
          render: (row) => {
            const library = libraries.find((item) => item.id === (row as LibraryClass).library_id);
            return library ? (
              <Badge tone="violet" noDot>
                {library.name}
              </Badge>
            ) : (
              <span className="muted">—</span>
            );
          },
        },
      ],
      fields: [
        { name: "name", label: "Название", required: true },
        { name: "library_id", label: "Библиотека", type: "select", options: libraryOptions },
        { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
      ],
      preview: (row) => {
        const item = row as LibraryClass;
        const library = libraries.find((entry) => entry.id === item.library_id);
        return (
          <>
            <div className="preview-field">
              <div className="k">Библиотека</div>
              <div className="v">{library?.name ?? "Не указана"}</div>
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
  const hasFilters = Boolean(config.filters);

  return (
    <>
      <PageHeader
        title="Интерпретируемые данные"
        subtitle="Справочники, библиотеки и классы, которые связывают данные платформы с бизнес-смыслом."
      />

      <div className="tabs-row">
        <nav className="pill-tabs">
          {TABS.map((item) => (
            <NavLink
              key={item.key}
              to={`/interpreted-data/${item.key}`}
              className={({ isActive }) => cx("pill-tab", isActive && "active")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div
        className={cx("info-layout", !hasFilters && "two-col")}
      >
        {hasFilters ? (
          <aside className="card filter-card">
            <h3>Фильтры</h3>
            <div className="filter-group">
              <Checkbox checked={false} onChange={() => undefined} disabled label="Показывать только мои записи" />
              <span className="field-hint">Авторство записей появится вместе с расширенными ролями.</span>
            </div>
            <div className="filter-group">
              <span className="filter-label">Тип справочника</span>
              <Select value={dictType} onChange={(event) => setDictType(event.target.value)}>
                <option value="">Все типы</option>
                <option value="api">API</option>
                <option value="file">Файл</option>
              </Select>
            </div>
            <div className="divider" style={{ margin: "14px 0" }} />
            <div className="filter-group">
              <span className="filter-label">Раздел</span>
              <div className="row" style={{ gap: 7 }}>
                <span className="chip" style={{ height: 32, fontSize: 12 }}>
                  <Database size={14} /> {config.title}
                </span>
              </div>
              <span className="tiny muted">Записей на странице: {rowCount}</span>
            </div>
          </aside>
        ) : null}

        <section>
          <CatalogTable<Row>
            key={`${activeTab}-${dictType}`}
            endpoint={config.endpoint}
            query={hasFilters ? { dict_type: dictType } : undefined}
            title={config.title}
            subtitle="Единый каталог платформы"
            columns={config.columns}
            fields={config.fields}
            createLabel="Добавить"
            searchPlaceholder="Поиск"
            emptyTitle={config.emptyTitle}
            emptyText={config.emptyText}
            pageSize={10}
            minWidth={hasFilters ? 540 : 620}
            selectedKey={selected?.id ?? null}
            onSelect={(row) => setSelected(row)}
            onLoaded={(rows) => setRowCount(rows.length)}
            autoOpen={autoOpen}
            compactActions
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
              <div className="preview-fields">{config.preview(selected)}</div>
            </>
          ) : (
            <div className="preview-empty">
              <BookOpen />
              <span>Выберите запись для просмотра данных</span>
              <span className="tiny" style={{ maxWidth: 210 }}>
                Карточка покажет тип и состав выбранной записи.
              </span>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
