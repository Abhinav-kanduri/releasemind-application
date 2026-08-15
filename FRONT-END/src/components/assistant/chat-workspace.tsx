"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Bot, Copy } from "lucide-react";
import { useWorkspaceContext } from "@/workspace-context";
import {
  getProjectRepositories,
  getRepositoryBranches,
} from "@/lib/impact-analysis/api";
import type {
  ProjectRepository,
  RepositoryBranch,
} from "@/lib/impact-analysis/types";
import type {
  GitHubLatestSummaryResponse,
  GitHubSummaryDocumentReference,
} from "@/lib/github-summary";
import { AssistantHeader } from "./assistant-header";
import { AssistantMessage } from "./assistant-message";
import { AssistantTypingIndicator } from "./assistant-typing-indicator";
import { ChatComposer } from "./chat-composer";
import { ConversationDeleteDialog } from "./conversation-delete-dialog";
import { ConversationSidebar } from "./conversation-sidebar";
import { ConversationContextDrawer } from "./conversation-context-drawer";
import { conversationTitle } from "./conversation-title";
import { EvidencePanel } from "./evidence-panel";
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
  "Searching project data…",
  "Reviewing connected knowledge…",
  "Preparing your answer…",
];
async function readApiResponse(response: Response) {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(
      `ReleaseLens received an invalid response (${response.status}). Please retry after the service restarts.`,
    );
  }
}

export function ChatWorkspace() {
  const productSpaceId = useWorkspaceContext(
      (state) => state.productSpaceId,
    ),
    projectId = useWorkspaceContext((state) => state.projectId),
    release =
      useWorkspaceContext((state) => state.release?.name) || "All releases",
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
    [contextOpen, setContextOpen] = useState(false),
    [historyOpen, setHistoryOpen] = useState(false),
    [historyCollapsed, setHistoryCollapsed] = useState(false),
    [highlightedSource, setHighlightedSource] = useState<number | null>(null),
    [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null),
    [notice, setNotice] = useState(""),
    [announcement, setAnnouncement] = useState(""),
    [responseStage, setResponseStage] = useState(0),
    [showJumpToLatest, setShowJumpToLatest] = useState(false),
    [repositories, setRepositories] = useState<ProjectRepository[]>([]),
    [repositoryId, setRepositoryId] = useState(""),
    [branches, setBranches] = useState<RepositoryBranch[]>([]),
    [branch, setBranch] = useState(""),
    [summaryDocument, setSummaryDocument] =
      useState<GitHubSummaryDocumentReference | null>(null),
    [useSummary, setUseSummary] = useState(false),
    [scopeLoading, setScopeLoading] = useState(false),
    [scopeError, setScopeError] = useState("");
  const composerRef = useRef<HTMLTextAreaElement>(null),
    messagesRef = useRef<HTMLDivElement>(null),
    nearBottomRef = useRef(true),
    requestVersionRef = useRef(0),
    sendingRef = useRef(false),
    repositoriesVersionRef = useRef(0),
    branchesVersionRef = useRef(0),
    summaryVersionRef = useRef(0);

  const selectedRepository = useMemo(
    () =>
      repositories.find((item) => item.association_id === repositoryId) || null,
    [repositories, repositoryId],
  );

  useEffect(() => {
    const version = ++repositoriesVersionRef.current;
    ++branchesVersionRef.current;
    ++summaryVersionRef.current;
    setRepositories([]);
    setRepositoryId("");
    setBranches([]);
    setBranch("");
    setSummaryDocument(null);
    setUseSummary(false);
    setScopeError("");
    if (!productSpaceId || !projectId) return;
    setScopeLoading(true);
    getProjectRepositories(productSpaceId, projectId)
      .then((items) => {
        if (version !== repositoriesVersionRef.current) return;
        setRepositories(items);
        const first = items[0];
        setRepositoryId(first?.association_id || "");
      })
      .catch((reason) => {
        if (version !== repositoriesVersionRef.current) return;
        setScopeError(
          reason instanceof Error
            ? reason.message
            : "Linked repositories could not be loaded.",
        );
      })
      .finally(() => {
        if (version === repositoriesVersionRef.current) setScopeLoading(false);
      });
  }, [productSpaceId, projectId]);

  useEffect(() => {
    const version = ++branchesVersionRef.current;
    ++summaryVersionRef.current;
    setBranches([]);
    setBranch("");
    setSummaryDocument(null);
    setUseSummary(false);
    setScopeError("");
    if (!selectedRepository) return;
    setScopeLoading(true);
    getRepositoryBranches(selectedRepository.repository_url)
      .then((items) => {
        if (version !== branchesVersionRef.current) return;
        setBranches(items);
        const defaultBranch =
          items.find(
            (item) => item.name === selectedRepository.default_branch,
          )?.name ||
          items[0]?.name ||
          "";
        setBranch(defaultBranch);
      })
      .catch((reason) => {
        if (version !== branchesVersionRef.current) return;
        setScopeError(
          reason instanceof Error
            ? reason.message
            : "Repository branches could not be loaded.",
        );
      })
      .finally(() => {
        if (version === branchesVersionRef.current) setScopeLoading(false);
      });
  }, [selectedRepository]);

  const loadLatestSummary = useCallback(async () => {
    const version = ++summaryVersionRef.current;
    if (!selectedRepository || !branch) {
      setSummaryDocument(null);
      setUseSummary(false);
      return;
    }
    setScopeLoading(true);
    setScopeError("");
    try {
      const query = new URLSearchParams({
        repositoryUrl: selectedRepository.repository_url,
        branch,
      });
      const response = await fetch(`/api/github/summary/latest?${query}`, {
        cache: "no-store",
      });
      const body = (await readApiResponse(response)) as GitHubLatestSummaryResponse & {
        error?: string;
      };
      if (version !== summaryVersionRef.current) return;
      if (!response.ok)
        throw new Error(
          body.error || "Generated summary status could not be loaded.",
        );
      setSummaryDocument(body.summary || null);
      setUseSummary(Boolean(body.summary));
    } catch (reason) {
      if (version !== summaryVersionRef.current) return;
      setSummaryDocument(null);
      setUseSummary(false);
      setScopeError(
        reason instanceof Error
          ? reason.message
          : "Generated summary status could not be loaded.",
      );
    } finally {
      if (version === summaryVersionRef.current) setScopeLoading(false);
    }
  }, [selectedRepository, branch]);

  useEffect(() => {
    setSummaryDocument(null);
    setUseSummary(false);
    void loadLatestSummary();
  }, [loadLatestSummary]);

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
        body = await readApiResponse(response);
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
    setEvidenceOpen(false);
    setContextOpen(false);
    const resize = () => {
      if (window.innerWidth >= 1100) setHistoryOpen(false);
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    const closeDrawers = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setEvidenceOpen(false);
      setContextOpen(false);
      setHistoryOpen(false);
    };
    window.addEventListener("keydown", closeDrawers);
    return () => window.removeEventListener("keydown", closeDrawers);
  }, []);
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
        body = await readApiResponse(response);
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
    window.setTimeout(() => {
      document.getElementById(`message-${userId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      nearBottomRef.current = false;
    }, 0);
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
            context:
              useSummary && summaryDocument
                ? {
                    grounding_mode: "GITHUB_SUMMARY",
                    summary_document_id: summaryDocument.document_id,
                    repository_url: summaryDocument.repository_url,
                    repository_full_name:
                      summaryDocument.repository_full_name,
                    branch: summaryDocument.branch,
                    commit_sha: summaryDocument.commit_sha,
                  }
                : { grounding_mode: "PROJECT" },
          }),
        }),
        body = await readApiResponse(response);
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
      body = await readApiResponse(response);
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
    if (!messageSources.length) return;
    setSources(messageSources);
    setContextOpen(false);
    setEvidenceOpen(true);
  };
  const lastQuestion = [...messages]
    .reverse()
    .find((message) => message.role === "user")?.text;
  const summaryEvidence =
    useSummary ||
    sources.some((source) => source.source_type === "GITHUB_SUMMARY");
  const activeResponseStages = useSummary
    ? [
        "Understanding your question…",
        "Searching project context…",
        "Checking GitHub…",
        "Preparing your answer…",
      ]
    : responseStages;
  const activeConversation = conversations.find(
      (item) => item.session_id === sessionId,
    ),
    firstQuestion = messages.find((message) => message.role === "user")?.text,
    currentTitle = messages.length
      ? conversationTitle(activeConversation?.title || firstQuestion)
      : "Ask ReleaseLens",
    latestAssistantId = [...messages]
      .reverse()
      .find((message) => message.role === "assistant")?.id;
  return (
    <main
      className={`chat-page ${historyOpen ? "history-open" : ""} ${historyCollapsed ? "history-collapsed" : ""} ${evidenceOpen ? "evidence-open" : ""} ${contextOpen ? "context-open" : ""}`}
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
        onClose={() => {
          if (window.innerWidth >= 1100) setHistoryCollapsed(true);
          else setHistoryOpen(false);
        }}
      />
      <section className="chat-center">
        <AssistantHeader
          projectName={projectName}
          release={release}
          title={currentTitle}
          hasSession={Boolean(sessionId)}
          evidenceOpen={evidenceOpen}
          contextOpen={contextOpen}
          sourcesCount={sources.length}
          onNew={newConversation}
          onRefresh={() => {
            const selected = conversations.find(
              (item) => item.session_id === sessionId,
            );
            if (selected) void openConversation(selected);
          }}
          onToggleHistory={() => {
            if (window.innerWidth >= 1100)
              setHistoryCollapsed((value) => !value);
            else setHistoryOpen((value) => !value);
          }}
          onToggleEvidence={() => {
            setContextOpen(false);
            setEvidenceOpen((value) => !value);
          }}
          onToggleContext={() => {
            setEvidenceOpen(false);
            setContextOpen((value) => !value);
          }}
        />
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
            messages.map((message, messageIndex) =>
              message.role === "user" ? (
                <UserMessage message={message} key={message.id} />
              ) : (
                <AssistantMessage
                  message={message}
                  question={
                    messageIndex > 0 && messages[messageIndex - 1]?.role === "user"
                      ? messages[messageIndex - 1].text
                      : ""
                  }
                  key={message.id}
                  onCitation={(index) =>
                    focusSource(message.sources || [], index)
                  }
                  onViewSources={() => viewSources(message.sources || [])}
                  isLatest={message.id === latestAssistantId}
                  onFollowUp={(question) => void ask(question)}
                  onRegenerate={lastQuestion ? () => void ask(lastQuestion) : undefined}
                />
              ),
            )
          )}
          {sending && (
            <AssistantTypingIndicator
              status={activeResponseStages[responseStage]}
            />
          )}
          {error && (
            <div className="chat-error" role="alert">
              <strong>I couldn&apos;t complete that response.</strong>
              <p>Try again, or adjust the conversation context and ask once more.</p>
              <div>
                {lastQuestion && (
                  <button onClick={() => void ask(lastQuestion)}>
                    Try again
                  </button>
                )}
                <button onClick={() => setContextOpen(true)}>Change context</button>
              </div>
              <details>
                <summary>View details</summary>
                <p>{error}</p>
              </details>
              {lastQuestion && (
                <button
                  className="copy-question"
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
          hasConversation={messages.length > 0}
          contextLabel={useSummary ? "Project + GitHub" : "Project context"}
          textareaRef={composerRef}
          onInput={setInput}
          onSubmit={() => void ask(input)}
          onContext={() => {
            setEvidenceOpen(false);
            setContextOpen(true);
          }}
        />
      </section>
      {evidenceOpen && (
        <EvidencePanel
          sources={sources}
          onClose={() => setEvidenceOpen(false)}
          highlighted={highlightedSource}
          retrievalLabel={
            summaryEvidence
              ? "GitHub repository evidence"
              : "Project evidence"
          }
        />
      )}
      {contextOpen && (
        <ConversationContextDrawer
          projectName={projectName}
          release={release}
          environment={environment}
          repositories={repositories}
          repositoryId={repositoryId}
          branches={branches}
          branch={branch}
          summary={summaryDocument}
          useSummary={useSummary}
          loading={scopeLoading}
          error={scopeError}
          onRepository={(value) => {
            newConversation();
            setRepositoryId(value);
          }}
          onBranch={(value) => {
            newConversation();
            setBranch(value);
          }}
          onUseSummary={(value) => {
            newConversation();
            setUseSummary(value);
          }}
          onRefresh={() => void loadLatestSummary()}
          onClose={() => setContextOpen(false)}
        />
      )}
      <button
        className={`assistant-drawer-backdrop ${historyOpen || evidenceOpen || contextOpen ? "visible" : ""}`}
        onClick={() => {
          setHistoryOpen(false);
          setEvidenceOpen(false);
          setContextOpen(false);
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
