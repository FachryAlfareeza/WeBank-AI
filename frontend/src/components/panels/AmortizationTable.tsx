import type { AmortizationRow } from "@/types";

const rmb = (n: number) => `¥${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/** Transparent, dynamically rendered installment schedule (engine column names). */
export function AmortizationTable({ rows }: { rows: AmortizationRow[] }) {
  return (
    <table className="amort">
      <thead>
        <tr>
          <th>Month</th>
          <th>Payment</th>
          <th>Principal</th>
          <th>Interest</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.Bulan}>
            <td>{r.Bulan}</td>
            <td>{rmb(r.Angsuran_Total_RMB)}</td>
            <td>{rmb(r.Cicilan_Pokok_RMB)}</td>
            <td>{rmb(r.Bunga_Bulanan_RMB)}</td>
            <td>{rmb(r.Sisa_Pokok_RMB)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
