import type { SessionResult } from "@/types";

// The three-session flow is the core narrative of the product:
//   1. Input & Profiling  →  2. Risk & ZKP  →  3. Draft & Submit
// This stepper keeps that narrative visible at all times so reviewers (and the
// 5-minute demo video) can see which phase the copilot is in.

export type Stage = 1 | 2 | 3;

const STEPS: { id: Stage; title: string; hint: string }[] = [
  { id: 1, title: "Input & Profiling", hint: "Voice / text / CSV" },
  { id: 2, title: "Risk & ZKP", hint: "DSCR · anonymous proof" },
  { id: 3, title: "Draft & Submit", hint: "Amortization · payload" },
];

/** Derive the active stage from the current engine result. */
export function stageFromResult(result: SessionResult | null): Stage {
  if (!result) return 1;
  if (result.status === "REJECTED_SECURITY_VIOLATION") return 1;
  if (result.status === "APPROVED" && result.webank_api_payload) return 3;
  // We have a profile/evaluation but no approved payload yet.
  return 2;
}

interface Props {
  result: SessionResult | null;
}

export function SessionStepper({ result }: Props) {
  const blocked = result?.status === "REJECTED_SECURITY_VIOLATION";
  const active = stageFromResult(result);

  return (
    <ol
      className={`stages ${blocked ? "stages--blocked" : ""}`}
      aria-label="Loan session progress"
    >
      {STEPS.map((step) => {
        const isActive = !blocked && step.id === active;
        const isDone = !blocked && step.id < active;
        return (
          <li
            key={step.id}
            className={`stages__item ${isActive ? "stages__item--active" : ""} ${
              isDone ? "stages__item--done" : ""
            }`}
            aria-current={isActive ? "step" : undefined}
          >
            <span className="stages__num" aria-hidden="true">
              {isDone ? "✓" : step.id}
            </span>
            <span className="stages__title">{step.title}</span>
            <span className="stages__hint">{step.hint}</span>
          </li>
        );
      })}
    </ol>
  );
}
