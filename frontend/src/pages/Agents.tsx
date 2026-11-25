import { Bot } from "lucide-react";
import { useDocumentTitle } from "../api/hooks";
import {Field, Input} from "../ui/primitives";

export function Agents() {
  useDocumentTitle("Агенты");

  return (
    <div
      style={{
        minHeight: "62vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 12,
      }}
    >
      <span className="empty-icon" style={{ width: 64, height: 64, borderRadius: 20 }}>
        <Bot size={28} />
      </span>
      <h1 className="page-title" style={{ fontSize: 34 }}>
        Агенты
      </h1>
        <Field label="Системный промпт" required hint="Системный промпт">
                <Input
                  value={form.name}
                  autoFocus
                  placeholder="crm.update_status"
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
        </Field>
      <p style={{ color: "var(--muted)", fontSize: 15 }}>В разработке</p>
    </div>
  );
}
