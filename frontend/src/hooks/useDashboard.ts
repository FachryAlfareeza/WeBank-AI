import { useCallback, useEffect, useMemo, useState } from "react";
import type { LoanApplication, Merchant } from "@/types/dashboard";
import {
  getActiveMerchantId,
  loadApplications,
  loadMerchants,
  saveApplications,
  setActiveMerchantId,
} from "@/services/merchantStore";

/**
 * Dashboard state: the list of merchants, the active one, and loan applications.
 * Persisted to localStorage so the demo survives a refresh ("my data lives in
 * my dashboard"), while the AI itself retains nothing.
 */
export function useDashboard() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [applications, setApplications] = useState<LoanApplication[]>([]);

  // Initial load (seed on first run).
  useEffect(() => {
    const m = loadMerchants();
    setMerchants(m);
    const stored = getActiveMerchantId();
    setActiveId(stored && m.some((x) => x.id === stored) ? stored : m[0]?.id ?? null);
    setApplications(loadApplications());
  }, []);

  const activeMerchant = useMemo(
    () => merchants.find((m) => m.id === activeId) ?? null,
    [merchants, activeId]
  );

  const selectMerchant = useCallback((id: string) => {
    setActiveId(id);
    setActiveMerchantId(id);
  }, []);

  const addApplication = useCallback((application: LoanApplication) => {
    setApplications((prev) => {
      const next = [application, ...prev];
      saveApplications(next);
      return next;
    });
  }, []);

  const updateApplication = useCallback(
    (id: string, patch: Partial<LoanApplication>) => {
      setApplications((prev) => {
        const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
        saveApplications(next);
        return next;
      });
    },
    []
  );

  const activeApplications = useMemo(
    () => applications.filter((a) => a.merchantId === activeId),
    [applications, activeId]
  );

  return {
    merchants,
    activeMerchant,
    activeApplications,
    selectMerchant,
    addApplication,
    updateApplication,
  };
}
