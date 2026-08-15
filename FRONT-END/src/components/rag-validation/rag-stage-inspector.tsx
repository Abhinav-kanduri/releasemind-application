"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Braces,
  CheckCircle2,
  CircleDashed,
  Cpu,
  FileSearch,
  GitFork,
  Network,
  Sparkles,
} from "lucide-react";
import type {
  ImpactFinding,
  ImpactGraph,
  ImpactObservability,
  ImpactRequirement,
  ImpactRun,
} from "@/lib/impact-analysis/types";
import { metricDisplay } from "./rag-evaluation-adapter";
import type {
  RagEvaluationMetric,
  RagEvaluationModel,
} from "./rag-evaluation.types";
import type { RagStage } from "./rag-pipeline";
import styles from "./rag-validation.module.css";

type StageFact = {
  label: string;
  value: string;
  note?: string;
  available?: boolean;
};

type StageQuality = {
  label: string;
  value: string;
  source: string;
  available: boolean;
};

export type RagStageDetail = {
  input: StageFact[];
  processing: StageFact[];
  output: StageFact[];
  observation: string;
  warnings: string[];
  quality: StageQuality[];
  lineage: StageFact[];
  rawInput: Record<string, unknown>;
  rawOutput: Record<string, unknown>;
};

type DetailContext = {
  run: ImpactRun;
  observability: ImpactObservability | null;
  requirements: ImpactRequirement[];
  findings: ImpactFinding[];
  expectedGraph: ImpactGraph | null;
  actualGraph: ImpactGraph | null;
  evaluation: RagEvaluationModel | null;
};

const unavailable = (label: string, note: string): StageFact => ({
  label,
  value: "Not persisted",
  note,
  available: false,
});

const fact = (label: string, value: string, note?: string): StageFact => ({
  label,
  value,
  note,
  available: true,
});

const qualityUnavailable = (label: string, source: string): StageQuality => ({
  label,
  value: "N/A",
  source,
  available: false,
});

function countBy<T>(items: T[], key: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const value = key(item) || "UNKNOWN";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function compactCounts(counts: Record<string, number>) {
  const entries = Object.entries(counts);
  return entries.length
    ? entries.map(([name, count]) => `${name.replaceAll("_", " ")}: ${count}`).join(" · ")
    : "None persisted";
}

function stageMetric(
  evaluation: RagEvaluationModel | null,
  id: RagEvaluationMetric["id"],
): StageQuality {
  const metric = evaluation?.metrics.find((item) => item.id === id);
  return {
    label: metric?.name || id.replaceAll("_", " "),
    value: metric ? metricDisplay(metric) : "N/A",
    source:
      metric?.unavailableReason ||
      (metric?.evaluationMode === "GOLDEN_DATASET"
        ? "Golden dataset required"
        : "Evaluator measurement not persisted"),
    available: metric?.normalizedScore != null,
  };
}

function commonLineage(run: ImpactRun): StageFact[] {
  return [
    fact("Run", run.run_id),
    fact("Scope", run.scope?.key || run.scope?.id || "Unavailable"),
    fact("Repository", run.repository?.name || "Not pinned"),
    fact("Commit", run.repository?.commit_sha || "Not pinned"),
  ];
}

export function buildRagStageDetail(stageId: string, context: DetailContext): RagStageDetail {
  const {
    run,
    observability,
    requirements,
    findings,
    expectedGraph,
    actualGraph,
    evaluation,
  } = context;
  const repository = observability?.postgres.repository_index;
  const methods = observability?.retrieval.method_counts || {};
  const evidenceTypes = observability?.retrieval.evidence_type_counts || {};
  const statusCounts = countBy(findings, (item) => item.status);
  const requirementTypes = countBy(requirements, (item) => item.type);
  const expectedNodes = expectedGraph?.nodes.length || 0;
  const expectedEdges = expectedGraph?.edges.length || 0;
  const actualNodes = actualGraph?.nodes.length || 0;
  const actualEdges = actualGraph?.edges.length || 0;
  const vectorUsed = Object.entries(methods).some(
    ([name, count]) => count > 0 && name.toUpperCase().includes("VECTOR"),
  );
  const graphUsed = Object.entries(methods).some(
    ([name, count]) => count > 0 && name.toUpperCase().includes("GRAPH"),
  );
  const persistedEvidence = observability?.retrieval.persisted_evidence || 0;
  const base = {
    lineage: commonLineage(run),
    warnings: [] as string[],
  };

  switch (stageId) {
    case "scope":
      return {
        ...base,
        input: [
          fact("Scope type", run.scope?.type || "Unavailable"),
          fact("Scope ID", run.scope?.id || "Unavailable"),
          unavailable("Product / project IDs", "Not returned by the run detail contract"),
          unavailable("Release ID", "Not returned by the run detail contract"),
        ],
        processing: [
          fact("Backend stage", "SCOPE_RESOLUTION"),
          unavailable("Service / function trace", "Function-level execution is not instrumented"),
          unavailable("Duration", "Stage timestamps are not persisted"),
        ],
        output: [
          fact("Canonical work item", run.scope?.key || "Unavailable"),
          fact("Title", run.scope?.title || "Unavailable"),
          fact("Resolved type", run.scope?.type || "Unavailable"),
        ],
        observation: "The backend resolved the selected planning item into the canonical scope attached to this run.",
        quality: [qualityUnavailable("Scope resolution accuracy", "No labelled scope-resolution measurement is persisted")],
        rawInput: { scope_type: run.scope?.type, scope_id: run.scope?.id },
        rawOutput: { scope: run.scope },
      };

    case "requirements":
      return {
        ...base,
        input: [
          fact("Planning item", run.scope?.key || "Unavailable"),
          fact("Planning title", run.scope?.title || "Unavailable"),
          unavailable("Acceptance criteria", "Source planning fields are not exposed by this contract"),
          unavailable("Design context", "Design-context references are not returned by the run API"),
        ],
        processing: [
          fact("Backend stage", "REQUIREMENT_DECOMPOSITION"),
          unavailable("Model / prompt", "Decomposition provenance is not returned by the requirements API"),
          unavailable("Duration", "Stage timestamps are not persisted"),
        ],
        output: [
          fact("Atomic requirements", String(requirements.length)),
          fact("Requirement categories", compactCounts(requirementTypes)),
          fact("Weighted requirements", `${requirements.filter((item) => item.weight != null).length} / ${requirements.length}`),
          unavailable("Per-item provenance", "Requirement provenance is not persisted in the UI contract"),
        ],
        observation: `The backend produced ${requirements.length} atomic requirements from the resolved planning scope.`,
        quality: [qualityUnavailable("Decomposition coverage", "Approved atomic-requirement labels are required")],
        rawInput: { scope: run.scope },
        rawOutput: { requirements },
      };

    case "expected":
      return {
        ...base,
        input: [
          fact("Atomic requirements", String(requirements.length)),
          unavailable("Design context", "Design-context records are not returned by this endpoint"),
        ],
        processing: [
          fact("Backend stage", "EXPECTED_GRAPH"),
          fact("Operation", "Expected architecture graph build + sync"),
          unavailable("Schema validation result", "Validation output is not persisted in the run trace"),
        ],
        output: [
          fact("Expected nodes", String(expectedNodes)),
          fact("Expected relationships", String(expectedEdges)),
          unavailable("Missing / rejected nodes", "Graph-build diagnostics are not persisted"),
        ],
        observation: `The expected-graph endpoint exposes ${expectedNodes} nodes and ${expectedEdges} relationships for this run.`,
        quality: [qualityUnavailable("Expected graph coverage", "An approved architecture graph is required")],
        rawInput: { requirement_ids: requirements.map((item) => item.requirement_id) },
        rawOutput: { expected_graph: expectedGraph },
      };

    case "commit":
      return {
        ...base,
        input: [
          fact("Repository", run.repository?.name || "Not available"),
          fact("Requested ref", run.repository?.branch || "Not available"),
        ],
        processing: [
          fact("Backend stage", "GITHUB_SNAPSHOT"),
          fact("Operation", "Resolve ref and pin immutable commit"),
          unavailable("Snapshot duration", "Stage timing is not persisted"),
        ],
        output: [
          fact("Branch", run.repository?.branch || "Not pinned"),
          fact("Commit SHA", run.repository?.commit_sha || "Not pinned"),
          unavailable("Commit timestamp", "Not returned by the run detail contract"),
        ],
        observation: run.repository
          ? `Repository analysis was pinned to ${run.repository.commit_sha.slice(0, 8)} so downstream evidence can be reproduced.`
          : "No repository snapshot is attached to this run.",
        quality: [qualityUnavailable("Snapshot reproducibility", "Snapshot verification is not instrumented")],
        rawInput: { repository: run.repository?.name, ref: run.repository?.branch },
        rawOutput: { repository: run.repository },
      };

    case "index":
      return {
        ...base,
        input: [
          fact("Repository", run.repository?.name || "Not pinned"),
          fact("Commit", run.repository?.commit_sha || "Not pinned"),
        ],
        processing: [
          fact("Backend stages", "SOURCE_PARSING → SOURCE_INDEXING"),
          fact("Index target", "PostgreSQL repository source index"),
          unavailable("Parser diagnostics", "Per-parser results are not persisted"),
        ],
        output: [
          fact("Total chunks", String(repository?.total_chunks || 0)),
          fact("Searchable chunks", String(repository?.searchable_chunks || 0)),
          fact("Embedded chunks", `${repository?.embedded_chunks || 0} / ${repository?.total_chunks || 0}`),
          unavailable("Files / symbols / APIs", "Entity-level index counts are not returned by observability"),
        ],
        observation: `The repository index exposes ${repository?.searchable_chunks || 0} searchable chunks; ${repository?.embedded_chunks || 0} have embeddings.`,
        warnings: repository?.total_chunks && repository.embedded_chunks === 0
          ? ["Repository chunks are not embedded, so semantic vector retrieval cannot participate."]
          : [],
        quality: [qualityUnavailable("Parse completeness", "Expected file and symbol totals are not persisted")],
        rawInput: { repository: run.repository },
        rawOutput: { repository_index: repository },
      };

    case "retrieval":
      return {
        ...base,
        input: [
          fact("Requirements searched", String(requirements.length)),
          fact("Repository", run.repository?.name || "Not pinned"),
          fact("Commit", run.repository?.commit_sha || "Not pinned"),
          unavailable("Queries and filters", "Per-requirement retrieval inputs are not persisted"),
        ],
        processing: [
          fact("Backend stage", "EVIDENCE_RETRIEVAL"),
          fact("Observed methods", compactCounts(methods)),
          fact("Vector participation", vectorUsed ? "Used" : "Not used"),
          fact("Graph participation", graphUsed ? "Used" : "Not used"),
          unavailable("Candidate trace", "Candidates rejected before persistence are not instrumented"),
        ],
        output: [
          fact("Persisted evidence", String(persistedEvidence)),
          fact("Method counts", compactCounts(methods)),
          fact("Evidence types", compactCounts(evidenceTypes)),
          unavailable("Candidates found", "Pre-fusion candidate count is not persisted"),
        ],
        observation: `The backend persisted ${persistedEvidence} evidence records. ${vectorUsed ? "Vector retrieval participated." : "Vector retrieval did not participate."} ${graphUsed ? "Graph retrieval participated." : "Graph data was not used as a retrieval method."}`,
        warnings: [
          ...(!vectorUsed ? ["Semantic vector retrieval did not participate in this run."] : []),
          ...(!graphUsed ? ["Graph availability does not imply graph retrieval; no graph retrieval method was persisted."] : []),
        ],
        quality: [
          stageMetric(evaluation, "recall_at_k"),
          stageMetric(evaluation, "precision_at_k"),
          stageMetric(evaluation, "context_relevance"),
        ],
        rawInput: {
          requirement_ids: requirements.map((item) => item.requirement_id),
          repository: run.repository,
          queries: null,
          filters: null,
        },
        rawOutput: { persisted_evidence: persistedEvidence, method_counts: methods, evidence_type_counts: evidenceTypes },
      };

    case "evidence":
      return {
        ...base,
        input: [
          unavailable("Retrieval candidates", "Pre-fusion candidates are not persisted"),
          fact("Retrieval methods", compactCounts(methods)),
        ],
        processing: [
          fact("Operation", "Hybrid fusion and evidence materialization"),
          unavailable("Per-candidate score components", "Individual ranking features are not persisted"),
          unavailable("Reranker provenance", "No semantic-reranker trace is returned"),
        ],
        output: [
          fact("Persisted ranked evidence", String(persistedEvidence)),
          fact("Average score", observability?.retrieval.average_score?.toFixed(4) || "N/A"),
          fact("Maximum score", observability?.retrieval.maximum_score?.toFixed(4) || "N/A"),
          unavailable("Rejected candidates", "Rejected-candidate count is not instrumented"),
        ],
        observation: `Ranking produced ${persistedEvidence} persisted evidence records. Score aggregates are shown only when supplied by backend observability.`,
        quality: [stageMetric(evaluation, "mrr"), stageMetric(evaluation, "ndcg_at_k")],
        rawInput: { retrieval_method_counts: methods, candidates: null },
        rawOutput: {
          persisted_evidence: persistedEvidence,
          average_score: observability?.retrieval.average_score,
          maximum_score: observability?.retrieval.maximum_score,
          rejected_candidates: observability?.retrieval.rejected_candidates,
        },
      };

    case "graph":
      return {
        ...base,
        input: [
          fact("Expected graph", `${expectedNodes} nodes / ${expectedEdges} relationships`),
          fact("Actual graph", `${actualNodes} nodes / ${actualEdges} relationships`),
        ],
        processing: [
          fact("Backend stage", "ACTUAL_GRAPH"),
          fact("Graph retrieval", graphUsed ? "Observed in persisted evidence" : "Not observed"),
          unavailable("Path matching trace", "Matched and missing paths are not persisted"),
        ],
        output: [
          fact("Available graph nodes", String(expectedNodes + actualNodes)),
          fact("Available relationships", String(expectedEdges + actualEdges)),
          fact("Used for retrieval", graphUsed ? "Yes" : "No"),
          unavailable("Matches / missing nodes", "Graph comparison diagnostics are not returned"),
        ],
        observation: `Expected and actual graphs are available with ${expectedNodes + actualNodes} total nodes. ${graphUsed ? "Graph evidence participated in retrieval." : "The evidence metadata does not show graph retrieval."}`,
        warnings: graphUsed ? [] : ["Graph construction and graph retrieval are separate; this run exposes graph data but no graph retrieval evidence."],
        quality: [qualityUnavailable("Graph match coverage", "Persisted node and path match labels are required")],
        rawInput: { expected_graph: expectedGraph, actual_graph: actualGraph },
        rawOutput: { graph_retrieval_used: graphUsed, expected_nodes: expectedNodes, actual_nodes: actualNodes },
      };

    case "compare": {
      const confidenceCount = findings.filter((item) => item.confidence != null).length;
      return {
        ...base,
        input: [
          fact("Atomic requirements", String(requirements.length)),
          fact("Persisted evidence", String(persistedEvidence)),
          fact("Graph nodes available", String(expectedNodes + actualNodes)),
          unavailable("Comparator context", "Exact per-requirement comparator payloads are not persisted"),
        ],
        processing: [
          fact("Operation", "Expected-versus-actual finding classification"),
          fact("Finding engine", compactCounts(countBy(findings, (item) => item.model_name || "DETERMINISTIC_COMPARATOR"))),
          unavailable("Prompt input", "Only finding-level prompt/version metadata is returned when present"),
        ],
        output: [
          fact("Findings", String(findings.length)),
          fact("Status distribution", compactCounts(statusCounts)),
          fact("Confidence persisted", `${confidenceCount} / ${findings.length}`),
        ],
        observation: `The backend classified ${findings.length} findings: ${compactCounts(statusCounts)}.`,
        quality: [
          {
            label: "Confidence coverage",
            value: findings.length ? `${Math.round((confidenceCount / findings.length) * 100)}%` : "N/A",
            source: "Persisted finding confidence fields; this is coverage, not model accuracy",
            available: findings.length > 0,
          },
          stageMetric(evaluation, "faithfulness"),
          stageMetric(evaluation, "groundedness"),
        ],
        rawInput: { requirement_count: requirements.length, evidence_count: persistedEvidence, graph_nodes: expectedNodes + actualNodes },
        rawOutput: { finding_count: findings.length, status_counts: statusCounts },
      };
    }

    case "score":
      return {
        ...base,
        input: [
          fact("Findings", String(findings.length)),
          fact("Weighted findings", `${findings.filter((item) => item.weight != null).length} / ${findings.length}`),
          fact("Status distribution", compactCounts(statusCounts)),
        ],
        processing: [
          fact("Backend stage", "SCORING → PERSISTING"),
          fact("Calculation", "Deterministic weighted implementation score"),
          unavailable("Formula trace", "Per-finding arithmetic is not exposed at run level"),
        ],
        output: [
          fact("Implementation score", run.score == null ? "N/A" : `${run.score.toFixed(1)} / 100`),
          fact("Run status", run.status),
          fact("Persisted findings", String(findings.length)),
        ],
        observation: run.score == null
          ? "The backend has not persisted a final implementation score for this run."
          : `The deterministic backend calculation persisted an implementation score of ${run.score.toFixed(1)} out of 100.`,
        quality: [qualityUnavailable("Score calibration", "Approved finding labels and score expectations are required")],
        rawInput: { findings: findings.map((item) => ({ requirement_id: item.requirement_id, status: item.status, weight: item.weight, contribution: item.score_contribution })) },
        rawOutput: { score: run.score, status_counts: statusCounts, run_status: run.status },
      };

    case "evaluation": {
      const metrics = evaluation?.metrics || [];
      const availableMetrics = metrics.filter((item) => item.normalizedScore != null).length;
      return {
        ...base,
        input: [
          fact("Retrieval trace", `${persistedEvidence} persisted evidence records`),
          fact("Findings", String(findings.length)),
          unavailable("Approved golden labels", "No golden evidence dataset is attached to the run"),
          unavailable("Evaluator claims", "Online evaluator measurements are not persisted at run level"),
        ],
        processing: [
          fact("Evaluation layer", evaluation?.status || "N/A"),
          unavailable("Golden metric calculation", "Approved labels are required"),
          unavailable("Online LLM evaluator", "Structured evaluator judgments are not persisted"),
        ],
        output: [
          fact("Available metrics", `${availableMetrics} / ${metrics.length}`),
          fact("Overall RAG quality", evaluation?.overallScore == null ? "N/A" : `${evaluation.overallScore.toFixed(1)} / 100`),
          fact("Evaluation status", evaluation?.status || "N/A"),
        ],
        observation: availableMetrics
          ? `${availableMetrics} run-level evaluation metrics are available from persisted backend measurements.`
          : "RAG quality remains N/A because this run has neither approved golden retrieval labels nor persisted online evaluator measurements.",
        warnings: availableMetrics ? [] : ["Unavailable metrics are intentionally not estimated in the browser."],
        quality: metrics.map((metric) => ({
          label: metric.name,
          value: metricDisplay(metric),
          source: metric.unavailableReason || metric.existingDataSource,
          available: metric.normalizedScore != null,
        })),
        rawInput: { retrieval: observability?.retrieval, findings: findings.length, golden_labels: null, evaluator_claims: null },
        rawOutput: { status: evaluation?.status, overall_score: evaluation?.overallScore, metrics: metrics.map((metric) => ({ id: metric.id, score: metric.score, availability: metric.dataAvailability })) },
      };
    }

    default:
      return {
        ...base,
        input: [unavailable("Input", "No stage adapter is defined")],
        processing: [unavailable("Processing", "No stage adapter is defined")],
        output: [unavailable("Output", "No stage adapter is defined")],
        observation: "No backend-grounded stage detail is available.",
        quality: [qualityUnavailable("Quality", "No stage adapter is defined")],
        rawInput: {},
        rawOutput: {},
      };
  }
}

function FactList({ items }: { items: StageFact[] }) {
  return (
    <dl className={styles.stageFactList}>
      {items.map((item) => (
        <div key={item.label} data-available={item.available !== false}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          {item.note && <small>{item.note}</small>}
        </div>
      ))}
    </dl>
  );
}

function statusLabel(state: RagStage["state"]) {
  if (state === "complete") return "COMPLETED";
  if (state === "active") return "ACTIVE";
  if (state === "failed") return "FAILED";
  if (state === "warning") return "COMPLETED WITH GAPS";
  return "PENDING";
}

export function RagStageInspector({
  stage,
  detail,
  onNavigate,
}: {
  stage: RagStage;
  detail: RagStageDetail;
  onNavigate: (view: "evidence" | "graph" | "evaluation") => void;
}) {
  const [raw, setRaw] = useState<"input" | "output" | null>(null);
  useEffect(() => setRaw(null), [stage.id]);

  return (
    <article className={styles.stageInspectorPanel}>
      <header className={styles.stageInspectorHeader}>
        <div className={styles.stageTitle}>
          <span>{stage.number}</span>
          <div>
            <small>PIPELINE STAGE</small>
            <h3>{stage.label}</h3>
            <p>{stage.detail}</p>
          </div>
        </div>
        <div className={styles.stageBadges}>
          <b data-state={stage.state}>{statusLabel(stage.state)}</b>
          <span><CheckCircle2 /> Backend result</span>
          <span data-muted="true"><Sparkles /> AI explanation not persisted</span>
        </div>
      </header>

      {detail.warnings.length > 0 && (
        <div className={styles.stageWarnings}>
          <AlertTriangle />
          <div>{detail.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>
        </div>
      )}

      <div className={styles.stageIoGrid}>
        <section>
          <div className={styles.stageSectionTitle}><Braces /><span><small>01</small> Input</span></div>
          <FactList items={detail.input} />
        </section>
        <section>
          <div className={styles.stageSectionTitle}><FileSearch /><span><small>03</small> Output</span></div>
          <FactList items={detail.output} />
        </section>
      </div>

      <section className={styles.stageWideSection}>
        <div className={styles.stageSectionTitle}><Cpu /><span><small>02</small> Processing</span></div>
        <FactList items={detail.processing} />
      </section>

      <section className={styles.backendObservation}>
        <CheckCircle2 />
        <div><small>BACKEND-GROUNDED OBSERVATION</small><p>{detail.observation}</p></div>
      </section>

      <section className={styles.aiExplanationEmpty}>
        <Sparkles />
        <div>
          <small>04 · AI EXPLANATION</small>
          <h4>No stage-explainer record</h4>
          <p>The backend has not persisted a separate AI explanation for this stage. The browser will not invent what happened, why it happened, risks, or a recommended next step.</p>
        </div>
        <button disabled title="A persisted stage-explanation endpoint is required">Explain with AI</button>
      </section>

      <section className={styles.stageQuality}>
        <div className={styles.stageSectionTitle}><BarChart3 /><span><small>05</small> Quality</span></div>
        <div className={styles.qualityRows}>
          {detail.quality.map((item) => (
            <div key={item.label} data-available={item.available}>
              <strong>{item.label}</strong><b>{item.value}</b><span>{item.source}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.stageLineage}>
        <div className={styles.stageSectionTitle}><GitFork /><span><small>06</small> Lineage</span></div>
        <div>{detail.lineage.map((item, index) => (
          <div key={item.label}>
            <article><small>{item.label}</small><strong>{item.value}</strong></article>
            {index < detail.lineage.length - 1 && <Network />}
          </div>
        ))}</div>
      </section>

      {raw && (
        <section className={styles.rawStageData}>
          <div><Braces /><strong>Raw {raw}</strong><button onClick={() => setRaw(null)}>Close</button></div>
          <pre>{JSON.stringify(raw === "input" ? detail.rawInput : detail.rawOutput, null, 2)}</pre>
        </section>
      )}

      <footer className={styles.stageActions}>
        <button onClick={() => setRaw(raw === "input" ? null : "input")}><Braces /> Raw input</button>
        <button onClick={() => setRaw(raw === "output" ? null : "output")}><Braces /> Raw output</button>
        <button disabled title="Backend log references are not persisted"><CircleDashed /> Backend logs</button>
        <button onClick={() => onNavigate("evidence")}><FileSearch /> Evidence</button>
        <button onClick={() => onNavigate("graph")}><Network /> Graph</button>
        <button onClick={() => onNavigate("evaluation")}><BarChart3 /> Metrics</button>
        <button disabled title="A persisted stage-explanation endpoint is required"><Sparkles /> Explain with AI</button>
      </footer>
    </article>
  );
}
