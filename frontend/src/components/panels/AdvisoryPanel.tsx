import type { RecommendedAdjustment } from "@/types";

const rmb = (n: number) => `¥${Math.round(n).toLocaleString("en-US")}`;

interface Props {
  reason: string;
  adjustment: RecommendedAdjustment;
  requestedTenor: number;
}

/** Shown when status is ADJUSTMENT_REQUIRED — never a flat rejection. */
export function AdvisoryPanel({ reason, adjustment, requestedTenor }: Props) {
  return (
    <div className="advisory">
      <div className="advisory__reason">⚠️ {reason}</div>
      <div className="advisory__options">
        <div className="advisory__option">
          <div className="advisory__opt-title">Option A — Reduce amount</div>
          <div className="advisory__opt-value">{rmb(adjustment.safe_reduced_amount)}</div>
          <div className="advisory__opt-note">Tenor stays {requestedTenor} months</div>
        </div>
        <div className="advisory__option">
          <div className="advisory__opt-title">Option B — Extend tenor</div>
          <div className="advisory__opt-value">{adjustment.safe_extended_tenor} months</div>
          <div className="advisory__opt-note">
            New DSCR {adjustment.extended_tenor_dscr} · {rmb(adjustment.extended_tenor_installment)}/mo
          </div>
        </div>
      </div>
    </div>
  );
}
