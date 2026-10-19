import { useCallback, useState } from "react";
import type { SessionResult } from "@/types";
import type { LoanApplication } from "@/types/dashboard";
import { useDashboard } from "@/hooks/useDashboard";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { CopilotView } from "@/components/CopilotView";
import { applicationFromResult } from "@/services/applicationFactory";

type View = "dashboard" | "copilot";

export default function App() {
  const {
    merchants,
    activeMerchant,
    activeApplications,
    selectMerchant,
    addApplication,
    updateApplication,
  } = useDashboard();
  const [view, setView] = useState<View>("dashboard");

  // Record (or update) the application for the current session result.
  const handleResult = useCallback(
    (result: SessionResult) => {
      if (!activeMerchant) return;
      const app = applicationFromResult(activeMerchant, result);
      const existing = activeApplications.find((a) => a.id === app.id);
      if (existing) {
        updateApplication(app.id, app);
      } else {
        addApplication(app);
      }
    },
    [activeMerchant, activeApplications, addApplication, updateApplication]
  );

  const openApplication = useCallback((_application: LoanApplication) => {
    // Opening an existing application re-enters the copilot view for context.
    setView("copilot");
  }, []);

  if (!activeMerchant) {
    return <div className="app app--loading">Loading dashboard…</div>;
  }

  if (view === "copilot") {
    return (
      <CopilotView
        merchant={activeMerchant}
        onBack={() => setView("dashboard")}
        onResult={handleResult}
      />
    );
  }

  return (
    <Dashboard
      merchants={merchants}
      activeMerchant={activeMerchant}
      applications={activeApplications}
      onSelectMerchant={selectMerchant}
      onApply={() => setView("copilot")}
      onOpenApplication={openApplication}
    />
  );
}
