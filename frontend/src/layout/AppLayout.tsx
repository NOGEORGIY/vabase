import { Link, NavLink, Outlet } from "react-router-dom";
import {
  BookText,
  Database,
  FolderKanban,
  Home,
  Layers,
  SquareTerminal,
} from "lucide-react";
import { Brand } from "./Logo";
import { Topbar } from "./Topbar";
import { cx } from "../ui/primitives";

const NAV_ITEMS = [
  { to: "/", label: "Главная", icon: <Home />, end: true },
  { to: "/projects", label: "Мои проекты", icon: <FolderKanban /> },
  { to: "/services", label: "Сервисы и компоненты", icon: <Layers /> },
  { to: "/prompt-engineering", label: "Промпт-инжиниринг", icon: <SquareTerminal /> },
  { to: "/info-model", label: "Информационная модель", icon: <BookText /> },
  { to: "/interpreted-data", label: "Интерпретируемые данные", icon: <Database /> },
];

export function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" aria-label="Vabase — на главную" style={{ width: "max-content", textDecoration: "none" }}>
          <Brand />
        </Link>
        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cx("nav-item", isActive && "active")}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <strong>Vabase 0.1 · прототип</strong>
          Каркас платформы и реестр инструментов готовы. Подсистема ИИ-агентов — следующий модуль.
        </div>
      </aside>

      <div className="main-column">
        <Topbar />
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
