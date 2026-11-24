import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lightbulb } from "lucide-react";
import { useProject } from "../layout/ProjectLayout";
import { Badge } from "../ui/primitives";

export function ProjectSection({
  title,
  description,
  icon,
  features,
  note,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  features: string[];
  note?: string;
}) {
  const { project } = useProject();

  return (
    <div className="section-placeholder">
      <h1 className="project-content-title">{title}</h1>
      <p className="project-content-sub">{description}</p>

      <div className="placeholder-panel">
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <span className="placeholder-icon">{icon}</span>
          <Badge tone="violet">В разработке</Badge>
        </div>
        <h2>Раздел появится в следующей итерации</h2>
        <p>
          Каркас проекта и навигация уже готовы. Раздел подключается отдельным модулем —
          без изменений реестра инструментов и каталогов платформы.
        </p>

        <div className="feature-list">
          {features.map((feature) => (
            <div key={feature} className="feature-item">
              <CheckCircle2 />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {note ? (
          <div className="hint-card" style={{ marginTop: 20 }}>
            <h3>
              <Lightbulb /> Связь с подсистемой агентов
            </h3>
            <p>{note}</p>
          </div>
        ) : null}

        <Link
          to={`/projects/${project.id}`}
          className="btn btn-secondary btn-sm"
          style={{ marginTop: 22 }}
        >
          <ArrowLeft size={15} /> К обзору проекта
        </Link>
      </div>
    </div>
  );
}
