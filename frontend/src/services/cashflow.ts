// Lightweight cash-flow summary derived from a merchant CSV, for dashboard display.
// Mirrors the ingestion maths in mockEngine.ts but returns only summary figures.

export interface CashFlowSummary {
  months: number;
  avgRevenue: number;
  avgExpense: number;
  avgNetCashFlow: number;
}

const num = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

export function summarizeCsv(csv: string): CashFlowSummary | null {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return null;
  const headers = lines[0].split(",").map((h) => h.trim());
  const rev = headers.indexOf("gross_revenue_rmb");
  const exp = headers.indexOf("total_expenses_rmb");
  if (rev < 0 || exp < 0) return null;

  const rows = lines.slice(1).filter((l) => l.trim().length > 0);
  if (rows.length === 0) return null;

  let revSum = 0;
  let expSum = 0;
  for (const line of rows) {
    const cols = line.split(",");
    revSum += num(cols[rev]);
    expSum += num(cols[exp]);
  }
  const months = rows.length;
  const avgRevenue = revSum / months;
  const avgExpense = expSum / months;
  return {
    months,
    avgRevenue,
    avgExpense,
    avgNetCashFlow: avgRevenue - avgExpense,
  };
}
