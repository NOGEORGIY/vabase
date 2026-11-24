import { useMemo, useState, type FormEvent } from "react";
import {
  Bot,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  Wrench,
} from "lucide-react";
import { api } from "../api/client";
import { useApi } from "../api/hooks";
import type { ListResponse, Tool, ToolValidation } from "../api/types";
import { useToast } from "../context/ToastContext";
import { TOOL_TYPE_LABELS } from "../lib/format";
import { DataTable, type Column } from "../ui/DataTable";
import {
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  SearchInput,
  Select,
  StatusBadge,
  Textarea,
  ValidationRow,
  WarningNote,
} from "../ui/primitives";

const DEFAULT_SCHEMA = `{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Идентификатор объекта"
    }
  },
  "required": ["id"]
}`;

interface ToolForm {
  name: string;
  description: string;
  tool_type: string;
  endpoint: string;
  http_method: string;
  version: string;
  status: string;
  requires_approval: boolean;
  input_schema: string;
}

const EMPTY_FORM: ToolForm = {
  name: "",
  description: "",
  tool_type: "http",
  endpoint: "",
  http_method: "POST",
  version: "1.0.0",
  status: "draft",
  requires_approval: false,
  input_schema: DEFAULT_SCHEMA,
};

export function ToolsPanel({ autoOpen }: { autoOpen?: boolean }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<ListResponse<Tool>>("/tools?limit=300");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(Boolean(autoOpen));
  const [editing, setEditing] = useState<Tool | null>(null);
  const [form, setForm] = useState<ToolForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState<ToolValidation | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tool | null>(null);
  const [deleting, setDeleting] = useState(false);

  const tools = data?.items ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tools;
    return tools.filter((tool) =>
      [tool.name, tool.description, tool.endpoint].join(" ").toLowerCase().includes(query),
    );
  }, [tools, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (tool: Tool) => {
    setEditing(tool);
    setForm({
      name: tool.name,
      description: tool.description,
      tool_type: tool.tool_type,
      endpoint: tool.endpoint,
      http_method: tool.http_method,
      version: tool.version,
      status: tool.status,
      requires_approval: tool.requires_approval,
      input_schema: JSON.stringify(tool.input_schema ?? {}, null, 2),
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError("Укажите имя инструмента");
      return;
    }
    let schema: Record<string, unknown>;
    try {
      schema = form.input_schema.trim() ? JSON.parse(form.input_schema) : {};
    } catch {
      setFormError("JSON-схема содержит синтаксическую ошибку");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        tool_type: form.tool_type,
        endpoint: form.endpoint.trim(),
        http_method: form.http_method,
        version: form.version.trim(),
        status: form.status,
        requires_approval: form.requires_approval,
        input_schema: schema,
      };
      await api(editing ? `/tools/${editing.id}` : "/tools", {
        method: editing ? "PATCH" : "POST",
        body,
      });
      toast.push(editing ? "Инструмент обновлён" : "Инструмент добавлен в реестр");
      setModalOpen(false);
      setEditing(null);
      reload();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Не удалось сохранить инструмент");
    } finally {
      setSaving(false);
    }
  };

  const validateTool = async (tool: Tool) => {
    setValidatingId(tool.id);
    try {
      const result = await api<ToolValidation>(`/tools/${tool.id}/validate`, { method: "POST" });
      setValidation(result);
      reload();
    } catch (caught) {
      toast.push(caught instanceof Error ? caught.message : "Не удалось проверить инструмент", "error");
    } finally {
      setValidatingId(null);
    }
  };

  const publishTool = async (tool: Tool) => {
    try {
      await api(`/tools/${tool.id}/publish`, { method: "POST" });
      toast.push(`Инструмент ${tool.name} опубликован`);
      reload();
    } catch (caught) {
      toast.push(caught instanceof Error ? caught.message : "Не удалось опубликовать", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/tools/${deleteTarget.id}`, { method: "DELETE" });
      toast.push("Инструмент удалён");
      setDeleteTarget(null);
      reload();
    } catch (caught) {
      toast.push(caught instanceof Error ? caught.message : "Не удалось удалить", "error");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Tool>[] = [
    {
      key: "name",
      header: "Инструмент",
      primary: true,
      render: (tool) => (
        <div>
          <div className="tool-name">{tool.name}</div>
          <span className="cell-sub">{tool.description || "Без описания"}</span>
          <span
            className="tiny"
            style={{
              display: "block",
              marginTop: 3,
              color: "#7a7890",
              fontFamily: "var(--mono)",
              maxWidth: 360,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {tool.endpoint || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "tool_type",
      header: "Тип",
      width: "150px",
      render: (tool) => (
        <div>
          <Badge tone="gray" noDot>
            {TOOL_TYPE_LABELS[tool.tool_type] ?? tool.tool_type}
          </Badge>
          <div className="tiny muted" style={{ marginTop: 4 }}>
            версия {tool.version}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Статус",
      width: "160px",
      render: (tool) => (
        <div>
          <StatusBadge status={tool.status} />
          {tool.requires_approval ? (
            <div className="tiny" style={{ color: "var(--amber)", marginTop: 4 }}>
              Требует подтверждения
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "__actions",
      header: "",
      width: "176px",
      align: "right",
      render: (tool) => (
        <div className="cell-actions" style={{ opacity: 1 }} onClick={(event) => event.stopPropagation()}>
          <IconButton
            plain
            size="sm"
            title="Проверить манифест"
            aria-label="Проверить манифест"
            onClick={() => validateTool(tool)}
            disabled={validatingId === tool.id}
          >
            {validatingId === tool.id ? <span className="spinner dark" /> : <ShieldCheck />}
          </IconButton>
          {tool.status !== "published" && tool.status !== "active" ? (
            <IconButton
              plain
              size="sm"
              title="Опубликовать"
              aria-label="Опубликовать"
              onClick={() => publishTool(tool)}
            >
              <Upload />
            </IconButton>
          ) : null}
          <IconButton
            plain
            size="sm"
            title="Редактировать"
            aria-label="Редактировать"
            onClick={() => openEdit(tool)}
          >
            <Pencil />
          </IconButton>
          <IconButton
            plain
            size="sm"
            title="Удалить"
            aria-label="Удалить"
            onClick={() => setDeleteTarget(tool)}
          >
            <Trash2 />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="tool-note">
        <span className="icon">
          <Bot />
        </span>
        <div>
          <div className="t">Реестр инструментов — основа подсистемы агентов</div>
          <div className="s">
            Агент получит только инструменты, опубликованные здесь. Схема параметров проверяется
            до вызова, а флаг «Требуется подтверждение» остановит опасный шаг.
          </div>
        </div>
      </div>

      <div className="card catalog-card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Инструменты</h2>
            <p className="card-subtitle">
              {tools.length} в реестре · опубликовано{" "}
              {tools.filter((tool) => tool.status === "published" || tool.status === "active").length}
            </p>
          </div>
          <div className="card-actions">
            <Button variant="primary" onClick={openCreate}>
              <Plus /> Добавить инструмент
            </Button>
          </div>
        </div>

        <div className="catalog-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Поиск по имени, описанию или адресу"
            onGray
          />
          <span className="tiny muted" style={{ marginLeft: "auto" }}>
            Проверка манифеста выполняется на сервере
          </span>
        </div>

        {error ? <WarningNote text={error} /> : null}

        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(tool) => tool.id}
          loading={loading}
          emptyTitle="Инструментов пока нет"
          emptyText="Опишите первый инструмент: имя, назначение, схему параметров и адрес вызова."
          emptyIcon={<Wrench />}
          emptyAction={
            <Button variant="soft" size="sm" onClick={openCreate}>
              <Plus /> Добавить инструмент
            </Button>
          }
          onRowClick={openEdit}
          minWidth={760}
          pageSize={10}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Редактирование инструмента" : "Новый инструмент"}
        subtitle="Манифест инструмента: имя, назначение, схема параметров и адрес вызова"
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button variant="primary" type="submit" form="tool-form" loading={saving}>
              Сохранить
            </Button>
          </>
        }
      >
        <form id="tool-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            {formError ? <WarningNote text={formError} /> : null}
            <div className="form-grid">
              <Field label="Имя инструмента" required hint="Латиница, точки: crm.update_status">
                <Input
                  value={form.name}
                  autoFocus
                  placeholder="crm.update_status"
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </Field>
              <Field label="Тип">
                <Select
                  value={form.tool_type}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, tool_type: event.target.value }))
                  }
                >
                  <option value="http">HTTP</option>
                  <option value="mcp">MCP-сервер</option>
                  <option value="webhook">Вебхук</option>
                  <option value="builtin">Встроенная функция</option>
                </Select>
              </Field>
              <Field label="Описание" className="span-2" hint="Модель выбирает инструмент по этому описанию">
                <Textarea
                  rows={2}
                  value={form.description}
                  placeholder="Что делает инструмент и когда его вызывать"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </Field>
              <Field label="Адрес вызова" required>
                <Input
                  value={form.endpoint}
                  placeholder="https://api.example.ru/v1/action"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, endpoint: event.target.value }))
                  }
                />
              </Field>
              <div className="form-grid" style={{ gap: 12 }}>
                <Field label="HTTP-метод">
                  <Select
                    value={form.http_method}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, http_method: event.target.value }))
                    }
                  >
                    {["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Версия" required>
                  <Input
                    value={form.version}
                    placeholder="1.0.0"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, version: event.target.value }))
                    }
                  />
                </Field>
              </div>
              <Field label="Статус">
                <Select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value }))
                  }
                >
                  <option value="draft">Черновик</option>
                  <option value="registered">Зарегистрирован</option>
                  <option value="validated">Проверен</option>
                  <option value="published">Опубликован</option>
                  <option value="active">Активен</option>
                </Select>
              </Field>
              <div className="field" style={{ paddingTop: 30 }}>
                <Checkbox
                  checked={form.requires_approval}
                  label="Требуется подтверждение оператора"
                  onChange={(checked) =>
                    setForm((current) => ({ ...current, requires_approval: checked }))
                  }
                />
              </div>
              <Field
                label="JSON-схема параметров"
                className="span-2"
                hint="Объект с type=object и properties. Проверяется перед сохранением и вызовом."
              >
                <Textarea
                  rows={9}
                  value={form.input_schema}
                  style={{ fontFamily: "var(--mono)", fontSize: 12.5 }}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, input_schema: event.target.value }))
                  }
                />
              </Field>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(validation)}
        onClose={() => setValidation(null)}
        title="Проверка инструмента"
        subtitle={validation ? `${validation.tool.name} · версия ${validation.tool.version}` : undefined}
        footer={
          <>
            {validation && validation.tool.status !== "published" ? (
              <Button
                variant="soft"
                onClick={() => {
                  publishTool(validation.tool);
                  setValidation(null);
                }}
              >
                <Upload /> Опубликовать
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => setValidation(null)}>
              Закрыть
            </Button>
          </>
        }
      >
        {validation ? (
          <div className="validation-list">
            {validation.checks.map((check) => (
              <ValidationRow
                key={check.id}
                status={check.status}
                label={check.label}
                message={check.message}
              />
            ))}
            <div className="tiny muted" style={{ marginTop: 4 }}>
              {validation.valid
                ? "Манифест корректен. Инструмент можно публиковать."
                : "Исправьте ошибки и повторите проверку."}
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Удалить инструмент?"
        text="Агенты не смогут вызвать удалённый инструмент. Действие нельзя отменить."
      />
    </>
  );
}
