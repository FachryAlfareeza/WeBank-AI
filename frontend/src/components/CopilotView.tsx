import { useEffect, useState } from "react";
import type { Merchant } from "@/types/dashboard";
import type { SessionResult } from "@/types";
import { useCopilotSession } from "@/hooks/useCopilotSession";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Composer } from "@/components/chat/Composer";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { SessionStepper } from "@/components/layout/SessionStepper";
import { USE_MOCKS } from "@/services/api";

interface Props {
  merchant: Merchant;
  onBack: () => void;
  /** Called whenever the engine produces a result, so the dashboard can record it. */
  onResult: (result: SessionResult) => void;
}

/** The AI copilot chat, launched from the dashboard for one merchant. */
export function CopilotView({ merchant, onBack, onResult }: Props) {
  const { messages, thinking, result, send, reset } = useCopilotSession(merchant);
  const [draft, setDraft] = useState(merchant.suggestedPrompt);

  // Surface each new engine result to the dashboard (records the application).
  useEffect(() => {
    if (result) onResult(result);
  }, [result, onResult]);

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-left">
          <button type="button" className="app__back" onClick={onBack} aria-label="Back to dashboard">
            ← Dashboard
          </button>
          <div>
            <h1 className="app__title">Loan Copilot · {merchant.name}</h1>
            <p className="app__subtitle">
              Cash-flow simulator for MSMEs — not financial advice
            </p>
          </div>
        </div>
        <div className="app__header-right">
          <StatusBadge status={result?.status ?? null} />
          <button
            type="button"
            className="app__reset"
            onClick={reset}
            title="Event-kill switch (PIPL)"
            aria-label="Start a new session and wipe all current session data (PIPL event-kill switch)"
          >
            New session
          </button>
        </div>
      </header>

      <SessionStepper result={result} />

      <main className="app__main">
        <ChatWindow messages={messages} thinking={thinking} />
      </main>

      <footer className="app__footer">
        <Composer value={draft} onChange={setDraft} onSend={send} disabled={thinking} />
        <p className="app__disclaimer">
          {USE_MOCKS ? "Local mock engine" : "Live backend engine"} · WeBank submission is simulated ·
          the AI stores nothing — your data stays in your dashboard
        </p>
      </footer>
    </div>
  );
}
