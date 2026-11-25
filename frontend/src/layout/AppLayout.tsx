import { Link, NavLink, Outlet } from "react-router-dom";
import { Bot, FileText, Wrench } from "lucide-react";
import { Brand } from "./Logo";
import { Topbar } from "./Topbar";
import { cx } from "../ui/primitives";

const NAV_ITEMS = [
  { to: "/agents", label: "Агенты", icon: <Bot /> },
  { to: "/tools", label: "Инструменты", icon: <Wrench /> },
  { to: "/prompts", label: "Промпты", icon: <FileText /> },
];

export function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link
          to="/agents"
          aria-label="Vabase"
          style={{ width: "max-content", textDecoration: "none" }}
        >
          <Brand />
        </Link>
        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cx("nav-item", isActive && "active")}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <strong>Vabase 0.1</strong>
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
