export type GitHubSummaryBranch = {
  name: string;
  commit_sha: string | null;
  protected: boolean;
};

export type GitHubSummaryBranchResponse = {
  branches: GitHubSummaryBranch[];
  refreshed_at: string;
};

export type GitHubSummaryDocumentReference = {
  document_id: string;
  repository_url: string;
  repository_full_name: string;
  branch: string;
  commit_sha: string;
  title: string;
  generated_at: string;
  indexed_at: string | null;
  chunk_count: number;
};

export type GitHubLatestSummaryResponse = {
  summary: GitHubSummaryDocumentReference | null;
};

export type GitHubSummaryComponent = {
  name: string;
  paths: string[];
  responsibility: string;
};

export type GitHubSummaryEndpoint = {
  method: string;
  path: string;
  purpose: string;
  source_file: string | null;
};

export type GitHubRepositorySummaryResponse = {
  status: "completed";
  generated_at: string;
  duration_seconds: number;
  repository: {
    owner: string;
    name: string;
    full_name: string;
    url: string;
    visibility: string | null;
    description: string | null;
    default_branch: string;
    analyzed_ref: string;
    commit_sha: string | null;
    language_bytes: Record<string, number>;
    stars: number;
    forks: number;
    open_issues: number;
    archived: boolean;
    repository_url: string;
    repository_full_name: string;
    branch: string;
  };
  analysis: {
    archive_bytes: number;
    discovered_files: number;
    analyzed_files: number;
    skipped_files: number;
    analyzed_characters: number;
    batches: number;
    cache_hit: boolean;
    summary_chunks: number;
    embedded_chunks: number;
  };
  summary: {
    title: string;
    executive_summary: string;
    problem_statement: string;
    primary_capabilities: string[];
    architecture: string[];
    technology_stack: string[];
    key_components: GitHubSummaryComponent[];
    api_endpoints: GitHubSummaryEndpoint[];
    data_and_storage: string[];
    request_or_processing_flow: string[];
    setup_and_run: string[];
    strengths: string[];
    risks_and_gaps: string[];
    recommended_next_steps: string[];
    evidence_files: string[];
  };
  summary_markdown: string;
  model: string;
  artifact: {
    document_id: string;
    markdown_file: string;
    chunks_file: string;
    manifest_file: string;
    markdown_download_url: string;
    chunks_url: string;
    content_sha256: string;
    chunk_count: number;
    embedding_model: string;
    embedding_dimensions: number;
    indexed_at: string;
  } | null;
};
