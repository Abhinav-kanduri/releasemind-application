"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Braces,
  ChevronRight,
  CircleDot,
  Database,
  FileSearch,
  Network,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { useWorkspaceContext } from "@/workspace-context";
import styles from "./graph-analysis-dashboard.module.css";

type GraphHealth = {
  status: string;
  uri: string;
  database: string;
  version: string;
  framework: string;
};

type GraphResult = {
  text: string;
  score: number;
  metadata: Record<string, unknown>;
};

type GraphSearchResponse = {
  query: string;
  results: GraphResult[];
  count: number;
};

type ApiError = {
  error?: string;
  message?: string;
  detail?: { message?: string } | string;
};

function messageFrom(body: ApiError, fallback: string) {
  if (typeof body.detail === "string") return body.detail;
  return body.detail?.message || body.error || body.message || fallback;
}

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as ApiError;
  if (!response.ok) throw new Error(messageFrom(body, fallback));
  return body as T;
}

export function GraphAnalysisDashboard() {
  const productSpaceId = useWorkspaceContext((state) => state.productSpaceId);
  const projectId = useWorkspaceContext((state) => state.projectId);
  const project = useWorkspaceContext((state) => state.project);
  const release = useWorkspaceContext((state) => state.release);
  const environment = useWorkspaceContext((state) => state.environment);
  const [health, setHealth] = useState<GraphHealth | null>(null);
  const [schema, setSchema] = useState("");
  const [loading, setLoading] = useState(true);
  const [healthError, setHealthError] = useState("");
  const [schemaError, setSchemaError] = useState("");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(5);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResponse, setSearchResponse] =
    useState<GraphSearchResponse | null>(null);

  const connected = health?.status === "ok";
  const hasWorkspaceScope = Boolean(productSpaceId && projectId);

  const refresh = useCallback(async () => {
    setLoading(true);
    setHealthError("");
    setSchemaError("");
    try {
      const healthResponse = await fetch("/api/graph/health", {
        cache: "no-store",
      });
      const graphHealth = await readJson<GraphHealth>(
        healthResponse,
        "Neo4j health could not be loaded.",
      );
      setHealth(graphHealth);

      const schemaResponse = await fetch("/api/graph/schema", {
        cache: "no-store",
      });
      try {
        const graphSchema = await readJson<{ schema: string }>(
          schemaResponse,
          "Neo4j schema could not be loaded.",
        );
        setSchema(graphSchema.schema || "");
      } catch (error) {
        setSchema("");
        setSchemaError(
          error instanceof Error
            ? error.message
            : "Neo4j schema could not be loaded.",
        );
      }
    } catch (error) {
      setHealth(null);
      setSchema("");
      setHealthError(
        error instanceof Error
          ? error.message
          : "The Neo4j graph service is unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setSearchResponse(null);
    setSearchError("");
  }, [projectId, release?.id, environment?.id]);

  const scopeLabel = useMemo(
    () =>
      [
        project?.name,
        release?.name || "All releases",
        environment?.name || "All environments",
      ]
        .filter(Boolean)
        .join(" · "),
    [environment?.name, project?.name, release?.name],
  );

  const search = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (!normalizedQuery || searching || !connected || !hasWorkspaceScope)
      return;
    setSearching(true);
    setSearchError("");
    setSearchResponse(null);
    try {
      const response = await fetch("/api/graph/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: normalizedQuery, k: limit }),
      });
      setSearchResponse(
        await readJson<GraphSearchResponse>(
          response,
          "Graph semantic search could not be completed.",
        ),
      );
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : "Graph semantic search could not be completed.",
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <main
      className={`dashboard source-dashboard graph-analysis-dashboard ${styles.dashboard}`}
    >
      <div className="source-back">
        <Link href="/data-sources">Data Sources</Link>
        <ChevronRight />
        <span>Graph Analysis</span>
      </div>

      <div className="source-hero">
        <div>
          <span className="eyebrow">CONNECTED SOURCE · NEO4J GRAPH RAG</span>
          <h1>Graph Analysis</h1>
          <p>
            Inspect graph connectivity, discover the live schema, and search
            semantically indexed evidence through Neo4j and LangChain.
          </p>
        </div>
        <span className={`source-health ${connected ? "healthy" : "delayed"}`}>
          <i />
          {loading ? "Checking" : connected ? "Connected" : "Unavailable"}
        </span>
      </div>

      <section className="source-metrics" aria-label="Graph service metrics">
        <Metric
          icon={<CircleDot />}
          label="Connection"
          value={loading ? "Checking" : connected ? "Healthy" : "Offline"}
        />
        <Metric
          icon={<Database />}
          label="Neo4j database"
          value={health?.database || "Not available"}
        />
        <Metric
          icon={<Waypoints />}
          label="Runtime"
          value={health ? `Neo4j ${health.version}` : "LangChain"}
        />
      </section>

      {healthError && (
        <section className={`card ${styles.alert}`} role="alert">
          <AlertCircle />
          <div>
            <span className="eyebrow">CONNECTION REQUIRED</span>
            <h2>Neo4j is not available to ReleaseLens</h2>
            <p>{healthError}</p>
            <p>
              Start the Neo4j Compose service, run its migrations, and restart
              the FastAPI process so it reloads the graph configuration.
            </p>
          </div>
          <button onClick={refresh} disabled={loading}>
            <RefreshCw /> Try again
          </button>
        </section>
      )}

      {!hasWorkspaceScope && (
        <section className={`card ${styles.scopeNotice}`} role="status">
          <ShieldAlert />
          <div>
            <h2>Select a Product Space and Project</h2>
            <p>
              Workspace Context is required before running graph searches or
              interpreting retrieved evidence.
            </p>
          </div>
        </section>
      )}

      <section className={`card ${styles.pipeline}`}>
        <div className={styles.sectionHeading}>
          <div>
            <span className="eyebrow">END-TO-END RETRIEVAL</span>
            <h2>From question to nearest graph evidence</h2>
            <p>
              The endpoint returns ranked chunks and provenance metadata. It
              does not generate a final chat answer.
            </p>
          </div>
          <span className={styles.indexBadge}>1536 dimensions · cosine</span>
        </div>
        <div className={styles.flow}>
          {[
            ["01", "Query", "Validated text + top K", <Search key="query" />],
            [
              "02",
              "Embed",
              "OpenAI text-embedding-3-small",
              <Sparkles key="embed" />,
            ],
            [
              "03",
              "Vector search",
              "document_chunk_embedding",
              <Network key="vector" />,
            ],
            [
              "04",
              "Evidence",
              "DocumentChunk + score + metadata",
              <FileSearch key="evidence" />,
            ],
          ].map(([number, title, detail, icon], index) => (
            <div className={styles.flowStep} key={String(number)}>
              <article>
                <span>{number}</span>
                {icon}
                <strong>{title}</strong>
                <small>{detail}</small>
              </article>
              {index < 3 && (
                <span className={styles.flowArrow} aria-hidden="true">
                  <ArrowRight />
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className={styles.analysisGrid}>
        <section className={`card ${styles.modelCard}`}>
          <span className="eyebrow">GRAPH MODEL</span>
          <h2>Connected planning and evidence</h2>
          <p>
            The development schema links project intent to documents, chunks,
            and extracted entities.
          </p>
          <div
            className={styles.graphPath}
            aria-label="Neo4j relationship path"
          >
            {[
              ["Project", "HAS_DOCUMENT"],
              ["Document", "HAS_CHUNK"],
              ["DocumentChunk", "MENTIONS"],
              ["Entity", "RELATED_TO"],
            ].map(([node, relationship], index) => (
              <div key={node}>
                <span className={styles.graphNode}>{node}</span>
                {index < 3 && (
                  <span className={styles.relationship}>
                    {relationship}
                    <ArrowRight />
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className={styles.modelNote}>
            <Braces />
            <span>
              Planning nodes also include ProductSpace, Release, Feature, and
              UserStory relationships.
            </span>
          </div>
        </section>

        <section className={`card ${styles.schemaCard}`}>
          <div className={styles.compactHeading}>
            <div>
              <span className="eyebrow">LIVE DATABASE CONTRACT</span>
              <h2>Discovered Neo4j schema</h2>
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              aria-label="Refresh graph schema"
            >
              <RefreshCw />
            </button>
          </div>
          {loading ? (
            <div className={styles.schemaLoading}>Refreshing schema…</div>
          ) : schema ? (
            <pre>{schema}</pre>
          ) : (
            <div className={styles.schemaEmpty}>
              <Database />
              <p>
                {schemaError || "Schema is available after Neo4j connects."}
              </p>
            </div>
          )}
        </section>
      </div>

      <section className={`card ${styles.searchCard}`}>
        <div className={styles.sectionHeading}>
          <div>
            <span className="eyebrow">SEMANTIC GRAPH SEARCH</span>
            <h2>Find the nearest DocumentChunk evidence</h2>
            <p>
              Active workspace: <strong>{scopeLabel || "Not selected"}</strong>
            </p>
          </div>
          <span className={styles.globalBadge}>Global retrieval</span>
        </div>

        <div className={styles.scopeWarning}>
          <ShieldAlert />
          <p>
            Current backend limitation: the Graph API does not yet enforce
            Product Space, Project, Release, or Environment filters. Results may
            include chunks outside the selected workspace and must be reviewed
            before use in a release decision.
          </p>
        </div>

        <form className={styles.searchForm} onSubmit={search}>
          <label>
            <span>Question or retrieval query</span>
            <div>
              <Search />
              <input
                value={query}
                maxLength={4000}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="How does graph-aware document retrieval work?"
                aria-label="Graph search query"
              />
            </div>
          </label>
          <label className={styles.limit}>
            <span>Results</span>
            <select
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              aria-label="Graph result limit"
            >
              {[3, 5, 10, 15, 20].map((value) => (
                <option key={value} value={value}>
                  Top {value}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={
              !query.trim() || searching || !connected || !hasWorkspaceScope
            }
          >
            {searching ? (
              <RefreshCw className={styles.spinning} />
            ) : (
              <Network />
            )}
            {searching ? "Searching graph…" : "Search graph"}
          </button>
        </form>

        {searchError && (
          <div className={styles.inlineError} role="alert">
            <AlertCircle /> {searchError}
          </div>
        )}

        {searchResponse && (
          <div className={styles.results} aria-live="polite">
            <div className={styles.resultsHeading}>
              <div>
                <span className="eyebrow">RETRIEVAL RESULTS</span>
                <h3>{searchResponse.count} evidence chunks found</h3>
              </div>
              <small>No answer generation was performed</small>
            </div>
            {searchResponse.results.length ? (
              searchResponse.results.map((result, index) => {
                const score = Math.max(
                  0,
                  Math.min(100, Math.round(Number(result.score) * 100)),
                );
                return (
                  <article
                    className={styles.result}
                    key={`${index}-${result.text.slice(0, 30)}`}
                  >
                    <div className={styles.resultRank}>{index + 1}</div>
                    <div className={styles.resultBody}>
                      <p>{result.text}</p>
                      <div className={styles.metadata}>
                        {Object.entries(result.metadata || {})
                          .slice(0, 6)
                          .map(([key, value]) => (
                            <span key={key}>
                              <b>{key}</b> {String(value)}
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className={styles.score}>
                      <strong>{score}%</strong>
                      <small>Similarity</small>
                      <span>
                        <i style={{ width: `${score}%` }} />
                      </span>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className={styles.noResults}>
                <FileSearch />
                <div>
                  <strong>No embedded chunks were returned</strong>
                  <p>
                    The development seed contains text but no fake embeddings.
                    Ingest real 1536-dimensional chunk embeddings before search.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="card source-metric">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong title={value}>{value}</strong>
      </div>
    </article>
  );
}
