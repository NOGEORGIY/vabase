from __future__ import annotations

import os
import tempfile
from pathlib import Path

import pytest

TEMP_DB = Path(tempfile.mkdtemp(prefix="vabase-tests-")) / "test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEMP_DB.as_posix()}"
os.environ["SEED_DEMO"] = "true"
os.environ["DEMO_PASSWORD"] = "vabase"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "g.rasputin@vabase.ru", "password": "vabase"},
    )
    assert response.status_code == 200, response.text
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_health(client: TestClient) -> None:
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_login_and_me(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["role"] == "analyst"


def test_demo_accounts_can_login(client: TestClient) -> None:
    accounts = client.get("/api/v1/auth/demo-accounts").json()
    assert len(accounts) == 3
    for account in accounts:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": account["email"], "password": account["password"]},
        )
        assert response.status_code == 200, account["email"]


def test_login_error_has_unified_format(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "g.rasputin@vabase.ru", "password": "wrong"},
    )
    assert response.status_code == 401
    body = response.json()
    assert body["code"] == "UNAUTHORIZED"
    assert "message" in body


def test_projects_and_demo_seed(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/api/v1/projects", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["total"] == 3
    assert response.json()["items"][0]["name"] == "рпк-тест"


def test_create_update_delete_project(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = client.post(
        "/api/v1/projects",
        headers=auth_headers,
        json={"name": "Автотест", "description": "Проверка CRUD"},
    )
    assert created.status_code == 201, created.text
    project_id = created.json()["id"]

    updated = client.patch(
        f"/api/v1/projects/{project_id}",
        headers=auth_headers,
        json={"status": "active"},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "active"

    deleted = client.delete(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert deleted.status_code == 204


def test_tools_registry_is_ready_for_agents(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    response = client.get("/api/v1/tools", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["total"] >= 7

    tools = response.json()["items"]
    approval_tool = next(tool for tool in tools if tool["name"] == "crm.update_status")
    assert approval_tool["requires_approval"] is True
    assert approval_tool["status"] == "published"


def test_tool_search_and_validation(client: TestClient, auth_headers: dict[str, str]) -> None:
    search = client.get(
        "/api/v1/tools/search",
        headers=auth_headers,
        params={"q": "изменить статус заявки в CRM"},
    )
    assert search.status_code == 200
    assert search.json()["items"]
    assert search.json()["items"][0]["tool"]["name"] == "crm.update_status"

    tools = client.get("/api/v1/tools", headers=auth_headers).json()["items"]
    draft = next(tool for tool in tools if tool["status"] == "draft")
    validation = client.post(f"/api/v1/tools/{draft['id']}/validate", headers=auth_headers)
    assert validation.status_code == 200
    assert "checks" in validation.json()


def test_prompt_search_by_task(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get(
        "/api/v1/prompts/search",
        headers=auth_headers,
        params={"q": "классификация обращения клиента"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["items"]
    assert data["items"][0]["prompt"]["name"] == "Классификация обращения клиента"
    assert data["items"][0]["score"] > 0


def test_agents_roadmap_and_stub(client: TestClient, auth_headers: dict[str, str]) -> None:
    roadmap = client.get("/api/v1/agents/roadmap", headers=auth_headers)
    assert roadmap.status_code == 200
    payload = roadmap.json()
    assert payload["status"] == "planned"
    assert any(item["status"] == "ready" for item in payload["items"])

    stub = client.get("/api/v1/agents", headers=auth_headers)
    assert stub.status_code == 501
    assert stub.json()["code"] == "NOT_IMPLEMENTED"


def test_metrics_and_search(client: TestClient, auth_headers: dict[str, str]) -> None:
    metrics = client.get("/api/v1/metrics/summary", headers=auth_headers)
    assert metrics.status_code == 200
    assert metrics.json()["tools"] >= 7
    assert metrics.json()["runs"] == 0

    search = client.get("/api/v1/search", headers=auth_headers, params={"q": "заявк"})
    assert search.status_code == 200
    assert search.json()["total"] > 0


def test_dictionary_type_filter(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get(
        "/api/v1/interpreted-data/dictionaries",
        headers=auth_headers,
        params={"dict_type": "file"},
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert items
    assert all(item["dict_type"] == "file" for item in items)


def test_unauthorized(client: TestClient) -> None:
    response = client.get("/api/v1/projects")
    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"
