import type {
  RagEvaluationMetric,
  RagMetricCategory,
  RagMetricId,
  RagMetricStatus,
} from "./rag-evaluation.types";

export const RAG_EVALUATION_POLICY = {
  quality: { pass: 0.85, warning: 0.7 },
  inverseQuality: { pass: 0.05, warning: 0.12 },
} as const;

export type RagMetricDefinition = Pick<
  RagEvaluationMetric,
  | "id"
  | "name"
  | "category"
  | "evaluationMode"
  | "definition"
  | "whyItMatters"
  | "interpretation"
  | "formula"
  | "requiredData"
  | "existingDataSource"
  | "missingBackendField"
> & { defaultK?: number };

export const RAG_METRIC_DEFINITIONS: RagMetricDefinition[] = [
  {
    id: "recall_at_k",
    name: "Recall@K",
    category: "retrieval",
    evaluationMode: "GOLDEN_DATASET",
    defaultK: 5,
    definition:
      "The share of all known-relevant evidence that appeared in the top K retrieval results.",
    whyItMatters:
      "Low recall means important implementation evidence may never reach the evaluator.",
    interpretation:
      "Higher is better. Similarity scores alone cannot establish relevance.",
    formula: "Relevant expected evidence retrieved in Top K / Total expected relevant evidence",
    requiredData: "Expected relevant evidence labels and the ordered Top-K results for every evaluation case.",
    existingDataSource: "impact_evidence provides persisted ranks and retrieval scores only (PARTIAL).",
    missingBackendField: "Golden expected-evidence sets and relevance labels.",
  },
  {
    id: "precision_at_k",
    name: "Precision@K",
    category: "retrieval",
    evaluationMode: "GOLDEN_DATASET",
    defaultK: 5,
    definition: "The share of retrieved Top-K evidence that is labelled relevant.",
    whyItMatters: "Low precision fills evaluator context with distracting or misleading evidence.",
    interpretation: "Higher is better. Relevance must come from labels, not vector similarity.",
    formula: "Relevant results in Top K / Retrieved results in Top K",
    requiredData: "An ordered Top-K result set with a relevance label for every result.",
    existingDataSource: "impact_evidence provides rank and score but no relevance judgement (PARTIAL).",
    missingBackendField: "Per-result relevance labels.",
  },
  {
    id: "hit_rate",
    name: "Hit Rate",
    category: "retrieval",
    evaluationMode: "GOLDEN_DATASET",
    definition: "How often an evaluation case returned at least one known-relevant item.",
    whyItMatters: "Misses identify requirements for which the evaluator received no useful evidence.",
    interpretation: "Higher is better; case-level misses should always remain inspectable.",
    formula: "Evaluation cases with at least one relevant result / Total evaluation cases",
    requiredData: "Explicit evaluation cases, expected evidence, and relevance-labelled retrieval results.",
    existingDataSource: "Atomic requirements and persisted evidence exist, but they are not labelled evaluation cases (PARTIAL).",
    missingBackendField: "Evaluation-case labels, hit/miss outcomes, and expected evidence.",
  },
  {
    id: "mrr",
    name: "MRR",
    category: "retrieval",
    evaluationMode: "GOLDEN_DATASET",
    definition: "The mean reciprocal rank of the first relevant retrieval result.",
    whyItMatters: "MRR reveals whether the first useful item appears early enough to influence context selection.",
    interpretation: "1.0 is ideal. A no-hit case contributes zero.",
    formula: "Mean(1 / first relevant rank) across evaluation cases",
    requiredData: "Case-level ordered results and the first result labelled relevant in each case.",
    existingDataSource: "impact_evidence stores ranks without relevance labels (PARTIAL).",
    missingBackendField: "First-relevant rank per labelled evaluation case.",
  },
  {
    id: "ndcg_at_k",
    name: "NDCG@K",
    category: "retrieval",
    evaluationMode: "GOLDEN_DATASET",
    defaultK: 5,
    definition: "Ranking quality compared with an ideal ordering using graded relevance.",
    whyItMatters: "NDCG detects when highly relevant evidence is ranked below weaker evidence.",
    interpretation: "Higher is better; the score requires graded relevance judgements.",
    formula: "DCG@K / IDCG@K",
    requiredData: "Per-result graded relevance plus actual and ideal rankings.",
    existingDataSource: "Persisted evidence has retrieval scores, not graded relevance (PARTIAL).",
    missingBackendField: "Relevance grades, DCG, and ideal ranking data.",
  },
  {
    id: "context_relevance",
    name: "Context Relevance",
    category: "context",
    evaluationMode: "ONLINE",
    definition: "How much evaluator context was useful for evaluating the requirement.",
    whyItMatters: "Relevant retrieval can still become noisy or redundant evaluator context.",
    interpretation: "Higher is better when backed by per-context-item relevance judgements.",
    formula: "Relevant context items or tokens / Total context items or tokens",
    requiredData: "The exact evaluator context and a relevance judgement for each context item.",
    existingDataSource: "impact_evidence identifies persisted evaluator evidence but has no context-relevance labels (PARTIAL).",
    missingBackendField: "Context selection record, token counts, and per-item relevance evaluation.",
  },
  {
    id: "context_recall",
    name: "Context Recall",
    category: "context",
    evaluationMode: "GOLDEN_DATASET",
    definition: "Whether evaluator context contained all facts required for a correct decision.",
    whyItMatters: "A correct retriever is insufficient if context assembly drops a required fact.",
    interpretation: "Higher is better; required facts must be labelled in advance.",
    formula: "Required evidence facts available in context / Total required evidence facts",
    requiredData: "A labelled set of required facts and the exact facts available in evaluator context.",
    existingDataSource: "Requirements and context evidence exist without required-fact labels (PARTIAL).",
    missingBackendField: "Required evidence facts and fact-to-context matches.",
  },
  {
    id: "faithfulness",
    name: "Faithfulness",
    category: "generation",
    evaluationMode: "ONLINE",
    definition: "The share of evaluator claims supported by retrieved evidence.",
    whyItMatters: "An evaluator can produce plausible explanations that are not supported by the repository.",
    interpretation: "Higher is better; every claim must map to specific supporting evidence.",
    formula: "Supported claim weight / Total claim weight",
    requiredData: "Evaluator claims, support classifications, and claim-to-evidence mappings.",
    existingDataSource: "Impact findings persist explanations and evidence separately, not claim mappings (PARTIAL).",
    missingBackendField: "Atomic claims and claim-to-evidence support evaluations.",
  },
  {
    id: "answer_relevance",
    name: "Answer Relevance",
    category: "generation",
    evaluationMode: "ONLINE",
    definition: "Whether the evaluator explanation addresses the concepts in the atomic requirement.",
    whyItMatters: "A grounded explanation can still fail to answer the requirement being evaluated.",
    interpretation: "Higher is better when concept-level matches are persisted by the evaluator.",
    formula: "Requirement concepts addressed / Total labelled requirement concepts",
    requiredData: "Labelled requirement concepts and evaluator concept-match results.",
    existingDataSource: "Atomic requirement text and evaluator explanation exist without concept labels (PARTIAL).",
    missingBackendField: "Concept extraction and concept-addressed evaluations.",
  },
  {
    id: "groundedness",
    name: "Groundedness",
    category: "generation",
    evaluationMode: "ONLINE",
    definition: "How strongly the final finding is backed by repository or project evidence.",
    whyItMatters: "Implementation findings must remain auditable to the pinned source of truth.",
    interpretation: "Higher is better; confidence and implementation score are different measures.",
    formula: "Evidence-backed finding claim weight / Total finding claim weight",
    requiredData: "Finding claims, evidence references, and support classifications.",
    existingDataSource: "Findings and supporting evidence are persisted, but claim coverage is not evaluated (PARTIAL).",
    missingBackendField: "Finding claim decomposition and evidence-backed claim labels.",
  },
  {
    id: "hallucination_rate",
    name: "Hallucination Rate",
    category: "generation",
    evaluationMode: "ONLINE",
    definition: "The share of evaluator claims unsupported by evidence.",
    whyItMatters: "Unsupported evaluator claims can create false implementation findings.",
    interpretation: "Lower is better. This metric uses inverse status thresholds.",
    formula: "Unsupported claims / Total evaluator claims",
    requiredData: "Evaluator claims and explicit supported, partial, or unsupported classifications.",
    existingDataSource: "Evaluator explanations are persisted without claim-level support labels (PARTIAL).",
    missingBackendField: "Unsupported-claim labels and claim-to-evidence mappings.",
  },
];

export const RAG_METRIC_GROUPS: Array<{
  category: RagMetricCategory;
  label: string;
  metricIds: RagMetricId[];
}> = [
  {
    category: "retrieval",
    label: "Retrieval Quality",
    metricIds: ["recall_at_k", "precision_at_k", "hit_rate", "mrr", "ndcg_at_k"],
  },
  {
    category: "context",
    label: "Context Quality",
    metricIds: ["context_relevance", "context_recall"],
  },
  {
    category: "generation",
    label: "Generation Quality",
    metricIds: ["faithfulness", "answer_relevance", "groundedness", "hallucination_rate"],
  },
];

export function metricStatus(id: RagMetricId, normalizedScore: number | null): RagMetricStatus {
  if (normalizedScore == null) return "N/A";
  const score = normalizedScore / 100;
  if (id === "hallucination_rate") {
    if (score <= RAG_EVALUATION_POLICY.inverseQuality.pass) return "PASS";
    if (score <= RAG_EVALUATION_POLICY.inverseQuality.warning) return "WARNING";
    return "FAIL";
  }
  if (score >= RAG_EVALUATION_POLICY.quality.pass) return "PASS";
  if (score >= RAG_EVALUATION_POLICY.quality.warning) return "WARNING";
  return "FAIL";
}

export function summaryStatus(score: number | null): RagMetricStatus {
  if (score == null) return "N/A";
  if (score >= RAG_EVALUATION_POLICY.quality.pass * 100) return "PASS";
  if (score >= RAG_EVALUATION_POLICY.quality.warning * 100) return "WARNING";
  return "FAIL";
}
