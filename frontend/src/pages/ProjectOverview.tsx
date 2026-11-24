import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Clock,
  Save,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { api } from "../api/client";
import { useApi, useDocumentTitle } from "../api/hooks";
import type { ListResponse, Prompt } from "../api/types";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../lib/format";
import { useProject } from "../layout/ProjectLayout";
import {
  Badge,
  Button,
  ConfirmDialog,
  Field,
  Input,
  Select,
  StatusBadge,
  Textarea,
  WarningNote,
} from "../ui/primitives";

export function ProjectOverview() {
  const { project, reload } = useProject();
  const toast = useToast();
  const navigate = useNavigate();
  useDocumentTitle(`${project.name} · Обзор`);

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: promptsData } = useApi<ListResponse<Prompt>>(
    `/prompts?limit=3&project_id=${project.id}`,
    [project.id],
  );

  useEffect(() => {
    setName(project.name);
    setDescription(project.description);
    setStatus(project.status);
  }, [project]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Название проекта не может быть пустым");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api(`/projects/${project.id}`, {
        method: "PATCH",
        body: { name: name.trim(), description: description.trim(), status },
      });
      toast.push("Проект сохранён");
      reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить проект");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api(`/projects/${project.id}`, { method: "DELETE" });
      toast.push("Проект удалён");
      navigate("/projects");
    } catch (caught) {
      toast.push(caught instanceof Error ? caught.message : "Не удалось удалить проект", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <h1 className="project-content-title">Обзор проекта</h1>
        <p className="project-content-sub" style={{ marginBottom: 0 }}>
          Основные настройки и состояние контура. Изменения сразу видны команде.
        </p>
      </div>

      <div className="project-overview-grid">
        <form onSubmit={handleSave} className="card overview-form">
          <div className="card-head">
            <div>
              <h2 className="card-title">Настройки проекта</h2>
              <p className="card-subtitle">Название и описание видны в списке проектов</p>
            </div>
            <Badge tone="gray" noDot>
              ID {project.id.slice(0, 8)}
            </Badge>
          </div>

          {error ? <WarningNote text={error} /> : null}

          <div className="stack" style={{ gap: 16 }}>
            <Field label="Название" required>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="Описание" hint="Какую задачу решает проект и кто его использует">
              <Textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Опишите назначение проекта"
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

          <div className="modal-footer" style={{ marginTop: 22 }}>
            <Button variant="ghost" type="button" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={16} /> Удалить проект
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              <Save /> Сохранить
            </Button>
          </div>
        </form>

        <div className="overview-side">
          <section className="card">
            <div className="card-head" style={{ marginBottom: 14 }}>
              <div>
                <h2 className="card-title">Состояние контура</h2>
                <p className="card-subtitle">Наполнение проекта</p>
              </div>
            </div>
            <div className="mini-stats">
              <div className="mini-stat">
                <div className="v">{project.stats.assistants}</div>
                <div className="k">Ассистенты</div>
              </div>
              <div className="mini-stat">
                <div className="v">{project.stats.entities}</div>
                <div className="k">Сущности</div>
              </div>
              <div className="mini-stat">
                <div className="v">{project.stats.components}</div>
                <div className="k">Компоненты</div>
              </div>
              <div className="mini-stat">
                <div className="v">{project.stats.services}</div>
                <div className="k">Сервисы</div>
              </div>
            </div>
            <div className="divider" />
            <div className="meta-list">
              <div className="mi">
                <span className="row" style={{ gap: 7 }}>
                  <UserRound size={15} /> Владелец
                </span>
                <strong>Григорий Распутин</strong>
              </div>
              <div className="mi">
                <span className="row" style={{ gap: 7 }}>
                  <Clock size={15} /> Создан
                </span>
                <strong>{formatDate(project.created_at)}</strong>
              </div>
              <div className="mi">
                <span className="row" style={{ gap: 7 }}>
                  <Clock size={15} /> Обновлён
                </span>
                <strong>{formatDate(project.updated_at)}</strong>
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: 20 }}>
            <div className="row between">
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 620 }}>Подсистема агентов</h3>
                <p className="tiny muted" style={{ marginTop: 3 }}>
                  Следующий модуль платформы
                </p>
              </div>
              <Badge tone="violet">Скоро</Badge>
            </div>
            <p className="tiny muted" style={{ marginTop: 10, lineHeight: 1.55 }}>
              Заготовка уже здесь: реестр инструментов, поиск по описанию задачи, единый
              формат ошибок и модель данных.
            </p>
            <Link
              to={`/projects/${project.id}/assistants`}
              className="btn btn-soft btn-sm btn-block"
              style={{ marginTop: 12 }}
            >
              <Bot /> Открыть заготовку <ArrowRight size={14} />
            </Link>
          </section>

          {promptsData && promptsData.items.length > 0 ? (
            <section className="card" style={{ padding: 20 }}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 620 }}>Промпты проекта</h3>
                <Sparkles size={16} color="var(--muted)" />
              </div>
              {promptsData.items.map((prompt) => (
                <div key={prompt.id} className="row between" style={{ padding: "7px 0", gap: 10 }}>
                  <span className="tiny" style={{ fontWeight: 500 }}>
                    {prompt.name}
                  </span>
                  <StatusBadge status={prompt.status} />
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Удалить проект?"
        text="Проект, его сущности и связанные данные будут удалены. Действие нельзя отменить."
      />
    </>
  );
}
