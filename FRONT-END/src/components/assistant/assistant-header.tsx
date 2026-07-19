import {
  History,
  MessageSquarePlus,
  PanelRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export function AssistantHeader({
  projectName,
  environment,
  hasSession,
  evidenceOpen,
  onNew,
  onRefresh,
  onToggleHistory,
  onToggleEvidence,
}: {
  projectName: string;
  environment: string;
  hasSession: boolean;
  evidenceOpen: boolean;
  onNew: () => void;
  onRefresh: () => void;
  onToggleHistory: () => void;
  onToggleEvidence: () => void;
}) {
  return (
    <header className="chat-header">
      <span className="bot-mark">
        <Sparkles />
      </span>
      <div>
        <h1>Ask ReleaseLens</h1>
        <p>
          <i />
          {projectName} · {environment}
        </p>
      </div>
      <div className="chat-header-actions">
        <button
          onClick={onToggleHistory}
          className="history-toggle"
          aria-label="Toggle conversation history"
          title="Conversation history"
        >
          <History />
        </button>
        <button
          onClick={onNew}
          aria-label="New conversation"
          title="New conversation"
        >
          <MessageSquarePlus />
        </button>
        <button
          onClick={onRefresh}
          disabled={!hasSession}
          aria-label="Refresh conversation"
          title="Refresh conversation"
        >
          <RefreshCw />
        </button>
        <button
          onClick={onToggleEvidence}
          aria-expanded={evidenceOpen}
          aria-label="Toggle Evidence panel"
          title="Evidence"
        >
          <PanelRight />
        </button>
      </div>
    </header>
  );
}
