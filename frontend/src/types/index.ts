// Shared domain types for the Loan Copilot frontend.
// These mirror the real engine's `result` dict (see ai/copilot_engine.py and
// ai/frontend_integration_guide.md) so the UI consumes engine output directly.

export type Role = "user" | "assistant" | "system";

export type SessionStatus =
  | "APPROVED"
  | "ADJUSTMENT_REQUIRED"
  | "REJECTED_SECURITY_VIOLATION";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  attachment?: MessageAttachment;
  createdAt: string; // ISO timestamp
}

export type MessageAttachment =
  | { kind: "cashflow"; data: FinancialProfile }
  | { kind: "evaluation"; data: LoanEvaluation }
  | { kind: "proof"; data: ZkpProof; verified: boolean }
  | { kind: "strain"; data: StrainAnalysis }
  | { kind: "amortization"; data: AmortizationRow[] }
  | { kind: "payload"; data: Record<string, unknown> }
  | { kind: "killswitch"; data: KillSwitchReceipt }
  | { kind: "guardrail"; data: GuardrailReport };

/** result.profile */
export interface FinancialProfile {
  merchant_name: string;
  requested_amount: number;
  requested_tenor_months: number;
  stated_purpose: string;
  avg_monthly_revenue: number;
  avg_monthly_expense: number;
  avg_monthly_net_cash_flow: number;
  supplier_invoice_total: number;
}

/** result.evaluation */
export interface LoanEvaluation {
  is_approved: boolean;
  dscr: number;
  credit_ceiling: number;
  approved_amount: number;
  tenor_months: number;
  annual_interest_rate_effective: number;
  monthly_interest_rate_flat: number;
  monthly_installment_flat: number;
  monthly_installment_effective: number;
  total_interest_flat: number;
  total_interest_effective: number;
  cashflow_volatility_cv: number;
  risk_tier: string;
  rejection_or_adjustment_reason?: string | null;
  recommended_adjustment?: RecommendedAdjustment | null;
}

export interface RecommendedAdjustment {
  safe_reduced_amount: number; // Option A
  safe_extended_tenor: number; // Option B (months)
  extended_tenor_dscr: number;
  extended_tenor_installment: number;
}

/** result.zkp_proof (+ result.zkp_verification_passed) */
export interface ZkpProof {
  merchant_pseudonym: string;
  commitment_hash: string;
  dscr_threshold_proven: number;
  is_dscr_satisfied: boolean;
  is_ceiling_satisfied: boolean;
  proof_timestamp: string;
  zkp_signature: string;
  public_salt_hint: string;
}

/** result.strain_analysis */
export interface StrainAnalysis {
  strain_ratio_pct: number;
  safety_level: string; // "AMAN (Healthy)" | "MODERAT (Prudent)" | "WASPADA (High Burden)"
  advisory_message: string;
  recommended_allocation: Record<string, string>;
}

/** rows of result.amortization_schedule (engine uses Indonesian labels) */
export interface AmortizationRow {
  Bulan: number;
  Angsuran_Total_RMB: number;
  Cicilan_Pokok_RMB: number;
  Bunga_Bulanan_RMB: number;
  Sisa_Pokok_RMB: number;
}

/** result.kill_switch_receipt */
export interface KillSwitchReceipt {
  session_id: string;
  status: string; // "PURGED_AND_DESTROYED"
  logs_wiped: number;
  cache_entries_wiped: number;
  timestamp: string;
  pipl_compliance: string;
}

/** result.guardrail_report (present when BLOCKED) */
export interface GuardrailReport {
  status: string; // "BLOCKED"
  clean_text: string;
  warning: string | null;
  pii_masked: Record<string, number>;
}

/** The full engine result dict returned by orchestrator.process_application_session. */
export interface SessionResult {
  session_id: string;
  status: SessionStatus;
  profile?: FinancialProfile;
  evaluation?: LoanEvaluation;
  zkp_proof?: ZkpProof;
  zkp_verification_passed?: boolean;
  strain_analysis?: StrainAnalysis;
  amortization_schedule?: AmortizationRow[] | null;
  webank_api_payload?: Record<string, unknown> | null;
  guardrail_report?: GuardrailReport;
  kill_switch_receipt: KillSwitchReceipt;
  /** Natural-language explanation from the Qwen2.5 LLM layer (orchestrator_v2). */
  llm_explanation?: string | null;
  /** Whether the LLM explanation layer was available and ran. */
  llm_available?: boolean;
}

/** Request body for POST /api/session. */
export interface SessionRequest {
  merchant_id: string;
  merchant_name: string;
  user_input_text: string;
  csv_text: string;
  auto_confirm: boolean;
  /** Ask the backend to include an LLM explanation of the decision. */
  explain?: boolean;
  /** Explanation language: "en" or "id". */
  language?: string;
}
