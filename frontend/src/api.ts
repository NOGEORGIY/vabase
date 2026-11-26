const API = "/api/v1";

export interface Tool {
	id: string;
	name: string;
	description: string;
	endpoint: string;
	input_schema: Record<string, unknown>;
}

export interface Prompt {
	id: string;
	name: string;
	description: string;
	content: string;
}

export interface RunStep {
	agent: string;
	type: "start" | "tool" | "final";
	content?: string;
	tool?: string;
	arguments?: Record<string, unknown>;
	result?: string;
	functions?: string[];
	step?: number;
}

export interface RunResult {
	final_answer: string;
	steps: RunStep[];
}

async function request<T>(
	path: string,
	options: { method?: string; body?: unknown } = {},
): Promise<T> {
	const response = await fetch(`${API}${path}`, {
		method: options.method ?? "GET",
		headers: options.body ? { "Content-Type": "application/json" } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});

	if (!response.ok) {
		throw new Error(`Request failed: ${response.status}`);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

export function getTools(): Promise<Tool[]> {
	return request<Tool[]>("/tools");
}

export function createTool(data: {
	name: string;
	description: string;
	endpoint: string;
	input_schema: Record<string, unknown>;
}): Promise<Tool> {
	return request<Tool>("/tools", { method: "POST", body: data });
}

export function updateTool(
	id: string,
	data: {
		name?: string;
		description?: string;
		endpoint?: string;
		input_schema?: Record<string, unknown>;
	},
): Promise<Tool> {
	return request<Tool>(`/tools/${id}`, { method: "PATCH", body: data });
}

export function deleteTool(id: string): Promise<void> {
	return request<void>(`/tools/${id}`, { method: "DELETE" });
}

export function getPrompts(): Promise<Prompt[]> {
	return request<Prompt[]>("/prompts");
}

export function createPrompt(data: {
	name: string;
	description: string;
	content: string;
}): Promise<Prompt> {
	return request<Prompt>("/prompts", { method: "POST", body: data });
}

export function deletePrompt(id: string): Promise<void> {
	return request<void>(`/prompts/${id}`, { method: "DELETE" });
}

export function runGraph(data: {
	nodes: unknown[];
	edges: unknown[];
}): Promise<RunResult> {
	return request<RunResult>("/run", { method: "POST", body: data });
}
