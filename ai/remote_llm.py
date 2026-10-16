# -*- coding: utf-8 -*-
"""
================================================================================
Weiyedai Remote LLM Client (OpenAI-compatible)
================================================================================
Lets the LLM explanation layer run on a REMOTE GPU instead of the local machine
— without changing any engine code. Point WEIYEDAI_LLM_REMOTE_BASE_URL at any
server that speaks the OpenAI `/v1/chat/completions` schema:

    - vLLM            (`python -m vllm.entrypoints.openai.api_server ...`)
    - Text Generation Inference (TGI) with the OpenAI-compatible route
    - Ollama          (`http://host:11434/v1`)
    - LM Studio       (`http://host:1234/v1`)
    - Groq / Together / OpenRouter / OpenAI itself

Uses `requests` if installed, otherwise falls back to the Python stdlib
(`urllib`) so no extra dependency is strictly required.
================================================================================
"""

from __future__ import annotations

import json
from typing import Dict, List, Optional


class RemoteLLMError(RuntimeError):
    """Raised when the remote inference endpoint cannot be reached or errors."""


class RemoteLLMClient:
    """Thin client for an OpenAI-compatible chat completions endpoint."""

    def __init__(self,
                 base_url: str,
                 model: str,
                 api_key: str = "",
                 timeout_s: int = 60):
        if not base_url:
            raise ValueError("RemoteLLMClient requires a base_url.")
        # Normalise: strip a trailing slash; the caller provides .../v1
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.api_key = api_key
        self.timeout_s = timeout_s

    @property
    def _endpoint(self) -> str:
        return f"{self.base_url}/chat/completions"

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def chat(self,
             messages: List[Dict[str, str]],
             max_new_tokens: int = 300,
             temperature: float = 0.3,
             top_p: float = 0.9) -> str:
        """Send a chat request and return the assistant message content."""
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_new_tokens,
            "temperature": temperature,
            "top_p": top_p,
            "stream": False,
        }
        body = self._post_json(payload)

        try:
            return body["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, TypeError) as exc:
            raise RemoteLLMError(
                f"Unexpected response shape from {self._endpoint}: {body!r}"
            ) from exc

    # ------------------------------------------------------------------ transport
    def _post_json(self, payload: Dict) -> Dict:
        data = json.dumps(payload).encode("utf-8")

        # Prefer requests if available (nicer errors / proxy handling).
        try:
            import requests  # type: ignore

            resp = requests.post(
                self._endpoint,
                headers=self._headers(),
                data=data,
                timeout=self.timeout_s,
            )
            if resp.status_code >= 400:
                raise RemoteLLMError(
                    f"Remote LLM HTTP {resp.status_code}: {resp.text[:500]}"
                )
            return resp.json()
        except ImportError:
            pass  # fall through to urllib

        # Stdlib fallback — no third-party dependency needed.
        import urllib.error
        import urllib.request

        req = urllib.request.Request(
            self._endpoint, data=data, headers=self._headers(), method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_s) as resp:
                raw = resp.read().decode("utf-8")
            return json.loads(raw)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:500]
            raise RemoteLLMError(
                f"Remote LLM HTTP {exc.code}: {detail}"
            ) from exc
        except urllib.error.URLError as exc:
            raise RemoteLLMError(
                f"Could not reach remote LLM at {self._endpoint}: {exc.reason}"
            ) from exc

    def health_check(self) -> bool:
        """Best-effort reachability probe (lists models). Never raises."""
        models_url = f"{self.base_url}/models"
        try:
            import requests  # type: ignore

            resp = requests.get(models_url, headers=self._headers(),
                                timeout=self.timeout_s)
            return resp.status_code < 400
        except ImportError:
            pass
        except Exception:
            return False

        import urllib.request

        try:
            req = urllib.request.Request(models_url, headers=self._headers())
            with urllib.request.urlopen(req, timeout=self.timeout_s) as resp:
                return resp.status < 400
        except Exception:
            return False
