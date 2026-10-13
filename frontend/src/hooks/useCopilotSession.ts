import { useCallback, useState } from "react";
import type { ChatMessage, SessionResult } from "@/types";
import { runMockSession } from "@/mocks/mockEngine";
import { postSession, USE_MOCKS } from "@/services/api";
import { SAMPLE_DATASETS, type SampleDataset } from "@/mocks/sampleData";

let counter = 0;
const id = () => `m-${Date.now()}-${counter++}`;
const now = () => new Date().toISOString();

function assistant(content: string, attachment?: ChatMessage["attachment"]): ChatMessage {
  return { id: id(), role: "assistant", content, attachment, createdAt: now() };
}
function user(content: string): ChatMessage {
  return { id: id(), role: "user", content, createdAt: now() };
}

const GREETING = assistant(
  "Hi! I'm your WeBank loan copilot. Pick a demo dataset or upload your merchant CSV, " +
    "then tell me what you need. (This is a cash-flow simulator, not financial advice.)"
);

/** Turns an engine result into a sequence of assistant messages with attachments. */
function resultToMessages(result: SessionResult): ChatMessage[] {
  const msgs: ChatMessage[] = [];

  if (result.status === "REJECTED_SECURITY_VIOLATION" && result.guardrail_report) {
    msgs.push(
      assistant(
        "🛡️ Security guardrail triggered. This request was blocked and the session was purged.",
        { kind: "guardrail", data: result.guardrail_report }
      )
    );
    msgs.push(assistant("Session memory wiped (PIPL).", { kind: "killswitch", data: result.kill_switch_receipt }));
    return msgs;
  }

  if (result.profile) {
    msgs.push(
      assistant(
        `I read the records for ${result.profile.merchant_name} (Bill Analysis).`,
        { kind: "cashflow", data: result.profile }
      )
    );
  }
  if (result.evaluation) {
    const e = result.evaluation;
    const verb = result.status === "APPROVED" ? "approved" : "needs adjustment";
    msgs.push(
      assistant(
        `Risk assessment complete — this request ${verb}. DSCR is ${e.dscr} (safe threshold 1.25). ` +
          `This is a cash-flow calculation, not financial advice.`,
        { kind: "evaluation", data: e }
      )
    );
  }
  if (result.zkp_proof) {
    msgs.push(
      assistant("Eligibility proven without exposing raw revenue.", {
        kind: "proof",
        data: result.zkp_proof,
        verified: Boolean(result.zkp_verification_passed),
      })
    );
  }
  if (result.strain_analysis) {
    msgs.push(
      assistant(result.strain_analysis.advisory_message, {
        kind: "strain",
        data: result.strain_analysis,
      })
    );
  }
  if (result.status === "APPROVED" && result.amortization_schedule) {
    msgs.push(
      assistant("Here is your installment schedule.", {
        kind: "amortization",
        data: result.amortization_schedule,
      })
    );
    if (result.webank_api_payload) {
      msgs.push(
        assistant("Draft ready to send to WeBank (simulated).", {
          kind: "payload",
          data: result.webank_api_payload,
        })
      );
    }
    msgs.push(
      assistant("Session memory wiped (PIPL).", {
        kind: "killswitch",
        data: result.kill_switch_receipt,
      })
    );
  }
  return msgs;
}

export function useCopilotSession() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [dataset, setDataset] = useState<SampleDataset>(SAMPLE_DATASETS[0]);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<SessionResult | null>(null);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setMessages((prev) => [...prev, user(text)]);
      setThinking(true);
      try {
        const req = {
          merchant_id: dataset.merchantId,
          merchant_name: dataset.merchantName,
          user_input_text: text,
          csv_text: dataset.csv,
          auto_confirm: true,
        };
        const res = USE_MOCKS
          ? runMockSession({
              merchantId: dataset.merchantId,
              merchantName: dataset.merchantName,
              userInputText: text,
              csv: dataset.csv,
            })
          : await postSession(req);
        setResult(res);
        setMessages((prev) => [...prev, ...resultToMessages(res)]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          assistant(`Something went wrong: ${err instanceof Error ? err.message : String(err)}`),
        ]);
      } finally {
        setThinking(false);
      }
    },
    [dataset]
  );

  const reset = useCallback(() => {
    // Event-kill switch: wipe conversation memory (PIPL).
    setMessages([GREETING]);
    setResult(null);
    setThinking(false);
  }, []);

  return { messages, dataset, setDataset, thinking, result, send, reset };
}
