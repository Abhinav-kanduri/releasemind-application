"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Database,
  FileSearch,
  GitBranch,
  Layers3,
  Network,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleAlert,
  Waypoints,
} from "lucide-react";
import {
  getFindingEvidence,
  getImpactFinding,
  getImpactFindings,
  getImpactGraph,
  getImpactHistory,
  getImpactObservability,
  getImpactRequirements,
  getImpactRun,
} from "@/lib/impact-analysis/api";
import type {
  ImpactEvidence,
  ImpactFinding,
  ImpactGraph,
  ImpactHistoryItem,
  ImpactObservability,
  ImpactRequirement,
  ImpactRun,
} from "@/lib/impact-analysis/types";
import { useWorkspaceContext } from "@/workspace-context";
import { RagEvidenceExplorer } from "./rag-evidence-explorer";
import { buildRagEvaluation } from "./rag-evaluation-adapter";
import { RagEvaluationTab } from "./rag-evaluation-tab";
import type { EvaluationNavigationTarget } from "./rag-metric-inspector";
import { RagGraphPanel, type GraphHealth } from "./rag-graph-panel";
import { buildRagStages, RagPipeline } from "./rag-pipeline";
import { buildRagStageDetail, RagStageInspector } from "./rag-stage-inspector";
import styles from "./rag-validation.module.css";

type View = "overview" | "trace" | "evidence" | "graph" | "evaluation";
const VIEWS: View[] = ["overview", "trace", "evidence", "graph", "evaluation"];

function viewFrom(value: string | null): View {
  return value && VIEWS.includes(value as View) ? (value as View) : "overview";
}

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function methodUsed(methods: Record<string, number>, needle: string) {
  return Object.entries(methods).some(
    ([name, count]) => count > 0 && name.toUpperCase().includes(needle),
  );
}

function displayMethod(name: string) {
  return name.replaceAll("_", " ").replace("FTS", "full-text");
}

export function RagValidationDashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const productSpaceId = useWorkspaceContext((state) => state.productSpaceId);
  const projectId = useWorkspaceContext((state) => state.projectId);
  const productSpace = useWorkspaceContext((state) => state.productSpace);
  const project = useWorkspaceContext((state) => state.project);
  const release = useWorkspaceContext((state) => state.release);
  const environment = useWorkspaceContext((state) => state.environment);
  const [view, setView] = useState<View>(() => viewFrom(params.get("view")));
  const [history, setHistory] = useState<ImpactHistoryItem[]>([]);
  const [runId, setRunId] = useState(params.get("runId") || "");
  const [run, setRun] = useState<ImpactRun | null>(null);
  const [observability, setObservability] =
    useState<ImpactObservability | null>(null);
  const [requirements, setRequirements] = useState<ImpactRequirement[]>([]);
  const [findings, setFindings] = useState<ImpactFinding[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState("");
  const [selectedFinding, setSelectedFinding] = useState<ImpactFinding | null>(null);
  const [evidence, setEvidence] = useState<ImpactEvidence[]>([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState("");
  const [expectedGraph, setExpectedGraph] = useState<ImpactGraph | null>(null);
  const [actualGraph, setActualGraph] = useState<ImpactGraph | null>(null);
  const [graphHealth, setGraphHealth] = useState<GraphHealth | null>(null);
  const [graphError, setGraphError] = useState("");
  const [selectedStage, setSelectedStage] = useState("retrieval");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const setRunUrl = useCallback(
    (nextRunId: string) => {
      const query = new URLSearchParams(params.toString());
      if (nextRunId) query.set("runId", nextRunId);
      else query.delete("runId");
      router.replace(`/rag-validation?${query.toString()}`, { scroll: false });
      setRunId(nextRunId);
    },
    [params, router],
  );

  const loadHistory = useCallback(async () => {
    if (!productSpaceId || !projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await getImpactHistory({ productSpaceId, projectId });
      setHistory(response.items);
      const requested = params.get("runId");
      const next =
        (requested && response.items.some((item) => item.run_id === requested)
          ? requested
          : response.items[0]?.run_id) || "";
      if (next !== runId) setRunUrl(next);
      if (!next) setLoading(false);
    } catch (cause) {
      setError(messageFrom(cause, "RAG Validation runs could not be loaded."));
      setLoading(false);
    }
  }, [params, productSpaceId, projectId, runId, setRunUrl]);

  useEffect(() => {
    void loadHistory();
  }, [productSpaceId, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!runId) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setGraphError("");
    Promise.all([
      getImpactRun(runId, controller.signal),
      getImpactRequirements(runId, controller.signal),
      getImpactFindings(runId, { pageSize: 200 }, controller.signal),
      getImpactObservability(runId, controller.signal),
      getImpactGraph(runId, "expected", controller.signal).catch((cause) => {
        setGraphError(messageFrom(cause, "Expected graph is unavailable."));
        return null;
      }),
      getImpactGraph(runId, "actual", controller.signal).catch((cause) => {
        setGraphError(messageFrom(cause, "Actual graph is unavailable."));
        return null;
      }),
      fetch("/api/graph/health", { cache: "no-store", signal: controller.signal })
        .then(async (response) => (response.ok ? ((await response.json()) as GraphHealth) : null))
        .catch(() => null),
    ])
      .then(([nextRun, nextRequirements, nextFindings, nextObservability, expected, actual, health]) => {
        setRun(nextRun);
        setRequirements(nextRequirements);
        setFindings(nextFindings);
        setObservability(nextObservability);
        setExpectedGraph(expected);
        setActualGraph(actual);
        setGraphHealth(health);
        setSelectedFindingId((current) =>
          nextFindings.some((item) => item.finding_id === current)
            ? current
            : nextFindings[0]?.finding_id || "",
        );
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(messageFrom(cause, "The selected RAG trace could not be loaded."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [runId]);

  useEffect(() => {
    if (!selectedFindingId) {
      setSelectedFinding(null);
      setEvidence([]);
      return;
    }
    const controller = new AbortController();
    setDetailLoading(true);
    Promise.all([
      getImpactFinding(selectedFindingId, controller.signal),
      getFindingEvidence(selectedFindingId, controller.signal),
    ])
      .then(([finding, items]) => {
        setSelectedFinding(finding);
        setEvidence(items);
        setSelectedEvidenceId((current) =>
          items.some((item) => item.evidence_id === current)
            ? current
            : items[0]?.evidence_id || "",
        );
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(messageFrom(cause, "Requirement evidence could not be loaded."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });
    return () => controller.abort();
  }, [selectedFindingId]);

  const methods = observability?.retrieval.method_counts || {};
  const vectorUsed = methodUsed(methods, "VECTOR");
  const keywordUsed = methodUsed(methods, "KEYWORD");
  const structuredUsed = methodUsed(methods, "STRUCTURED");
  const graphUsed = methodUsed(methods, "GRAPH");
  const graphNodes = (expectedGraph?.nodes.length || 0) + (actualGraph?.nodes.length || 0);
  const totalRequirements = requirements.length || findings.length;
  const ragEvaluation = useMemo(
    () => (run ? buildRagEvaluation(run, findings) : null),
    [findings, run],
  );
  const stages = useMemo(
    () => (run ? buildRagStages(run, observability, graphNodes, ragEvaluation?.status) : []),
    [graphNodes, observability, ragEvaluation?.status, run],
  );
  const stage = stages.find((item) => item.id === selectedStage) || stages[0];
  const stageDetail = useMemo(
    () => run && stage
      ? buildRagStageDetail(stage.id, {
          run,
          observability,
          requirements,
          findings,
          expectedGraph,
          actualGraph,
          evaluation: ragEvaluation,
        })
      : null,
    [actualGraph, expectedGraph, findings, observability, ragEvaluation, requirements, run, stage],
  );
  const handleEvaluationNavigation = useCallback(
    (target: EvaluationNavigationTarget) => {
      if (target.requirementId) {
        const finding = findings.find(
          (item) => item.requirement_id === target.requirementId,
        );
        if (finding) setSelectedFindingId(finding.finding_id);
      }
      if (target.evidenceId) setSelectedEvidenceId(target.evidenceId);
      setView(target.view);
    },
    [findings],
  );

  if (!productSpaceId || !projectId)
    return (
      <main className={`dashboard ${styles.dashboard}`}>
        <div className={styles.emptyPage}><ShieldCheck /><h1>Select a Product Space and Project</h1><p>RAG traces are always project-scoped.</p></div>
      </main>
    );

  return (
    <main className={`dashboard ${styles.dashboard}`}>
      <div className={styles.breadcrumb}>
        <Link href="/assistant">AI Intelligence</Link><ChevronRight /><span>RAG Validation</span>
      </div>
      <header className={styles.hero}>
        <div>
          <span className="eyebrow">IMPACT ANALYSIS RAG OBSERVABILITY</span>
          <h1>RAG Validation</h1>
          <p>See exactly how planning intent becomes repository evidence, graph truth, an implementation finding, and a backend-calculated score.</p>
        </div>
        <div className={styles.runControl}>
          <label htmlFor="rag-run">Persisted analysis run</label>
          <select id="rag-run" value={runId} onChange={(event) => setRunUrl(event.target.value)}>
            {history.map((item) => <option key={item.run_id} value={item.run_id}>{item.scope?.key || "Run"} / {item.repository?.branch || "pending"} / {item.score == null ? item.status : item.score.toFixed(1)}</option>)}
          </select>
          <button onClick={loadHistory} disabled={loading} aria-label="Refresh RAG traces"><RefreshCw /></button>
        </div>
      </header>

      <section className={styles.scopeBar} aria-label="Resolved analysis scope">
        <Scope label="Product Space" value={productSpace?.name || "Not available"} />
        <Scope label="Project" value={project?.name || "Not available"} />
        <Scope label="Release" value={release?.name || "All releases"} />
        <Scope label="Environment" value={environment?.name || "Not captured by Impact Analysis"} warning={!environment?.id} />
        <Scope label="Work item" value={run?.scope?.key || "No run selected"} />
        <Scope label="Repository" value={run?.repository ? `${run.repository.name} / ${run.repository.branch}` : "Not pinned"} />
      </section>

      {error && <div className={styles.error} role="alert"><AlertCircle /><span>{error}</span><button onClick={() => setError("")}>Dismiss</button></div>}
      {loading && !run ? <div className={styles.loading}><RefreshCw /> Loading persisted RAG trace...</div> : !run ? (
        <div className={styles.emptyPage}><CircleDashed /><h2>No Impact Analysis runs yet</h2><p>Run Impact Analysis first, then inspect its RAG evidence here.</p><Link href="/impact-analysis">Open Impact Analysis <ArrowRight /></Link></div>
      ) : (
        <>
          <section className={styles.metrics}>
            <Metric icon={<BarChart3 />} label="Implementation score" value={run.score == null ? "N/A" : run.score.toFixed(1)} note="Backend calculated" />
            <Metric icon={<Layers3 />} label="Atomic requirements" value={String(totalRequirements)} note={`${run.counts?.present || 0} present / ${run.counts?.partial || 0} partial`} />
            <Metric icon={<FileSearch />} label="Persisted evidence" value={String(observability?.retrieval.persisted_evidence || 0)} note="Evaluator context evidence" />
            <Metric icon={<Waypoints />} label="Architecture graph" value={String(graphNodes)} note={`${(expectedGraph?.edges.length || 0) + (actualGraph?.edges.length || 0)} relationships`} />
            {ragEvaluation?.overallScore != null && <Metric icon={<ShieldCheck />} label="RAG quality" value={ragEvaluation.overallScore.toFixed(1)} note="Evaluation quality / 100" />}
          </section>

          <nav className={styles.tabs} aria-label="RAG validation views">
            {(["overview", "trace", "evidence", "graph", "evaluation"] as View[]).map((item) => (
              <button key={item} className={view === item ? styles.tabActive : ""} onClick={() => setView(item)}>{item === "trace" ? "Requirement Trace" : item === "graph" ? "Graph & Vector" : item === "evaluation" ? "RAG Evaluation" : item[0].toUpperCase() + item.slice(1)}</button>
            ))}
          </nav>

          {view === "overview" && (
            <>
              <section className={`card ${styles.sectionCard}`}>
                <SectionHeading eyebrow="CLICKABLE BACKEND EXECUTION" title="From planning scope to explainable evaluation" detail="Select a stage to inspect backend-grounded input, processing, output, quality, and lineage. Missing trace data stays visibly unavailable." />
                <RagPipeline stages={stages} selected={selectedStage} onSelect={setSelectedStage} />
                {stage && stageDetail && (
                  <RagStageInspector
                    stage={stage}
                    detail={stageDetail}
                    onNavigate={setView}
                  />
                )}
              </section>
              <section className={styles.systemGrid}>
                <SystemCard icon={<Database />} title="PostgreSQL structured index" state={structuredUsed ? "Used in this run" : "Not used"} tone={structuredUsed ? "good" : "muted"} detail={`${observability?.postgres.repository_index.searchable_chunks || 0} searchable repository chunks`} />
                <SystemCard icon={<Search />} title="PostgreSQL full-text search" state={keywordUsed ? "Used in this run" : "Not used"} tone={keywordUsed ? "good" : "muted"} detail={`${methods.KEYWORD_FTS || 0} persisted evidence matches`} />
                <SystemCard icon={<Layers3 />} title="Postgres pgvector" state={vectorUsed ? "Used in this run" : observability?.postgres.repository_index.vector_status || "Not indexed"} tone={vectorUsed ? "good" : "warning"} detail={`${observability?.postgres.repository_index.embedded_chunks || 0} / ${observability?.postgres.repository_index.total_chunks || 0} repository chunks embedded`} />
                <SystemCard icon={<Network />} title="Neo4j Graph RAG" state={graphUsed ? "Used in retrieval" : graphHealth?.status === "ok" ? "Connected / not retrieved" : "Unavailable"} tone={graphUsed ? "good" : "warning"} detail={`${graphNodes} run graph nodes available`} />
              </section>
              <section className={styles.overviewGrid}>
                <article className={`card ${styles.sectionCard}`}><SectionHeading eyebrow="RETRIEVAL METHODS" title="What actually found the evidence" detail="Counts come from persisted evidence metadata." /><div className={styles.methodList}>{Object.entries(methods).map(([name, count]) => <div key={name}><span>{displayMethod(name)}</span><strong>{count}</strong></div>)}{!Object.keys(methods).length && <p>No retrieval methods were persisted.</p>}</div></article>
                <article className={`card ${styles.sectionCard}`}><SectionHeading eyebrow="OBSERVABILITY GAPS" title="What this run cannot prove" detail="Unavailable values are deliberately not synthesized in the browser." /><div className={styles.gapList}>{Object.entries(observability?.instrumentation || {}).map(([name, available]) => <div key={name}>{available ? <CheckCircle2 /> : <TriangleAlert />}<span>{displayMethod(name)}</span><b>{available ? "Available" : "Not instrumented"}</b></div>)}</div></article>
              </section>
            </>
          )}

          {view === "trace" && (
            <section className={styles.traceLayout}>
              <aside className={`card ${styles.requirementList}`}><SectionHeading eyebrow="ATOMIC REQUIREMENTS" title={`${findings.length} findings`} detail="Select a requirement to explain its decision." />{findings.map((item) => <button key={item.finding_id} className={selectedFindingId === item.finding_id ? styles.requirementSelected : ""} onClick={() => setSelectedFindingId(item.finding_id)}><span>{item.requirement_id}</span><strong>{item.requirement}</strong><small data-status={item.status}>{item.status} / {item.confidence == null ? "N/A" : `${Math.round(item.confidence * 100)}%`}</small></button>)}</aside>
              <article className={`card ${styles.traceDetail}`}>{detailLoading || !selectedFinding ? <div className={styles.loading}><RefreshCw /> Loading requirement trace...</div> : <RequirementTrace finding={selectedFinding} run={run} evidence={evidence} />}</article>
            </section>
          )}

          {view === "evidence" && (
            <section className={`card ${styles.sectionCard}`}><SectionHeading eyebrow="EVIDENCE EXPLORER" title={selectedFinding ? `${selectedFinding.requirement_id} retrieved evidence` : "Select a requirement"} detail="Every row is persisted backend evidence at the pinned commit." /><RequirementPicker findings={findings} value={selectedFindingId} onChange={setSelectedFindingId} /><RagEvidenceExplorer evidence={evidence} selectedId={selectedEvidenceId} onSelect={setSelectedEvidenceId} /></section>
          )}

          {view === "graph" && (
            <>
              <section className={`card ${styles.sectionCard}`}><SectionHeading eyebrow="GRAPH RAG TRUTH" title="Expected architecture versus actual implementation" detail="Graph construction and graph retrieval are reported separately." /><RagGraphPanel expected={expectedGraph} actual={actualGraph} health={graphHealth} retrievalUsed={graphUsed} error={graphError} /></section>
              <section className={styles.vectorGrid}><VectorCard title="Repository source pgvector" total={observability?.postgres.repository_index.total_chunks || 0} embedded={observability?.postgres.repository_index.embedded_chunks || 0} status={observability?.postgres.repository_index.vector_status || "NOT AVAILABLE"} model={observability?.postgres.repository_index.embedding_model} dimensions={observability?.postgres.repository_index.embedding_dimensions} used={vectorUsed} /><VectorCard title="Knowledge Base pgvector" total={observability?.postgres.knowledge_base.total_chunks || 0} embedded={observability?.postgres.knowledge_base.embedded_chunks || 0} status={observability?.postgres.knowledge_base.vector_status || "NOT AVAILABLE"} model={observability?.postgres.knowledge_base.embedding_model} dimensions={observability?.postgres.knowledge_base.embedding_dimensions} used={false} note="Indexed and searchable, but the current Impact Analysis retriever does not query Knowledge Base chunks." /></section>
            </>
          )}

          {view === "evaluation" && ragEvaluation && (
            <RagEvaluationTab
              run={run}
              evaluation={ragEvaluation}
              productSpaceName={productSpace?.name || "Not available"}
              projectName={project?.name || "Not available"}
              releaseName={release?.name || "All releases"}
              expectedGraph={expectedGraph}
              actualGraph={actualGraph}
              onNavigate={handleEvaluationNavigation}
            />
          )}
        </>
      )}
    </main>
  );
}

function Scope({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) { return <div className={warning ? styles.scopeWarning : ""}><small>{label}</small><strong title={value}>{value}</strong></div>; }
function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) { return <article className="card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{note}</em></div></article>; }
function SectionHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) { return <div className={styles.sectionHeading}><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{detail}</p></div></div>; }
function SystemCard({ icon, title, state, detail, tone }: { icon: React.ReactNode; title: string; state: string; detail: string; tone: "good" | "warning" | "muted" }) { return <article className={`card ${styles.systemCard}`} data-tone={tone}><span>{icon}</span><div><small>{title}</small><strong>{state}</strong><p>{detail}</p></div></article>; }
function RequirementPicker({ findings, value, onChange }: { findings: ImpactFinding[]; value: string; onChange: (id: string) => void }) { return <label className={styles.requirementPicker}><Search /><span>Requirement</span><select value={value} onChange={(event) => onChange(event.target.value)}>{findings.map((item) => <option value={item.finding_id} key={item.finding_id}>{item.requirement_id} / {item.status}</option>)}</select></label>; }

function RequirementTrace({ finding, run, evidence }: { finding: ImpactFinding; run: ImpactRun; evidence: ImpactEvidence[] }) {
  return <><div className={styles.findingHeader}><div><span className="eyebrow">REQUIREMENT VALIDATION TRACE</span><h2>{finding.requirement_id}</h2><p>{finding.requirement}</p></div><span className={styles.findingStatus} data-status={finding.status}>{finding.status}<b>{finding.confidence == null ? "N/A" : `${Math.round(finding.confidence * 100)}%`}</b></span></div><div className={styles.lineage}>{[["Planning scope", run.scope?.key || "N/A"],["Atomic requirement", finding.requirement_id],["Retrieval", `${evidence.length} persisted items`],["Repository evidence", evidence[0]?.file_path || "No evidence"],["Comparator", finding.model_name || "Deterministic comparator"],["Decision", finding.status],["Score contribution", finding.score_contribution == null ? "N/A" : finding.score_contribution.toFixed(3)]].map(([label, value], index, items) => <div key={label}><article><small>{label}</small><strong>{value}</strong></article>{index < items.length - 1 && <ArrowRight />}</div>)}</div><div className={styles.reasonGrid}><section><span className="eyebrow">WHAT IS PRESENT</span><p>{finding.what_present || "No present implementation statement was persisted."}</p></section><section><span className="eyebrow">WHAT IS MISSING</span><p>{finding.what_missing || "No missing implementation statement was persisted."}</p></section><section><span className="eyebrow">WHY THIS DECISION</span><p>{finding.technical_reason || finding.explanation || "No decision explanation was persisted."}</p></section><section><span className="eyebrow">RECOMMENDATION</span><p>{finding.recommendation || "No recommendation was persisted."}</p></section></div><div className={styles.evaluatorBar}><div><small>Evaluation engine</small><strong>{finding.model_name || "Deterministic comparator"}</strong></div><div><small>Prompt/version</small><strong>{finding.prompt_version || "Not applicable"}</strong></div><div><small>Evidence supplied</small><strong>{evidence.length}</strong></div><div><small>Tokens / latency</small><strong>Not instrumented</strong></div></div></>;
}

function VectorCard({ title, total, embedded, status, model, dimensions, used, note }: { title: string; total: number; embedded: number; status: string; model?: string | null; dimensions?: number | null; used: boolean; note?: string }) {
  const coverage = total ? Math.round((embedded / total) * 100) : 0;
  return <article className={`card ${styles.vectorCard}`}><div><Database /><span><small>{title}</small><strong>{status.replaceAll("_", " ")}</strong></span><b data-used={used}>{used ? "Used in run" : "Not used in run"}</b></div><div className={styles.coverage}><span><i style={{ width: `${coverage}%` }} /></span><strong>{embedded} / {total}</strong><small>{coverage}% embedded</small></div><dl><div><dt>Model</dt><dd>{model || "Not available"}</dd></div><div><dt>Dimensions</dt><dd>{dimensions || "N/A"}</dd></div></dl>{note && <p>{note}</p>}</article>;
}
