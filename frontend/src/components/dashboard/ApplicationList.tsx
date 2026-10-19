import type { ApplicationStatus, LoanApplication } from "@/types/dashboard";

const rmb = (n: number) => `¥${Math.round(n).toLocaleString("en-US")}`;

const STATUS_LABEL: Record<ApplicationStatus, { text: string; cls: string }> = {
  DRAFT: { text: "Draft", cls: "appstatus--draft" },
  SUBMITTED: { text: "Submitted", cls: "appstatus--submitted" },
  APPROVED: { text: "Approved", cls: "appstatus--approved" },
  ADJUSTMENT_REQUIRED: { text: "Adjustment required", cls: "appstatus--adjust" },
  REJECTED_SECURITY: { text: "Blocked", cls: "appstatus--rejected" },
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

interface Props {
  applications: LoanApplication[];
  onOpen: (application: LoanApplication) => void;
}

/** The merchant's loan applications with lifecycle status. */
export function ApplicationList({ applications, onOpen }: Props) {
  return (
    <section className="dash-card">
      <h2 className="dash-card__title">Loan applications</h2>
      {applications.length === 0 ? (
        <p className="dash-card__empty">
          No applications yet. Start one with “Apply for a loan”.
        </p>
      ) : (
        <ul className="applist">
          {applications.map((a) => {
            const s = STATUS_LABEL[a.status];
            return (
              <li key={a.id}>
                <button
                  type="button"
                  className="applist__item"
                  onClick={() => onOpen(a)}
                >
                  <div className="applist__main">
                    <span className="applist__amount">
                      {rmb(a.requestedAmount)} · {a.tenorMonths} mo
                    </span>
                    <span className="applist__purpose">{a.purpose}</span>
                  </div>
                  <div className="applist__meta">
                    <span className={`appstatus ${s.cls}`}>{s.text}</span>
                    <span className="applist__date">{fmtDate(a.createdAt)}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
