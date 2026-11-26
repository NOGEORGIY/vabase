import { useEffect, useState } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Wrench } from "lucide-react";
import { getTools, type Tool } from "../api";

interface ToolData {
	label?: string;
	toolId?: string;
	description?: string;
	endpoint?: string;
}

export function ToolNode({ id, data }: { id: string; data: ToolData }) {
	const { setNodes } = useReactFlow();
	const [tools, setTools] = useState<Tool[]>([]);

	useEffect(() => {
		getTools().then(setTools).catch(() => setTools([]));
	}, []);

	const selectedTool = tools.find((tool) => tool.id === data.toolId) ?? null;

	const selectTool = (value: string) => {
		const tool = tools.find((item) => item.id === value) ?? null;
		setNodes((current) =>
			current.map((node) => {
				if (node.id !== id) return node;
				if (!tool) {
					return {
						...node,
						data: { ...node.data, toolId: "", description: "", endpoint: "" },
					};
				}
				return {
					...node,
					data: {
						...node.data,
						toolId: tool.id,
						label: tool.name,
						description: tool.description,
						endpoint: tool.endpoint,
					},
				};
			}),
		);
	};

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
				<Wrench size={18} />
				{data.label || "Инструмент"}
			</div>

			<select
				value={data.toolId ?? ""}
				onChange={(event) => selectTool(event.target.value)}
				className="nodrag"
				style={{
					width: "100%",
					marginTop: 10,
					padding: "6px 8px",
					border: "1px solid #d1d5db",
					borderRadius: 6,
				}}
			>
				<option value="">Выберите инструмент</option>
				{tools.map((tool) => (
					<option key={tool.id} value={tool.id}>
						{tool.name}
					</option>
				))}
			</select>

			<div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
				{selectedTool?.description || "Без описания"}
			</div>
			<div style={{ marginTop: 4, fontSize: 12, color: "#374151", wordBreak: "break-all" }}>
				{selectedTool?.endpoint || ""}
			</div>

			<Handle type="source" position={Position.Right} />
		</div>
	);
}
