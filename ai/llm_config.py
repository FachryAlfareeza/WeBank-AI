# -*- coding: utf-8 -*-
"""
================================================================================
Weiyedai LLM Runtime Configuration
================================================================================
Centralises EVERY hardware / backend decision for the optional Qwen2.5 LLM
layer so that end users can tune it for their own machine WITHOUT editing any
Python code. All settings are read from environment variables (optionally via a
`.env` file placed next to this module or in the current working directory).

Two things are configurable:

1. LOCAL CUDA / device setup  (backend = "local")
   - which device to use (auto / cuda / cuda:1 / cpu)
   - whether to use 4-bit QLoRA quantization
   - compute dtype (float16 / bfloat16 / float32)
   - which CUDA device index CUDA should expose

2. REMOTE GPU inference        (backend = "remote")
   - point the engine at any OpenAI-compatible chat endpoint (vLLM, TGI,
     Ollama, LM Studio, Together, Groq, a friend's GPU box, etc.)
   - the model is NEVER loaded locally; requests go over HTTP instead.

Nothing here changes the deterministic rule-engine math — it only governs how
the natural-language explanation layer runs.

Quick start:
    cp .env.example .env     # then edit .env for your machine
    # or just export the WEIYEDAI_LLM_* variables in your shell
================================================================================
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Optional


# ----------------------------------------------------------------------------
# Minimal .env loader (no external dependency required).
# Loads KEY=VALUE lines from a .env file into os.environ WITHOUT overriding
# variables that are already set in the real environment.
# ----------------------------------------------------------------------------
def _load_dotenv(explicit_path: Optional[str] = None) -> Optional[str]:
    candidates = []
    if explicit_path:
        candidates.append(Path(explicit_path))
    # .env sitting next to this file (ai/.env) and one in the CWD.
    candidates.append(Path(__file__).resolve().parent / ".env")
    candidates.append(Path.cwd() / ".env")

    for path in candidates:
        try:
            if not path.is_file():
                continue
        except OSError:
            continue
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value
        return str(path)
    return None


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    return raw.strip().lower() in {"1", "true", "yes", "y", "on"}


def _env_int(name: str, default: Optional[int]) -> Optional[int]:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return int(raw.strip())
    except ValueError:
        return default


@dataclass
class LLMRuntimeConfig:
    """Resolved runtime configuration for the LLM explanation layer."""

    # "local"  -> load the model on this machine (CUDA or CPU)
    # "remote" -> call an OpenAI-compatible endpoint, nothing loaded locally
    backend: str = "local"

    # --- Local backend settings ---------------------------------------------
    # device: "auto" | "cuda" | "cuda:0" | "cuda:1" | "cpu"
    device: str = "auto"
    # Use 4-bit QLoRA quantization (needs bitsandbytes + CUDA). Ignored on CPU.
    load_in_4bit: bool = True
    # Compute dtype: "float16" | "bfloat16" | "float32"
    torch_dtype: str = "float16"
    # Value for CUDA_VISIBLE_DEVICES (e.g. "0", "1", "0,1"). Empty = leave as-is.
    cuda_visible_devices: str = ""

    # --- Remote backend settings --------------------------------------------
    remote_base_url: str = ""          # e.g. http://192.168.1.50:8000/v1
    remote_api_key: str = ""           # bearer token if the endpoint needs one
    remote_model: str = "Qwen/Qwen2.5-1.5B-Instruct"
    remote_timeout_s: int = 60

    # --- Model identity (shared) --------------------------------------------
    base_model_id: str = "Qwen/Qwen2.5-1.5B-Instruct"
    adapter_repo_id: str = "Bintangdanis/qwen2.5-weiyedai-copilot-adapter"

    # Where the .env was loaded from (for diagnostics), if any.
    dotenv_path: Optional[str] = field(default=None)

    # ------------------------------------------------------------------ helpers
    @property
    def is_remote(self) -> bool:
        return self.backend == "remote"

    @property
    def cpu_only(self) -> bool:
        """True when the local backend should avoid CUDA entirely."""
        return (not self.is_remote) and self.device.lower() == "cpu"

    def device_map(self):
        """
        The `device_map` argument for transformers/accelerate.

        - "auto"      -> let accelerate place layers (default local-GPU behavior)
        - "cpu"       -> everything on CPU
        - "cuda[:N]"  -> pin to a specific device
        """
        dev = self.device.lower()
        if dev == "auto":
            return "auto"
        if dev == "cpu":
            return {"": "cpu"}
        # explicit cuda / cuda:N
        return {"": dev}

    def validate(self) -> "LLMRuntimeConfig":
        valid_backends = {"local", "remote"}
        if self.backend not in valid_backends:
            raise ValueError(
                f"WEIYEDAI_LLM_BACKEND must be one of {sorted(valid_backends)}, "
                f"got '{self.backend}'."
            )
        if self.is_remote and not self.remote_base_url:
            raise ValueError(
                "Remote backend selected (WEIYEDAI_LLM_BACKEND=remote) but "
                "WEIYEDAI_LLM_REMOTE_BASE_URL is not set."
            )
        valid_dtypes = {"float16", "bfloat16", "float32"}
        if self.torch_dtype not in valid_dtypes:
            raise ValueError(
                f"WEIYEDAI_LLM_TORCH_DTYPE must be one of {sorted(valid_dtypes)}, "
                f"got '{self.torch_dtype}'."
            )
        return self

    def summary(self) -> str:
        if self.is_remote:
            return (f"backend=remote url={self.remote_base_url} "
                    f"model={self.remote_model}")
        return (f"backend=local device={self.device} "
                f"4bit={self.load_in_4bit} dtype={self.torch_dtype}")


def load_config(dotenv_path: Optional[str] = None) -> LLMRuntimeConfig:
    """
    Build an LLMRuntimeConfig from environment variables (and a .env file).

    Environment variables (all prefixed WEIYEDAI_LLM_):
        WEIYEDAI_LLM_BACKEND            local | remote          (default: local)

      Local backend:
        WEIYEDAI_LLM_DEVICE            auto | cuda | cuda:N | cpu (default: auto)
        WEIYEDAI_LLM_LOAD_IN_4BIT     true | false              (default: true)
        WEIYEDAI_LLM_TORCH_DTYPE      float16|bfloat16|float32  (default: float16)
        WEIYEDAI_LLM_CUDA_VISIBLE_DEVICES  e.g. "0" or "0,1"    (default: unset)

      Remote backend (OpenAI-compatible chat/completions endpoint):
        WEIYEDAI_LLM_REMOTE_BASE_URL  e.g. http://host:8000/v1  (required)
        WEIYEDAI_LLM_REMOTE_API_KEY   bearer token              (optional)
        WEIYEDAI_LLM_REMOTE_MODEL     served model name
        WEIYEDAI_LLM_REMOTE_TIMEOUT   seconds                   (default: 60)

      Model identity (rarely changed):
        WEIYEDAI_LLM_BASE_MODEL_ID
        WEIYEDAI_LLM_ADAPTER_REPO_ID
    """
    loaded_from = _load_dotenv(dotenv_path)

    cfg = LLMRuntimeConfig(
        backend=_env("WEIYEDAI_LLM_BACKEND", "local").lower() or "local",
        device=_env("WEIYEDAI_LLM_DEVICE", "auto") or "auto",
        load_in_4bit=_env_bool("WEIYEDAI_LLM_LOAD_IN_4BIT", True),
        torch_dtype=_env("WEIYEDAI_LLM_TORCH_DTYPE", "float16").lower() or "float16",
        cuda_visible_devices=_env("WEIYEDAI_LLM_CUDA_VISIBLE_DEVICES", ""),
        remote_base_url=_env("WEIYEDAI_LLM_REMOTE_BASE_URL", ""),
        remote_api_key=_env("WEIYEDAI_LLM_REMOTE_API_KEY", ""),
        remote_model=_env("WEIYEDAI_LLM_REMOTE_MODEL", "Qwen/Qwen2.5-1.5B-Instruct")
        or "Qwen/Qwen2.5-1.5B-Instruct",
        remote_timeout_s=_env_int("WEIYEDAI_LLM_REMOTE_TIMEOUT", 60) or 60,
        base_model_id=_env("WEIYEDAI_LLM_BASE_MODEL_ID", "Qwen/Qwen2.5-1.5B-Instruct")
        or "Qwen/Qwen2.5-1.5B-Instruct",
        adapter_repo_id=_env(
            "WEIYEDAI_LLM_ADAPTER_REPO_ID",
            "Bintangdanis/qwen2.5-weiyedai-copilot-adapter",
        )
        or "Bintangdanis/qwen2.5-weiyedai-copilot-adapter",
        dotenv_path=loaded_from,
    )

    # Apply CUDA_VISIBLE_DEVICES before torch is ever imported so it takes
    # effect. Only set it when the user explicitly asked for it.
    if cfg.cuda_visible_devices:
        os.environ["CUDA_VISIBLE_DEVICES"] = cfg.cuda_visible_devices

    return cfg.validate()


def torch_dtype_obj(name: str):
    """Map a dtype name to a torch dtype (imported lazily)."""
    import torch

    return {
        "float16": torch.float16,
        "bfloat16": torch.bfloat16,
        "float32": torch.float32,
    }.get(name, torch.float16)


if __name__ == "__main__":
    c = load_config()
    print("Loaded LLM runtime config:")
    print("  .env source :", c.dotenv_path or "(none — using environment / defaults)")
    print("  summary     :", c.summary())
