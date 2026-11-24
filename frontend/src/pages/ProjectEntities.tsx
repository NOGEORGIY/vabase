import { Link } from "react-router-dom";
import { BookText, Boxes } from "lucide-react";
import { useDocumentTitle } from "../api/hooks";
import type { EntityItem } from "../api/types";
import { useProject } from "../layout/ProjectLayout";
import { CatalogTable } from "../ui/CatalogTable";
import { Badge } from "../ui/primitives";

export function ProjectEntities() {
  const { project } = useProject();
  useDocumentTitle(`${project.name} · Сущности`);

  return (
    <>
      <h1 className="project-content-title">Сущности</h1>
      <p className="project-content-sub">
        Модель данных проекта: объекты, с которыми работают процессы и будущие агенты.
      </p>

      <CatalogTable<EntityItem>
        endpoint="/entities"
        query={{ project_id: project.id }}
        defaults={{ project_id: project.id }}
        title="Модель данных"
        subtitle="Характеристики сущностей задаются в информационной модели платформы"
        columns={[
          {
            key: "name",
            header: "Сущность",
            primary: true,
            render: (row) => (
              <span className="row" style={{ gap: 9 }}>
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    background: "var(--blue-soft)",
                    color: "var(--blue)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Boxes size={15} />
                </span>
                {row.name}
              </span>
            ),
          },
          { key: "description", header: "Описание" },
          {
            key: "fields_count",
            header: "Полей",
            width: "100px",
            render: (row) => (
              <Badge tone="gray" noDot>
                {row.fields_count}
              </Badge>
            ),
          },
        ]}
        fields={[
          { name: "name", label: "Название", required: true, placeholder: "Например, Заявка" },
          {
            name: "description",
            label: "Описание",
            type: "textarea",
            wide: true,
            rows: 2,
            placeholder: "Что описывает сущность и где используется",
          },
          { name: "fields_count", label: "Количество полей", type: "number", defaultValue: 0 },
        ]}
        createLabel="Добавить сущность"
        searchPlaceholder="Поиск по названию"
        emptyTitle="Сущностей пока нет"
        emptyText="Создайте первую сущность, чтобы связать её со сценарием."
        pageSize={10}
        minWidth={720}
        headerActions={
          <Link to="/info-model/categories" className="btn btn-secondary">
            <BookText /> Информационная модель
          </Link>
        }
      />
    </>
  );
}
