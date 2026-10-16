# Quick Start — run the Loan Copilot with zero manual config

This guide gets the whole product running without editing files, setting
`PYTHONPATH`, or `cd`-ing between folders. Four PowerShell scripts at the repo
root do the plumbing for you. Each one is **directory-independent** — it finds
its own location, so you can run it from anywhere.

| Script | What it does |
|--------|--------------|
| `setup.ps1` | One-shot install: both Python venvs, wires the engine into the backend, creates all `.env` files, installs frontend packages |
| `demo.ps1` | Runs the engine end-to-end on the sample data — no servers, no browser |
| `start-backend.ps1` | Starts the FastAPI backend (uvicorn) |
| `start-frontend.ps1` | Starts the React/Vite UI (mock engine by default, `-Live` for the real backend) |

## Prerequisites

- **Python 3.10+** on your PATH (`python` or `py`)
- **Node.js 18+** (only needed for the web UI)
- Windows + PowerShell (these are `.ps1` scripts)

> If scripts are blocked by execution policy, either run each with
> `powershell -ExecutionPolicy Bypass -File .\<script>.ps1`, or allow them once
> for your user: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## 1. Install everything (once)

From the repo root (`coding/`):

```powershell
.\setup.ps1
```

This is idempotent — safe to re-run any time. It:

1. Creates `ai/.venv` and installs the rule-engine dependencies.
2. Creates `backend/.venv` and installs the API dependencies.
3. Drops a `.pth` file into the backend venv so `import copilot_engine` works
   with **no `PYTHONPATH` setup**, then verifies the import.
4. Copies every `*.env.example` to its real `.env` (only if missing).
5. Runs `npm install` in `frontend/`.

It does **not** install the optional GPU LLM layer (torch/transformers) — the
product runs fully on the deterministic rule engine without it. See
`ai/README.md` to add the LLM layer and `ai/.env` to point it at a GPU or a
remote endpoint.

## 2. See it work in 10 seconds (no servers)

```powershell
.\demo.ps1
```

Runs both demo merchants through the full pipeline and prints the result:

```
Merchant : Xingfu Coffee Shop
Status   : APPROVED
DSCR     : 3.86  (safe threshold >= 1.25)
...
Merchant : Lianhua Mini Mart
Status   : ADJUSTMENT_REQUIRED
DSCR     : 0.64  (safe threshold >= 1.25)
Option A : reduce to RMB 40,000
Option B : extend to 12 months (DSCR 1.26)
```

Add natural-language explanations from the LLM (needs the GPU layer installed
and `ai/.env` configured):

```powershell
.\demo.ps1 -Explain            # English
.\demo.ps1 -Explain -Language id   # Bahasa Indonesia
```

## 3. Run the full stack (backend + web UI)

You only need the backend if you want the UI to call the real engine. The UI
also ships a faithful in-browser mock, so you can skip straight to a mock-only
run if you just want to see the interface.

### Option A — real engine (two terminals)

**Terminal 1 — backend:**

```powershell
.\start-backend.ps1
```

Serves on `http://localhost:8000` (`/health` for a liveness check,
`POST /api/session` for the engine). Flags: `-Port 9000`, `-NoReload`.

**Terminal 2 — frontend wired to the backend:**

```powershell
.\start-frontend.ps1 -Live
```

`-Live` writes `frontend/.env.local` for you (`VITE_USE_MOCKS=false` +
`VITE_API_BASE_URL`), so there is nothing to edit. Then open the URL Vite
prints (usually `http://localhost:5173`). Point at a non-default backend with
`-ApiBaseUrl http://localhost:9000`.

### Option B — UI only, in-browser mock (one terminal)

```powershell
.\start-frontend.ps1
```

No backend, no Python needed — the UI uses its local mock engine.

## Choosing where the LLM runs (optional)

The optional explanation model is configured entirely through `ai/.env` — no
code edits. `setup.ps1` already created it from the template. Common setups:

```ini
# Local GPU, pinned to the first card (the default verified RTX 4060 setup)
WEIYEDAI_LLM_BACKEND=local
WEIYEDAI_LLM_DEVICE=cuda:0

# No GPU — run on CPU
WEIYEDAI_LLM_DEVICE=cpu

# Use a remote GPU box (vLLM / Ollama / LM Studio / cloud)
WEIYEDAI_LLM_BACKEND=remote
WEIYEDAI_LLM_REMOTE_BASE_URL=http://192.168.1.50:8000/v1
```

Full reference: `ai/.env.example` and `ai/README.md`. Check the resolved config
without loading a model:

```powershell
.\ai\.venv\Scripts\python.exe .\ai\llm_config.py
```

## Troubleshooting

- **`... venv not found. Run .\setup.ps1 first.`** — run `.\setup.ps1`.
- **`Python not found` / `npm not found`** — install Python 3.10+ / Node 18+
  and make sure they are on PATH, then re-run setup.
- **UI shows "Local mock engine" but you wanted the real one** — start it with
  `-Live`, and make sure the backend is running.
- **Engine math unchanged but no LLM text** — the GPU LLM layer is optional and
  not installed by `setup.ps1`; see `ai/README.md`.

All generated files (`*/.venv`, `*/.env`, `frontend/.env.local`,
`frontend/node_modules`) are git-ignored, so your local setup never gets
committed.
