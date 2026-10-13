// API client for the backend. When VITE_USE_MOCKS is true, the app uses the
// local mock engine instead (see src/mocks/).

import type { SessionRequest, SessionResult } from "@/types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const USE_MOCKS =
  (import.meta.env.VITE_USE_MOCKS ?? "true").toString().toLowerCase() === "true";

/** POST /api/session — runs one full engine session on the backend. */
export async function postSession(req: SessionRequest): Promise<SessionResult> {
  const res = await fetch(`${BASE_URL}/api/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Session request failed (${res.status}): ${detail}`);
  }
  const body = (await res.json()) as { result: SessionResult };
  return body.result;
}
