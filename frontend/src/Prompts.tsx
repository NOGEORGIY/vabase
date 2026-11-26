import { useEffect, useState } from "react";
import { createPrompt, deletePrompt, getPrompts, type Prompt } from "./api";

const cell = {
	padding: "8px 10px",
	borderBottom: "1px solid #e5e7eb",
	textAlign: "left" as const,
};

export function Prompts() {
	const [prompts, setPrompts] = useState<Prompt[]>([]);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [content, setContent] = useState("");

	const load = () => {
		getPrompts().then(setPrompts).catch(() => setPrompts([]));
	};

	useEffect(() => {
		load();
	}, []);

	const add = () => {
		createPrompt({ name, description, content }).then(() => {
			setName("");
			setDescription("");
			setContent("");
			load();
		});
	};

	const remove = (id: string) => {
		deletePrompt(id).then(load);
	};

	return (
		<div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 16 }}>
			<h2 style={{ margin: 0 }}>Промпты</h2>

			<div
				style={{
					display: "grid",
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
					placeholder="Описание"
					value={description}
					onChange={(event) => setDescription(event.target.value)}
					style={{ padding: 8 }}
				/>
				<textarea
					placeholder="Текст промпта"
					rows={4}
					value={content}
					onChange={(event) => setContent(event.target.value)}
					style={{ padding: 8 }}
				/>
				<button onClick={add} style={{ padding: "8px 12px", width: 120 }}>
					Добавить
				</button>
			</div>

			<table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
				<thead>
					<tr>
						<th style={cell}>Название</th>
						<th style={cell}>Описание</th>
						<th style={cell}>Текст</th>
						<th style={cell} />
					</tr>
				</thead>
				<tbody>
					{prompts.map((prompt) => (
						<tr key={prompt.id}>
							<td style={cell}>{prompt.name}</td>
							<td style={cell}>{prompt.description}</td>
							<td style={cell}>{prompt.content}</td>
							<td style={cell}>
								<button onClick={() => remove(prompt.id)}>Удалить</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
