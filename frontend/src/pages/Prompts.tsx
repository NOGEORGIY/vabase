import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useDocumentTitle } from "../api/hooks";
import type { Prompt } from "../api/types";
import { CatalogTable } from "../ui/CatalogTable";
import type { Column } from "../ui/DataTable";
import { Button, PageHeader, StatusBadge } from "../ui/primitives";
import { PromptSearchModal } from "./PromptSearchModal";

export function Prompts() {
  useDocumentTitle("Промпты");
  const [searchOpen, setSearchOpen] = useState(false);

  const columns: Column<Prompt>[] = [
    { key: "name", header: "Название", primary: true },
    {
      key: "description",
      header: "Описание",
      render: (row) => row.description || <span className="muted">—</span>,
    },
    {
      key: "tools",
      header: "Инструменты",
      render: (row) =>
        row.tools ? <span className="tiny">{row.tools}</span> : <span className="muted">—</span>,
    },
    {
      key: "task",
      header: "Задача",
      render: (row) => row.task || <span className="muted">—</span>,
    },
    {
      key: "status",
      header: "Статус",
      width: "120px",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Промпты"
        subtitle="Инструкции, по которым работают агенты."
        actions={
          <Button variant="soft" onClick={() => setSearchOpen(true)}>
            <Sparkles /> Подобрать по задаче
          </Button>
        }
      />

      <CatalogTable<Prompt>
        endpoint="/prompts"
        title="Список промптов"
        subtitle="Шаблоны инструкций для типовых задач"
        columns={columns}
        createLabel="Добавить промпт"
        searchPlaceholder="Поиск по названию и тексту"
        emptyTitle="Промптов пока нет"
        emptyText="Создайте первый промпт: инструкция и ожидаемый результат."
        pageSize={10}
        minWidth={760}
        fields={[
          { name: "name", label: "Название", required: true },
          {
            name: "status",
            label: "Статус",
            type: "select",
            options: [
              { value: "draft", label: "Черновик" },
              { value: "active", label: "Активен" },
              { value: "archived", label: "Архив" },
            ],
            defaultValue: "draft",
          },
          { name: "description", label: "Описание", type: "textarea", wide: true, rows: 2 },
          { name: "content", label: "Текст промпта", type: "textarea", wide: true, rows: 6 },
          { name: "tools", label: "Инструменты", placeholder: "crm.get_contact, email.send" },
          { name: "task", label: "Задача", placeholder: "Разбор входящего обращения" },
        ]}
      />

      <PromptSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
