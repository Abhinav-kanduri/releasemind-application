"use client";
import { Trash2 } from "lucide-react";
import type { Conversation } from "./assistant-types";
export function ConversationDeleteDialog({
  conversation,
  onCancel,
  onConfirm,
}: {
  conversation: Conversation;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="card delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-chat-title"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
      >
        <Trash2 />
        <h2 id="delete-chat-title">Delete conversation?</h2>
        <p>
          <strong>“{conversation.title}”</strong>
        </p>
        <p>
          This permanently removes the conversation and its messages. Project
          planning records and source documents will not be deleted.
        </p>
        <div>
          <button onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button className="danger" onClick={onConfirm}>
            Delete conversation
          </button>
        </div>
      </section>
    </div>
  );
}
