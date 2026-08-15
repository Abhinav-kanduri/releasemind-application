import { Bot } from "lucide-react";

export function AssistantTypingIndicator({ status }: { status: string }) {
  return (
    <article
      className="message assistant assistant-typing"
      role="status"
      aria-label={`ReleaseLens AI: ${status}`}
    >
      <div className="message-avatar" aria-hidden="true">
        <Bot />
      </div>
      <div className="message-body assistant-card">
        <header>
          <div>
            <strong>ReleaseLens AI</strong>
            <time>
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </div>
        </header>
        <div className="typing-status">
          <span>{status}</span>
          <span className="typing-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
    </article>
  );
}