import { Handle, Position } from "@xyflow/react";
import { Bot } from "lucide-react";

interface AgentData {
	label?: string;
	model?: string;
	systemPrompt?: string;
}

export function AgentNode({ data }: { data: AgentData }) {
	return (
		<div
			style={{
				width: 300,
				padding: 14,
				border: "1px solid #d1d5db",
				borderRadius: 10,
				background: "#fff",
			}}
		>
			<Handle type="target" position={Position.Left} />
			<div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
				<Bot size={18} />
				{data.label || "Агент"}
			</div>
			<div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
				{data.model || "GigaChat-2"}
			</div>
			<div style={{ marginTop: 8, fontSize: 12, color: "#374151", whiteSpace: "pre-wrap" }}>
				{data.systemPrompt || "Без системного промпта"}
			</div>
			<Handle type="source" position={Position.Right} />
		</div>
	);
}
