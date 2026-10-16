import { useState } from "react";
import { useCopilotSession } from "@/hooks/useCopilotSession";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Composer } from "@/components/chat/Composer";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { SessionStepper } from "@/components/layout/SessionStepper";
import { DatasetPicker } from "@/components/layout/DatasetPicker";
import { USE_MOCKS } from "@/services/api";

export default function App() {
  const { messages, dataset, setDataset, thinking, result, send, reset } = useCopilotSession();
  const [draft, setDraft] = useState("");

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1 className="app__title">WeBank Loan Copilot</h1>
          <p className="app__subtitle">
            Cash-flow simulator for MSMEs — not financial advice
          </p>
          <span className="app__privacy-badge" title="Zero-Knowledge Proof + PIPL event-kill switch">
            🔒 Anonymous · Zero-Knowledge · data purged each session
          </span>
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

      <DatasetPicker value={dataset} onChange={setDataset} onUsePrompt={setDraft} />

      <main className="app__main">
        <ChatWindow messages={messages} thinking={thinking} />
      </main>

      <footer className="app__footer">
        <Composer value={draft} onChange={setDraft} onSend={send} disabled={thinking} />
        <p className="app__disclaimer">
          {USE_MOCKS ? "Local mock engine" : "Live backend engine"} · WeBank submission is simulated ·
          data purged after each session (PIPL)
        </p>
      </footer>
    </div>
  );
}
