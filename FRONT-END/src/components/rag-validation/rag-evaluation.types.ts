export type RagMetricCategory = "retrieval" | "context" | "generation";

export type RagEvaluationMode = "ONLINE" | "GOLDEN_DATASET";

export type RagMetricStatus = "PASS" | "WARNING" | "FAIL" | "N/A";

export type RagDataAvailability =
  | "AVAILABLE"
  | "PARTIAL"
  | "GOLDEN_DATASET_REQUIRED"
  | "INSUFFICIENT_EVIDENCE"
  | "EVALUATION_FAILED"
  | "BACKEND_UNAVAILABLE";

export type RagMetricId =
  | "recall_at_k"
  | "precision_at_k"
  | "hit_rate"
  | "mrr"
  | "ndcg_at_k"
  | "context_relevance"
  | "context_recall"
  | "faithfulness"
  | "answer_relevance"
  | "groundedness"
  | "hallucination_rate";

export type RagEvidenceEvaluation = {
  id: string;
  label: string;
  source?: string | null;
  requirementId?: string | null;
  relevance?: "RELEVANT" | "WEAKLY_RELEVANT" | "IRRELEVANT" | "UNKNOWN";
  relevanceGrade?: number | null;
  rank?: number | null;
  score?: number | null;
  reason?: string | null;
};

export type RagClaimEvaluation = {
  id: string;
  claim: string;
  status: "SUPPORTED" | "PARTIAL" | "UNSUPPORTED" | "UNKNOWN";
  evidence: RagEvidenceEvaluation[];
  requirementId?: string | null;
};

export type RagRankingEvaluation = {
  caseId: string;
  label: string;
  firstRelevantRank?: number | null;
  reciprocalRank?: number | null;
  dcg?: number | null;
  idcg?: number | null;
  ndcg?: number | null;
};

export type RagMetricDetails = {
  expected: RagEvidenceEvaluation[];
  retrieved: RagEvidenceEvaluation[];
  matched: RagEvidenceEvaluation[];
  missed: RagEvidenceEvaluation[];
  irrelevant: RagEvidenceEvaluation[];
  claims: RagClaimEvaluation[];
  rankings: RagRankingEvaluation[];
  requiredFacts: string[];
  availableFacts: string[];
  missingFacts: string[];
  concepts: Array<{ name: string; addressed: boolean | null }>;
  totalContextChunks?: number | null;
  relevantContextChunks?: number | null;
  weaklyRelevantContextChunks?: number | null;
  irrelevantContextChunks?: number | null;
  totalContextTokens?: number | null;
  relevantContextTokens?: number | null;
  finalFinding?: string | null;
  evaluatorConfidence?: number | null;
};

export type RagEvaluationMetric = {
  id: RagMetricId;
  name: string;
  category: RagMetricCategory;
  evaluationMode: RagEvaluationMode;
  score: number | null;
  normalizedScore: number | null;
  status: RagMetricStatus;
  k?: number | null;
  numerator?: number | null;
  denominator?: number | null;
  definition: string;
  whyItMatters: string;
  interpretation: string;
  formula: string;
  calculation: string | null;
  dataAvailability: RagDataAvailability;
  unavailableReason?: string | null;
  requiredData: string;
  existingDataSource: string;
  missingBackendField?: string | null;
  runId: string;
  requirementId?: string | null;
  details: RagMetricDetails;
};

export type RagEvaluationCase = {
  findingId: string;
  requirementId: string;
  requirement: string;
  category: string;
  findingStatus: string;
  confidence?: number | null;
  scoreContribution?: number | null;
  evidenceCount: number;
  metrics: RagEvaluationMetric[];
};

export type RagCategorySummary = {
  category: RagMetricCategory;
  label: string;
  score: number | null;
  status: RagMetricStatus;
  availability: "AVAILABLE" | "PARTIAL" | "N/A";
  availableMetrics: number;
  totalMetrics: number;
};

export type RagEvaluationModel = {
  runId: string;
  status: "AVAILABLE" | "PARTIAL" | "N/A" | "EVALUATION_FAILED";
  overallScore: number | null;
  overallStatus: RagMetricStatus;
  categories: RagCategorySummary[];
  metrics: RagEvaluationMetric[];
  cases: RagEvaluationCase[];
};
