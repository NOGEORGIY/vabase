import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  Avatar,
  Dropdown,
  DropdownLink,
  DropdownSeparator,
} from "../ui/primitives";

const ROLE_LABELS: Record<string, string> = {
  analyst: "Аналитик",
  admin: "Администратор",
  developer: "Разработчик интеграций",
};

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="topbar-actions">
        <Dropdown
          align="right"
          trigger={
            <button type="button" className="user-chip">
              <Avatar name={user?.full_name ?? "Гость"} color={user?.avatar_color} />
              <span className="meta">
                <span className="name">{user?.full_name ?? "Гость"}</span>
                <span className="email">{user?.email}</span>
              </span>
              <ChevronDown size={15} color="var(--muted)" />
            </button>
          }
        >
          <div style={{ padding: "8px 11px 4px" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{user?.full_name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
            </div>
          </div>
          <DropdownSeparator />
          <DropdownLink
            icon={<LogOut />}
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Выйти
          </DropdownLink>
        </Dropdown>
      </div>
    </header>
  );
}
