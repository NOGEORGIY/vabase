import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  BookText,
  FileText,
  FolderKanban,
  Layers,
  Search,
  Wrench,
} from "lucide-react";
import { useApi, useDocumentTitle } from "../api/hooks";
import type { SearchResponse } from "../api/types";
import { Button, EmptyState, Input, PageHeader } from "../ui/primitives";

const TYPE_ICONS: Record<string, ReactNode> = {
  project: <FolderKanban />,
  service: <Layers />,
  prompt: <FileText />,
  tool: <Wrench />,
  dictionary: <BookOpen />,
  category: <BookText />,
};

export function SearchResults() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const [value, setValue] = useState(query);
  const { data, loading } = useApi<SearchResponse | null>(
    query ? `/search?q=${encodeURIComponent(query)}` : null,
    [query],
  );
  useDocumentTitle(`Поиск · ${query}`);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = value.trim();
    if (next.length < 2) return;
    setParams({ q: next });
  };

  return (
    <>
      <PageHeader
        title="Поиск"
        subtitle={query ? `Результаты по запросу «${query}»` : "Введите запрос в строке поиска"}
      />

      <form onSubmit={submit} className="row" style={{ gap: 10, marginBottom: 22, maxWidth: 560 }}>
        <div className="search-field">
          <Search />
          <Input
            value={value}
            placeholder="Что ищем?"
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
        <Button variant="primary" type="submit">
          Найти
        </Button>
      </form>

      {loading ? (
        <div className="center-loader">Ищем по платформе…</div>
      ) : !query ? (
        <div className="card">
          <EmptyState
            icon={<Search />}
            title="Введите запрос"
            text="Поиск работает по проектам, сервисам, промптам, инструментам и справочникам."
          />
        </div>
      ) : data && data.total === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Search />}
            title="Ничего не найдено"
            text="Попробуйте другой запрос или проверьте, что запись уже создана."
            action={
              <Link to="/" className="btn btn-secondary btn-sm">
                На главную
              </Link>
            }
          />
        </div>
      ) : (
        <div className="search-groups">
          {data?.groups.map((group) => (
            <section key={group.type} className="search-group">
              <div className="group-title">{group.title}</div>
              {group.items.map((item) => (
                <Link key={`${group.type}-${item.id}`} to={item.link} className="search-item">
                  <span className="si">{TYPE_ICONS[group.type] ?? <Search />}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="t" style={{ display: "block" }}>
                      {item.title}
                    </span>
                    <span className="s" style={{ display: "block" }}>
                      {item.subtitle || "Без описания"}
                    </span>
                  </span>
                </Link>
              ))}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
