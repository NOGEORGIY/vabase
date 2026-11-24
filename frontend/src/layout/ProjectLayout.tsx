import { Link, NavLink, Outlet, useParams, useOutletContext } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  Boxes,
  ChevronRight,
  Contact,
  GitBranch,
  Layers,
  LayoutDashboard,
  MessagesSquare,
  Pencil,
  Plus,
  Radio,
  Workflow,
} from "lucide-react";
import { useApi } from "../api/hooks";
import type { Project } from "../api/types";
import { useAuth } from "../context/AuthContext";
import {
  Avatar,
  Dropdown,
  DropdownLabel,
  DropdownLink,
  EmptyState,
  IconButton,
  StatusBadge,
  cx,
} from "../ui/primitives";

const PROJECT_NAV = [
  { to: "", label: "Обзор проекта", icon: <LayoutDashboard />, end: true },
  { to: "assistants", label: "Ассистенты", icon: <Bot /> },
  { to: "entities", label: "Сущности", icon: <Boxes />, chevron: true },
  { to: "components", label: "Компоненты и сервисы", icon: <Layers />, chevron: true },
  { to: "channels", label: "Каналы связи", icon: <Radio /> },
  { to: "dialog", label: "Разговорный интерфейс", icon: <MessagesSquare /> },
  { to: "dialog-control", label: "Управление диалогом", icon: <GitBranch /> },
  { to: "crm", label: "CRM компонент", icon: <Contact /> },
  { to: "scenarios", label: "Редактор сценариев", icon: <Workflow /> },
  { to: "scenarios-2", label: "Редактор сценариев 2", icon: <Workflow /> },
];

export interface ProjectContextValue {
  project: Project;
  reload: () => void;
}

export function useProject(): ProjectContextValue {
  return useOutletContext<ProjectContextValue>();
}

export function ProjectLayout() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { data: project, loading, error, reload } = useApi<Project>(
    projectId ? `/projects/${projectId}` : null,
    [projectId],
  );

  if (loading) {
    return (
      <div className="project-shell">
        <div className="center-loader">Загружаем проект…</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-shell" style={{ display: "grid", placeItems: "center" }}>
        <div className="card" style={{ maxWidth: 460 }}>
          <EmptyState
            title="Проект не найден"
            text={error ?? "Возможно, проект был удалён или ссылка устарела."}
            action={
              <Link to="/projects" className="btn btn-primary">
                К списку проектов
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const base = `/projects/${project.id}`;

  return (
    <div className="project-shell">
      <header className="project-topbar">
        <Link to="/projects" className="icon-btn back" aria-label="Назад к проектам">
          <ArrowLeft />
        </Link>
        <div className="project-title-wrap">
          <span className="project-title-icon">
            <MessagesSquare />
          </span>
          <span className="project-title">{project.name}</span>
          <Link
            to={base}
            className="icon-btn plain sm project-title-edit"
            aria-label="Редактировать проект"
          >
            <Pencil />
          </Link>
          <StatusBadge status={project.status} />
        </div>

        <div className="spacer" />

        <Avatar name={user?.full_name ?? "Гость"} color={user?.avatar_color} size="sm" />

        <Dropdown
          align="right"
          trigger={
            <IconButton aria-label="Создать в проекте">
              <Plus />
            </IconButton>
          }
        >
          <DropdownLabel>Создать в проекте</DropdownLabel>
          <DropdownLink to={`${base}/entities`} icon={<Boxes />}>
            Сущность
          </DropdownLink>
          <DropdownLink to={`${base}/components`} icon={<Layers />}>
            Компонент или сервис
          </DropdownLink>
          <DropdownLink to={`${base}/channels`} icon={<Radio />}>
            Канал связи
          </DropdownLink>
          <DropdownLink to={`${base}/scenarios`} icon={<Workflow />}>
            Сценарий
          </DropdownLink>
        </Dropdown>
      </header>

      <div className="project-body">
        <nav className="project-nav">
          {PROJECT_NAV.map((item) => (
            <NavLink
              key={item.to || "overview"}
              to={item.to ? `${base}/${item.to}` : base}
              end={item.end}
              className={({ isActive }) => cx("project-nav-item", isActive && "active")}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.chevron ? <ChevronRight className="chev" /> : null}
            </NavLink>
          ))}
        </nav>

        <div className="project-content">
          <Outlet context={{ project, reload } satisfies ProjectContextValue} />
        </div>
      </div>
    </div>
  );
}
