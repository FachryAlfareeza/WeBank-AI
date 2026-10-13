// The DSCR gauge is the most important demo component.
// Bands: >=2.0 very healthy, >=1.25 safe/pass, >=1.0 moderate, <1.0 high risk.

function band(dscr: number): { label: string; cls: string } {
  if (dscr >= 2.0) return { label: "Very healthy", cls: "gauge--great" };
  if (dscr >= 1.25) return { label: "Safe (pass)", cls: "gauge--ok" };
  if (dscr >= 1.0) return { label: "Moderate", cls: "gauge--moderate" };
  return { label: "High risk", cls: "gauge--risk" };
}

export function DscrGauge({ dscr }: { dscr: number }) {
  const { label, cls } = band(dscr);
  // Position a marker on a 0–4 scale for a simple visual bar.
  const pct = Math.min(100, (dscr / 4) * 100);
  return (
    <div className={`gauge ${cls}`}>
      <div className="gauge__head">
        <span className="gauge__value">{dscr.toFixed(2)}</span>
        <span className="gauge__label">DSCR · {label}</span>
      </div>
      <div className="gauge__track">
        <div className="gauge__threshold" style={{ left: `${(1.25 / 4) * 100}%` }} title="Threshold 1.25" />
        <div className="gauge__fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="gauge__scale">
        <span>0</span>
        <span>1.25</span>
        <span>4+</span>
      </div>
    </div>
  );
}
