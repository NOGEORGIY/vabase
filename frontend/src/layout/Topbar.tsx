import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  Boxes,
  ChevronDown,
  FileText,
  FolderPlus,
  LogOut,
  Plug,
  Plus,
  Sparkles,
  Upload,
  UserRound,
  Wrench,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  Avatar,
  Button,
  Dropdown,
  DropdownLabel,
  DropdownLink,
  DropdownSeparator,
  IconButton,
  SearchInput,
} from "../ui/primitives";

const ROLE_LABELS: Record<string, string> = {
  analyst: "Аналитик",
  admin: "Администратор платформы",
  developer: "Разработчик интеграций",
};

const CREATE_ITEMS = [
  { to: "/projects?new=1", label: "Проект", icon: <FolderPlus /> },
  { to: "/services?new=service", label: "Сервис", icon: <Plug /> },
  { to: "/services?new=component", label: "Компонент", icon: <Boxes /> },
  { to: "/prompt-engineering/prompts?new=1", label: "Промпт", icon: <FileText /> },
  { to: "/prompt-engineering/tools?new=1", label: "Инструмент", icon: <Wrench /> },
  { to: "/interpreted-data/dictionaries?new=1", label: "Справочник", icon: <BookOpen /> },
];

const NOTIFICATIONS = [
  {
    title: "Подсистема агентов запланирована",
    text: "Каркас и реестр инструментов готовы. Вкладка «Ассистенты» появится в проекте.",
    time: "сегодня",
  },
  {
    title: "Инструмент crm.update_status опубликован",
    text: "Для вызова требуется подтверждение оператора.",
    time: "2 часа назад",
  },
  {
    title: "Метрики за неделю",
    text: "Запусков агентов пока нет: модуль находится в разработке.",
    time: "вчера",
  },
];

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const submitSearch = () => {
    const query = search.trim();
    if (query.length < 2) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setSearch("");
  };

  return (
    <header className="topbar">
      <Dropdown
        align="left"
        trigger={
          <Button variant="primary">
            <Plus /> Создать
          </Button>
        }
      >
        <DropdownLabel>Новый объект</DropdownLabel>
        {CREATE_ITEMS.map((item) => (
          <DropdownLink key={item.to} to={item.to} icon={item.icon}>
            {item.label}
          </DropdownLink>
        ))}
      </Dropdown>

      <div className="topbar-search">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск по платформе"
          onSubmit={submitSearch}
        />
      </div>

      <div className="topbar-actions">
        <IconButton title="Импорт данных — скоро" aria-label="Импорт данных">
          <Upload />
        </IconButton>

        <Dropdown
          align="right"
          trigger={
            <IconButton aria-label="Уведомления" style={{ position: "relative" }}>
              <Bell />
              <span
                style={{
                  position: "absolute",
                  top: 11,
                  right: 12,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--blue)",
                  border: "2px solid #fff",
                }}
              />
            </IconButton>
          }
        >
          <DropdownLabel>Уведомления</DropdownLabel>
          <div style={{ padding: "2px 4px 6px", width: 300 }}>
            {NOTIFICATIONS.map((item) => (
              <div
                key={item.title}
                style={{
                  padding: "10px 10px",
                  borderRadius: 12,
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 2, lineHeight: 1.45 }}>
                  {item.text}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{item.time}</div>
              </div>
            ))}
          </div>
        </Dropdown>

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
          <DropdownLink icon={<UserRound />}>Профиль</DropdownLink>
          <DropdownLink icon={<Sparkles />} to="/projects">
            Мои проекты
          </DropdownLink>
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
