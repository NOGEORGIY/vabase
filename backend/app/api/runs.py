from __future__ import annotations

import json
import os
from typing import Any

import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from app.database import SessionLocal
from app.models import Tool
from app.services.llm_client import LLMClient
from app.tools import TOOLS_MAP

router = APIRouter(tags=["run"])

DEFAULT_SYSTEM_PROMPT = "Ты — полезный ассистент."
DEFAULT_MODEL = "GigaChat-2"
MAX_STEPS = 8


class RunRequest(BaseModel):
	nodes: list[dict[str, Any]]
	edges: list[dict[str, Any]]


class RunResponse(BaseModel):
	final_answer: str
	steps: list[dict[str, Any]]


def execute_tool(tool: Tool, arguments: dict[str, Any]) -> str:
	if tool.name in TOOLS_MAP:
		try:
			return str(TOOLS_MAP[tool.name](**arguments))
		except Exception as exc:
			return f"Ошибка инструмента: {exc}"

	if tool.tool_type != "http":
		return "Инструмент не поддерживается"

	url = tool.endpoint
	for key, value in arguments.items():
		url = url.replace("{" + key + "}", str(value))

	try:
		if tool.http_method.upper() == "GET":
			response = requests.get(url, timeout=20, verify=False)
		else:
			response = requests.request(
				tool.http_method.upper(),
				url,
				json=arguments,
				timeout=20,
				verify=False,
			)
		return response.text[:4000]
	except Exception as exc:
		return f"Ошибка инструмента: {exc}"


def tool_schema(tool: Tool) -> dict[str, Any]:
	return {
		"name": tool.name.replace(".", "_"),
		"description": tool.description,
		"parameters": tool.input_schema or {"type": "object", "properties": {}},
	}


def order_agents(agents: dict[str, dict[str, Any]], deps: dict[str, set[str]]) -> list[str]:
	ordered: list[str] = []
	visited: set[str] = set()

	def visit(agent_id: str) -> None:
		if agent_id in visited:
			return
		visited.add(agent_id)
		for parent in deps[agent_id]:
			visit(parent)
		ordered.append(agent_id)

	for agent_id in agents:
		visit(agent_id)
	return ordered


@router.post("/run", response_model=RunResponse)
def run_graph(payload: RunRequest) -> RunResponse:
	agents = {
		node["id"]: node
		for node in payload.nodes
		if node.get("type") == "agent" and node.get("id")
	}
	tool_nodes = {
		node["id"]: node
		for node in payload.nodes
		if node.get("type") == "tool" and node.get("id")
	}
	text_nodes = {
		node["id"]: node
		for node in payload.nodes
		if node.get("type") == "text" and node.get("id")
	}

	if not agents:
		raise HTTPException(status_code=400, detail="В графе нет агентов")

	tool_ids: set[str] = set()
	for node in tool_nodes.values():
		tool_id = node.get("data", {}).get("toolId")
		if tool_id:
			tool_ids.add(tool_id)

	tools: dict[str, Tool] = {}
	if tool_ids:
		with SessionLocal() as db:
			for tool in db.scalars(select(Tool).where(Tool.id.in_(tool_ids))).all():
				tools[tool.id] = tool

	attachments: dict[str, set[str]] = {agent_id: set() for agent_id in agents}
	deps: dict[str, set[str]] = {agent_id: set() for agent_id in agents}
	texts: dict[str, list[str]] = {agent_id: [] for agent_id in agents}

	for edge in payload.edges:
		source = edge.get("source")
		target = edge.get("target")
		if source in agents and target in tool_nodes:
			tool_id = tool_nodes[target].get("data", {}).get("toolId")
			if tool_id:
				attachments[source].add(tool_id)
		if target in agents and source in tool_nodes:
			tool_id = tool_nodes[source].get("data", {}).get("toolId")
			if tool_id:
				attachments[target].add(tool_id)
		if source in agents and target in agents:
			deps[target].add(source)
		if source in text_nodes and target in agents:
			text = text_nodes[source].get("data", {}).get("text")
			if text:
				texts[target].append(text)
		if target in text_nodes and source in agents:
			text = text_nodes[target].get("data", {}).get("text")
			if text:
				texts[source].append(text)

	steps: list[dict[str, Any]] = []
	finals: dict[str, str] = {}
	order = order_agents(agents, deps)

	for agent_id in order:
		agent = agents[agent_id]
		data = agent.get("data", {})
		agent_name = data.get("label") or "Агент"
		system_prompt = data.get("systemPrompt") or DEFAULT_SYSTEM_PROMPT
		functions = [
			tool_schema(tools[tool_id])
			for tool_id in attachments[agent_id]
			if tool_id in tools
		]

		messages: list[dict[str, Any]] = [{"role": "system", "content": system_prompt}]
		has_context = False
		for parent in deps[agent_id]:
			if parent in finals:
				messages.append(
					{
						"role": "user",
						"content": f"Ответ предыдущего агента:\n{finals[parent]}",
					}
				)
				has_context = True
		for text in texts[agent_id]:
			messages.append({"role": "user", "content": text})
			has_context = True

		if not has_context:
			messages.append({"role": "user", "content": "Выполни задачу."})

		steps.append(
			{
				"agent": agent_name,
				"type": "start",
				"content": "\n".join(texts[agent_id]) or "Запуск",
				"functions": [function["name"] for function in functions],
			}
		)

		client = LLMClient(
			credentials=os.getenv("GIGACHAT_API_TOKEN", ""),
			model=data.get("model") or DEFAULT_MODEL,
		)

		answer = ""
		final_recorded = False
		for step_number in range(1, MAX_STEPS + 1):
			try:
				message = client.chat(messages, functions=functions or None)
			except Exception as exc:
				raise HTTPException(status_code=502, detail=f"Ошибка LLM: {exc}") from exc

			content = message.get("content") or ""
			call = message.get("function_call")
			messages.append(message)

			if not call:
				answer = content
				steps.append(
					{
						"agent": agent_name,
						"type": "final",
						"content": answer,
						"step": step_number,
					}
				)
				final_recorded = True
				break

			calls = call if isinstance(call, list) else [call]
			for item in calls:
				name = item.get("name", "")
				raw_arguments = item.get("arguments") or {}
				if isinstance(raw_arguments, dict):
					arguments = raw_arguments
				else:
					try:
						arguments = json.loads(raw_arguments)
					except json.JSONDecodeError:
						arguments = {}

				tool = next(
					(
						value
						for value in tools.values()
						if value.name == name or value.name.replace(".", "_") == name
					),
					None,
				)
				result = execute_tool(tool, arguments) if tool else "Инструмент не найден"

				steps.append(
					{
						"agent": agent_name,
						"type": "tool",
						"tool": tool.name if tool else name,
						"arguments": arguments,
						"result": result,
						"step": step_number,
					}
				)

				messages.append(
					{
						"role": "tool",
						"name": name,
						"content": json.dumps({"result": result}, ensure_ascii=False),
					}
				)

		finals[agent_id] = answer
		if not answer and not final_recorded:
			steps.append(
				{
					"agent": agent_name,
					"type": "final",
					"content": "",
					"step": MAX_STEPS,
				}
			)

	last_agent = order[-1]
	final_answer = next(
		(finals[agent_id] for agent_id in reversed(order) if finals.get(agent_id)),
		"",
	)
	return RunResponse(final_answer=final_answer or finals.get(last_agent, ""), steps=steps)
