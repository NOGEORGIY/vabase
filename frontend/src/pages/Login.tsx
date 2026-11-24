import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Code2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Workflow,
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
    return <Navigate to="/" replace />;
  }

  const signIn = async (nextEmail: string, nextPassword: string) => {
    setError(null);
    await login(nextEmail, nextPassword);
    navigate("/", { replace: true });
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
            Соберите процесс.
            <br />
            Подключите <em>агента</em>.
          </h1>
          <p className="login-lead">
            Vabase — низкокодовая платформа конструирования решений. Собирайте сценарии
            из готовых блоков, подключайте сервисы и готовьте почву для автономных
            ИИ-агентов, которые выбирают инструменты без доработки ядра.
          </p>

          <div className="login-points">
            <div className="login-point">
              <span className="dot">
                <Check />
              </span>
              <span>Проекты, сервисы, промпты и информационная модель — в одном контуре</span>
            </div>
            <div className="login-point">
              <span className="dot">
                <Wrench />
              </span>
              <span>Реестр инструментов с версиями, проверкой манифеста и подтверждением действий</span>
            </div>
            <div className="login-point">
              <span className="dot">
                <Workflow />
              </span>
              <span>Каркас готов к подключению вкладки «Ассистенты» отдельным модулем</span>
            </div>
          </div>
        </div>

        <div className="login-preview">
          <div className="preview-card">
            <div className="label">Демо-контур</div>
            <div className="value">3 проекта</div>
            <div className="tiny muted" style={{ marginTop: 4 }}>
              с наполненными каталогами
            </div>
          </div>
          <div className="preview-card">
            <div className="label">Реестр инструментов</div>
            <div className="value">7 инструментов</div>
            <div className="tiny muted" style={{ marginTop: 4 }}>
              HTTP, MCP, вебхук, встроенный
            </div>
          </div>
          <div className="preview-card">
            <div className="label">Подсистема агентов</div>
            <div className="value">Скоро</div>
            <div className="tiny muted" style={{ marginTop: 4 }}>
              контракты и данные готовы
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
