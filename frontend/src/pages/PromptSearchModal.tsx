import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { api } from "../api/client";
import type { PromptSearchResponse } from "../api/types";
import { Badge, Button, EmptyState, Modal, Textarea, WarningNote } from "../ui/primitives";

export function PromptSearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<PromptSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async () => {
    if (query.trim().length < 2) {
      setError("Опишите задачу: минимум два символа");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api<PromptSearchResponse>(
        `/prompts/search?q=${encodeURIComponent(query.trim())}`,
      );
      setResult(response);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Поиск не удался");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Подбор промпта"
      subtitle="Опишите задачу — покажем подходящие промпты"
      wide
      footer={
        <Button variant="secondary" onClick={onClose}>
          Закрыть
        </Button>
      }
    >
      <div className="modal-body">
        {error ? <WarningNote text={error} /> : null}
        <div className="field">
          <span className="field-label">Что нужно сделать</span>
          <Textarea
            rows={3}
            value={query}
            autoFocus
            placeholder="Например: разобрать входящее обращение клиента и определить тему"
            onChange={(event) => setQuery(event.target.value)}
          />
          <span className="field-hint">
            Поиск по названию, описанию и связанным инструментам.
          </span>
        </div>
        <div className="row">
          <Button variant="primary" onClick={runSearch} loading={loading}>
            <Search /> Найти промпт
          </Button>
          <Badge tone="violet" noDot>
            <Sparkles size={12} /> релевантность
          </Badge>
        </div>

        {result ? (
          result.items.length === 0 ? (
            <EmptyState
              compact
              title="Ничего не найдено"
              text="Попробуйте сформулировать задачу иначе или создайте новый промпт."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.items.map((hit, index) => (
                <div key={hit.prompt.id} className="search-item" style={{ alignItems: "flex-start" }}>
                  <span className="si" style={{ marginTop: 2 }}>
                    {index + 1}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="t" style={{ display: "block" }}>
                      {hit.prompt.name}
                    </span>
                    <span className="s" style={{ display: "block" }}>
                      {hit.prompt.description || hit.prompt.task || "Без описания"}
                    </span>
                    {hit.matched_terms.length > 0 ? (
                      <span className="row" style={{ gap: 5, marginTop: 7, flexWrap: "wrap" }}>
                        {hit.matched_terms.map((term) => (
                          <Badge key={term} tone="gray" noDot>
                            {term}
                          </Badge>
                        ))}
                      </span>
                    ) : null}
                  </span>
                  <Badge tone="blue">{Math.round(hit.score * 100)}%</Badge>
                </div>
              ))}
            </div>
          )
        ) : null}
      </div>
    </Modal>
  );
}
