// Turns an engine SessionResult into a dashboard LoanApplication record.
// The audit record intentionally carries NO merchant figures (NFRA-aligned).

import type { SessionResult } from "@/types";
import type {
  ApplicationStatus,
  LoanApplication,
  Merchant,
} from "@/types/dashboard";

const RULE_VERSION = "dscr-1.25/v1";

function statusFrom(result: SessionResult): ApplicationStatus {
  switch (result.status) {
    case "APPROVED":
      return "APPROVED";
    case "ADJUSTMENT_REQUIRED":
      return "ADJUSTMENT_REQUIRED";
    case "REJECTED_SECURITY_VIOLATION":
      return "REJECTED_SECURITY";
    default:
      return "DRAFT";
  }
}

export function applicationFromResult(
  merchant: Merchant,
  result: SessionResult
): LoanApplication {
  const status = statusFrom(result);
  const amount = result.profile?.requested_amount ?? 0;
  const tenor = result.profile?.requested_tenor_months ?? 0;
  const purpose = result.profile?.stated_purpose ?? "Working capital";

  return {
    id: result.session_id,
    merchantId: merchant.id,
    createdAt: new Date().toISOString(),
    requestedAmount: amount,
    tenorMonths: tenor,
    purpose,
    status,
    engineResult: result,
    auditRecord: {
      timestamp: new Date().toISOString(),
      ruleVersion: RULE_VERSION,
      outcome: status,
      attestationHash: result.zkp_proof?.commitment_hash ?? null,
    },
  };
}
