import {
  BarChart3,
  Boxes,
  CheckCircle2,
  CircleDashed,
  Database,
  FileSearch,
  GitCommitHorizontal,
  Network,
  Scale,
  Search,
  ShieldQuestion,
} from "lucide-react";
import type { ImpactObservability, ImpactRun } from "@/lib/impact-analysis/types";
import styles from "./rag-validation.module.css";

export type RagStage = {
  id: string;
  number: string;
  label: string;
  detail: string;
  state: "complete" | "active" | "warning" | "pending" | "failed";
  metric: string;
};

const icons = {
  scope: ShieldQuestion,
  requirements: Boxes,
  expected: Network,
  commit: GitCommitHorizontal,
  index: Database,
  retrieval: Search,
  evidence: FileSearch,
  graph: Network,
  compare: Scale,
  score: CheckCircle2,
  evaluation: BarChart3,
};

export function buildRagStages(
  run: ImpactRun,
  observability: ImpactObservability | null,
  graphNodes: number,
  evaluationStatus: "AVAILABLE" | "PARTIAL" | "N/A" | "EVALUATION_FAILED" = "N/A",
): RagStage[] {
  const complete = run.status === "COMPLETED";
  const failed = run.status === "FAILED";
  const timeline = new Map(
    (run.timeline || []).map((item) => [item.stage, item.status]),
  );
  const stateFor = (stage: string): RagStage["state"] => {
    const state = timeline.get(stage);
    if (state === "FAILED") return "failed";
    if (state === "ACTIVE") return "active";
    if (state === "COMPLETED" || complete) return "complete";
    return failed ? "pending" : "pending";
  };
  const repository = observability?.postgres.repository_index;
  const methods = observability?.retrieval.method_counts || {};
  const vectorUsed = Object.keys(methods).some((name) =>
    name.toUpperCase().includes("VECTOR"),
  );
  const graphUsed = Object.keys(methods).some((name) =>
    name.toUpperCase().includes("GRAPH"),
  );
  const stages: Array<Omit<RagStage, "number">> = [
    {
      id: "scope",
      label: "Resolve scope",
      detail: "Feature or user story + release",
      state: stateFor("SCOPE_RESOLUTION"),
      metric: run.scope?.key || "Scope unavailable",
    },
    {
      id: "requirements",
      label: "Atomic requirements",
      detail: "Planning intent decomposed",
      state: stateFor("REQUIREMENT_DECOMPOSITION"),
      metric: `${Object.values(run.counts || {}).reduce((sum, value) => sum + value, 0)} requirements`,
    },
    {
      id: "expected",
      label: "Expected graph",
      detail: "Architecture expectation synchronized",
      state: stateFor("EXPECTED_GRAPH"),
      metric: "Neo4j expected truth",
    },
    {
      id: "commit",
      label: "Pin repository",
      detail: "Immutable branch + commit",
      state: stateFor("GITHUB_SNAPSHOT"),
      metric: run.repository?.commit_sha.slice(0, 8) || "Not pinned",
    },
    {
      id: "index",
      label: "Parse & index",
      detail: "Files, symbols, chunks, relationships",
      state: stateFor("SOURCE_INDEXING"),
      metric: repository ? `${repository.total_chunks} chunks` : "N/A",
    },
    {
      id: "retrieval",
      label: "Hybrid retrieval",
      detail: "Structured + full-text + optional vector",
      state:
        repository && repository.embedded_chunks === 0
          ? "warning"
          : stateFor("EVIDENCE_RETRIEVAL"),
      metric: vectorUsed ? "Vector used" : "Vector not used",
    },
    {
      id: "evidence",
      label: "Rank evidence",
      detail: "RRF fusion and top evidence",
      state: stateFor("EVIDENCE_RETRIEVAL"),
      metric: `${observability?.retrieval.persisted_evidence || 0} persisted`,
    },
    {
      id: "graph",
      label: "Graph evidence",
      detail: "Expected and actual implementation graph",
      state: graphNodes ? (graphUsed ? "complete" : "warning") : "pending",
      metric: graphUsed ? "Used in retrieval" : `${graphNodes} nodes / not retrieval`,
    },
    {
      id: "compare",
      label: "Classify finding",
      detail: "Deterministic expected-vs-actual comparison",
      state: stateFor("EVIDENCE_RETRIEVAL"),
      metric: "Present / partial / missing / unknown",
    },
    {
      id: "score",
      label: "Score & persist",
      detail: "Weighted backend calculation",
      state: stateFor("SCORING"),
      metric: run.score == null ? "N/A" : `${run.score.toFixed(1)} / 100`,
    },
    {
      id: "evaluation",
      label: "RAG evaluation",
      detail: "Golden retrieval + online evaluator metrics",
      state:
        evaluationStatus === "AVAILABLE"
          ? "complete"
          : evaluationStatus === "EVALUATION_FAILED"
            ? "failed"
            : "warning",
      metric:
        evaluationStatus === "AVAILABLE"
          ? "Metrics available"
          : evaluationStatus === "PARTIAL"
            ? "Partially measured"
            : "N/A / data required",
    },
  ];
  return stages.map((stage, index) => ({
    ...stage,
    number: String(index + 1).padStart(2, "0"),
  }));
}

export function RagPipeline({
  stages,
  selected,
  onSelect,
}: {
  stages: RagStage[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className={styles.pipeline} aria-label="Impact Analysis RAG pipeline">
      {stages.map((stage, index) => {
        const Icon = icons[stage.id as keyof typeof icons] || CircleDashed;
        return (
          <div className={styles.pipelineItem} key={stage.id}>
            <button
              className={`${styles.stage} ${styles[stage.state]} ${
                selected === stage.id ? styles.stageSelected : ""
              }`}
              onClick={() => onSelect(stage.id)}
              aria-pressed={selected === stage.id}
            >
              <span className={styles.stageNumber}>
                {stage.number}
              </span>
              <Icon />
              <strong>{stage.label}</strong>
              <small>{stage.detail}</small>
              <em>{stage.metric}</em>
            </button>
            {index < stages.length - 1 && (
              <span className={styles.pipelineLink} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}
