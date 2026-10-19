import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types";
import { MessageBubble } from "./MessageBubble";

interface Props {
  messages: ChatMessage[];
  thinking: boolean;
}

export function ChatWindow({ messages, thinking }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  return (
    <div
      className="chat-window"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Conversation with the loan copilot"
    >
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {thinking && (
        <div className="chat-thinking" aria-live="assertive">
          Copilot is thinking…
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
