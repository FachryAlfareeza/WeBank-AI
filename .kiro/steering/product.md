# Product Steering — Event-Driven Loan Copilot for Chinese MSMEs

> Sources of truth: `D:\Lomba\WeBank\context\Brainstorming WeBank.pdf`, the team's implementation in `D:\Lomba\WeBank\context\Lomba Fintech\` (notably `copilot_engine.py`, `frontend_integration_guide.md`, `demo_scenarios_guide.md`, `README_HuggingFace.md`), and the FinTechathon 2026 competition brief.
> This document guides all implementation work in this workspace. Keep it in sync with the engine and the technical paper.

## Elevator pitch

A conversational (voice/text) banking AI agent that acts as an **automated loan copilot** for micro and small enterprises (MSMEs) in China. It replicates the operating model of **Weiyedai (微业贷)** by WeBank: it runs in a single focused session to assess creditworthiness from daily cash flow (e-fapiao / WeChat Pay Merchant history), produces a safe simulation, and generates a draft loan application — without crossing financial-advisory or data-privacy regulatory lines.

This is the competition's **"AI Financial Participant"** theme. Of the offered directions (A–E new/expanded, F original Agent Wallet), this project targets the small-and-micro-business financing assistant: an agent that can "understand, plan, and execute safely."

## Project scope — OPEN

The project is now **open across all three tracks**: frontend, backend, and AI. The team's backend engine and fine-tuned LLM already exist (see below). Work in this workspace integrates the real engine rather than building against throwaway mocks.

- **Backend/AI engine:** `copilot_engine.py` — a complete multi-agent rule engine with real logic (DSCR scoring, credit ceiling, flat/effective pricing, amortization, HMAC-based ZKP, PII masking, prompt-injection guardrail, PIPL kill switch). Importable as a Python module (`from copilot_engine import orchestrator`).
- **LLM layer (optional):** a Qwen2.5-1.5B-Instruct QLoRA adapter (`Bintangdanis/qwen2.5-weiyedai-copilot-adapter`) for natural-language explanations via `orchestrator_v2`. Requires GPU; the system runs fully without it (rule engine only).
- **Frontend:** React + Vite + TS app in `frontend/`. It should present the engine's real outputs (DSCR gauge, amortization table, ZKP badge, strain early-warning, WeBank payload, PIPL notice).

## Competition context (FinTechathon 2026)

- Event: 2026 Shenzhen International FinTech Competition — Xilihu FinTech University Student Challenge.
- Track: AI (also offers a Data Analysis track).
- Theme: "AI Financial Participant" — build an agent that understands, plans, and executes safely.

## Mandatory core scenarios (must all be satisfied)

The project explicitly fulfills the three required AI-track scenarios, implemented by three agents in the engine:

1. **Bill Analysis (Agent 1 — Ingestion)** — Ingests expense/income data via voice/chat text and uploaded cash records (e-fapiao / WeChat Pay Merchant CSV), extracting a cash-flow profile.
2. **Wealth Operations / Risk Assessment (Agent 2 — Risk Engine)** — Computes DSCR, cash-flow volatility (CV) risk tier, credit ceiling, and flat/effective pricing. Does not store sensitive data.
3. **Cross-scenario Orchestration (Agent 3 — Drafting/Advisory)** — Projects installment strain, plans tenor, builds the amortization schedule, and generates the simulated WeBank API payload.

Any feature that does not advance one of these three scenarios is out of scope for the demo.

## Three demo outcomes (engine `status`)

The orchestrator returns one of three statuses — the UI must handle all three:

1. **`APPROVED`** — DSCR ≥ 1.25 and requested amount ≤ credit ceiling. Shows amortization schedule + WeBank payload.
   - Demo: Xingfu Coffee Shop, 50,000 RMB / 6 months → DSCR ≈ 3.86.
2. **`ADJUSTMENT_REQUIRED`** — Over-leveraged (DSCR < 1.25 or amount > ceiling). Never a flat "rejected"; the engine returns two options:
   - Option A: reduce principal to `safe_reduced_amount`.
   - Option B: extend tenor to `safe_extended_tenor` (raising DSCR back above 1.25).
   - Demo: Lianhua Mini Mart, 120,000 RMB / 6 months → DSCR ≈ 0.64.
3. **`REJECTED_SECURITY_VIOLATION`** — Prompt-injection detected by the guardrail. Request blocked, session memory purged, no instructions executed.
   - Demo: an "ignore all previous instructions / override credit ceiling" attack.

## Core user flow (three sessions)

### Session 1 — Multimodal input (voice & documents)
- **Voice NLP (speech-to-text):** the user dictates their financial need in natural language (e.g. "I need 50,000 RMB to restock inventory next month"). The engine parses amount, tenor, and purpose from free text.
- **Cash document extraction:** upload a WeChat Pay Merchant / e-fapiao CSV, read into a cash-flow profile (Bill Analysis).
- **PII masking happens here:** China ID, bank card, and phone numbers in the user's text are auto-masked before processing (PIPL/DSL).

### Session 2 — Risk scoring, simulation & ZKP (no financial advice)
- **DSCR & credit ceiling:** `DSCR = Avg Monthly Net Cash Flow / Monthly Installment`. Safe threshold is **1.25**. Credit ceiling derives from average net cash flow with a volatility penalty.
- **Dynamic simulation:** installment ratio / strain analysis plus flat vs effective pricing, surfaced in-conversation.
- **Zero-Knowledge Proof (ZKP) gate (REAL):** an HMAC-SHA256 commitment + signature proves the merchant meets WeBank's minimum criteria (DSCR ≥ 1.25 and amount ≤ ceiling) **without exposing raw revenue figures**. Verifiable via `verify_proof`. This is a real cryptographic implementation — not a mock.

### Session 3 — WeBank draft execution (complete)
- **Smart drafting:** confirm final amount and tenor; render the amortization schedule.
- **API payload generator:** produce a WeBank-shaped approval payload (simulated endpoint — never actually sent).
- **Event-kill switch:** on completion/approval, ephemeral session memory is purged (logs + cache wiped) to comply with PIPL; the engine returns a kill-switch receipt.

## Hard constraints & compliance

These are non-negotiable product rules — treat them as acceptance criteria:

- **Not a financial advisor.** Frame all outputs as a "cash-flow calculator/simulator," never "financial advice," to avoid CBIRC legal exposure. UI copy must reflect this.
- **Privacy-preserving by design (real ZKP).** The ZKP gate uses HMAC-SHA256 commitments/signatures to prove eligibility without leaking raw cash figures. Do not persist sensitive financial data on public servers. (Note: this reverses the earlier "mocked" plan — the engine ships a real implementation.)
- **PII masking.** Chinese ID numbers, bank cards, and phone numbers are auto-masked by the guardrail before any processing.
- **Prompt-injection defense.** The guardrail blocks override/bypass/jailbreak attempts and purges the session.
- **PIPL & DSL compliance.** Ephemeral sessions; all conversation data is purged after the session via the event-kill switch (required, not optional).
- **Simulated, not live.** The WeBank API submission is simulated — generate the payload; never call a real banking endpoint.
- **Single focused session.** The agent operates within one scoped session per loan assessment.

## Primary persona

Owner/operator of a Chinese micro or small enterprise who needs fast working-capital financing, interacts by voice and natural language rather than filling out rigid forms, and uploads merchant transaction history or e-fapiao as proof of cash flow.

## Experience principles

- Lead with a **smart chat interface** (voice-to-text first), not a static dashboard or stiff form.
- The **DSCR gauge** is the single most important demo component — show the number and a color band (≥2.0 very healthy, ≥1.25 safe/pass, ≥1.0 moderate, <1.0 high risk).
- Render the **amortization table dynamically inside the chat history** for transparency.
- Handle all three statuses distinctly: green APPROVED, amber ADJUSTMENT_REQUIRED (with Option A/B controls), red REJECTED_SECURITY_VIOLATION.
- Keep the end-to-end demo tight enough for a **5-minute demo video** across the three scripted scenarios.
