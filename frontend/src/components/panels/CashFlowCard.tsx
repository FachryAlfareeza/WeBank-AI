import type { FinancialProfile } from "@/types";

const rmb = (n: number) => `¥${Math.round(n).toLocaleString("en-US")}`;

/** Session 1 — Bill Analysis result. */
export function CashFlowCard({ profile }: { profile: FinancialProfile }) {
  return (
    <div className="card">
      <div className="card__title">Cash-flow profile — {profile.merchant_name}</div>
      <div className="card__grid">
        <div>
          <span className="card__label">Avg monthly revenue</span>
          <span className="card__value">{rmb(profile.avg_monthly_revenue)}</span>
        </div>
        <div>
          <span className="card__label">Avg monthly expense</span>
          <span className="card__value">{rmb(profile.avg_monthly_expense)}</span>
        </div>
        <div>
          <span className="card__label">Avg net cash flow</span>
          <span className="card__value card__value--accent">
            {rmb(profile.avg_monthly_net_cash_flow)}
          </span>
        </div>
        <div>
          <span className="card__label">Requested</span>
          <span className="card__value">
            {rmb(profile.requested_amount)} · {profile.requested_tenor_months} mo
          </span>
        </div>
      </div>
      <div className="card__sources">Purpose: {profile.stated_purpose}</div>
    </div>
  );
}
