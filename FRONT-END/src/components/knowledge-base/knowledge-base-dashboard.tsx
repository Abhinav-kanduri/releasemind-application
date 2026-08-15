"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Database,
  FileText,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { useWorkspaceContext } from "@/workspace-context";

type KnowledgeDocument = {
  doc_id: string;
  doc_nm: string;
  doc_type: string;
  doc_status:
    | "RECEIVED"
    | "UPLOADED"
    | "PARSING"
    | "PARSED"
    | "CHUNKING"
    | "CHUNKED"
    | "EMBEDDING"
    | "EMBEDDED"
    | "FAILED";
  release_id: string | null;
  environment_id: string | null;
  file_size_bytes: number;
  ingestion_error_code: string | null;
  ingestion_error: string | null;
  chunk_count: number;
  embedded_chunk_count: number;
  last_update_timestamp: string;
};

type KnowledgeStats = {
  documents: number;
  chunks: number;
  embedded_chunks: number;
  embedded_documents: number;
  processing: number;
  failed: number;
};

const activeStatuses = new Set([
  "RECEIVED",
  "UPLOADED",
  "PARSING",
  "PARSED",
  "CHUNKING",
  "CHUNKED",
  "EMBEDDING",
]);

function responseMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const body = payload as Record<string, unknown>;
  const detail = body.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    const message = (detail as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }
  if (typeof body.error === "string") return body.error;
  if (typeof body.message === "string") return body.message;
  return fallback;
}

async function readResponsePayload(response: Response, fallback: string) {
  const raw = await response.text();
  if (!raw) throw new Error(fallback);
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(fallback);
  }
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const unit = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** unit).toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

export function KnowledgeBaseDashboard({ project }: { project: string }) {
  const productSpaceId = useWorkspaceContext(
    (state) => state.productSpaceId,
  );
  const projectId = useWorkspaceContext((state) => state.projectId);
  const releaseId = useWorkspaceContext((state) => state.releaseId);
  const environmentId = useWorkspaceContext(
    (state) => state.environmentId,
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [stats, setStats] = useState<KnowledgeStats>({
    documents: 0,
    chunks: 0,
    embedded_chunks: 0,
    embedded_documents: 0,
    processing: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");

  const scopeQuery = useMemo(() => {
    const query = new URLSearchParams();
    if (productSpaceId) query.set("productSpaceId", productSpaceId);
    if (projectId) query.set("projectId", projectId);
    return query.toString();
  }, [productSpaceId, projectId]);

  const load = useCallback(
    async (quiet = false) => {
      if (!productSpaceId || !projectId) return;
      if (!quiet) setLoading(true);
      try {
        const [documentsResponse, statsResponse] = await Promise.all([
          fetch(`/api/knowledge-base/documents?${scopeQuery}`, {
            cache: "no-store",
          }),
          fetch(`/api/knowledge-base/stats?${scopeQuery}`, {
            cache: "no-store",
          }),
        ]);
        const [documentsBody, statsBody] = await Promise.all([
          readResponsePayload(
            documentsResponse,
            "Documents could not be loaded.",
          ),
          readResponsePayload(
            statsResponse,
            "Knowledge Base stats could not load.",
          ),
        ]);
        if (!documentsResponse.ok)
          throw new Error(
            responseMessage(documentsBody, "Documents could not be loaded."),
          );
        if (!statsResponse.ok)
          throw new Error(
            responseMessage(statsBody, "Knowledge Base stats could not load."),
          );
        const documentPayload = documentsBody as
          | { items?: KnowledgeDocument[] }
          | null;
        setDocuments(documentPayload?.items || []);
        setStats(statsBody as KnowledgeStats);
        setError("");
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Knowledge Base could not be loaded.",
        );
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [productSpaceId, projectId, scopeQuery],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const processing = documents.some((document) =>
    activeStatuses.has(document.doc_status),
  );

  useEffect(() => {
    if (!processing) return;
    const interval = window.setInterval(() => void load(true), 2000);
    return () => window.clearInterval(interval);
  }, [load, processing]);

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length || !productSpaceId || !projectId) return;
    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        if (releaseId) formData.append("release_id", releaseId);
        if (environmentId)
          formData.append("environment_id", environmentId);
        const response = await fetch(
          `/api/knowledge-base/documents?${scopeQuery}`,
          { method: "POST", body: formData },
        );
        const payload = await readResponsePayload(
          response,
          `Could not upload ${file.name}.`,
        );
        if (!response.ok)
          throw new Error(
            responseMessage(payload, `Could not upload ${file.name}.`),
          );
      }
      await load(true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Document upload failed.",
      );
    } finally {
      setUploading(false);
    }
  };

  const retry = async (document: KnowledgeDocument) => {
    setActionId(document.doc_id);
    setError("");
    try {
      const response = await fetch(
        `/api/knowledge-base/documents/${encodeURIComponent(document.doc_id)}/retry?${scopeQuery}`,
        { method: "POST" },
      );
      const payload = await readResponsePayload(
        response,
        "Retry could not start.",
      );
      if (!response.ok)
        throw new Error(responseMessage(payload, "Retry could not start."));
      await load(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Retry failed.");
    } finally {
      setActionId("");
    }
  };

  const remove = async (document: KnowledgeDocument) => {
    if (
      !window.confirm(
        `Delete ${document.doc_nm} and all of its chunks from ${project}?`,
      )
    )
      return;
    setActionId(document.doc_id);
    setError("");
    try {
      const response = await fetch(
        `/api/knowledge-base/documents/${encodeURIComponent(document.doc_id)}?${scopeQuery}`,
        { method: "DELETE" },
      );
      const payload = await readResponsePayload(
        response,
        "Document could not be deleted.",
      );
      if (!response.ok)
        throw new Error(
          responseMessage(payload, "Document could not be deleted."),
        );
      await load(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Delete failed.");
    } finally {
      setActionId("");
    }
  };

  return (
    <>
      <section className="card knowledge-actions">
        <div>
          <span className="eyebrow">PROJECT KNOWLEDGE</span>
          <h2>Documents for {project}</h2>
          <p>
            Uploads inherit the active Product Space, Project, Release, and
            Environment context.
          </p>
        </div>
        <div>
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            multiple
            hidden
            onChange={uploadFiles}
          />
          <button
            className="quiet"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw />
            Refresh
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
          >
            {uploading ? <LoaderCircle className="spin" /> : <Upload />}
            {uploading ? "Uploading..." : "Upload Documents"}
          </button>
        </div>
      </section>

      {error && (
        <div className="knowledge-error" role="alert">
          <AlertCircle />
          <span>{error}</span>
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      <section className="source-metrics">
        <KnowledgeMetric
          label="Documents"
          value={String(stats.documents)}
          icon={<BookOpen />}
        />
        <KnowledgeMetric
          label="Chunks"
          value={String(stats.chunks)}
          icon={<FileText />}
        />
        <KnowledgeMetric
          label="Embedded chunks"
          value={String(stats.embedded_chunks)}
          icon={<Database />}
        />
      </section>

      {loading ? (
        <section className="card knowledge-empty">Loading documents...</section>
      ) : documents.length === 0 ? (
        <section className="card knowledge-empty">
          <Upload />
          <h2>No Knowledge Base documents exist for this project.</h2>
          <p>
            Upload PDF, DOCX, Markdown, or plain-text documents for {project}.
          </p>
          <button onClick={() => fileInput.current?.click()}>
            Upload Documents
          </button>
        </section>
      ) : (
        <section className="card knowledge-table-card">
          <div className="knowledge-table-heading">
            <div>
              <span className="eyebrow">INGESTION</span>
              <h2>Document processing</h2>
            </div>
            <span>
              {stats.processing
                ? `${stats.processing} processing`
                : "All processing complete"}
              {stats.failed ? ` · ${stats.failed} failed` : ""}
            </span>
          </div>
          <div className="knowledge-table-scroll">
            <table className="knowledge-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Release</th>
                  <th>Environment</th>
                  <th>Pipeline</th>
                  <th>Chunks</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.doc_id}>
                    <td>
                      <strong>{document.doc_nm}</strong>
                      <small>
                        {document.doc_type.toUpperCase()} ·{" "}
                        {formatBytes(document.file_size_bytes)}
                      </small>
                    </td>
                    <td>{document.release_id ? "Selected release" : "All"}</td>
                    <td>{document.environment_id || "All"}</td>
                    <td>
                      <Pipeline status={document.doc_status} />
                    </td>
                    <td>
                      {document.embedded_chunk_count}/{document.chunk_count}
                    </td>
                    <td>
                      <span
                        className={`knowledge-status ${document.doc_status.toLowerCase()}`}
                      >
                        {document.doc_status}
                      </span>
                      {document.ingestion_error && (
                        <small title={document.ingestion_error}>
                          {document.ingestion_error_code}
                        </small>
                      )}
                    </td>
                    <td>
                      {new Date(
                        document.last_update_timestamp,
                      ).toLocaleString()}
                    </td>
                    <td>
                      <div className="knowledge-row-actions">
                        {document.doc_status === "FAILED" && (
                          <button
                            aria-label={`Retry ${document.doc_nm}`}
                            onClick={() => void retry(document)}
                            disabled={actionId === document.doc_id}
                          >
                            <RotateCcw />
                          </button>
                        )}
                        <button
                          aria-label={`Delete ${document.doc_nm}`}
                          onClick={() => void remove(document)}
                          disabled={actionId === document.doc_id}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

function KnowledgeMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="card source-metric">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function Pipeline({ status }: { status: KnowledgeDocument["doc_status"] }) {
  const order = [
    "PARSING",
    "PARSED",
    "CHUNKING",
    "CHUNKED",
    "EMBEDDING",
    "EMBEDDED",
  ];
  const position = order.indexOf(status);
  const stage = (
    name: "Parsing" | "Chunking" | "Embedding",
    start: number,
    complete: number,
  ) => {
    const failed = status === "FAILED";
    const done = position >= complete || status === "EMBEDDED";
    const active = position >= start && position < complete;
    return (
      <span className={done ? "done" : active ? "active" : failed ? "failed" : ""}>
        {done ? (
          <CheckCircle2 />
        ) : failed ? (
          <XCircle />
        ) : active ? (
          <LoaderCircle className="spin" />
        ) : (
          <i />
        )}
        {name}
      </span>
    );
  };
  return (
    <div className="knowledge-pipeline">
      {stage("Parsing", 0, 1)}
      {stage("Chunking", 2, 3)}
      {stage("Embedding", 4, 5)}
    </div>
  );
}
