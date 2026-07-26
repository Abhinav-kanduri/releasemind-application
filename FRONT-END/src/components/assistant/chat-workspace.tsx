"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Bot, Copy } from "lucide-react";
import { useWorkspaceContext } from "@/workspace-context";
import { AssistantHeader } from "./assistant-header";
import { AssistantMessage } from "./assistant-message";
import { ChatComposer } from "./chat-composer";
import { ConversationDeleteDialog } from "./conversation-delete-dialog";
import { ConversationSidebar } from "./conversation-sidebar";
import { EvidencePanel } from "./evidence-panel";
import { ProjectScopeBar } from "./project-scope-bar";
import { UserMessage } from "./user-message";
import { WelcomeState } from "./welcome-state";
import type { Conversation, Message, Source } from "./assistant-types";

const groupName = (date?: string) => {
  if (!date) return "Older";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  return days < 1
    ? "Today"
    : days < 2
      ? "Yesterday"
      : days < 7
        ? "Previous 7 days"
        : "Older";
};

const responseStages = [
  "Understanding your question…",
  "Searching Project records…",
  "Reviewing evidence…",
  "Preparing the response…",
];

export function ChatWorkspace() {
  const productSpaceId = useWorkspaceContext(
      (state) => state.productSpaceId,
    ),
    projectId = useWorkspaceContext((state) => state.projectId),
    environment =
      useWorkspaceContext((state) => state.environment?.name) ||
      "All environments";
  const [input, setInput] = useState(""),
    [sending, setSending] = useState(false),
    [conversationLoading, setConversationLoading] = useState(false),
    [error, setError] = useState(""),
    [sessionId, setSessionId] = useState<string | null>(null),
    [conversations, setConversations] = useState<Conversation[]>([]),
    [sources, setSources] = useState<Source[]>([]),
    [projectName, setProjectName] = useState("Selected Project"),
    [messages, setMessages] = useState<Message[]>([]),
    [search, setSearch] = useState(""),
    [evidenceOpen, setEvidenceOpen] = useState(false),
    [historyOpen, setHistoryOpen] = useState(false),
    [preferenceReady, setPreferenceReady] = useState(false),
    [highlightedSource, setHighlightedSource] = useState<number | null>(null),
    [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null),
    [notice, setNotice] = useState(""),
    [announcement, setAnnouncement] = useState(""),
    [responseStage, setResponseStage] = useState(0),
    [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null),
    messagesRef = useRef<HTMLDivElement>(null),
    nearBottomRef = useRef(true),
    requestVersionRef = useRef(0),
    sendingRef = useRef(false);

  const loadConversations = useCallback(async () => {
    const version = ++requestVersionRef.current;
    setConversations([]);
    if (!productSpaceId || !projectId) {
      setProjectName("Select a Project");
      setError("");
      return;
    }
    try {
      const query = new URLSearchParams();
      if (productSpaceId) query.set("productSpaceId", productSpaceId);
      if (projectId) query.set("projectId", projectId);
      const response = await fetch(`/api/chat?${query}`, { cache: "no-store" }),
        body = await response.json();
      if (version !== requestVersionRef.current) return;
      if (!response.ok)
        throw new Error(body.error || "Unable to load conversations.");
      setConversations(body.items || []);
      setProjectName(body.context?.project_name || "Selected Project");
    } catch (reason) {
      if (version === requestVersionRef.current)
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load conversations.",
        );
    }
  }, [productSpaceId, projectId]);
  useEffect(() => {
    requestVersionRef.current++;
    setSessionId(null);
    setMessages([]);
    setSources([]);
    setConversations([]);
    setError("");
    setHistoryOpen(false);
    void loadConversations();
  }, [loadConversations]);
  useEffect(() => {
    const saved = localStorage.getItem("releaselens-evidence-open"),
      configure = () => {
        if (window.innerWidth >= 1600) setEvidenceOpen(saved !== "false");
        else setEvidenceOpen(false);
        if (window.innerWidth >= 1100) setHistoryOpen(false);
      };
    configure();
    setPreferenceReady(true);
    const resize = () => {
      if (window.innerWidth < 1600) setEvidenceOpen(false);
      if (window.innerWidth >= 1100) setHistoryOpen(false);
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    if (preferenceReady)
      localStorage.setItem("releaselens-evidence-open", String(evidenceOpen));
  }, [evidenceOpen, preferenceReady]);
  useEffect(() => {
    const textarea = composerRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }
  }, [input]);
  useEffect(() => {
    if ((messages.length > 0 || sending) && nearBottomRef.current) {
      const viewport = messagesRef.current;
      viewport?.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, sending]);
  useEffect(() => {
    if (!sending) {
      setResponseStage(0);
      return;
    }
    const timer = window.setInterval(
      () => setResponseStage((current) => Math.min(current + 1, 3)),
      1400,
    );
    return () => window.clearInterval(timer);
  }, [sending]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const filtered = useMemo(
    () =>
      conversations.filter((item) =>
        `${item.title} ${item.last_message_preview || ""} ${item.current_intent || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [conversations, search],
  );
  const grouped = useMemo(
    () =>
      Object.entries(
        filtered.reduce<Record<string, Conversation[]>>((groups, item) => {
          const group = groupName(item.updated_at || item.created_at);
          (groups[group] ||= []).push(item);
          return groups;
        }, {}),
      ),
    [filtered],
  );
  const newConversation = () => {
    requestVersionRef.current++;
    setSessionId(null);
    setMessages([]);
    setSources([]);
    setError("");
    setHistoryOpen(false);
    composerRef.current?.focus();
  };
  const openConversation = async (conversation: Conversation) => {
    const version = ++requestVersionRef.current;
    setConversationLoading(true);
    setError("");
    setHistoryOpen(false);
    try {
      const response = await fetch(
          `/api/chat?sessionId=${encodeURIComponent(conversation.session_id)}`,
          { cache: "no-store" },
        ),
        body = await response.json();
      if (version !== requestVersionRef.current) return;
      if (!response.ok)
        throw new Error(body.error || "Unable to load conversation.");
      const restored: Message[] = (body.items || [])
        .filter(
          (item: { role: string }) =>
            item.role === "USER" || item.role === "ASSISTANT",
        )
        .map(
          (item: {
            id: string;
            role: string;
            content: string;
            created_at?: string;
            latency_ms?: number;
            metadata?: {
              sources?: Source[];
              response?: {
                intent?: { name?: string };
                search?: { latency_ms?: number };
              };
            };
          }) => ({
            id: item.id,
            role: item.role === "USER" ? "user" : "assistant",
            text: item.content,
            sources: item.metadata?.sources,
            intent: item.metadata?.response?.intent?.name,
            createdAt: item.created_at,
            latencyMs:
              item.metadata?.response?.search?.latency_ms || item.latency_ms,
          }),
        );
      const latest = [...restored]
        .reverse()
        .find((item) => item.sources?.length);
      setSessionId(conversation.session_id);
      setMessages(restored);
      setSources(latest?.sources || []);
    } catch (reason) {
      if (version === requestVersionRef.current)
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load conversation.",
        );
    } finally {
      if (version === requestVersionRef.current) setConversationLoading(false);
    }
  };
  const ask = async (question: string) => {
    const value = question.trim();
    if (!value || sendingRef.current) return;
    if (!productSpaceId || !projectId) {
      setError("Select a Product Space and Project in Workspace Context.");
      return;
    }
    sendingRef.current = true;
    nearBottomRef.current = true;
    setShowJumpToLatest(false);
    const userId = crypto.randomUUID(),
      sentAt = new Date().toISOString();
    setMessages((current) => [
      ...current,
      { id: userId, role: "user", text: value, createdAt: sentAt },
    ]);
    setInput("");
    setSending(true);
    setError("");
    setAnnouncement("Message sent. ReleaseLens is responding.");
    try {
      const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            product_space_id: productSpaceId,
            project_id: projectId,
            message: value,
            client_message_id: userId,
          }),
        }),
        body = await response.json();
      if (!response.ok)
        throw new Error(
          body.error || "ReleaseLens could not answer the question.",
        );
      const answer: Message = {
        id: body.assistant_message_id || crypto.randomUUID(),
        role: "assistant",
        text: body.answer,
        sources: body.sources || [],
        intent: body.intent?.name,
        createdAt: new Date().toISOString(),
        latencyMs: body.search?.latency_ms,
      };
      setSessionId(body.session_id);
      setSources(answer.sources || []);
      setMessages((current) => [...current, answer]);
      setConversations((current) => {
        const existing = current.find(
            (item) => item.session_id === body.session_id,
          ),
          updated: Conversation = {
            session_id: body.session_id,
            title: existing?.title || value.slice(0, 80),
            last_message_preview: value,
            current_intent: body.intent?.name,
            updated_at: new Date().toISOString(),
          };
        return [
          updated,
          ...current.filter((item) => item.session_id !== body.session_id),
        ];
      });
      setAnnouncement("Response completed.");
      composerRef.current?.focus();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "ReleaseLens could not answer the question.",
      );
      setAnnouncement(
        "Response failed. Your question remains in the conversation.",
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };
  const deleteConversation = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget,
      next = conversations.find(
        (item) => item.session_id !== target.session_id,
      );
    const response = await fetch(
        `/api/chat?sessionId=${encodeURIComponent(target.session_id)}`,
        { method: "DELETE" },
      ),
      body = await response.json();
    if (!response.ok) {
      setError(body.error || "Unable to delete conversation.");
      return;
    }
    setConversations((current) =>
      current.filter((item) => item.session_id !== target.session_id),
    );
    setDeleteTarget(null);
    setNotice("Conversation deleted");
    setAnnouncement("Conversation deleted.");
    if (sessionId === target.session_id) {
      if (next) void openConversation(next);
      else newConversation();
    }
  };
  const focusSource = (messageSources: Source[], index: number) => {
    setSources(messageSources);
    setEvidenceOpen(true);
    setHighlightedSource(index);
    window.setTimeout(() => {
      const source = document.getElementById(`evidence-source-${index}`);
      source?.scrollIntoView({ behavior: "smooth", block: "center" });
      source?.focus();
    }, 80);
    window.setTimeout(() => setHighlightedSource(null), 1600);
  };
  const viewSources = (messageSources: Source[]) => {
    setSources(messageSources);
    setEvidenceOpen(true);
  };
  const lastQuestion = [...messages]
    .reverse()
    .find((message) => message.role === "user")?.text;
  return (
    <main
      className={`chat-page ${evidenceOpen ? "evidence-open" : "evidence-collapsed"} ${historyOpen ? "history-open" : ""}`}
    >
      <ConversationSidebar
        groups={grouped}
        sessionId={sessionId}
        projectName={projectName}
        search={search}
        open={historyOpen}
        onSearch={setSearch}
        onNew={newConversation}
        onOpen={(conversation) => void openConversation(conversation)}
        onDelete={setDeleteTarget}
        onClose={() => setHistoryOpen(false)}
      />
      <section className="chat-center">
        <AssistantHeader
          projectName={projectName}
          environment={environment}
          hasSession={Boolean(sessionId)}
          evidenceOpen={evidenceOpen}
          onNew={newConversation}
          onRefresh={() => {
            const selected = conversations.find(
              (item) => item.session_id === sessionId,
            );
            if (selected) void openConversation(selected);
          }}
          onToggleHistory={() => setHistoryOpen((value) => !value)}
          onToggleEvidence={() => setEvidenceOpen((value) => !value)}
        />
        <ProjectScopeBar projectName={projectName} />
        <div
          className="messages"
          ref={messagesRef}
          onScroll={(event) => {
            const element = event.currentTarget;
            const isNearBottom =
              element.scrollHeight - element.scrollTop - element.clientHeight <
              120;
            nearBottomRef.current = isNearBottom;
            setShowJumpToLatest(!isNearBottom && messages.length > 0);
          }}
        >
          {conversationLoading ? (
            <div className="chat-loading">
              <Bot />
              <span>Loading conversation…</span>
            </div>
          ) : messages.length === 0 ? (
            <WelcomeState
              projectName={projectName}
              onAsk={(question) => void ask(question)}
            />
          ) : (
            messages.map((message) =>
              message.role === "user" ? (
                <UserMessage message={message} key={message.id} />
              ) : (
                <AssistantMessage
                  message={message}
                  key={message.id}
                  onCitation={(index) =>
                    focusSource(message.sources || [], index)
                  }
                  onViewSources={() => viewSources(message.sources || [])}
                />
              ),
            )
          )}
          {sending && (
            <div className="thinking-card" role="status">
              <Bot />
              <div>
                <strong>Preparing a grounded answer</strong>
                <span>{responseStages[responseStage]}</span>
              </div>
              <i />
              <i />
              <i />
            </div>
          )}
          {error && (
            <div className="chat-error" role="alert">
              <strong>The response could not be completed.</strong>
              <p>{error}</p>
              {lastQuestion && (
                <button
                  onClick={() =>
                    void navigator.clipboard.writeText(lastQuestion)
                  }
                >
                  <Copy />
                  Copy question
                </button>
              )}
            </div>
          )}
        </div>
        {showJumpToLatest && (
          <button
            className="jump-to-latest"
            onClick={() => {
              const viewport = messagesRef.current;
              viewport?.scrollTo({
                top: viewport.scrollHeight,
                behavior: "smooth",
              });
              nearBottomRef.current = true;
              setShowJumpToLatest(false);
            }}
            aria-label="Jump to the latest message"
          >
            <ArrowDown />
            Jump to latest
          </button>
        )}
        <ChatComposer
          input={input}
          projectName={projectName}
          sending={sending}
          textareaRef={composerRef}
          onInput={setInput}
          onSubmit={() => void ask(input)}
        />
      </section>
      {evidenceOpen ? (
        <EvidencePanel
          sources={sources}
          onClose={() => setEvidenceOpen(false)}
          highlighted={highlightedSource}
        />
      ) : (
        <button
          className="evidence-rail"
          onClick={() => setEvidenceOpen(true)}
          aria-label="Open Evidence panel"
          aria-expanded="false"
        >
          <span>{sources.length}</span>
        </button>
      )}
      <button
        className={`assistant-drawer-backdrop ${historyOpen || evidenceOpen ? "visible" : ""}`}
        onClick={() => {
          setHistoryOpen(false);
          if (window.innerWidth < 1600) setEvidenceOpen(false);
        }}
        aria-label="Close open panel"
      />
      {deleteTarget && (
        <ConversationDeleteDialog
          conversation={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void deleteConversation()}
        />
      )}
      <div className="assistant-live" aria-live="polite">
        {announcement}
      </div>
      {notice && (
        <div className="assistant-toast" role="status">
          {notice}
        </div>
      )}
    </main>
  );
}
