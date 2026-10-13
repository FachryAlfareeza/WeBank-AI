// Local mock of copilot_engine.py — reproduces the engine's logic and result
// shape so the frontend demo runs without a backend (VITE_USE_MOCKS=true).
// Kept intentionally faithful to ai/copilot_engine.py so UI behaviour matches
// the real backend. Swap for the real API via src/services/api.ts.

import type {
  AmortizationRow,
  FinancialProfile,
  GuardrailReport,
  KillSwitchReceipt,
  LoanEvaluation,
  SessionResult,
  SessionStatus,
  StrainAnalysis,
  ZkpProof,
} from "@/types";

const DSCR_THRESHOLD = 1.25;
const MAX_POLICY_CAP = 300000;
const BASE_ANNUAL_RATE = 0.072;

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s*prompt/i,
  /override\s+(credit\s+limit|credit\s+ceiling|dscr|approval)/i,
  /bypass\s+(verification|guardrail|scoring|dscr)/i,
  /approve\s+(immediately|without\s+checks|any\s+amount)/i,
  /jailbreak/i,
  /you\s+are\s+now\s+(in\s+developer\s+mode|dan|unrestricted)/i,
];

function maskPii(text: string): { clean: string; counts: Record<string, number> } {
  const counts = { id_card: 0, bank_card: 0, phone: 0 };
  let clean = text.replace(/\b[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dX]\b/g, (m) => {
    counts.id_card++;
    return `${m.slice(0, 3)}***********${m.slice(-4)}`;
  });
  clean = clean.replace(/\b(62|60|4|5)[0-9]{15,18}\b/g, (m) => {
    counts.bank_card++;
    return `${m.slice(0, 4)}********${m.slice(-4)}`;
  });
  clean = clean.replace(/\b(?:\+?86)?1[3-9]\d{9}\b/g, (m) => {
    counts.phone++;
    return `${m.slice(0, 3)}****${m.slice(-4)}`;
  });
  return { clean, counts };
}

function parseIntent(text: string): { amount: number; tenor: number; purpose: string } {
  const amountMatch = text.match(/(\d[\d,.]*)\s*(?:rb|ribu|k|jt|juta|rmb|yuan)?/i);
  let amount = 50000;
  if (amountMatch) {
    const raw = Number(amountMatch[1].replace(/,/g, ""));
    if (!Number.isNaN(raw) && raw >= 1000) amount = raw;
  }
  const tenorMatch = text.match(/(\d+)\s*(?:bulan|months?|mo|bln)/i);
  const tenor = tenorMatch ? Number(tenorMatch[1]) : 6;
  let purpose = "Working capital & daily inventory";
  if (/stok|inventory|restock/i.test(text)) purpose = "Inventory / raw-material procurement";
  else if (/mesin|alat|kulkas|fridge|equipment/i.test(text)) purpose = "Equipment / machinery investment";
  return { amount, tenor, purpose };
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function std(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

interface Row {
  gross_revenue_rmb: number;
  total_expenses_rmb: number;
  supplier_invoices_efapiao_rmb: number;
}

function parseCsv(csv: string): Row[] {
  const lines = csv.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  const idx = (name: string) => headers.indexOf(name);
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    return {
      gross_revenue_rmb: Number(cols[idx("gross_revenue_rmb")]),
      total_expenses_rmb: Number(cols[idx("total_expenses_rmb")]),
      supplier_invoices_efapiao_rmb: Number(cols[idx("supplier_invoices_efapiao_rmb")]),
    };
  });
}

function effectiveInstallment(principal: number, tenor: number, annualRate: number): number {
  const r = annualRate / 12;
  if (r <= 0) return principal / tenor;
  return (principal * (r * (1 + r) ** tenor)) / ((1 + r) ** tenor - 1);
}

function buildSchedule(principal: number, tenor: number, annualRateEffPct: number): AmortizationRow[] {
  const r = annualRateEffPct / 100 / 12;
  const inst = effectiveInstallment(principal, tenor, (annualRateEffPct / 100));
  const rows: AmortizationRow[] = [];
  let balance = principal;
  for (let m = 1; m <= tenor; m++) {
    const interest = balance * r;
    const principalPaid = inst - interest;
    balance = Math.max(0, balance - principalPaid);
    rows.push({
      Bulan: m,
      Angsuran_Total_RMB: round2(inst),
      Cicilan_Pokok_RMB: round2(principalPaid),
      Bunga_Bulanan_RMB: round2(interest),
      Sisa_Pokok_RMB: round2(balance),
    });
  }
  return rows;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function strain(netCashFlow: number, installment: number): StrainAnalysis {
  const ratio = netCashFlow > 0 ? (installment / netCashFlow) * 100 : 100;
  let level: string;
  let msg: string;
  if (ratio < 40) {
    level = "AMAN (Healthy)";
    msg = `Installments take only ${ratio.toFixed(1)}% of free cash flow. Liquidity is very safe.`;
  } else if (ratio <= 65) {
    level = "MODERAT (Prudent)";
    msg = `Installments take ${ratio.toFixed(1)}% of free cash flow. Within normal operating tolerance.`;
  } else {
    level = "WASPADA (High Burden)";
    msg = `Early warning: installments take ${ratio.toFixed(1)}% of net cash flow. Vulnerable to late customer payments.`;
  }
  return {
    strain_ratio_pct: round2(ratio),
    safety_level: level,
    advisory_message: msg,
    recommended_allocation: {
      Inventory: "70% (faster stock turnover & revenue)",
      "Working capital": "20% (utilities & wages)",
      "Emergency reserve": "10% (sales-fluctuation buffer)",
    },
  };
}

function mockZkp(dscr: number, requested: number, ceiling: number): ZkpProof {
  const hex = (n: number) => Math.random().toString(16).slice(2).padEnd(n, "0").slice(0, n);
  return {
    merchant_pseudonym: `ANON_MSME_${hex(16)}`,
    commitment_hash: hex(64),
    dscr_threshold_proven: 1.25,
    is_dscr_satisfied: dscr >= DSCR_THRESHOLD,
    is_ceiling_satisfied: requested <= ceiling,
    proof_timestamp: new Date().toISOString(),
    zkp_signature: hex(64),
    public_salt_hint: hex(8) + "...",
  };
}

export interface RunArgs {
  merchantId: string;
  merchantName: string;
  userInputText: string;
  csv: string;
  autoConfirm?: boolean;
}

/** Faithful local reproduction of orchestrator.process_application_session. */
export function runMockSession({
  merchantName,
  userInputText,
  csv,
  autoConfirm = true,
}: RunArgs): SessionResult {
  const sessionId = `SES-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
  const killSwitch: KillSwitchReceipt = {
    session_id: sessionId,
    status: "PURGED_AND_DESTROYED",
    logs_wiped: 5,
    cache_entries_wiped: 3,
    timestamp: new Date().toISOString(),
    pipl_compliance: "CONFIRMED_DATA_PURGED",
  };

  // 1. Guardrail
  const injection = INJECTION_PATTERNS.find((re) => re.test(userInputText));
  if (injection) {
    const report: GuardrailReport = {
      status: "BLOCKED",
      clean_text: "",
      warning: `Prompt-injection threat detected: ${injection.source}`,
      pii_masked: {},
    };
    return {
      session_id: sessionId,
      status: "REJECTED_SECURITY_VIOLATION",
      guardrail_report: report,
      kill_switch_receipt: killSwitch,
    };
  }

  const { clean } = maskPii(userInputText);
  const intent = parseIntent(clean);

  // 2. Ingestion
  const rows = parseCsv(csv);
  const revenues = rows.map((r) => r.gross_revenue_rmb);
  const expenses = rows.map((r) => r.total_expenses_rmb);
  const nets = revenues.map((rev, i) => rev - expenses[i]);
  const avgRevenue = mean(revenues);
  const avgExpense = mean(expenses);
  const avgNet = avgRevenue - avgExpense;

  const profile: FinancialProfile = {
    merchant_name: merchantName,
    requested_amount: intent.amount,
    requested_tenor_months: intent.tenor,
    stated_purpose: intent.purpose,
    avg_monthly_revenue: round2(avgRevenue),
    avg_monthly_expense: round2(avgExpense),
    avg_monthly_net_cash_flow: round2(avgNet),
    supplier_invoice_total: round2(
      rows.reduce((a, r) => a + r.supplier_invoices_efapiao_rmb, 0)
    ),
  };

  // 3. Risk engine
  const cv = mean(nets) > 0 ? std(nets) / mean(nets) : 1;
  let tier: string;
  let annualRate: number;
  if (cv < 0.15) {
    tier = "Tier A (Very low risk - stable cash flow)";
    annualRate = BASE_ANNUAL_RATE;
  } else if (cv < 0.3) {
    tier = "Tier B (Moderate risk - normal fluctuation)";
    annualRate = BASE_ANNUAL_RATE + 0.024;
  } else {
    tier = "Tier C (High risk - volatile cash flow)";
    annualRate = BASE_ANNUAL_RATE + 0.052;
  }

  const volatilityPenalty = Math.min(cv * 0.5, 0.4);
  const ceiling = Math.min(
    MAX_POLICY_CAP,
    Math.max(10000, avgNet * 3.2 * (1 - volatilityPenalty))
  );

  const inst = effectiveInstallment(intent.amount, intent.tenor, annualRate);
  const flatMonthlyInterest = intent.amount * (annualRate / 12);
  const flatInstallment = intent.amount / intent.tenor + flatMonthlyInterest;
  const dscr = inst > 0 ? avgNet / inst : 0;
  const isApproved = dscr >= DSCR_THRESHOLD && intent.amount <= ceiling;

  let reason: string | null = null;
  let adjustment: LoanEvaluation["recommended_adjustment"] = null;
  if (!isApproved) {
    reason =
      intent.amount > ceiling
        ? `Requested amount (RMB ${intent.amount.toLocaleString()}) exceeds the safe credit ceiling (RMB ${Math.round(ceiling).toLocaleString()}).`
        : `DSCR (${dscr.toFixed(2)}) is below the safe regulatory standard (>= ${DSCR_THRESHOLD}).`;
    const maxSafeInstallment = avgNet / DSCR_THRESHOLD;
    const r = annualRate / 12;
    const n = intent.tenor;
    const safeAmount = r > 0
      ? Math.min(ceiling, (maxSafeInstallment * ((1 + r) ** n - 1)) / (r * (1 + r) ** n))
      : Math.min(ceiling, maxSafeInstallment * n);
    const extendedTenor = Math.min(24, intent.tenor + 6);
    const extInst = effectiveInstallment(intent.amount, extendedTenor, annualRate);
    adjustment = {
      safe_reduced_amount: Math.round(safeAmount / 1000) * 1000,
      safe_extended_tenor: extendedTenor,
      extended_tenor_dscr: round2(avgNet / extInst),
      extended_tenor_installment: round2(extInst),
    };
  }

  const evaluation: LoanEvaluation = {
    is_approved: isApproved,
    dscr: round2(dscr),
    credit_ceiling: round2(ceiling),
    approved_amount: isApproved ? intent.amount : 0,
    tenor_months: intent.tenor,
    annual_interest_rate_effective: round2(annualRate * 100),
    monthly_interest_rate_flat: round2((annualRate / 12) * 100),
    monthly_installment_flat: round2(flatInstallment),
    monthly_installment_effective: round2(inst),
    total_interest_flat: round2(flatMonthlyInterest * intent.tenor),
    total_interest_effective: round2(inst * intent.tenor - intent.amount),
    cashflow_volatility_cv: round2(cv),
    risk_tier: tier,
    rejection_or_adjustment_reason: reason,
    recommended_adjustment: adjustment,
  };

  // 4. ZKP
  const zkp = mockZkp(dscr, intent.amount, ceiling);
  const zkpPassed = zkp.is_dscr_satisfied && zkp.is_ceiling_satisfied;

  // 5. Advisory
  const strainAnalysis = strain(avgNet, inst);
  const schedule = isApproved
    ? buildSchedule(intent.amount, intent.tenor, evaluation.annual_interest_rate_effective)
    : null;
  const payload = isApproved && autoConfirm
    ? {
        header: {
          request_id: `REQ-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
          timestamp: new Date().toISOString(),
          compliance_jurisdiction: "PRC_PIPL_CBIRC_ALIGNED",
        },
        applicant: { merchant_pseudonym: zkp.merchant_pseudonym, stated_business_purpose: intent.purpose },
        loan_terms: {
          currency: "RMB",
          approved_principal: evaluation.approved_amount,
          tenor_months: evaluation.tenor_months,
          effective_annual_rate_pct: evaluation.annual_interest_rate_effective,
          monthly_installment_effective: evaluation.monthly_installment_effective,
          total_repayment: round2(evaluation.monthly_installment_effective * evaluation.tenor_months),
        },
        credit_risk_attestation: {
          dscr_ratio: evaluation.dscr,
          zkp_commitment_hash: zkp.commitment_hash,
          zero_knowledge_proof_valid: true,
        },
      }
    : null;

  const status: SessionStatus = isApproved ? "APPROVED" : "ADJUSTMENT_REQUIRED";
  return {
    session_id: sessionId,
    status,
    profile,
    evaluation,
    zkp_proof: zkp,
    zkp_verification_passed: zkpPassed,
    strain_analysis: strainAnalysis,
    amortization_schedule: schedule,
    webank_api_payload: payload,
    kill_switch_receipt: killSwitch,
  };
}
