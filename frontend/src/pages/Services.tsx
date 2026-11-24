import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Boxes, Cog, Plus, Search, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { useApi, useDocumentTitle } from "../api/hooks";
import type { Component, ListResponse, Service } from "../api/types";
import { useToast } from "../context/ToastContext";
import {
  COMPONENT_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  formatDate,
} from "../lib/format";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Textarea,
  WarningNote,
  cx,
} from "../ui/primitives";


type Tab = "services" | "components";
type CatalogItem = Service | Component;

export function Services() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const initialTab: Tab = params.get("new") === "component" ? "components" : "services";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(
    params.get("new") === "service" || params.get("new") === "component",
  );
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [values, setValues] = useState({
    name: "",
    description: "",
    url: "",
    service_type: "api",
    component_type: "widget",
    status: "active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useDocumentTitle(tab === "services" ? "Сервисы" : "Компоненты");

  const endpoint = tab === "services" ? "/services" : "/components";
  const { data, loading, reload } = useApi<ListResponse<CatalogItem>>(
    `${endpoint}?limit=200`,
    [tab],
  );

  const newParam = params.get("new");

  const items = useMemo(() => {
    const list = data?.items ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter((item) =>
      [item.name, item.description, "url" in item ? item.url : ""]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [data, search]);

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setError(null);
    if (params.get("new")) {
      params.delete("new");
      setParams(params, { replace: true });
    }
  };

  const openCreate = () => {
    setEditing(null);
    setValues({
      name: "",
      description: "",
      url: "",
      service_type: "api",
      component_type: "widget",
      status: "active",
    });
    setError(null);
    setModalOpen(true);
  };

  useEffect(() => {
    if (newParam === "service") {
      setTab("services");
      openCreate();
    } else if (newParam === "component") {
      setTab("components");
      openCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newParam]);

  const openEdit = (item: CatalogItem) => {
    setEditing(item);
    setValues({
      name: item.name,
      description: item.description,
      url: "url" in item ? item.url : "",
      service_type: "service_type" in item ? item.service_type : "api",
      component_type: "component_type" in item ? item.component_type : "widget",
      status: item.status,
    });
    setError(null);
    setModalOpen(true);
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setSearch("");
    closeModal();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!values.name.trim()) {
      setError("Укажите название");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body =
        tab === "services"
          ? {
              name: values.name.trim(),
              description: values.description.trim(),
              url: values.url.trim(),
              service_type: values.service_type,
              status: values.status,
            }
          : {
              name: values.name.trim(),
              description: values.description.trim(),
              component_type: values.component_type,
              status: values.status,
            };
      await api(editing ? `${endpoint}/${editing.id}` : endpoint, {
        method: editing ? "PATCH" : "POST",
        body,
      });
      toast.push(editing ? "Изменения сохранены" : tab === "services" ? "Сервис создан" : "Компонент создан");
      closeModal();
      reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить");
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
      closeModal();
      reload();
    } catch (caught) {
      toast.push(caught instanceof Error ? caught.message : "Не удалось удалить", "error");
    } finally {
      setDeleting(false);
    }
  };

  const title = tab === "services" ? "Сервисы" : "Компоненты";

  return (
    <>
      <PageHeader
        title={title}
        subtitle={
          tab === "services"
            ? "Внешние API, вебхуки и MCP-серверы, которые используют процессы и будущие агенты."
            : "Готовые элементы интерфейса и коннекторы, из которых собирается решение."
        }
        actions={
          <div className="segmented">
            <button
              type="button"
              className={cx(tab === "services" && "active")}
              onClick={() => switchTab("services")}
            >
              Сервисы
            </button>
            <button
              type="button"
              className={cx(tab === "components" && "active")}
              onClick={() => switchTab("components")}
            >
              Компоненты
            </button>
          </div>
        }
      />

      <div className="card services-search">
        <div className="label">Поиск</div>
        <div className="search-field">
          <Search />
          <input
            className="input"
            placeholder="Введите название"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {items.length === 0 && !loading ? (
        <div className="card">
          <EmptyState
            icon={tab === "services" ? <Cog /> : <Boxes />}
            title={search ? "Ничего не найдено" : `Пока нет ${tab === "services" ? "сервисов" : "компонентов"}`}
            text={
              search
                ? "Попробуйте изменить поисковый запрос."
                : "Добавьте первую запись, чтобы использовать её в сценариях."
            }
            action={
              <Button variant="primary" onClick={openCreate}>
                <Plus /> {tab === "services" ? "Добавить сервис" : "Добавить компонент"}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="services-grid">
          {items.map((item) => (
            <article
              key={item.id}
              className="service-card"
              role="button"
              tabIndex={0}
              onClick={() => openEdit(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openEdit(item);
                }
              }}
            >
              <div className="row between">
                <span className="service-icon">{tab === "services" ? <Cog /> : <Boxes />}</span>
                <StatusBadge status={item.status} />
              </div>
              <div>
                <h3>{item.name}</h3>
                <p className="desc" style={{ marginTop: 5 }}>
                  {item.description || ("url" in item ? item.url : "Описание не заполнено")}
                </p>
              </div>
              <div className="foot">
                <Badge tone="gray" noDot>
                  {tab === "services"
                    ? SERVICE_TYPE_LABELS[(item as Service).service_type] ?? (item as Service).service_type
                    : COMPONENT_TYPE_LABELS[(item as Component).component_type] ??
                      (item as Component).component_type}
                </Badge>
                <span className="tiny muted">{formatDate(item.updated_at)}</span>
              </div>
            </article>
          ))}

          <button type="button" className="service-new" onClick={openCreate}>
            <span className="plus">
              <Plus size={20} />
            </span>
            {tab === "services" ? "Добавить сервис" : "Добавить компонент"}
          </button>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={
          editing
            ? `Редактирование ${tab === "services" ? "сервиса" : "компонента"}`
            : tab === "services"
              ? "Новый сервис"
              : "Новый компонент"
        }
        subtitle="Запись доступна процессам платформы и будущим агентам"
        footer={
          <div className="row between" style={{ width: "100%" }}>
            {editing ? (
              <Button
                variant="ghost"
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
              <Button variant="secondary" onClick={closeModal}>
                Отмена
              </Button>
              <Button variant="primary" type="submit" form="service-form" loading={saving}>
                Сохранить
              </Button>
            </div>
          </div>
        }
      >
        <form id="service-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            {error ? <WarningNote text={error} /> : null}
            <Field label="Название" required>
              <Input
                value={values.name}
                autoFocus
                placeholder={tab === "services" ? "Например, CRM Sync" : "Например, Форма заявки"}
                onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              />
            </Field>
            <Field label="Описание">
              <Textarea
                rows={3}
                value={values.description}
                placeholder="Что делает и где используется"
                onChange={(event) =>
                  setValues((current) => ({ ...current, description: event.target.value }))
                }
              />
            </Field>
            {tab === "services" ? (
              <div className="form-grid">
                <Field label="Тип">
                  <Select
                    value={values.service_type}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, service_type: event.target.value }))
                    }
                  >
                    <option value="api">API</option>
                    <option value="webhook">Вебхук</option>
                    <option value="mcp">MCP-сервер</option>
                    <option value="builtin">Встроенный</option>
                  </Select>
                </Field>
                <Field label="Адрес вызова" hint="URL или имя встроенной функции">
                  <Input
                    value={values.url}
                    placeholder="https://api.example.ru/v1"
                    onChange={(event) =>
                      setValues((current) => ({ ...current, url: event.target.value }))
                    }
                  />
                </Field>
              </div>
            ) : (
              <Field label="Тип компонента">
                <Select
                  value={values.component_type}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, component_type: event.target.value }))
                  }
                >
                  <option value="widget">Виджет</option>
                  <option value="form">Форма</option>
                  <option value="table">Таблица</option>
                  <option value="card">Карточка</option>
                  <option value="calendar">Календарь</option>
                  <option value="connector">Коннектор</option>
                </Select>
              </Field>
            )}
            <Field label="Статус">
              <Select
                value={values.status}
                onChange={(event) => setValues((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="active">Активен</option>
                <option value="draft">Черновик</option>
                <option value="archived">Архив</option>
              </Select>
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Удалить запись?"
        text="Сценарии, которые используют эту запись, могут перестать работать."
      />
    </>
  );
}
