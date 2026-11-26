import { useCallback, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Bot, FileText, Trash2, Wrench } from "lucide-react";
import {
	Background,
	Controls,
	ReactFlow,
	addEdge,
	useEdgesState,
	useNodesState,
	type Connection,
	type Edge,
	type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AgentNode } from "./components/AgentNode";
import { TextNode } from "./components/TextNode";
import { ToolNode } from "./components/ToolNode";
import { runGraph, type RunResult } from "./api";

const nodeTypes = {
	agent: AgentNode,
	tool: ToolNode,
	text: TextNode,
};

const initialNodes: Node[] = [
	{
		id: "agent-1",
		type: "agent",
		position: { x: 120, y: 80 },
		data: { label: "Главный агент", model: "GigaChat-2", systemPrompt: "" },
	},
];

const inputStyle = {
	width: "100%",
	padding: "8px 10px",
	border: "1px solid #d1d5db",
	borderRadius: 6,
	background: "#fff",
	color: "#111827",
};

const fieldStyle = {
	display: "flex",
	flexDirection: "column" as const,
	gap: 4,
	fontSize: 13,
};

export function Agents() {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [result, setResult] = useState<RunResult | null>(null);
	const [mode, setMode] = useState<"steps" | "final">("steps");
	const [running, setRunning] = useState(false);
	const [runError, setRunError] = useState("");
	const [panelHeight, setPanelHeight] = useState(220);

	const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

	const onConnect = useCallback(
		(connection: Connection) => {
			setEdges((current) => addEdge(connection, current));
		},
		[setEdges],
	);

	const updateSelectedNodeData = (key: string, value: string) => {
		if (!selectedNodeId) return;
		setNodes((current) =>
			current.map((node) =>
				node.id === selectedNodeId
					? { ...node, data: { ...node.data, [key]: value } }
					: node,
			),
		);
	};

	const addNode = (type: "agent" | "tool" | "text") => {
		const id = `${type}-${Date.now()}`;
		const node: Node = {
			id,
			type,
			position: { x: 120 + Math.random() * 240, y: 80 + Math.random() * 160 },
			data:
				type === "agent"
					? { label: `Агент ${nodes.length + 1}`, model: "GigaChat-2", systemPrompt: "" }
					: type === "text"
						? { label: `Текст ${nodes.length + 1}`, text: "", promptId: "" }
						: { label: `Инструмент ${nodes.length + 1}`, description: "", endpoint: "" },
		};
		setNodes((current) => [...current, node]);
		setSelectedNodeId(id);
	};

	const deleteSelectedNode = () => {
		if (!selectedNodeId) return;
		setNodes((current) => current.filter((node) => node.id !== selectedNodeId));
		setEdges((current) =>
			current.filter(
				(edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId,
			),
		);
		setSelectedNodeId(null);
	};

	const startRun = async () => {
		setRunning(true);
		setRunError("");
		try {
			const response = await runGraph({ nodes, edges });
			setResult(response);
			setMode("steps");
		} catch (error) {
			setRunError(error instanceof Error ? error.message : "Ошибка запуска");
		} finally {
			setRunning(false);
		}
	};

	const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
		const startY = event.clientY;
		const startHeight = panelHeight;
		const move = (moveEvent: globalThis.PointerEvent) => {
			const next = startHeight + startY - moveEvent.clientY;
			setPanelHeight(Math.max(120, Math.min(window.innerHeight - 180, next)));
		};
		const stop = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", stop);
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", stop);
	};

	const stepText = (step: RunResult["steps"][number]) => {
		if (step.type === "start") {
			return `${step.agent}: старт${step.functions?.length ? `, функции: ${step.functions.join(", ")}` : ""}`;
		}
		if (step.type === "tool") {
			const args = JSON.stringify(step.arguments ?? {});
			return `${step.agent}: ${step.tool}(${args}) → ${step.result}`;
		}
		return `${step.agent}: ${step.content || "пустой ответ"}`;
	};

	return (
		<div
			style={{
				height: "calc(100vh - 100px)",
				display: "flex",
				flexDirection: "column",
				border: "1px solid #e5e7eb",
				borderRadius: 8,
				overflow: "hidden",
				background: "#fff",
			}}
		>
			<div style={{ display: "flex", flex: 1, minHeight: 0 }}>
			<aside
				style={{
					width: 180,
					padding: 12,
					borderRight: "1px solid #e5e7eb",
					background: "#fafafa",
					display: "flex",
					flexDirection: "column",
					gap: 8,
				}}
			>
				<strong style={{ fontSize: 13 }}>Добавить блок</strong>
				<button onClick={() => addNode("agent")} style={inputStyle}>
					<Bot size={16} /> Агент
				</button>
				<button onClick={() => addNode("tool")} style={inputStyle}>
					<Wrench size={16} /> Инструмент
				</button>
				<button onClick={() => addNode("text")} style={inputStyle}>
					<FileText size={16} /> Создать текст
				</button>
			</aside>

			<div style={{ flex: 1, minWidth: 0 }}>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onNodeClick={(_, node) => setSelectedNodeId(node.id)}
					onPaneClick={() => setSelectedNodeId(null)}
					nodeTypes={nodeTypes}
					fitView
				>
					<Background />
					<Controls />
				</ReactFlow>
			</div>

			<aside
				style={{
					width: 280,
					padding: 12,
					borderLeft: "1px solid #e5e7eb",
					background: "#fafafa",
					overflowY: "auto",
					display: "flex",
					flexDirection: "column",
					gap: 12,
				}}
			>
				<strong style={{ fontSize: 13 }}>Свойства</strong>

				{selectedNode ? (
					<>
						<div style={{ fontSize: 12, color: "#6b7280" }}>
							{selectedNode.id} ({selectedNode.type})
						</div>

						<label style={fieldStyle}>
							Название
							<input
								style={inputStyle}
								value={String(selectedNode.data.label ?? "")}
								onChange={(event) =>
									updateSelectedNodeData("label", event.target.value)
								}
							/>
						</label>

						{selectedNode.type === "agent" ? (
							<>
								<label style={fieldStyle}>
									Модель
									<input
										style={inputStyle}
										value={String(selectedNode.data.model ?? "")}
										onChange={(event) =>
											updateSelectedNodeData("model", event.target.value)
										}
									/>
								</label>
								<label style={fieldStyle}>
									Системный промпт
									<textarea
										rows={5}
										style={inputStyle}
										value={String(selectedNode.data.systemPrompt ?? "")}
										onChange={(event) =>
											updateSelectedNodeData("systemPrompt", event.target.value)
										}
									/>
								</label>
							</>
						) : selectedNode.type === "text" ? (
							<label style={fieldStyle}>
								Текст промпта
								<textarea
									rows={6}
									style={inputStyle}
									value={String(selectedNode.data.text ?? "")}
									onChange={(event) =>
										updateSelectedNodeData("text", event.target.value)
									}
								/>
							</label>
						) : (
							<>
								<label style={fieldStyle}>
									Описание
									<textarea
										rows={3}
										style={inputStyle}
										value={String(selectedNode.data.description ?? "")}
										onChange={(event) =>
											updateSelectedNodeData("description", event.target.value)
										}
									/>
								</label>
								<label style={fieldStyle}>
									Endpoint
									<input
										style={inputStyle}
										value={String(selectedNode.data.endpoint ?? "")}
										onChange={(event) =>
											updateSelectedNodeData("endpoint", event.target.value)
										}
									/>
								</label>
							</>
						)}

						<button
							onClick={deleteSelectedNode}
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: 6,
								padding: "8px 10px",
								border: "1px solid #fca5a5",
								borderRadius: 6,
								background: "#fef2f2",
								color: "#dc2626",
								cursor: "pointer",
							}}
						>
							<Trash2 size={14} /> Удалить
						</button>
					</>
				) : (
					<div style={{ fontSize: 13, color: "#9ca3af" }}>
						Выберите блок на холсте
					</div>
				)}
			</aside>
			</div>

			<section
				style={{
					height: panelHeight,
					borderTop: "1px solid #e5e7eb",
					display: "flex",
					flexDirection: "column",
					background: "#fff",
					flexShrink: 0,
				}}
			>
				<div
					onPointerDown={startResize}
					style={{
						height: 9,
						cursor: "ns-resize",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						background: "#f3f4f6",
					}}
				>
					<div style={{ width: 48, height: 3, borderRadius: 2, background: "#9ca3af" }} />
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
						padding: 8,
						borderBottom: "1px solid #e5e7eb",
					}}
				>
					<button
						onClick={() => setMode("steps")}
						style={{
							padding: "6px 10px",
							border: "1px solid #d1d5db",
							borderRadius: 5,
							background: mode === "steps" ? "#2563eb" : "#fff",
							color: mode === "steps" ? "#fff" : "#111827",
						}}
					>
						Все шаги
					</button>
					<button
						onClick={() => setMode("final")}
						style={{
							padding: "6px 10px",
							border: "1px solid #d1d5db",
							borderRadius: 5,
							background: mode === "final" ? "#2563eb" : "#fff",
							color: mode === "final" ? "#fff" : "#111827",
						}}
					>
						Финальный ответ
					</button>
					<div style={{ flex: 1 }} />
					<button
						onClick={startRun}
						disabled={running}
						style={{
							padding: "6px 12px",
							border: "1px solid #d1d5db",
							borderRadius: 5,
							background: "#16a34a",
							color: "#fff",
						}}
					>
						{running ? "Выполняется..." : "Запустить"}
					</button>
				</div>

				<div
					style={{
						flex: 1,
						overflow: "auto",
						padding: 10,
						fontSize: 13,
						background: "#0f172a",
						color: "#e2e8f0",
					}}
				>
					{runError ? <div style={{ color: "#f87171" }}>{runError}</div> : null}
					{mode === "final" ? (
						<div style={{ whiteSpace: "pre-wrap" }}>
							{result?.final_answer || "Нет ответа"}
						</div>
					) : result?.steps.length ? (
						result.steps.map((step, index) => (
							<div key={index} style={{ marginBottom: 6, whiteSpace: "pre-wrap" }}>
								[{step.type}] {stepText(step)}
							</div>
						))
					) : (
						<div style={{ color: "#94a3b8" }}>Запустите граф</div>
					)}
				</div>
			</section>
		</div>
	);
}
