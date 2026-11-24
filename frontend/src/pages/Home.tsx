import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  FolderKanban,
  Layers,
  Plug,
  Plus,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useApi, useDocumentTitle } from "../api/hooks";
import type { ListResponse, MetricsSummary, Project } from "../api/types";
import { useAuth } from "../context/AuthContext";
import {
  Badge,
  PageHeader,
  StatusBadge,
  cx,
} from "../ui/primitives";

const STAT_CARDS = [
  { key: "projects", label: "Проекты", icon: <FolderKanban />, tone: "", to: "/projects" },
  { key: "services", label: "Сервисы", icon: <Layers />, tone: "violet", to: "/services" },
  { key: "prompts", label: "Промпты", icon: <FileText />, tone: "green", to: "/prompt-engineering/prompts" },
  { key: "tools", label: "Инструменты", icon: <Wrench />, tone: "amber", to: "/prompt-engineering/tools" },
] as const;

const QUICK_ACTIONS = [
  {
    to: "/projects?new=1",
    label: "Создать проект",
    hint: "Новый контур для сценария",
    icon: <Plus />,
  },
  {
    to: "/services?new=service",
    label: "Подключить сервис",
    hint: "API, вебхук или MCP-сервер",
    icon: <Plug />,
  },
  {
    to: "/prompt-engineering/prompts?new=1",
    label: "Создать промпт",
    hint: "Инструкция для модели",
    icon: <FileText />,
  },
  {
    to: "/prompt-engineering/tools?new=1",
    label: "Описать инструмент",
    hint: "Заготовка для агента",
    icon: <Wrench />,
  },
];

export function Home() {
  useDocumentTitle("Главная");
  const { user } = useAuth();
  const { data: metrics } = useApi<MetricsSummary>("/metrics/summary");
  const { data: projects } = useApi<ListResponse<Project>>("/projects?limit=5");
  const recent = projects?.items ?? [];
  const firstProject = recent[0];

  return (
    <>
      <PageHeader
        title={`Здравствуйте, ${user?.full_name?.split(" ")[0] ?? "коллега"}`}
        subtitle="Сводка по платформе и быстрый доступ к разделам конструирования."
        actions={
          <Link to="/projects?new=1" className="btn btn-primary">
            <Plus /> Новый проект
          </Link>
        }
      />

      <section className="home-hero">
        <div className="home-hero-text">
          <div className="eyebrow">Задел под ИИ-агентов</div>
          <h1>Платформа готова к подключению подсистемы агентов</h1>
          <p>
            Проекты, каталоги и реестр инструментов уже работают. Следующий модуль добавит
            агентов, запуск задач и трассировку — без изменений ядра и без пересборки
            платформы.
          </p>
        </div>
        <div className="home-hero-actions">
          {firstProject ? (
            <Link to={`/projects/${firstProject.id}/assistants`} className="btn btn-secondary">
              <Bot /> Открыть задел
            </Link>
          ) : null}
          <Link to="/prompt-engineering/tools" className="btn btn-outline">
            <Wrench /> Реестр инструментов
          </Link>
        </div>
      </section>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        {STAT_CARDS.map((card) => (
          <Link
            key={card.key}
            to={card.to}
            className="card stat-card"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="stat-top">
              <span className={cx("stat-icon", card.tone)}>{card.icon}</span>
              <ArrowRight size={16} color="var(--muted)" />
            </div>
            <div>
              <div className="stat-value">{metrics ? metrics[card.key] : "—"}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="home-grid">
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Недавние проекты</h2>
              <p className="card-subtitle">Контуры, в которых вы работали последними</p>
            </div>
            <Link to="/projects" className="link small row" style={{ gap: 4 }}>
              Все проекты <ArrowRight size={14} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="empty-state compact">
              <span className="empty-icon">
                <FolderKanban />
              </span>
              <span className="empty-title">Проектов пока нет</span>
              <span className="empty-text">Создайте первый проект, чтобы собрать сценарий.</span>
            </div>
          ) : (
            <div>
              {recent.map((project) => (
                <Link key={project.id} to={`/projects/${project.id}`} className="project-row">
                  <span className="project-icon">
                    <FolderKanban />
                  </span>
                  <span className="grow">
                    <span className="name">{project.name}</span>
                    <span className="desc">{project.description || "Без описания"}</span>
                  </span>
                  <span className="tiny muted" style={{ whiteSpace: "nowrap" }}>
                    {project.stats.entities} сущн. · {project.stats.components} комп.
                  </span>
                  <StatusBadge status={project.status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Быстрый старт</h2>
                <p className="card-subtitle">Частые действия в прототипе</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.to} to={action.to} className="quick-action">
                  <span className="qi">{action.icon}</span>
                  <span>
                    <span className="t" style={{ display: "block" }}>
                      {action.label}
                    </span>
                    <span className="s">{action.hint}</span>
                  </span>
                  <ArrowRight className="arrow" size={16} />
                </Link>
              ))}
            </div>
          </section>

          <div className="agents-teaser">
            <span className="icon">
              <Sparkles />
            </span>
            <div style={{ flex: 1 }}>
              <h3>Вкладка «Ассистенты»</h3>
              <p>
                Заготовка уже в проекте: роадмап, контракт API и модель данных.
              </p>
            </div>
            {firstProject ? (
              <Link
                to={`/projects/${firstProject.id}/assistants`}
                className="btn btn-soft btn-sm"
              >
                Смотреть
              </Link>
            ) : null}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div className="row between">
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 620 }}>Готовность платформы</h3>
                <p className="tiny muted" style={{ marginTop: 3 }}>
                  Блоки, на которые опирается агент
                </p>
              </div>
              <Badge tone="green">
                <CheckCircle2 size={12} /> База
              </Badge>
            </div>
            <div className="divider" style={{ margin: "14px 0" }} />
            <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
              {["Проекты", "Сервисы", "Промпты", "Информационная модель", "Инструменты"].map(
                (item) => (
                  <span key={item} className="chip" style={{ height: 30, fontSize: 12 }}>
                    <CheckCircle2 size={13} color="var(--green)" /> {item}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
