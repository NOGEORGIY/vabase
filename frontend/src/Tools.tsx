import { useEffect, useState } from "react";
import {
	createTool,
	deleteTool,
	getTools,
	updateTool,
	type Tool,
} from "./api";

const cell = {
	padding: "8px 10px",
	borderBottom: "1px solid #e5e7eb",
	textAlign: "left" as const,
	verticalAlign: "top" as const,
};

const emptySchema = '{"type": "object", "properties": {}}';

export function Tools() {
	const [tools, setTools] = useState<Tool[]>([]);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [endpoint, setEndpoint] = useState("");
	const [schema, setSchema] = useState(emptySchema);

	const load = () => {
		getTools().then(setTools).catch(() => setTools([]));
	};

	useEffect(() => {
		load();
	}, []);

	const reset = () => {
		setEditingId(null);
		setName("");
		setDescription("");
		setEndpoint("");
		setSchema(emptySchema);
	};

	const save = () => {
		let parsed: Record<string, unknown> = {};
		try {
			parsed = JSON.parse(schema || "{}") as Record<string, unknown>;
		} catch {
			parsed = {};
		}

		const action = editingId
			? updateTool(editingId, {
					name,
					description,
					endpoint,
					input_schema: parsed,
				})
			: createTool({
					name,
					description,
					endpoint,
					input_schema: parsed,
				});

		action.then(() => {
			reset();
			load();
		});
	};

	const edit = (tool: Tool) => {
		setEditingId(tool.id);
		setName(tool.name);
		setDescription(tool.description);
		setEndpoint(tool.endpoint);
		setSchema(JSON.stringify(tool.input_schema ?? {}, null, 2));
	};

	const remove = (id: string) => {
		deleteTool(id).then(load);
	};

	return (
		<div style={{ maxWidth: 1050, margin: "0 auto", display: "grid", gap: 16 }}>
			<h2 style={{ margin: 0 }}>Инструменты</h2>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr auto",
					gap: 8,
					padding: 12,
					background: "#fff",
					border: "1px solid #e5e7eb",
					borderRadius: 8,
				}}
			>
				<input
					placeholder="Название"
					value={name}
					onChange={(event) => setName(event.target.value)}
					style={{ padding: 8 }}
				/>
				<input
					placeholder="Endpoint"
					value={endpoint}
					onChange={(event) => setEndpoint(event.target.value)}
					style={{ padding: 8 }}
				/>
				<button onClick={save} style={{ padding: "8px 12px" }}>
					{editingId ? "Сохранить" : "Добавить"}
				</button>
				<input
					placeholder="Описание"
					value={description}
					onChange={(event) => setDescription(event.target.value)}
					style={{ padding: 8, gridColumn: "1 / -1" }}
				/>
				<textarea
					placeholder="Параметры JSON"
					rows={5}
					value={schema}
					onChange={(event) => setSchema(event.target.value)}
					style={{
						padding: 8,
						gridColumn: "1 / -1",
						fontFamily: "monospace",
						fontSize: 12,
					}}
				/>
				{editingId ? (
					<button onClick={reset} style={{ gridColumn: "1 / -1", padding: 8 }}>
						Отмена
					</button>
				) : null}
			</div>

			<table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
				<thead>
					<tr>
						<th style={cell}>Название</th>
						<th style={cell}>Описание</th>
						<th style={cell}>Endpoint</th>
						<th style={cell}>Параметры</th>
						<th style={cell} />
					</tr>
				</thead>
				<tbody>
					{tools.map((tool) => (
						<tr key={tool.id}>
							<td style={cell}>{tool.name}</td>
							<td style={cell}>{tool.description}</td>
							<td style={cell}>{tool.endpoint}</td>
							<td style={{ ...cell, fontFamily: "monospace", fontSize: 12 }}>
								{JSON.stringify(tool.input_schema)}
							</td>
							<td style={cell}>
								<button onClick={() => edit(tool)}>Изменить</button>
								<button onClick={() => remove(tool.id)}>Удалить</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
