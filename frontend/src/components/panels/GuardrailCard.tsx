import type { GuardrailReport } from "@/types";

/** Shown when a prompt-injection attack is blocked. */
export function GuardrailCard({ report }: { report: GuardrailReport }) {
  return (
    <div className="card card--warn">
      <div className="card__title">🛡️ Security guardrail — {report.status}</div>
      <p className="card__text">{report.warning}</p>
      <div className="card__sources">Request rejected. No instructions were executed.</div>
    </div>
  );
}
