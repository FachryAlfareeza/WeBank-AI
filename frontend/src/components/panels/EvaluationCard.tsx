import type { LoanEvaluation } from "@/types";
import { DscrGauge } from "./DscrGauge";
import { AdvisoryPanel } from "./AdvisoryPanel";

const rmb = (n: number) => `¥${Math.round(n).toLocaleString("en-US")}`;

/** Session 2 — risk assessment: DSCR gauge + pricing + Option A/B when adjustment. */
export function EvaluationCard({ evaluation }: { evaluation: LoanEvaluation }) {
  return (
    <div className="card">
      <div className="card__title">Risk assessment (cash-flow calculator)</div>
      <DscrGauge dscr={evaluation.dscr} />
      <div className="card__grid">
        <div>
          <span className="card__label">Credit ceiling</span>
          <span className="card__value">{rmb(evaluation.credit_ceiling)}</span>
        </div>
        <div>
          <span className="card__label">Risk tier</span>
          <span className="card__value card__value--small">{evaluation.risk_tier}</span>
        </div>
        <div>
          <span className="card__label">Monthly installment (eff.)</span>
          <span className="card__value">{rmb(evaluation.monthly_installment_effective)}</span>
        </div>
        <div>
          <span className="card__label">Effective annual rate</span>
          <span className="card__value">{evaluation.annual_interest_rate_effective}%</span>
        </div>
        <div>
          <span className="card__label">Monthly installment (flat)</span>
          <span className="card__value">{rmb(evaluation.monthly_installment_flat)}</span>
        </div>
        <div>
          <span className="card__label">Cash-flow volatility (CV)</span>
          <span className="card__value">{evaluation.cashflow_volatility_cv}</span>
        </div>
      </div>
      {!evaluation.is_approved && evaluation.recommended_adjustment && (
        <AdvisoryPanel
          reason={evaluation.rejection_or_adjustment_reason ?? ""}
          adjustment={evaluation.recommended_adjustment}
          requestedTenor={evaluation.tenor_months}
        />
      )}
    </div>
  );
}
