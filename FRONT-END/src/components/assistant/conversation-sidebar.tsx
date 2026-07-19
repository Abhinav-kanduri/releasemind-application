import { MessageSquarePlus, Search, Trash2, X } from "lucide-react";
import type { Conversation } from "./assistant-types";

export function ConversationSidebar({
  groups,
  sessionId,
  projectName,
  search,
  open,
  onSearch,
  onNew,
  onOpen,
  onDelete,
  onClose,
}: {
  groups: Array<[string, Conversation[]]>;
  sessionId: string | null;
  projectName: string;
  search: string;
  open: boolean;
  onSearch: (value: string) => void;
  onNew: () => void;
  onOpen: (conversation: Conversation) => void;
  onDelete: (conversation: Conversation) => void;
  onClose: () => void;
}) {
  return (
    <aside
      className={`conversations ${open ? "open" : ""}`}
      aria-label="Conversation history"
    >
      <header>
        <div>
          <span>Assistant</span>
          <small>Project conversations</small>
        </div>
        <button
          className="drawer-close"
          onClick={onClose}
          aria-label="Close conversation history"
        >
          <X />
        </button>
      </header>
      <button className="new-chat" onClick={onNew}>
        <MessageSquarePlus />
        New conversation
      </button>
      <label className="conversation-search">
        <Search />
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search conversations…"
          aria-label="Search conversations"
        />
      </label>
      <div className="conversation-groups">
        {groups.length === 0 ? (
          <p className="conversation-empty">No conversations found.</p>
        ) : (
          groups.map(([group, items]) => (
            <section key={group}>
              <h2>{group}</h2>
              {items.map((item) => (
                <div
                  className={`conversation-row ${item.session_id === sessionId ? "active" : ""}`}
                  key={item.session_id}
                >
                  <button
                    className="conversation"
                    aria-current={
                      item.session_id === sessionId ? "true" : undefined
                    }
                    onClick={() => onOpen(item)}
                    title={item.title}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.last_message_preview || projectName}</span>
                    <footer>
                      <small>
                        {item.current_intent?.replaceAll("_", " ") ||
                          "Project chat"}
                      </small>
                      {item.updated_at && (
                        <time>
                          {new Date(item.updated_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      )}
                    </footer>
                  </button>
                  <button
                    className="conversation-delete"
                    onClick={() => onDelete(item)}
                    aria-label={`Delete ${item.title}`}
                    title="Delete conversation"
                  >
                    <Trash2 />
                  </button>
                </div>
              ))}
            </section>
          ))
        )}
      </div>
    </aside>
  );
}
