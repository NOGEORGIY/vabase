import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Code2,
  FileText,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import { useApi, useDocumentTitle } from "../api/hooks";
import type { DemoAccount } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { Brand } from "../layout/Logo";
import { Button, Field, Input, WarningNote } from "../ui/primitives";

const ROLE_ICONS: Record<string, ReactNode> = {
  analyst: <UserRound />,
  admin: <ShieldCheck />,
  developer: <Code2 />,
};

export function Login() {
  useDocumentTitle("Вход");
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { data: accounts } = useApi<DemoAccount[]>("/auth/demo-accounts");
  const [email, setEmail] = useState("g.rasputin@vabase.ru");
  const [password, setPassword] = useState("vabase");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/agents" replace />;
  }

  const signIn = async (nextEmail: string, nextPassword: string) => {
    setError(null);
    await login(nextEmail, nextPassword);
    navigate("/agents", { replace: true });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось войти");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setDemoLoading(account.email);
    setError(null);
    try {
      await signIn(account.email, account.password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось войти");
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <Link to="/login" style={{ width: "max-content", textDecoration: "none" }}>
          <Brand />
        </Link>

        <div className="login-hero-content">
          <h1 className="login-title">
            Инструменты.
            <br />
            Промпты. <em>Агенты</em>.
          </h1>
          <p className="login-lead">
            Vabase — платформа для работы с инструментами и промптами ИИ-агентов.
            Описывайте действия, проверяйте схемы и готовьте инструкции для задач.
          </p>

          <div className="login-points">
            <div className="login-point">
              <span className="dot">
                <Wrench />
              </span>
              <span>Реестр инструментов с версиями, проверкой схемы и публикацией</span>
            </div>
            <div className="login-point">
              <span className="dot">
                <FileText />
              </span>
              <span>Промпты и инструкции для типовых задач</span>
            </div>
            <div className="login-point">
              <span className="dot">
                <Users />
              </span>
              <span>Три демо-роли: аналитик, администратор, разработчик</span>
            </div>
          </div>
        </div>

        <div className="login-preview">
          <div className="preview-card">
            <div className="label">Инструменты</div>
            <div className="value">Реестр</div>
            <div className="tiny muted" style={{ marginTop: 4 }}>
              HTTP, MCP, вебхук, встроенный
            </div>
          </div>
          <div className="preview-card">
            <div className="label">Промпты</div>
            <div className="value">Шаблоны</div>
            <div className="tiny muted" style={{ marginTop: 4 }}>
              инструкции для задач
            </div>
          </div>
          <div className="preview-card">
            <div className="label">Доступ</div>
            <div className="value">3 роли</div>
            <div className="tiny muted" style={{ marginTop: 4 }}>
              демо-аккаунты
            </div>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="row" style={{ gap: 8, marginBottom: 18 }}>
            <span className="badge blue no-dot">
              <Sparkles size={12} /> Демо-доступ
            </span>
          </div>
          <h2>Вход в Vabase</h2>
          <p className="hint">
            Используйте демо-аккаунт или выберите роль ниже. Пароль всех аккаунтов —{" "}
            <span className="code-inline">vabase</span>.
          </p>

          {error ? <WarningNote text={error} /> : null}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Рабочая почта">
              <Input
                type="email"
                value={email}
                autoComplete="email"
                placeholder="name@company.ru"
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label="Пароль">
              <Input
                type="password"
                value={password}
                autoComplete="current-password"
                placeholder="••••••••"
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            <Button type="submit" block loading={loading} style={{ marginTop: 4 }}>
              Войти <ArrowRight size={16} />
            </Button>
          </form>

          <div className="divider" />

          <div className="tiny muted" style={{ marginBottom: 2 }}>
            Быстрый вход демо-аккаунтом
          </div>
          <div className="demo-accounts">
            {(accounts ?? []).map((account) => (
              <button
                key={account.email}
                type="button"
                className="demo-account"
                onClick={() => handleDemo(account)}
                disabled={Boolean(demoLoading)}
              >
                <span className="role-icon">{ROLE_ICONS[account.role] ?? <UserRound />}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="role-title" style={{ display: "block" }}>
                    {account.title}
                  </span>
                  <span className="role-note" style={{ display: "block" }}>
                    {account.description}
                  </span>
                </span>
                {demoLoading === account.email ? (
                  <span className="spinner dark" />
                ) : (
                  <ArrowRight size={16} color="var(--muted)" />
                )}
              </button>
            ))}
          </div>

          <p className="tiny muted" style={{ marginTop: 18, lineHeight: 1.5 }}>
            Прототип для курсового проекта. Данные хранятся в PostgreSQL, доступ к API —
            по токену сессии.
          </p>
        </div>
      </section>
    </div>
  );
}
