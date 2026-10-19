import { summarizeCsv } from "@/services/cashflow";

const rmb = (n: number) => `¥${Math.round(n).toLocaleString("en-US")}`;

/** Compact cash-flow summary for the dashboard (derived from the merchant CSV). */
export function CashFlowSummary({ csv }: { csv: string }) {
  const s = summarizeCsv(csv);
  if (!s) {
    return (
      <section className="dash-card">
        <h2 className="dash-card__title">Cash flow</h2>
        <p className="dash-card__empty">No transaction data available.</p>
      </section>
    );
  }
  return (
    <section className="dash-card">
      <h2 className="dash-card__title">Cash flow · last {s.months} months</h2>
      <div className="dash-metrics">
        <div className="dash-metric">
          <span className="dash-metric__label">Avg monthly revenue</span>
          <span className="dash-metric__value">{rmb(s.avgRevenue)}</span>
        </div>
        <div className="dash-metric">
          <span className="dash-metric__label">Avg monthly expense</span>
          <span className="dash-metric__value">{rmb(s.avgExpense)}</span>
        </div>
        <div className="dash-metric">
          <span className="dash-metric__label">Avg net cash flow</span>
          <span className="dash-metric__value dash-metric__value--accent">
            {rmb(s.avgNetCashFlow)}
          </span>
        </div>
      </div>
    </section>
  );
}
