import { useState } from "react";
import { Agents } from "./Agents";
import { Tools } from "./Tools";
import { Prompts } from "./Prompts";

type Tab = "agents" | "tools" | "prompts";

const tabs: { id: Tab; label: string }[] = [
	{ id: "agents", label: "Агенты" },
	{ id: "tools", label: "Инструменты" },
	{ id: "prompts", label: "Промпты" },
];

export function App() {
	const [tab, setTab] = useState<Tab>("agents");

	return (
		<div style={{ minHeight: "100vh", background: "#f6f7fb" }}>
			<header
				style={{
					display: "flex",
					alignItems: "center",
					gap: 24,
					padding: "12px 20px",
					background: "#fff",
					borderBottom: "1px solid #e5e7eb",
				}}
			>
				<strong style={{ fontSize: 20 }}>vabase</strong>
				<nav style={{ display: "flex", gap: 8 }}>
					{tabs.map((item) => (
						<button
							key={item.id}
							onClick={() => setTab(item.id)}
							style={{
								padding: "8px 14px",
								border: "1px solid #d1d5db",
								borderRadius: 6,
								background: tab === item.id ? "#2563eb" : "#fff",
								color: tab === item.id ? "#fff" : "#111827",
								cursor: "pointer",
							}}
						>
							{item.label}
						</button>
					))}
				</nav>
			</header>

			<main style={{ padding: 16 }}>
				{tab === "agents" && <Agents />}
				{tab === "tools" && <Tools />}
				{tab === "prompts" && <Prompts />}
			</main>
		</div>
	);
}
