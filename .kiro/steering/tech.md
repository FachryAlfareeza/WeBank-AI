# Technical Steering — Loan Copilot

> Companion to `product.md`. Reflects the team's real implementation in `D:\Lomba\WeBank\context\Lomba Fintech\`.

## Current working scope — OPEN (frontend + backend + AI)

All three tracks are active. The backend engine and the AI model already exist; new work integrates them.

- **Engine of record:** `copilot_engine.py` is the single backend module. Import and call it; do not reimplement its logic.
  ```python
  from copilot_engine import orchestrator
  result = orchestrator.process_application_session(
      merchant_id, merchant_name, user_input_text, df_transactions, auto_confirm=True
  )
  ```
- **LLM layer (optional):** `orchestrator_v2.process_application_session_v2(..., explain_mode=True, language="id"|"en")` adds a natural-language explanation from the Qwen2.5 LoRA adapter. Needs ~2.5GB VRAM GPU. If unavailable, `result["llm_available"]` is `False` and the rule engine result is still complete.
- **Frontend:** React + Vite + TS in `frontend/`. Replace the local mock engine with real engine output — directly (if hosting a Python runtime) or via the backend HTTP API.

## Engine architecture (as built)

Multi-agent pipeline inside `copilot_engine.py`:

1. **SecurityGuardrailLayer** — prompt-injection detection + PII masking (China ID / bank card / phone). Blocked input → `REJECTED_SECURITY_VIOLATION` and immediate purge.
2. **DocumentVoiceIngestionAgent (Agent 1)** — parses amount/tenor/purpose from free text; builds a `FinancialProfile` from the transactions DataFrame. Also has `generate_synthetic_wechat_efapiao(...)` for synthetic data.
3. **WeiyedaiRiskEngine (Agent 2)** — DSCR, CV-based risk tier, credit ceiling, flat & effective pricing, and over-leveraged adjustment recommendations.
4. **ZKPPrivacyGate** — real HMAC-SHA256 commitment + signature over eligibility facts; `verify_proof` confirms validity. No raw revenue is exposed.
5. **LoanDraftingAdvisoryAgent (Agent 3)** — amortization schedule, cash-flow strain early-warning, and the WeBank API payload.
6. **EventDrivenCopilotOrchestrator + EphemeralSessionMemory** — runs the session end-to-end and purges memory (PIPL kill switch), returning a receipt.

## Key financial rules (from the engine — do not diverge)

- **DSCR** = `avg_monthly_net_cash_flow / monthly_installment_effective`. Safe threshold **1.25**.
- **Risk tier** by coefficient of variation (CV) of monthly net cash flow: CV<0.15 Tier A, <0.30 Tier B, else Tier C.
- **Pricing:** base annual rate **7.2%**; +2.4% for Tier B, +5.2% for Tier C.
- **Credit ceiling** = `avg_net_cash_flow * 3.2 * (1 - min(CV*0.5, 0.4))`, clamped to [10,000, 300,000] RMB.
- **Effective (annuity) installment** and **flat installment** both computed; the amortization schedule uses the effective rate.
- All financial math lives in the engine so numbers are auditable and never inferred by the LLM.

## Data contract — transactions CSV

The ingestion agent expects these columns (see `sample_data_xingfu_coffee.csv`, `sample_data_lianhua_mart.csv`):

```
month, merchant_id, merchant_name,
gross_revenue_rmb, total_expenses_rmb,
supplier_invoices_efapiao_rmb, net_cash_flow_rmb
```

Read with `pd.read_csv(uploaded_file)` and pass as `df_transactions`.

## Result contract (keys the UI consumes)

`result` is a dict. Full field list is in `frontend_integration_guide.md`. Highlights:

- `session_id`, `status` (`APPROVED` | `ADJUSTMENT_REQUIRED` | `REJECTED_SECURITY_VIOLATION`)
- `evaluation` — DSCR, credit_ceiling, approved_amount, tenor, rates, both installments, CV, risk_tier; plus `recommended_adjustment` (Option A `safe_reduced_amount` / Option B `safe_extended_tenor`, `extended_tenor_dscr`, `extended_tenor_installment`) when ADJUSTMENT_REQUIRED.
- `profile` — merchant financials (revenue, expense, net cash flow, supplier invoice total).
- `zkp_proof` + `zkp_verification_passed` — pseudonym, commitment hash, signature, timestamp.
- `strain_analysis` — strain_ratio_pct, safety_level (AMAN/MODERAT/WASPADA), advisory_message, recommended_allocation.
- `amortization_schedule` — pandas DataFrame (columns: Bulan, Angsuran_Total_RMB, Cicilan_Pokok_RMB, Bunga_Bulanan_RMB, Sisa_Pokok_RMB); only when APPROVED.
- `webank_api_payload` — simulated WeBank JSON; only when APPROVED and auto_confirm.
- `guardrail_report` — present when BLOCKED.
- `kill_switch_receipt` — PIPL purge confirmation (always).

Frontend TS types in `frontend/src/types/index.ts` must mirror these keys. Where the engine uses Indonesian column labels in the amortization DataFrame, keep them as-is on the data side and localize in the view layer.

## AI model

- Base: `Qwen/Qwen2.5-1.5B-Instruct`; adapter: `Bintangdanis/qwen2.5-weiyedai-copilot-adapter` (QLoRA 4-bit NF4, LoRA rank=16/alpha=32).
- Trained for: financial-entity extraction → JSON, CBIRC-compliant framing, prompt-injection refusal, over-leveraged Option A/B advisory, draft-confirm + PIPL kill switch.
- Install: `transformers peft bitsandbytes accelerate`. Loaded with a `BitsAndBytesConfig` (4-bit, nf4, fp16 compute) + `PeftModel`.
- Optional in the pipeline — the system is fully functional on the rule engine alone.

## Candidate frontend stack

- **This workspace:** React + Vite + TypeScript (already scaffolded in `frontend/`).
- The team's integration guide also suggests Streamlit/Gradio for the fastest demo path since the engine is Python. Either is viable; keep the engine as the source of truth regardless of UI framework.

## Non-functional guardrails

- Do not persist sensitive financial data on public servers.
- The WeBank submission is simulated — never wire up a real banking endpoint.
- All regulatory framing (no financial advice, PII masking, injection defense, memory wipe on completion) is an acceptance criterion enforced in both code and copy.
- Do not reimplement or weaken the engine's DSCR/ceiling/pricing logic in the frontend; display what the engine returns.
