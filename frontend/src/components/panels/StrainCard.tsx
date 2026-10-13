import type { StrainAnalysis } from "@/types";

function level(safety: string): string {
  if (safety.startsWith("AMAN")) return "card--ok";
  if (safety.startsWith("MODERAT")) return "card--moderate";
  return "card--warn";
}

/** Early-warning liquidity strain bar. */
export function StrainCard({ strain }: { strain: StrainAnalysis }) {
  return (
    <div className={`card ${level(strain.safety_level)}`}>
      <div className="card__title">
        Liquidity early warning
        <span className="card__badge card__badge--plain">{strain.safety_level}</span>
      </div>
      <p className="card__text">{strain.advisory_message}</p>
      <div className="strain-bar">
        <div
          className="strain-bar__fill"
          style={{ width: `${Math.min(100, strain.strain_ratio_pct)}%` }}
        />
      </div>
      <div className="card__sources">Strain: {strain.strain_ratio_pct}% of net cash flow</div>
    </div>
  );
}
