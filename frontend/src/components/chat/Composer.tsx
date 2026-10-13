import { useVoiceInput } from "@/hooks/useVoiceInput";

interface Props {
  value: string;
  onChange: (text: string) => void;
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function Composer({ value, onChange, onSend, disabled }: Props) {
  const { listening, supported, toggle } = useVoiceInput((transcript) =>
    onChange(value ? `${value} ${transcript}` : transcript)
  );

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    onChange("");
  };

  return (
    <div className="composer">
      {supported && (
        <button
          type="button"
          className={`composer__mic ${listening ? "composer__mic--on" : ""}`}
          onClick={toggle}
          aria-label={listening ? "Stop voice input" : "Start voice input"}
          title="Voice-to-text"
        >
          {listening ? "● Listening" : "🎙"}
        </button>
      )}
      <textarea
        className="composer__input"
        value={value}
        placeholder="Tell the copilot what you need, or use the mic…"
        rows={1}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button
        type="button"
        className="composer__send"
        onClick={submit}
        disabled={disabled || !value.trim()}
      >
        Send
      </button>
    </div>
  );
}
