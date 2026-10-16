import type { ChatMessage } from "@/types";
import { AttachmentRenderer } from "./AttachmentRenderer";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const speaker = isUser ? "You" : "Copilot";
  return (
    <div className={`bubble-row ${isUser ? "bubble-row--user" : "bubble-row--assistant"}`}>
      <div className={`bubble ${isUser ? "bubble--user" : "bubble--assistant"}`}>
        <span className="sr-only">{speaker} said:</span>
        <p className="bubble__text">{message.content}</p>
        {message.attachment && (
          <div className="bubble__attachment">
            <AttachmentRenderer attachment={message.attachment} />
          </div>
        )}
      </div>
    </div>
  );
}
