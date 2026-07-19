import { FormEvent, KeyboardEvent, RefObject } from "react";
import { FileText, Send } from "lucide-react";
export function ChatComposer({
  input,
  projectName,
  sending,
  textareaRef,
  onInput,
  onSubmit,
}: {
  input: string;
  projectName: string;
  sending: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onInput: (value: string) => void;
  onSubmit: () => void;
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
          placeholder={`Ask about ${projectName}…`}
          aria-label="Chat message"
        />
        <footer>
          <span>
            <FileText />
            Project context attached
          </span>
          <button className="send" disabled={!input.trim() || sending}>
            <Send />
            {sending ? "Working…" : "Send"}
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
