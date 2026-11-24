import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  Database,
  GitBranch,
  Lightbulb,
  Lock,
  Network,
  Play,
  Plus,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useApi, useDocumentTitle } from "../api/hooks";
import type { AgentRoadmap } from "../api/types";
import { useProject } from "../layout/ProjectLayout";
import { Badge, Button, cx } from "../ui/primitives";

export function ProjectAssistants() {
  const { project } = useProject();
  const { data: roadmap, loading } = useApi<AgentRoadmap>("/agents/roadmap");
  useDocumentTitle(`${project.name} · Ассистенты`);

  return (
    <>
      <div className="row between" style={{ alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h1 className="project-content-title">Ассистенты</h1>
          <p className="project-content-sub" style={{ marginBottom: 0 }}>
            Автономные ИИ-агенты проекта: инструкция, инструменты, запуск и трассировка.
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Badge tone="violet">В разработке</Badge>
          <Button variant="primary" disabled title="Появится вместе с подсистемой агентов">
            <Plus /> Создать ассистента
          </Button>
        </div>
      </div>

      <section className="assist-hero">
        <Badge tone="violet">Задел подсистемы ИИ-агентов</Badge>
        <h2>{roadmap?.title ?? "Подсистема ИИ-агентов"}</h2>
        <p>
          {roadmap?.summary ??
            "Каркас платформы готов. Вкладка агентов подключается отдельным модулем без изменения ядра."}
        </p>
        <div className="assist-hero-actions">
          <Link to="/prompt-engineering/tools" className="btn btn-primary">
            <Wrench /> Реестр инструментов
          </Link>
          <Link to="/prompt-engineering/prompts" className="btn btn-secondary">
            <Sparkles /> Промпты и инструкции
          </Link>
        </div>

        <div className="flow">
          {[
            { label: "Задача", icon: <Play /> },
            { label: "Ядро агента", icon: <Bot /> },
            { label: "Реестр инструментов", icon: <Wrench /> },
            { label: "Внешние системы", icon: <Network /> },
            { label: "Трассировка", icon: <GitBranch /> },
          ].map((node, index) => (
            <span key={node.label} className="row" style={{ gap: 8 }}>
              {index > 0 ? <ArrowRight className="flow-arrow" size={15} /> : null}
              <span className="flow-node">
                {node.icon} {node.label}
              </span>
            </span>
          ))}
        </div>
      </section>

      <div className="assist-grid">
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">План реализации</h2>
              <p className="card-subtitle">Модуль подключается по шагам, без пересборки ядра</p>
            </div>
            <Badge tone="gray" noDot>
              6 шагов
            </Badge>
          </div>

          {loading ? (
            <div className="table-skeleton">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton row-skeleton" />
              ))}
            </div>
          ) : (
            <div className="roadmap-list">
              {(roadmap?.items ?? []).map((item) => (
                <div key={item.id} className="roadmap-row">
                  <span className={cx("roadmap-status", item.status)}>
                    {item.status === "ready" ? <CheckCircle2 /> : <Clock3 />}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="t">
                      {item.title}
                      <Badge tone={item.status === "ready" ? "green" : "gray"}>
                        {item.status === "ready" ? "Готово" : "Запланировано"}
                      </Badge>
                    </div>
                    <div className="d">{item.description}</div>
                    {item.footprint ? <div className="f">{item.footprint}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="stack">
          <section className="card">
            <div className="card-head" style={{ marginBottom: 12 }}>
              <div>
                <h2 className="card-title">Готово к подключению</h2>
                <p className="card-subtitle">Блоки, на которые опрётся агент</p>
              </div>
              <CheckCircle2 size={18} color="var(--green)" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {(roadmap?.ready_building_blocks ?? []).map((item) => (
                <div
                  key={item}
                  className="row"
                  style={{ gap: 9, fontSize: 13, color: "var(--ink-2)" }}
                >
                  <CheckCircle2 size={15} color="var(--green)" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Link
              to="/prompt-engineering/tools"
              className="btn btn-soft btn-sm btn-block"
              style={{ marginTop: 14 }}
            >
              Открыть инструменты <ArrowRight size={14} />
            </Link>
          </section>

          <section className="card">
            <div className="card-head" style={{ marginBottom: 10 }}>
              <div>
                <h2 className="card-title">Контракт API</h2>
                <p className="card-subtitle">Зарезервированные маршруты</p>
              </div>
              <Lock size={16} color="var(--muted)" />
            </div>
            <div className="code-card">
              {(roadmap?.endpoints ?? []).map((endpoint) => (
                <div key={endpoint}>
                  <span className="k">{endpoint.split(" ")[0]}</span>{" "}
                  {endpoint.split(" ").slice(1).join(" ")}
                </div>
              ))}
            </div>
            <div className="tiny muted" style={{ marginTop: 10, lineHeight: 1.5 }}>
              Маршруты отвечают <span className="code-inline">501 NOT_IMPLEMENTED</span> до
              подключения модуля — контракт зафиксирован.
            </div>
          </section>

          <section className="card">
            <div className="card-head" style={{ marginBottom: 10 }}>
              <div>
                <h2 className="card-title">Модель данных</h2>
                <p className="card-subtitle">Сущности будущей подсистемы</p>
              </div>
              <Database size={16} color="var(--muted)" />
            </div>
            <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
              {(roadmap?.data_model ?? []).map((table) => (
                <span key={table} className="chip" style={{ height: 30, fontSize: 12 }}>
                  {table}
                </span>
              ))}
            </div>
          </section>

          <div className="hint-card">
            <h3>
              <Lightbulb /> Почему вкладка пока пустая
            </h3>
            <p>
              В прототипе собран весь каркас платформы, а подсистема агентов подключается
              отдельным модулем. Создание агента и запуск задачи появятся здесь без
              изменений остальных разделов.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
