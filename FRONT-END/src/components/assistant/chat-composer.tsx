import { FormEvent, KeyboardEvent, RefObject } from "react";
import { Send, SlidersHorizontal } from "lucide-react";
export function ChatComposer({
  input,
  projectName,
  sending,
  contextLabel,
  hasConversation,
  textareaRef,
  onInput,
  onSubmit,
  onContext,
}: {
  input: string;
  projectName: string;
  sending: boolean;
  contextLabel: string;
  hasConversation: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onInput: (value: string) => void;
  onSubmit: () => void;
  onContext: () => void;
}) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };
  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };
  return (
    <form className="composer" onSubmit={submit}>
      <div>
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(event) => onInput(event.target.value)}
          onKeyDown={keyDown}
          placeholder={hasConversation ? "Ask a follow-up…" : `Ask ReleaseLens about ${projectName}…`}
          aria-label="Chat message"
        />
        <footer>
          <button
            type="button"
            className="composer-context"
            onClick={onContext}
            aria-haspopup="dialog"
          >
            <SlidersHorizontal />
            {contextLabel}
          </button>
          <button className="send" disabled={!input.trim() || sending}>
            <Send />
            {sending ? "Generating…" : "Send"}
          </button>
        </footer>
      </div>
      <small>
        ReleaseLens can make mistakes. Verify critical information using
        citations.
      </small>
    </form>
  );
}
