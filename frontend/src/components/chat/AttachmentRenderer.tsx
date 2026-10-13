import type { MessageAttachment } from "@/types";
import { CashFlowCard } from "@/components/panels/CashFlowCard";
import { EvaluationCard } from "@/components/panels/EvaluationCard";
import { ProofCard } from "@/components/panels/ProofCard";
import { StrainCard } from "@/components/panels/StrainCard";
import { AmortizationTable } from "@/components/panels/AmortizationTable";
import { DraftCard } from "@/components/panels/DraftCard";
import { KillSwitchCard } from "@/components/panels/KillSwitchCard";
import { GuardrailCard } from "@/components/panels/GuardrailCard";

/** Renders the rich inline payload attached to an assistant message. */
export function AttachmentRenderer({ attachment }: { attachment: MessageAttachment }) {
  switch (attachment.kind) {
    case "cashflow":
      return <CashFlowCard profile={attachment.data} />;
    case "evaluation":
      return <EvaluationCard evaluation={attachment.data} />;
    case "proof":
      return <ProofCard proof={attachment.data} verified={attachment.verified} />;
    case "strain":
      return <StrainCard strain={attachment.data} />;
    case "amortization":
      return <AmortizationTable rows={attachment.data} />;
    case "payload":
      return <DraftCard payload={attachment.data} />;
    case "killswitch":
      return <KillSwitchCard receipt={attachment.data} />;
    case "guardrail":
      return <GuardrailCard report={attachment.data} />;
    default:
      return null;
  }
}
