/** Session 3 — simulated WeBank payload (collapsible JSON). */
export function DraftCard({ payload }: { payload: Record<string, unknown> }) {
  return (
    <div className="card card--draft">
      <div className="card__title">
        WeBank API payload
        <span className="card__badge">simulated</span>
      </div>
      <details className="card__payload" open>
        <summary>View JSON</summary>
        <pre>{JSON.stringify(payload, null, 2)}</pre>
      </details>
    </div>
  );
}
