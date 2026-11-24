import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Boxes, FolderKanban, Layers, Plus, Search } from "lucide-react";
import { api } from "../api/client";
import { useApi, useDebounced, useDocumentTitle } from "../api/hooks";
import type { ListResponse, Project } from "../api/types";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../lib/format";
import {
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Select,
  StatusBadge,
  Textarea,
  WarningNote,
  cx,
} from "../ui/primitives";

const FILTERS = [
  { key: "all", label: "Все" },
  { key: "active", label: "Активные" },
  { key: "draft", label: "Черновики" },
  { key: "archived", label: "Архив" },
];

export function Projects() {
  useDocumentTitle("Мои проекты");
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 250);
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(params.get("new") === "1");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, loading, reload } = useApi<ListResponse<Project>>(
    `/projects?limit=200&q=${encodeURIComponent(debouncedSearch)}`,
    [debouncedSearch],
  );

  useEffect(() => {
    if (params.get("new") === "1") {
      setCreateOpen(true);
    }
  }, [params]);

  const closeCreate = () => {
    setCreateOpen(false);
    if (params.get("new")) {
      params.delete("new");
      setParams(params, { replace: true });
    }
    setName("");
    setDescription("");
    setStatus("active");
    setError(null);
  };

  const openCreate = () => {
    setCreateOpen(true);
    setParams({ new: "1" });
  };

  const projects = useMemo(() => {
    const items = data?.items ?? [];
    if (statusFilter === "all") return items;
    return items.filter((project) => project.status === statusFilter);
  }, [data, statusFilter]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Укажите название проекта");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await api<Project>("/projects", {
        method: "POST",
        body: { name: name.trim(), description: description.trim(), status },
      });
      toast.push("Проект создан");
      closeCreate();
      reload();
      navigate(`/projects/${created.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось создать проект");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Мои проекты"
        subtitle="Контуры, в которых собираются сценарии, сущности и будущие ассистенты."
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus /> Создать проект
          </Button>
        }
      />

      <div className="projects-toolbar">
        <div className="search-field" style={{ maxWidth: 360 }}>
          <Search />
          <input
            className="input"
            placeholder="Поиск по названию"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="segmented">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={cx(statusFilter === filter.key && "active")}
              onClick={() => setStatusFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <span className="tiny muted" style={{ marginLeft: "auto" }}>
          {loading ? "Загрузка…" : `${projects.length} из ${data?.total ?? 0}`}
        </span>
      </div>

      {projects.length === 0 && !loading ? (
        <div className="card">
          <EmptyState
            icon={<FolderKanban />}
            title="Проектов не найдено"
            text={
              search || statusFilter !== "all"
                ? "Попробуйте изменить запрос или фильтр."
                : "Создайте первый проект, чтобы начать конструировать решение."
            }
            action={
              <Button variant="primary" onClick={openCreate}>
                <Plus /> Создать проект
              </Button>
            }
          />
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="project-card">
              <div className="project-card-top">
                <span className="project-icon" style={{ width: 46, height: 46, borderRadius: 14 }}>
                  <FolderKanban />
                </span>
                <StatusBadge status={project.status} />
              </div>
              <div>
                <h3>{project.name}</h3>
                <p className="desc" style={{ marginTop: 6 }}>
                  {project.description || "Описание пока не заполнено"}
                </p>
              </div>
              <div className="project-meta">
                <span className="mi">
                  <Boxes /> {project.stats.entities} сущностей
                </span>
                <span className="mi">
                  <Layers /> {project.stats.components} компонентов
                </span>
                <span style={{ marginLeft: "auto" }}>{formatDate(project.updated_at)}</span>
                <ArrowRight size={15} style={{ marginLeft: 4 }} />
              </div>
            </Link>
          ))}

          <button type="button" className="project-new" onClick={openCreate}>
            <span className="plus">
              <Plus size={20} />
            </span>
            Новый проект
          </button>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Новый проект"
        subtitle="Проект — контур для сущностей, сценариев и ассистентов"
        footer={
          <>
            <Button variant="secondary" onClick={closeCreate}>
              Отмена
            </Button>
            <Button variant="primary" type="submit" form="project-form" loading={saving}>
              Создать
            </Button>
          </>
        }
      >
        <form id="project-form" onSubmit={handleCreate}>
          <div className="modal-body">
            {error ? <WarningNote text={error} /> : null}
            <Field label="Название" required>
              <Input
                value={name}
                autoFocus
                placeholder="Например, Поддержка клиентов"
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field label="Описание" hint="Что делает проект и какие задачи решает">
              <Textarea
                value={description}
                rows={3}
                placeholder="Обработка обращений и заявок через ассистента"
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
            <Field label="Статус">
              <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="active">Активный</option>
                <option value="draft">Черновик</option>
                <option value="archived">Архив</option>
              </Select>
            </Field>
          </div>
        </form>
      </Modal>
    </>
  );
}
