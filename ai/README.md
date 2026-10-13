# AI — Loan Copilot engine & model

The conversational agent, its multi-agent rule engine, and the optional LLM layer. **This is real, working code** (contributed by the team's System Architect & Security track), not a scaffold.

## What's here

| File | Purpose |
|------|---------|
| `copilot_engine.py` | The full engine — all agents, ZKP, orchestrator, PIPL kill switch |
| `data/sample_data_xingfu_coffee.csv` | Demo scenario 1 (APPROVED) |
| `data/sample_data_lianhua_mart.csv` | Demo scenario 2 (ADJUSTMENT_REQUIRED) |
| `frontend_integration_guide.md` | Full `result` dict field reference for the UI |
| `demo_scenarios_guide.md` | Scripts for the 5-minute demo video |
| `README_HuggingFace.md` | Qwen2.5 LoRA adapter card (model details) |
| `agent/`, `modules/` | Thin re-export modules pointing at the engine classes |

## Quick start

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
```

## Optional LLM explanations

`orchestrator_v2.process_application_session_v2(..., explain_mode=True, language="id"|"en")` adds a
natural-language explanation from the Qwen2.5-1.5B LoRA adapter
(`Bintangdanis/qwen2.5-weiyedai-copilot-adapter`, QLoRA 4-bit NF4). Needs ~2.5GB VRAM GPU; install
`transformers peft bitsandbytes accelerate`. If the model can't load, `result["llm_available"]` is
`False` and the rule-engine result is still complete. See `README_HuggingFace.md`.

## Notes

- Keep all financial math in the engine — never let the LLM invent numbers.
- The ZKP gate is a real cryptographic implementation (HMAC-SHA256), not a mock.
- The WeBank submission is simulated — no real banking endpoint is ever called.
- `agent/` and `modules/` are convenience re-exports of the engine's classes so other code can import
  by concern (e.g. `from modules.zkp import ZKPPrivacyGate`).
