from __future__ import annotations

from gigachat import GigaChat

import time
import redis
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)

class LLMClient:
    def __init__(self, credentials: str, model: str, timeout: int = 120 ):
        self.credentials = credentials
        self.model = model
        self.timeout = timeout
    def get_cached_giga_token(self) -> None:
        token = r.get("giga_token")
        if token:
            return token

        giga = GigaChat(
            base_url="https://api.giga.chat/v1",
            credentials=self.credentials,
            verify_ssl_certs=False,
        )

        giga_resp = giga.get_token()
        token = giga_resp.access_token
        ttl_seconds = int(giga_resp.expires_at / 1000 - time.time()) - 30

        if ttl_seconds > 0:
            r.set("giga_token", token, ex=ttl_seconds)

        return token
    def get_balance(self) -> str:
        with GigaChat(
                base_url="https://api.giga.chat/v1",
                credentials=self.credentials,
                scope="GIGACHAT_API_PERS",
                verify_ssl_certs=False,
        ) as client:
            balance = client.get_balance()
            for entry in balance.balance:
                print(f"{entry.usage}: {entry.value}")
    def chat(self, messages: list[dict], functions: list[dict] | None = None) -> dict:
        token = self.get_cached_giga_token()
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
        }
        if functions:
            payload["functions"] = functions

        resp = requests.post(
            'https://api.giga.chat/v1/chat/completions',
            json=payload,
            headers=headers,
            timeout=self.timeout,
            verify=False,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]