// Dashboard-side domain types (v3 concept).
// The dashboard stores the USER's own business data; the AI stores nothing.
// Only an anonymous HMAC attestation ever leaves the session for the bank.

import type { SessionResult } from "@/types";

/** A merchant/MSME account shown in the dashboard. User-owned, persisted locally. */
export interface Merchant {
  id: string;
  name: string;
  businessType: string;
  /** Payout destination for an approved loan. Stored raw, shown masked in the UI. */
  destinationAccount: string;
  /** Cash-flow source (WeChat Pay / e-fapiao CSV export). */
  csv: string;
  /** Short suggested funding request, used to prefill the copilot. */
  suggestedPrompt: string;
}

export type ApplicationStatus =
  | "DRAFT" // copilot session ran, awaiting user submit
  | "SUBMITTED" // sent to WeBank (simulated), awaiting decision
  | "APPROVED"
  | "ADJUSTMENT_REQUIRED"
  | "REJECTED_SECURITY";

/**
 * A minimal audit record retained after the session (NFRA-aligned): it deliberately
 * contains NO merchant figures — only metadata and the attestation hash.
 */
export interface AuditRecord {
  timestamp: string;
  ruleVersion: string;
  outcome: ApplicationStatus;
  attestationHash: string | null;
}

/** A loan application tracked in the merchant's dashboard. */
export interface LoanApplication {
  id: string;
  merchantId: string;
  createdAt: string;
  requestedAmount: number;
  tenorMonths: number;
  purpose: string;
  status: ApplicationStatus;
  /** The engine result that produced this application (kept for display). */
  engineResult: SessionResult;
  auditRecord: AuditRecord;
}
