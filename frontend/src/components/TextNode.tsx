import { useEffect, useState } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { FileText } from "lucide-react";
import { getPrompts, type Prompt } from "../api";

interface TextData {
	label?: string;
	text?: string;
	promptId?: string;
}

export function TextNode({ id, data }: { id: string; data: TextData }) {
	const { setNodes } = useReactFlow();
	const [prompts, setPrompts] = useState<Prompt[]>([]);

	useEffect(() => {
		getPrompts().then(setPrompts).catch(() => setPrompts([]));
	}, []);

	const choose = (value: string) => {
		const prompt = prompts.find((item) => item.id === value) ?? null;
		setNodes((current) =>
			current.map((node) => {
				if (node.id !== id) return node;
				return {
					...node,
					data: {
						...node.data,
						promptId: prompt?.id ?? "",
						label: prompt?.name ?? "Текст",
						text: prompt?.content ?? "",
					},
				};
			}),
		);
	};

	const updateText = (text: string) => {
		setNodes((current) =>
			current.map((node) =>
				node.id === id ? { ...node, data: { ...node.data, text } } : node,
			),
		);
	};

	return (
		<div
			style={{
				width: 320,
				padding: 12,
				border: "1px solid #d1d5db",
				borderRadius: 10,
				background: "#fff",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
				<FileText size={18} />
				{data.label || "Текст"}
			</div>

			<select
				className="nodrag"
				value={data.promptId ?? ""}
				onChange={(event) => choose(event.target.value)}
				style={{
					width: "100%",
					marginTop: 10,
					padding: "7px 8px",
					border: "1px solid #d1d5db",
					borderRadius: 6,
					background: "#fff",
					color: "#111827",
				}}
			>
				<option value="">Выберите промпт</option>
				{prompts.map((prompt) => (
					<option key={prompt.id} value={prompt.id}>
						{prompt.name}
					</option>
				))}
			</select>

			<textarea
				className="nodrag"
				rows={5}
				value={data.text ?? ""}
				onChange={(event) => updateText(event.target.value)}
				placeholder="Выберите промпт или введите текст"
				style={{
					width: "100%",
					marginTop: 8,
					padding: 8,
					border: "1px solid #d1d5db",
					borderRadius: 6,
					background: "#fff",
					color: "#111827",
					resize: "vertical",
				}}
			/>

			<Handle type="source" position={Position.Right} />
		</div>
	);
}
