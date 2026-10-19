import type { LoanApplication, Merchant } from "@/types/dashboard";
import { MerchantSwitcher } from "./MerchantSwitcher";
import { ProfileCard } from "./ProfileCard";
import { CashFlowSummary } from "./CashFlowSummary";
import { ApplicationList } from "./ApplicationList";

interface Props {
  merchants: Merchant[];
  activeMerchant: Merchant;
  applications: LoanApplication[];
  onSelectMerchant: (id: string) => void;
  onApply: () => void;
  onOpenApplication: (application: LoanApplication) => void;
}

/** Clean, formal merchant dashboard — the home surface of the product. */
export function Dashboard({
  merchants,
  activeMerchant,
  applications,
  onSelectMerchant,
  onApply,
  onOpenApplication,
}: Props) {
  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">WeBank MSME Portal</h1>
          <p className="dashboard__subtitle">Working-capital financing for small merchants</p>
        </div>
        <MerchantSwitcher
          merchants={merchants}
          activeId={activeMerchant.id}
          onSelect={onSelectMerchant}
        />
      </header>

      <div className="dashboard__grid">
        <ProfileCard merchant={activeMerchant} />
        <CashFlowSummary csv={activeMerchant.csv} />
      </div>

      <div className="dashboard__cta">
        <button type="button" className="dashboard__apply" onClick={onApply}>
          Apply for a loan
        </button>
      </div>

      <ApplicationList applications={applications} onOpen={onOpenApplication} />
    </div>
  );
}
