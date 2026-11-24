import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, buildQuery } from "../api/client";
import { useApi, useDebounced } from "../api/hooks";
import type { ListResponse } from "../api/types";
import { useToast } from "../context/ToastContext";
import { DataTable, type Column } from "./DataTable";
import {
  Button,
  Checkbox,
  ConfirmDialog,
  Field,
  IconButton,
  Input,
  Modal,
  SearchInput,
  Select,
  Textarea,
  WarningNote,
  cx,
} from "./primitives";

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select" | "number" | "checkbox" | "json";
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  wide?: boolean;
  rows?: number;
  defaultValue?: string | number | boolean;
}

interface CatalogTableProps<T extends { id: string }> {
  endpoint: string;
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  fields: FieldDef[];
  createLabel?: string;
  searchPlaceholder?: string;
  emptyTitle: string;
  emptyText?: string;
  defaults?: Record<string, unknown>;
  query?: Record<string, string | number | null | undefined>;
  headerActions?: ReactNode;
  toolbarExtra?: ReactNode;
  onSelect?: (row: T | null) => void;
  selectedKey?: string | null;
  rowActions?: (
    row: T,
    actions: { reload: () => void; edit: (row: T) => void; remove: (row: T) => void },
  ) => ReactNode;
  transformSubmit?: (values: Record<string, unknown>) => Record<string, unknown>;
  onLoaded?: (rows: T[]) => void;
  pageSize?: number;
  minWidth?: number;
  autoOpen?: boolean;
  compactActions?: boolean;
}

type FormValues = Record<string, string | boolean>;

export function CatalogTable<T extends { id: string }>({
  endpoint,
  title,
  subtitle,
  columns,
  fields,
  createLabel = "Добавить",
  searchPlaceholder = "Поиск по названию и описанию",
  emptyTitle,
  emptyText,
  defaults,
  query,
  headerActions,
  toolbarExtra,
  onSelect,
  selectedKey,
  rowActions,
  transformSubmit,
  onLoaded,
  pageSize,
  minWidth,
  autoOpen,
  compactActions,
}: CatalogTableProps<T>) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 250);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);

  const queryString = buildQuery({
    q: debouncedSearch,
    limit: 500,
    ...query,
  });
  const { data, loading, error, reload } = useApi<ListResponse<T>>(
    `${endpoint}${queryString}`,
    [debouncedSearch, JSON.stringify(query ?? {})],
  );

  const rows = data?.items ?? [];
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  useEffect(() => {
    if (data) onLoadedRef.current?.(data.items);
  }, [data]);

  const buildValues = (row: T | null): FormValues => {
    const next: FormValues = {};
    fields.forEach((field) => {
      const raw = row
        ? (row as Record<string, unknown>)[field.name]
        : defaults?.[field.name] ?? field.defaultValue;
      if (field.type === "checkbox") {
        next[field.name] = Boolean(raw);
      } else if (field.type === "json") {
        next[field.name] = raw ? JSON.stringify(raw, null, 2) : "{}";
      } else {
        next[field.name] = raw === null || raw === undefined ? "" : String(raw);
      }
    });
    return next;
  };

  const openCreate = () => {
    setEditing(null);
    setValues(buildValues(null));
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: T) => {
    setEditing(row);
    setValues(buildValues(row));
    setFormError(null);
    setModalOpen(true);
  };

  const didAutoOpen = useRef(false);
  useEffect(() => {
    if (autoOpen && !didAutoOpen.current) {
      didAutoOpen.current = true;
      openCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    for (const field of fields) {
      if (field.required && (values[field.name] === "" || values[field.name] === undefined)) {
        setFormError(`Заполните поле «${field.label}»`);
        return;
      }
    }

    const payload: Record<string, unknown> = { ...(editing ? {} : defaults) };
    try {
      for (const field of fields) {
        const value = values[field.name];
        if (field.type === "number") {
          payload[field.name] = value === "" ? null : Number(value);
        } else if (field.type === "checkbox") {
          payload[field.name] = Boolean(value);
        } else if (field.type === "json") {
          payload[field.name] = typeof value === "string" && value.trim() ? JSON.parse(value) : {};
        } else {
          payload[field.name] = value;
        }
      }
    } catch {
      setFormError("JSON-схема содержит синтаксическую ошибку");
      return;
    }

    const body = transformSubmit ? transformSubmit(payload) : payload;
    setSaving(true);
    try {
      await api(editing ? `${endpoint}/${editing.id}` : endpoint, {
        method: editing ? "PATCH" : "POST",
        body,
      });
      toast.push(editing ? "Изменения сохранены" : "Запись создана");
      setModalOpen(false);
      setEditing(null);
      reload();
      onSelect?.(null);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Не удалось сохранить запись");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`${endpoint}/${deleteTarget.id}`, { method: "DELETE" });
      toast.push("Запись удалена");
      setDeleteTarget(null);
      reload();
      if (selectedKey === deleteTarget.id) onSelect?.(null);
    } catch (caught) {
      toast.push(caught instanceof Error ? caught.message : "Не удалось удалить запись", "error");
    } finally {
      setDeleting(false);
    }
  };

  const tableColumns = useMemo<Column<T>[]>(() => {
    const actionColumn: Column<T> = {
      key: "__actions",
      header: "",
      width: compactActions ? "58px" : "100px",
      align: "right",
      render: (row) => (
        <div className="cell-actions" onClick={(event) => event.stopPropagation()}>
          {rowActions ? rowActions(row, { reload, edit: openEdit, remove: setDeleteTarget }) : null}
          <IconButton
            plain
            size="sm"
            aria-label="Редактировать"
            onClick={() => openEdit(row)}
          >
            <Pencil />
          </IconButton>
          {compactActions ? null : (
            <IconButton
              plain
              size="sm"
              aria-label="Удалить"
              onClick={() => setDeleteTarget(row)}
            >
              <Trash2 />
            </IconButton>
          )}
        </div>
      ),
    };
    return [...columns, actionColumn];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, rowActions, reload, selectedKey, compactActions]);

  return (
    <>
      <div className="card catalog-card">
        <div className="card-head">
          <div>
            <h2 className="card-title">{title}</h2>
            {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
          </div>
          <div className="card-actions">
            {headerActions}
            <Button variant="primary" onClick={openCreate}>
              <Plus /> {createLabel}
            </Button>
          </div>
        </div>

        <div className="catalog-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={searchPlaceholder}
            onGray
          />
          {toolbarExtra}
        </div>

        {error ? <WarningNote text={error} /> : null}

        <DataTable
          columns={tableColumns}
          rows={rows}
          rowKey={(row) => row.id}
          loading={loading}
          emptyTitle={emptyTitle}
          emptyText={emptyText}
          emptyAction={
            <Button variant="soft" size="sm" onClick={openCreate}>
              <Plus /> {createLabel}
            </Button>
          }
          selectedKey={selectedKey}
          onRowClick={
            onSelect
              ? (row) => onSelect(selectedKey === row.id ? null : row)
              : undefined
          }
          pageSize={pageSize}
          minWidth={minWidth}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Редактирование" : createLabel}
        subtitle={editing ? "Изменения применяются сразу после сохранения" : "Заполните обязательные поля"}
        footer={
          <div className="row between" style={{ width: "100%" }}>
            {editing ? (
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setDeleteTarget(editing);
                  setModalOpen(false);
                }}
              >
                <Trash2 size={16} /> Удалить
              </Button>
            ) : (
              <span />
            )}
            <div className="row">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Отмена
              </Button>
              <Button variant="primary" type="submit" form="catalog-form" loading={saving}>
                Сохранить
              </Button>
            </div>
          </div>
        }
      >
        <form id="catalog-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            {formError ? <WarningNote text={formError} /> : null}
            <div className="form-grid">
              {fields.map((field) => {
                const value = values[field.name];
                const control =
                  field.type === "textarea" || field.type === "json" ? (
                    <Textarea
                      value={String(value ?? "")}
                      rows={field.type === "json" ? 7 : field.rows ?? 3}
                      placeholder={field.placeholder}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [field.name]: event.target.value }))
                      }
                      style={
                        field.type === "json"
                          ? { fontFamily: "var(--mono)", fontSize: 12.5 }
                          : undefined
                      }
                    />
                  ) : field.type === "select" ? (
                    <Select
                      value={String(value ?? "")}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [field.name]: event.target.value }))
                      }
                    >
                      <option value="">Не выбрано</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  ) : field.type === "checkbox" ? (
                    <div className="field" style={{ paddingTop: 28 }}>
                      <Checkbox
                        checked={Boolean(value)}
                        label={field.label}
                        onChange={(checked) =>
                          setValues((current) => ({ ...current, [field.name]: checked }))
                        }
                      />
                    </div>
                  ) : (
                    <Input
                      type={field.type === "number" ? "number" : "text"}
                      value={String(value ?? "")}
                      placeholder={field.placeholder}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [field.name]: event.target.value }))
                      }
                    />
                  );

                if (field.type === "checkbox") {
                  return (
                    <div key={field.name} className={cx(field.wide && "span-2")}>
                      {control}
                      {field.hint ? <div className="field-hint">{field.hint}</div> : null}
                    </div>
                  );
                }

                return (
                  <Field
                    key={field.name}
                    label={field.label}
                    hint={field.hint}
                    required={field.required}
                    className={cx(field.wide && "span-2")}
                  >
                    {control}
                  </Field>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Удалить запись?"
        text="Действие нельзя отменить. Связанные данные останутся без этой записи."
      />
    </>
  );
}
