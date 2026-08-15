import {
  History,
  MessageSquarePlus,
  PanelRight,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

export function AssistantHeader({
  projectName,
  release,
  title,
  hasSession,
  evidenceOpen,
  contextOpen,
  sourcesCount,
  onNew,
  onRefresh,
  onToggleHistory,
  onToggleEvidence,
  onToggleContext,
}: {
  projectName: string;
  release: string;
  title: string;
  hasSession: boolean;
  evidenceOpen: boolean;
  contextOpen: boolean;
  sourcesCount: number;
  onNew: () => void;
  onRefresh: () => void;
  onToggleHistory: () => void;
  onToggleEvidence: () => void;
  onToggleContext: () => void;
}) {
  return (
    <header className="chat-header">
      <span className="bot-mark">
        <Sparkles />
      </span>
      <div>
        <h1>{title}</h1>
        <p>
          <i />
          {projectName} · {release}
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
          className="context-toggle"
          onClick={onToggleContext}
          aria-expanded={contextOpen}
          aria-label="Open conversation context"
          title="Conversation context"
        >
          <SlidersHorizontal />
          <span>Context</span>
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
          disabled={sourcesCount === 0}
          aria-label="Toggle Evidence panel"
          title="Evidence"
          className="sources-toggle"
        >
          <PanelRight />
          <span>Sources{sourcesCount ? ` · ${sourcesCount}` : ""}</span>
        </button>
      </div>
    </header>
  );
}
