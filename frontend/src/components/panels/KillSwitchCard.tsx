import type { KillSwitchReceipt } from "@/types";

/** PIPL event-kill switch receipt. */
export function KillSwitchCard({ receipt }: { receipt: KillSwitchReceipt }) {
  return (
    <div className="card card--kill">
      <div className="card__title">🔴 PIPL kill switch — {receipt.status}</div>
      <p className="card__text">
        {receipt.logs_wiped} logs and {receipt.cache_entries_wiped} cache entries wiped.
        Session data destroyed permanently.
      </p>
      <p className="card__text card__text--privacy">
        🔒 Nothing was stored. This session left no trace of your financial data
        (PIPL compliant).
      </p>
      <div className="card__sources">{receipt.pipl_compliance}</div>
    </div>
  );
}
