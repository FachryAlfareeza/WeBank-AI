# Event-Driven Loan Copilot for Chinese MSMEs

A conversational (voice/text) banking AI agent that acts as an automated loan copilot for micro and small enterprises, replicating WeBank's Weiyedai (微业贷). Built for FinTechathon 2026 (AI track).

See `.kiro/steering/product.md` and `.kiro/steering/tech.md` for the full product and technical specification.

## Scope — open

Work is active across **frontend, backend, and AI**. The team's backend engine and fine-tuned LLM already exist (in the shared `context/Lomba Fintech/` drop); this repo integrates them rather than building against throwaway mocks.

## Monorepo layout

```
coding/
├── frontend/   # React + Vite + TypeScript — chat UI, DSCR gauge, amortization, ZKP badge, payload view
├── backend/    # Python + FastAPI — HTTP wrapper around copilot_engine.py
├── ai/         # Python — copilot_engine.py + Qwen2.5 LoRA adapter integration
└── .kiro/      # Kiro steering docs
```

## The engine (source of truth)

`copilot_engine.py` is a complete multi-agent rule engine. Import and call it — don't reimplement its logic:

```python
import pandas as pd
from copilot_engine import orchestrator

df = pd.read_csv("sample_data_xingfu_coffee.csv")
result = orchestrator.process_application_session(
    merchant_id="MERCH_SH_88921",
    merchant_name="Xingfu Coffee Shop",
    user_input_text="I need 50,000 RMB to restock coffee beans, 6-month tenor.",
    df_transactions=df,
    auto_confirm=True,
)
print(result["status"])  # APPROVED | ADJUSTMENT_REQUIRED | REJECTED_SECURITY_VIOLATION
```

Pipeline: Security Guardrail (anti-injection + PII masking) → Ingestion (Bill Analysis) → Risk Engine (DSCR, credit ceiling, pricing) → ZKP Privacy Gate (real HMAC-SHA256) → Drafting/Advisory (amortization, strain, WeBank payload) → PIPL event-kill switch.

### Three demo outcomes
- **APPROVED** — Xingfu Coffee Shop, 50k RMB / 6 mo → DSCR ≈ 3.86.
- **ADJUSTMENT_REQUIRED** — Lianhua Mini Mart, 120k RMB / 6 mo → DSCR ≈ 0.64, offers Option A (reduce amount) / Option B (extend tenor).
- **REJECTED_SECURITY_VIOLATION** — prompt-injection attempt blocked and session purged.

### Optional LLM explanations
`orchestrator_v2.process_application_session_v2(..., explain_mode=True, language="id"|"en")` adds a natural-language explanation from the Qwen2.5-1.5B LoRA adapter (`Bintangdanis/qwen2.5-weiyedai-copilot-adapter`). Needs a GPU (~2.5GB VRAM); the rule engine works fully without it.

## Transactions CSV format

```
month, merchant_id, merchant_name, gross_revenue_rmb, total_expenses_rmb, supplier_invoices_efapiao_rmb, net_cash_flow_rmb
```

Sample files: `sample_data_xingfu_coffee.csv` (approved), `sample_data_lianhua_mart.csv` (adjustment).

## Getting started

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Set `VITE_USE_MOCKS=false` and `VITE_API_BASE_URL` once the backend is running to use the real engine.

### Backend
```bash
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Place/import `copilot_engine.py` (from the AI package) so the API can call `orchestrator`.

### AI
```bash
cd ai
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt   # add transformers/peft/bitsandbytes/accelerate for the LLM layer
```

## Team

| Member | Role |
|--------|------|
| Nabila | Accounting & finance formulas (DSCR, flat vs effective interest, CBIRC framing) |
| Fares & Stella | Frontend & UI/UX demo |
| Syauqi & Danis | System architect, security, ZKP, AI/ML pipeline |
