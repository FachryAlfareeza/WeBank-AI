// Prototype persistence for the dashboard, backed by localStorage.
// This stores ONLY the user's own business data (merchants + their loan
// applications). The AI never reads from or writes to a training store; raw
// figures never leave the browser except as an anonymous attestation.

import type { LoanApplication, Merchant } from "@/types/dashboard";
import { SEED_MERCHANTS } from "@/mocks/merchants";

const MERCHANTS_KEY = "copilot.merchants.v1";
const APPLICATIONS_KEY = "copilot.applications.v1";
const ACTIVE_KEY = "copilot.activeMerchant.v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode / quota) — degrade gracefully.
  }
}

/** Load merchants, seeding the demo set on first run. */
export function loadMerchants(): Merchant[] {
  const existing = read<Merchant[]>(MERCHANTS_KEY, []);
  if (existing.length > 0) return existing;
  write(MERCHANTS_KEY, SEED_MERCHANTS);
  return SEED_MERCHANTS;
}

export function saveMerchants(merchants: Merchant[]): void {
  write(MERCHANTS_KEY, merchants);
}

export function getActiveMerchantId(): string | null {
  return read<string | null>(ACTIVE_KEY, null);
}

export function setActiveMerchantId(id: string): void {
  write(ACTIVE_KEY, id);
}

export function loadApplications(): LoanApplication[] {
  return read<LoanApplication[]>(APPLICATIONS_KEY, []);
}

export function saveApplications(applications: LoanApplication[]): void {
  write(APPLICATIONS_KEY, applications);
}

/** Mask a payout account for display: keep the last 4 digits only. */
export function maskAccount(account: string): string {
  const digits = account.replace(/\s+/g, "");
  if (digits.length <= 4) return account;
  return `•••• •••• •••• ${digits.slice(-4)}`;
}
