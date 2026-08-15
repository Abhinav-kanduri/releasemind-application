import type { ImpactFinding, ImpactRun } from "@/lib/impact-analysis/types";
import {
  RAG_METRIC_DEFINITIONS,
  RAG_METRIC_GROUPS,
  metricStatus,
  summaryStatus,
} from "./rag-evaluation-policy";
import type {
  RagClaimEvaluation,
  RagDataAvailability,
  RagEvaluationCase,
  RagEvaluationMetric,
  RagEvaluationModel,
  RagEvidenceEvaluation,
  RagMetricDetails,
  RagMetricId,
  RagRankingEvaluation,
} from "./rag-evaluation.types";

type UnknownRecord = Record<string, unknown>;

const METRIC_ALIASES: Record<RagMetricId, string[]> = {
  recall_at_k: ["recall_at_k", "recall@k", "recall"],
  precision_at_k: ["precision_at_k", "precision@k", "precision"],
  hit_rate: ["hit_rate", "hitRate"],
  mrr: ["mrr", "mean_reciprocal_rank"],
  ndcg_at_k: ["ndcg_at_k", "ndcg@k", "ndcg"],
  context_relevance: ["context_relevance", "contextRelevance"],
  context_recall: ["context_recall", "contextRecall"],
  faithfulness: ["faithfulness"],
  answer_relevance: ["answer_relevance", "answerRelevance"],
  groundedness: ["groundedness"],
  hallucination_rate: ["hallucination_rate", "hallucinationRate", "hallucination"],
};

function record(value: unknown): UnknownRecord | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalized(value: number | null): number | null {
  if (value == null || value < 0) return null;
  const percentage = value <= 1 ? value * 100 : value;
  return percentage <= 100 ? Math.round(percentage * 10) / 10 : null;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(text).filter((item): item is string => item != null);
}

function evidenceList(value: unknown): RagEvidenceEvaluation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    const row = record(item);
    if (!row) return [];
    const label =
      text(row.label) || text(row.file_path) || text(row.source) || text(row.id);
    if (!label) return [];
    const relevance = text(row.relevance)?.toUpperCase();
    const allowed = ["RELEVANT", "WEAKLY_RELEVANT", "IRRELEVANT", "UNKNOWN"];
    return [
      {
        id: text(row.id) || text(row.evidence_id) || `evidence-${index + 1}`,
        label,
        source: text(row.source) || text(row.file_path),
        requirementId: text(row.requirement_id),
        relevance: allowed.includes(relevance || "")
          ? (relevance as RagEvidenceEvaluation["relevance"])
          : undefined,
        relevanceGrade: finite(row.relevance_grade),
        rank: finite(row.rank),
        score: finite(row.score),
        reason: text(row.reason),
      },
    ];
  });
}

function claimList(value: unknown): RagClaimEvaluation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    const row = record(item);
    const claim = row && (text(row.claim) || text(row.text));
    if (!row || !claim) return [];
    const candidate = text(row.status)?.toUpperCase() || "UNKNOWN";
    const status = ["SUPPORTED", "PARTIAL", "UNSUPPORTED", "UNKNOWN"].includes(candidate)
      ? (candidate as RagClaimEvaluation["status"])
      : "UNKNOWN";
    return [
      {
        id: text(row.id) || `claim-${index + 1}`,
        claim,
        status,
        evidence: evidenceList(row.evidence),
        requirementId: text(row.requirement_id),
      },
    ];
  });
}

function rankingList(value: unknown): RagRankingEvaluation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    const row = record(item);
    if (!row) return [];
    return [
      {
        caseId: text(row.case_id) || `case-${index + 1}`,
        label: text(row.label) || text(row.requirement_id) || `Case ${index + 1}`,
        firstRelevantRank: finite(row.first_relevant_rank),
        reciprocalRank: finite(row.reciprocal_rank),
        dcg: finite(row.dcg),
        idcg: finite(row.idcg),
        ndcg: finite(row.ndcg),
      },
    ];
  });
}

function detailsFrom(row: UnknownRecord | null): RagMetricDetails {
  const details = record(row?.details) || row || {};
  const concepts = Array.isArray(details.concepts)
    ? details.concepts.flatMap((item) => {
        const concept = record(item);
        const name = concept && text(concept.name);
        if (!concept || !name) return [];
        return [{ name, addressed: typeof concept.addressed === "boolean" ? concept.addressed : null }];
      })
    : [];
  return {
    expected: evidenceList(details.expected),
    retrieved: evidenceList(details.retrieved),
    matched: evidenceList(details.matched),
    missed: evidenceList(details.missed),
    irrelevant: evidenceList(details.irrelevant),
    claims: claimList(details.claims),
    rankings: rankingList(details.rankings),
    requiredFacts: stringList(details.required_facts),
    availableFacts: stringList(details.available_facts),
    missingFacts: stringList(details.missing_facts),
    concepts,
    totalContextChunks: finite(details.total_context_chunks),
    relevantContextChunks: finite(details.relevant_context_chunks),
    weaklyRelevantContextChunks: finite(details.weakly_relevant_context_chunks),
    irrelevantContextChunks: finite(details.irrelevant_context_chunks),
    totalContextTokens: finite(details.total_context_tokens),
    relevantContextTokens: finite(details.relevant_context_tokens),
    finalFinding: text(details.final_finding),
    evaluatorConfidence: finite(details.evaluator_confidence),
  };
}

function hasInspectableData(details: RagMetricDetails, numerator: number | null, denominator: number | null) {
  return (
    (numerator != null && denominator != null) ||
    details.expected.length > 0 ||
    details.retrieved.length > 0 ||
    details.claims.length > 0 ||
    details.rankings.length > 0 ||
    details.requiredFacts.length > 0 ||
    details.concepts.length > 0
  );
}

function metricSource(metadata: UnknownRecord, id: RagMetricId): UnknownRecord | null {
  const ragRoot = record(metadata.rag_evaluation) || record(metadata.ragEvaluation);
  const metrics = record(ragRoot?.metrics) || record(metadata.rag_metrics) || record(metadata.ragMetrics);
  if (!metrics) return null;
  for (const alias of METRIC_ALIASES[id]) {
    const candidate = record(metrics[alias]);
    if (candidate) return candidate;
  }
  return null;
}

function missingAvailability(mode: "ONLINE" | "GOLDEN_DATASET"): RagDataAvailability {
  return mode === "GOLDEN_DATASET" ? "GOLDEN_DATASET_REQUIRED" : "INSUFFICIENT_EVIDENCE";
}

function createMetric(
  runId: string,
  definition: (typeof RAG_METRIC_DEFINITIONS)[number],
  source: UnknownRecord | null,
  requirementId?: string,
): RagEvaluationMetric {
  const score = finite(source?.normalized_score) ?? finite(source?.normalizedScore) ?? finite(source?.score);
  const normalizedScore = normalized(score);
  const numerator = finite(source?.numerator);
  const denominator = finite(source?.denominator);
  const k = finite(source?.k) ?? definition.defaultK ?? null;
  const details = detailsFrom(source);
  const inspectable = hasInspectableData(details, numerator, denominator);
  const dataAvailability: RagDataAvailability =
    normalizedScore == null
      ? missingAvailability(definition.evaluationMode)
      : inspectable
        ? "AVAILABLE"
        : "PARTIAL";
  const calculation =
    text(source?.calculation) ||
    (numerator != null && denominator != null
      ? `${numerator} / ${denominator} = ${denominator === 0 ? "undefined" : `${normalized(numerator / denominator)}%`}`
      : null);
  const unavailableReason =
    normalizedScore == null
      ? definition.evaluationMode === "GOLDEN_DATASET"
        ? "Golden evidence required"
        : "Evaluator measurement not persisted"
      : !inspectable
        ? "Score exists, but the calculation records are not persisted"
        : null;
  return {
    ...definition,
    score,
    normalizedScore,
    status: normalizedScore == null ? "N/A" : metricStatus(definition.id, normalizedScore),
    k,
    numerator,
    denominator,
    calculation,
    dataAvailability,
    unavailableReason,
    runId,
    requirementId,
    details,
  };
}

function buildCase(runId: string, finding: ImpactFinding): RagEvaluationCase {
  const metadata = record(finding.evaluation_metadata) || {};
  return {
    findingId: finding.finding_id,
    requirementId: finding.requirement_id,
    requirement: finding.requirement,
    category: finding.category,
    findingStatus: finding.status,
    confidence: finding.confidence,
    scoreContribution: finding.score_contribution,
    evidenceCount: finding.evidence_count,
    metrics: RAG_METRIC_DEFINITIONS.map((definition) =>
      createMetric(runId, definition, metricSource(metadata, definition.id), finding.requirement_id),
    ),
  };
}

export function buildRagEvaluation(run: ImpactRun, findings: ImpactFinding[]): RagEvaluationModel {
  // The current run contract has no run-level RAG evaluation record. Do not average
  // requirement metrics here: Recall, MRR, NDCG, and claim metrics have distinct
  // aggregation rules that must be calculated and persisted by the backend evaluator.
  const metrics = RAG_METRIC_DEFINITIONS.map((definition) =>
    createMetric(run.run_id, definition, null),
  );
  const categories = RAG_METRIC_GROUPS.map((group) => {
    const items = metrics.filter((metric) => group.metricIds.includes(metric.id));
    const available = items.filter(
      (metric) => metric.dataAvailability === "AVAILABLE" && metric.normalizedScore != null,
    );
    const score =
      available.length === items.length
        ? available.reduce((total, metric) => total + (metric.normalizedScore || 0), 0) /
          available.length
        : null;
    return {
      category: group.category,
      label: group.label,
      score,
      status: summaryStatus(score),
      availability:
        available.length === items.length ? "AVAILABLE" as const : available.length ? "PARTIAL" as const : "N/A" as const,
      availableMetrics: available.length,
      totalMetrics: items.length,
    };
  });
  const completeCategories = categories.filter((category) => category.score != null);
  const overallScore =
    completeCategories.length === categories.length
      ? completeCategories.reduce((total, category) => total + (category.score || 0), 0) /
        completeCategories.length
      : null;
  const cases = findings.map((finding) => buildCase(run.run_id, finding));
  const availableCaseMetrics = cases.flatMap((item) => item.metrics).filter(
    (metric) => metric.dataAvailability === "AVAILABLE",
  ).length;
  return {
    runId: run.run_id,
    status: overallScore != null ? "AVAILABLE" : availableCaseMetrics ? "PARTIAL" : "N/A",
    overallScore,
    overallStatus: summaryStatus(overallScore),
    categories,
    metrics,
    cases,
  };
}

export function metricDisplay(metric: RagEvaluationMetric): string {
  if (metric.normalizedScore == null) return "N/A";
  if (metric.id === "mrr" || metric.id === "ndcg_at_k")
    return ((metric.score ?? metric.normalizedScore / 100)).toFixed(2);
  return `${metric.normalizedScore.toFixed(metric.normalizedScore % 1 ? 1 : 0)}%`;
}

export function availabilityLabel(value: RagDataAvailability): string {
  return value.replaceAll("_", " ");
}
