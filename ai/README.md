# AI — Loan Copilot engine & model

The conversational agent, its multi-agent rule engine, and the optional LLM layer. **This is real, working code** (contributed by the team's System Architect & Security track), not a scaffold.

## What's here

| File | Purpose |
|------|---------|
| `copilot_engine.py` | The full engine — all agents, ZKP, orchestrator, PIPL kill switch, LLM bridge |
| `data/sample_data_xingfu_coffee.csv` | Demo scenario 1 (APPROVED) |
| `data/sample_data_lianhua_mart.csv` | Demo scenario 2 (ADJUSTMENT_REQUIRED) |
| `frontend_integration_guide.md` | Full `result` dict field reference for the UI |
| `demo_scenarios_guide.md` | Scripts for the 5-minute demo video |
| `README_HuggingFace.md` | Qwen2.5 LoRA adapter card (model details) |
| `run.ps1` | Helper that activates the venv, sets UTF-8, and runs a script |
| `agent/`, `modules/` | Thin re-export modules pointing at the engine classes |

## Setup (Windows + PowerShell)

### 1. Create and activate the virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # NOT the plain `activate` file (that's for bash)
```

> If activation is blocked by execution policy, run once:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### 2. Install the rule engine (no GPU needed)

```powershell
pip install pandas==2.2.3 numpy==2.1.3
```

That's enough to run everything except the optional LLM explanation layer.

### 3. (Optional) Install the GPU LLM layer

Order matters — install the **CUDA** torch build first, or it falls back to CPU-only:

```powershell
# a) CUDA torch (this example targets CUDA 12.4; verified on an RTX 4060 Laptop, 8GB VRAM)
pip install torch --index-url https://download.pytorch.org/whl/cu124

# b) everything else
pip install -r requirements.txt
```

Verify the GPU is visible:

```powershell
python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"
# -> True NVIDIA GeForce RTX 4060 Laptop GPU
```

#### Why the pinned versions matter
- **torch from the cu124 index** — plain `pip install torch` is CPU-only and never touches the GPU.
- **`peft>=0.17`** — the adapter config uses `alora_invocation_tokens`; older peft (0.13) rejects it.
- **`bitsandbytes==0.45.0`** — 0.44.x has no Windows wheel.
- **`protobuf` + `sentencepiece`** — required by the Qwen tokenizer.

## Running

### Rule engine (fast, no GPU)

```powershell
python copilot_engine.py          # built-in self-test
```

```python
import pandas as pd
from copilot_engine import orchestrator

df = pd.read_csv("data/sample_data_xingfu_coffee.csv")
result = orchestrator.process_application_session(
    merchant_id="MERCH_SH_88921",
    merchant_name="Xingfu Coffee Shop",
    user_input_text="I need 50,000 RMB to restock coffee beans, 6-month tenor.",
    df_transactions=df,
    auto_confirm=True,
)
print(result["status"])  # APPROVED | ADJUSTMENT_REQUIRED | REJECTED_SECURITY_VIOLATION
```

### LLM path (GPU)

```python
from copilot_engine import orchestrator_v2

result = orchestrator_v2.process_application_session_v2(
    merchant_id="MERCH_SH_88921",
    merchant_name="Xingfu Coffee Shop",
    user_input_text="I need 50,000 RMB to restock coffee beans, 6-month tenor.",
    df_transactions=df,
    auto_confirm=True,
    explain_mode=True,
    language="en",     # or "id"
)
print(result["llm_available"])    # True once the model is loaded
print(result["llm_explanation"])  # natural-language explanation from Qwen2.5
```

The Qwen2.5-1.5B base model (~3GB) + LoRA adapter download from Hugging Face on first run and
are cached under `~/.cache/huggingface`.

> **Windows console note:** the explanation text contains emoji/Chinese characters. Windows'
> default cp1252 console encoding crashes on them (`UnicodeEncodeError`). Set UTF-8 before running:
> ```powershell
> $env:PYTHONUTF8 = "1"
> ```
> `run.ps1` does this for you.

### Using the run helper

```powershell
.\run.ps1 copilot_engine.py        # activates venv + sets UTF-8 + runs the script
.\run.ps1 my_script.py
```

## Pipeline (inside `copilot_engine.py`)

```
User input (voice/text)
        │
        ▼
  SecurityGuardrailLayer       ← anti prompt-injection + PII masking (PIPL/DSL)
        │
        ▼
  DocumentVoiceIngestionAgent  ← Bill Analysis: parse intent + read transactions
        │
        ▼
  WeiyedaiRiskEngine           ← DSCR (≥1.25), CV risk tier, credit ceiling, pricing
        │
        ▼
  ZKPPrivacyGate               ← REAL HMAC-SHA256 commitment + signature
        │
        ▼
  LoanDraftingAdvisoryAgent    ← amortization, strain early-warning, WeBank payload
        │
        ▼
  EphemeralSessionMemory.purge ← PIPL event-kill switch (returns receipt)

  (orchestrator_v2 adds a Qwen2.5 LLM explanation AFTER the rule engine —
   it never overrides the deterministic DSCR / pricing math.)
```

## Notes

- Keep all financial math in the engine — never let the LLM invent numbers.
- The ZKP gate is a real cryptographic implementation (HMAC-SHA256), not a mock.
- The WeBank submission is simulated — no real banking endpoint is ever called.
- The tokenizer is loaded from the base model (`Qwen/Qwen2.5-1.5B-Instruct`), not the adapter repo:
  the adapter's `tokenizer_config.json` stores `extra_special_tokens` as a list, which current
  `transformers` rejects. The base tokenizer is equivalent and loads cleanly. (This is a small patch
  in `copilot_engine.py` — flag it to the engine authors so it lands upstream too.)
- `agent/` and `modules/` are convenience re-exports of the engine's classes so other code can import
  by concern (e.g. `from modules.zkp import ZKPPrivacyGate`).
