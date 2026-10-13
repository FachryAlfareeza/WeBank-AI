import type { SessionStatus } from "@/types";

const MAP: Record<SessionStatus, { label: string; cls: string }> = {
  APPROVED: { label: "✅ Approved", cls: "status--approved" },
  ADJUSTMENT_REQUIRED: { label: "⚠️ Adjustment required", cls: "status--adjust" },
  REJECTED_SECURITY_VIOLATION: { label: "🛡️ Security blocked", cls: "status--rejected" },
};

export function StatusBadge({ status }: { status: SessionStatus | null }) {
  if (!status) return <span className="status status--idle">Awaiting request</span>;
  const { label, cls } = MAP[status];
  return <span className={`status ${cls}`}>{label}</span>;
}
