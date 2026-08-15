export type ImpactStatus = "PRESENT" | "PARTIAL" | "MISSING" | "UNKNOWN";

export type ImpactRunStatus =
  "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export type ImpactScopeType = "FEATURE" | "USER_STORY";

export type ImpactCounts = {
  present: number;
  partial: number;
  missing: number;
  unknown: number;
};

export type ImpactTimelineStatus =
  "PENDING" | "ACTIVE" | "COMPLETED" | "FAILED" | "CANCELLED";

export type ImpactTimelineStep = {
  stage: string;
  label: string;
  status: ImpactTimelineStatus;
  progress_percent: number;
  message?: string | null;
};

export type ImpactRunError = {
  code: string;
  message: string;
  stage: string;
};

export type ImpactRun = {
  run_id: string;
  status: ImpactRunStatus;
  stage: string;
  progress_percent: number;
  message?: string | null;
  timeline?: ImpactTimelineStep[];
  error?: ImpactRunError | null;
  created_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  score?: number | null;
  scope?: {
    type: ImpactScopeType;
    id: string;
    key?: string | null;
    title?: string | null;
  } | null;
  repository?: {
    repository_id: string;
    name: string;
    branch: string;
    commit_sha: string;
  } | null;
  counts?: ImpactCounts | null;
  previous_run_id?: string | null;
};

export type StartImpactAnalysisInput = {
  product_space_id: string;
  project_id: string;
  release_id: string | null;
  scope_type: ImpactScopeType;
  scope_id: string;
  project_repository_id: string;
  ref: string;
  force_repository_refresh: boolean;
  client_request_id: string;
};

export type ImpactRequirement = {
  requirement_id: string;
  text: string;
  type: string;
  weight?: number | null;
  status?: ImpactStatus | null;
};

export type ImpactFinding = {
  finding_id: string;
  requirement_id: string;
  requirement: string;
  category: string;
  status: ImpactStatus;
  what_present: string | null;
  what_missing: string | null;
  reason_code: string | null;
  technical_reason: string | null;
  explanation: string | null;
  impact: string | null;
  recommendation: string | null;
  confidence?: number | null;
  weight?: number | null;
  completion?: number | null;
  score_contribution?: number | null;
  evidence_count: number;
  code_generation_available: boolean;
  predicate_results?: Array<Record<string, unknown>>;
  model_name?: string | null;
  prompt_version?: string | null;
  evaluation_metadata?: Record<string, unknown>;
};

export type ImpactEvidenceType =
  | "SOURCE_CODE"
  | "TEST"
  | "CONFIGURATION"
  | "DATABASE_MIGRATION"
  | "DEPENDENCY"
  | "ARCHITECTURE_DOCUMENT"
  | "KNOWLEDGE_BASE"
  | "GRAPH_PATH"
  | "RETRIEVAL_TRACE"
  | string;

export type ImpactEvidence = {
  evidence_id: string;
  type: ImpactEvidenceType;
  repository?: string | null;
  commit_sha?: string | null;
  file_path?: string | null;
  symbol?: string | null;
  start_line?: number | null;
  end_line?: number | null;
  document_id?: string | null;
  document_name?: string | null;
  section?: string | null;
  retrieval_method?: string | null;
  retrieval_methods?: string[];
  supports?: ImpactStatus | null;
  direction?: string | null;
  rank?: number | null;
  score?: number | null;
  description: string;
  excerpt?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ImpactObservability = {
  run_id: string;
  postgres: {
    status: string;
    repository_index: {
      total_chunks: number;
      embedded_chunks: number;
      searchable_chunks: number;
      embedding_model?: string | null;
      embedding_dimensions?: number | null;
      vector_status: string;
      embedding_coverage_percent: number;
    };
    knowledge_base: {
      documents: number;
      total_chunks: number;
      embedded_chunks: number;
      embedding_model?: string | null;
      embedding_dimensions?: number | null;
      vector_status: string;
      embedding_coverage_percent: number;
    };
  };
  retrieval: {
    persisted_evidence: number;
    method_counts: Record<string, number>;
    evidence_type_counts: Record<string, number>;
    average_score: number | null;
    maximum_score: number | null;
    rejected_candidates: number | null;
  };
  instrumentation: Record<string, boolean>;
};

export type ImpactGraphView = "expected" | "actual" | "comparison";

export type ImpactGraphNode = {
  id: string;
  label: string;
  type?: string | null;
  status?: string | null;
  group?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ImpactGraphEdge = {
  id?: string | null;
  source: string;
  target: string;
  type?: string | null;
  label?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ImpactGraph = {
  view?: ImpactGraphView;
  nodes: ImpactGraphNode[];
  edges: ImpactGraphEdge[];
};

export type ImpactHistoryItem = ImpactRun;

export type ImpactHistoryResponse = {
  items: ImpactHistoryItem[];
  page?: number;
  page_size?: number;
  total?: number;
};

export type ReanalysisResponse = {
  previous_run_id: string;
  new_run_id: string;
  status: ImpactRunStatus;
};

export type ImpactRunComparison = {
  baseline_run_id: string;
  current_run_id: string;
  previous_score: number | null;
  new_score: number | null;
  score_delta: number | null;
  requirement_changes: Array<{
    requirement_id: string;
    requirement: string;
    previous_status: ImpactStatus | null;
    new_status: ImpactStatus | null;
    change: string;
  }>;
};

export type GeneratedFile = {
  path: string;
  status?: string | null;
  additions?: number | null;
  deletions?: number | null;
  diff?: string | null;
};

export type ValidationCheck = {
  name: string;
  status: string;
  duration_ms?: number | null;
  summary?: string | null;
  details_url?: string | null;
};

export type PullRequestInfo = {
  number?: number | null;
  url: string;
  title?: string | null;
  state: string;
  draft?: boolean;
  head?: string | null;
  base?: string | null;
  merged_at?: string | null;
};

export type GeneratedChange = {
  change_id: string;
  finding_id?: string | null;
  status: string;
  repository?: string | null;
  base_ref?: string | null;
  base_commit_sha?: string | null;
  created_at?: string | null;
  files?: GeneratedFile[];
  diff?: string | null;
  validation?: {
    status: string;
    checks?: ValidationCheck[];
  } | null;
  approval?: {
    decision: string;
    actor?: string | null;
    comment?: string | null;
    decided_at?: string | null;
  } | null;
  pull_request?: PullRequestInfo | null;
};

export type RemediationPromptTarget = "github_copilot_chat";

export type GenerateRemediationPromptOptions = {
  target: RemediationPromptTarget;
  target_repository: string | null;
  target_ref: string | null;
  include_related_requirements: boolean;
  include_test_plan: boolean;
  include_repository_warning: boolean;
};

export type RemediationPromptRepository = {
  name: string;
  ref: string;
  commit_sha: string;
};

export type SuggestedRemediationRepository = {
  name: string;
  ref: string;
  verified: boolean;
};

export type GeneratedRemediationPrompt = {
  prompt_id: string;
  run_id: string;
  requirement_id: string;
  title: string;
  target: RemediationPromptTarget;
  prompt_version: string;
  prompt: string;
  prompt_hash?: string | null;
  source_repository: RemediationPromptRepository;
  suggested_target_repository?: SuggestedRemediationRepository | null;
  repository_suitability: "suitable" | "possible_mismatch" | "unsuitable";
  warnings: string[];
  generated_at: string;
};
export type ImpactApiErrorBody = {
  code?: string;
  error?: string;
  message?: string;
  detail?: unknown;
  details?: unknown;
  retryable?: boolean;
};

export class ImpactApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  readonly retryable: boolean;

  constructor(input: {
    code?: string;
    message: string;
    status: number;
    details?: unknown;
    retryable?: boolean;
  }) {
    super(input.message);
    this.name = "ImpactApiError";
    this.code = input.code || "IMPACT_API_ERROR";
    this.status = input.status;
    this.details = input.details;
    this.retryable =
      input.retryable ?? (input.status === 408 || input.status >= 500);
  }
}

export type PlanningOption = {
  id: string;
  key: string;
  name: string;
  featureId?: string | null;
  releaseId?: string | null;
};

export type ImpactPlanningOptions = {
  features: PlanningOption[];
  stories: PlanningOption[];
};

export type ProjectRepository = {
  association_id: string;
  catalog_repository_id?: string;
  github_repository_id?: number;
  owner?: string;
  name: string;
  full_name: string;
  repository_url: string;
  default_branch: string;
  private?: boolean;
  archived?: boolean;
};

export type RepositoryBranch = {
  name: string;
  commit_sha?: string | null;
  protected?: boolean;
};
