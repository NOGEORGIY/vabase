import { Handle, Position } from "@xyflow/react";
import { Bot } from "lucide-react";
import { Field, Textarea } from "../../ui/primitives";

export function AgentNode({ data }: { data: { label: string } }) {
  return (
    <div
      style={{
        border: "1px solid var(--border, #333)",
        borderRadius: 16,
        padding: 16,
        width: 380,
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Bot size={20} />
        <strong>{data.label || "Агент"}</strong>
      </div>

      {/* Класс nodrag обязателен, чтобы при выделении текста не двигался весь блок */}
      <div className="nodrag" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Системный промпт" required>
          <Textarea
            rows={4}
            style={{ fontFamily: "var(--mono)", fontSize: 12, width: "100%" }}
            placeholder="Ты полезный ассистент..."
          />
        </Field>

        <Field label="JSON-схема параметров">
          <Textarea
            rows={4}
            style={{ fontFamily: "var(--mono)", fontSize: 12, width: "100%" }}
            placeholder='{"type": "object", "properties": {}}'
          />
        </Field>
      </div>

      {/* Исходящая точка соединения снизу */}
      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10 }} />
    </div>
  );
}