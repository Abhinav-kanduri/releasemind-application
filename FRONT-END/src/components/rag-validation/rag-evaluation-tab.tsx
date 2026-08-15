"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  CircleDashed,
  FileSearch,
  GitBranch,
  Info,
  ShieldAlert,
} from "lucide-react";
import type { ImpactGraph, ImpactRun } from "@/lib/impact-analysis/types";
import { metricDisplay } from "./rag-evaluation-adapter";
import { RAG_METRIC_GROUPS } from "./rag-evaluation-policy";
import type {
  RagEvaluationCase,
  RagEvaluationMetric,
  RagEvaluationModel,
  RagMetricId,
} from "./rag-evaluation.types";
import { EvaluationPipeline } from "./rag-evaluation-pipeline";
import { MetricScoreCard } from "./rag-metric-card";
import {
  RagMetricInspector,
  type EvaluationNavigationTarget,
} from "./rag-metric-inspector";
import styles from "./rag-evaluation.module.css";

type RagEvaluationTabProps = {
  run: ImpactRun;
  evaluation: RagEvaluationModel;
  productSpaceName: string;
  projectName: string;
  releaseName: string;
  expectedGraph: ImpactGraph | null;
  actualGraph: ImpactGraph | null;
  onNavigate: (target: EvaluationNavigationTarget) => void;
};

const TABLE_METRICS: RagMetricId[] = [
  "recall_at_k",
  "precision_at_k",
  "context_relevance",
  "faithfulness",
  "groundedness",
  "hallucination_rate",
];

export function RagEvaluationTab({
  run,
  evaluation,
  productSpaceName,
  projectName,
  releaseName,
  expectedGraph,
  actualGraph,
  onNavigate,
}: RagEvaluationTabProps) {
  const params = useSearchParams();
  const requestedMetric = params.get("metric") as RagMetricId | null;
  const [inspectedMetric, setInspectedMetric] = useState<RagEvaluationMetric | null>(
    () => evaluation.metrics.find((metric) => metric.id === requestedMetric) || null,
  );
  const [selectedCaseId, setSelectedCaseId] = useState(
    evaluation.cases[0]?.findingId || "",
  );

  useEffect(() => {
    setSelectedCaseId(evaluation.cases[0]?.findingId || "");
    setInspectedMetric(evaluation.metrics.find((metric) => metric.id === requestedMetric) || null);
  }, [evaluation.runId, evaluation.cases, evaluation.metrics, requestedMetric]);

  const selectedCase = useMemo(
    () =>
      evaluation.cases.find((item) => item.findingId === selectedCaseId) ||
      evaluation.cases[0] ||
      null,
    [evaluation.cases, selectedCaseId],
  );

  return (
    <div className={styles.evaluationTab}>
      <section className={styles.evaluationHeader}>
        <div className={styles.evaluationTitle}>
          <span>RUN-SCOPED RAG QUALITY</span>
          <h2>RAG Evaluation</h2>
          <p>
            Retrieval, evaluator context, and finding quality for this persisted Impact Analysis run.
            Missing evaluation records remain N/A and are never converted to zero.
          </p>
        </div>
        <div className={styles.evaluationStatus} data-status={evaluation.status}>
          {evaluation.status === "AVAILABLE" ? <CheckCircle2 /> : <AlertTriangle />}
          <div><small>Evaluation status</small><strong>{evaluation.status === "N/A" ? "Insufficient evaluation data" : evaluation.status}</strong></div>
        </div>
        <div className={styles.runMetadata}>
          <RunFact label="Run ID" value={run.run_id} wide />
          <RunFact label="Product Space" value={productSpaceName} />
          <RunFact label="Project" value={projectName} />
          <RunFact label="Release" value={releaseName} />
          <RunFact label="Work Item" value={run.scope?.key || "N/A"} />
          <RunFact label="Repository" value={run.repository?.name || "N/A"} />
          <RunFact label="Branch / Ref" value={run.repository?.branch || "N/A"} />
          <RunFact label="Commit SHA" value={run.repository?.commit_sha || "N/A"} />
          <RunFact label="Implementation Score" value={run.score == null ? "N/A" : run.score.toFixed(1)} />
        </div>
      </section>

      <section className={styles.scoreSummary}>
        <article className={styles.overallQuality} data-status={evaluation.overallStatus}>
          <div><span>Overall RAG Quality</span><strong>{evaluation.overallScore == null ? "N/A" : `${evaluation.overallScore.toFixed(1)} / 100`}</strong></div>
          <p>{evaluation.overallScore == null ? "A run-level score needs complete, inspectable category metrics." : "Calculated from complete retrieval, context, and generation category scores."}</p>
          <b>{evaluation.status === "N/A" ? "No evaluated categories" : evaluation.status}</b>
        </article>
        <div className={styles.categoryScores}>
          {evaluation.categories.map((category) => (
            <article key={category.category} data-status={category.status}>
              <span>{category.label}</span>
              <strong>{category.score == null ? "N/A" : category.score.toFixed(1)}</strong>
              <small>{category.availableMetrics} of {category.totalMetrics} metrics available · {category.availability}</small>
            </article>
          ))}
        </div>
      </section>

      <div className={styles.scoreDistinction}>
        <Info />
        <p><strong>Implementation Score {run.score == null ? "N/A" : run.score.toFixed(1)}</strong> measures how much of the feature appears implemented. <strong>RAG Quality</strong> separately measures whether evidence was retrieved, contextualized, and evaluated correctly. Retrieval similarity, evidence confidence, evaluator confidence, and graph coverage are also distinct signals.</p>
      </div>

      {RAG_METRIC_GROUPS.map((group) => {
        const items = evaluation.metrics.filter((metric) => group.metricIds.includes(metric.id));
        return (
          <section className={styles.metricGroup} key={group.category}>
            <div className={styles.groupHeading}>
              <div><span>{group.category.toUpperCase()} EVALUATION</span><h3>{group.label}</h3></div>
              <p>{group.category === "retrieval" ? "Golden-labelled evidence is required for ranking-quality metrics." : group.category === "context" ? "Measures what evidence actually reached the evaluator." : "Measures whether evaluator claims answer the requirement and follow evidence."}</p>
            </div>
            <div className={styles.metricGrid}>
              {items.map((metric) => <MetricScoreCard key={metric.id} metric={metric} onOpen={setInspectedMetric} />)}
            </div>
          </section>
        );
      })}

      <section className={styles.pipelinePanel}>
        <div className={styles.groupHeading}><div><span>WHERE EACH METRIC LIVES</span><h3>RAG pipeline evaluation</h3></div><p>Metrics diagnose different stages and must not be treated as interchangeable scores.</p></div>
        <EvaluationPipeline />
      </section>

      <section className={styles.casesPanel}>
        <div className={styles.groupHeading}><div><span>ATOMIC REQUIREMENTS</span><h3>Evaluation Cases</h3></div><p>Rows use persisted findings. Metrics remain N/A until an evaluator record supplies their labelled calculation data.</p></div>
        {evaluation.cases.length ? (
          <div className={styles.casesTableWrap}>
            <table className={styles.casesTable}>
              <thead><tr><th>Requirement</th><th>Category</th><th>Finding</th>{TABLE_METRICS.map((id) => <th key={id}>{evaluation.metrics.find((metric) => metric.id === id)?.name}</th>)}<th>Overall Evaluation</th></tr></thead>
              <tbody>
                {evaluation.cases.map((item) => (
                  <tr key={item.findingId} data-selected={selectedCase?.findingId === item.findingId}>
                    <td><button type="button" onClick={() => setSelectedCaseId(item.findingId)}><strong>{item.requirementId}</strong><small>{item.requirement}</small></button></td>
                    <td>{item.category}</td><td><span className={styles.findingBadge} data-status={item.findingStatus}>{item.findingStatus}</span></td>
                    {TABLE_METRICS.map((id) => <td key={id}>{metricDisplay(item.metrics.find((metric) => metric.id === id) || evaluation.metrics.find((metric) => metric.id === id)!)}</td>)}
                    <td>{caseEvaluationStatus(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.noCases}><CircleDashed /><strong>No atomic requirements</strong><p>This persisted run has no evaluation cases.</p></div>
        )}
      </section>

      {selectedCase && (
        <RequirementEvaluation
          item={selectedCase}
          expectedGraph={expectedGraph}
          actualGraph={actualGraph}
          onOpen={setInspectedMetric}
          onNavigate={onNavigate}
        />
      )}

      <RagMetricInspector metric={inspectedMetric} onClose={() => setInspectedMetric(null)} onNavigate={(target) => { setInspectedMetric(null); onNavigate(target); }} />
    </div>
  );
}

function RunFact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div data-wide={wide}><small>{label}</small><strong title={value}>{value}</strong></div>;
}

function caseEvaluationStatus(item: RagEvaluationCase) {
  const available = item.metrics.filter((metric) => metric.dataAvailability === "AVAILABLE").length;
  return available === item.metrics.length ? "AVAILABLE" : available ? "PARTIAL" : "N/A";
}

function RequirementEvaluation({
  item,
  expectedGraph,
  actualGraph,
  onOpen,
  onNavigate,
}: {
  item: RagEvaluationCase;
  expectedGraph: ImpactGraph | null;
  actualGraph: ImpactGraph | null;
  onOpen: (metric: RagEvaluationMetric) => void;
  onNavigate: (target: EvaluationNavigationTarget) => void;
}) {
  const expectedMatches = requirementGraphMatches(expectedGraph, item.requirementId);
  const actualMatches = requirementGraphMatches(actualGraph, item.requirementId);
  return (
    <section className={styles.requirementEvaluation}>
      <header>
        <div><span>REQUIREMENT-LEVEL EVALUATION</span><h3>{item.requirementId} RAG Evaluation</h3><p>{item.requirement}</p></div>
        <span className={styles.findingBadge} data-status={item.findingStatus}>{item.findingStatus}</span>
      </header>
      {RAG_METRIC_GROUPS.map((group) => (
        <div className={styles.requirementGroup} key={group.category}>
          <h4>{group.label.replace(" Quality", "")}</h4>
          <div>{item.metrics.filter((metric) => group.metricIds.includes(metric.id)).map((metric) => <MetricScoreCard key={metric.id} metric={metric} onOpen={onOpen} compact />)}</div>
        </div>
      ))}
      <div className={styles.requirementSignals}>
        <Signal icon={<FileSearch />} label="Selected evaluator evidence" value={String(item.evidenceCount)} note="Persisted evidence records" />
        <Signal icon={<Boxes />} label="Expected architecture nodes" value={expectedMatches == null ? "N/A" : String(expectedMatches)} note={expectedMatches == null ? "Requirement links not persisted" : "Requirement-linked nodes"} />
        <Signal icon={<GitBranch />} label="Actual architecture matches" value={actualMatches == null ? "N/A" : String(actualMatches)} note={actualMatches == null ? "Requirement links not persisted" : "Requirement-linked nodes"} />
        <Signal icon={<BarChart3 />} label="Score contribution" value={item.scoreContribution == null ? "N/A" : item.scoreContribution.toFixed(3)} note="Implementation score only" />
      </div>
      <div className={styles.requirementActions}>
        <button type="button" onClick={() => onNavigate({ view: "trace", requirementId: item.requirementId })}>Open Requirement Trace <ArrowRight /></button>
        <button type="button" onClick={() => onNavigate({ view: "evidence", requirementId: item.requirementId })}>Inspect Evidence <ArrowRight /></button>
        <button type="button" onClick={() => onNavigate({ view: "graph", requirementId: item.requirementId })}>Open Graph &amp; Vector <ArrowRight /></button>
      </div>
    </section>
  );
}

function Signal({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <article><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{note}</em></div></article>;
}

function requirementGraphMatches(graph: ImpactGraph | null, requirementId: string): number | null {
  if (!graph) return null;
  const labelled = graph.nodes.filter((node) => {
    const metadata = node.metadata;
    return metadata && (metadata.requirement_id != null || metadata.requirementId != null || metadata.requirement_ids != null);
  });
  if (!labelled.length) return null;
  return labelled.filter((node) => {
    const metadata = node.metadata || {};
    const direct = String(metadata.requirement_id || metadata.requirementId || "");
    const list = Array.isArray(metadata.requirement_ids) ? metadata.requirement_ids.map(String) : [];
    return direct === requirementId || list.includes(requirementId);
  }).length;
}
