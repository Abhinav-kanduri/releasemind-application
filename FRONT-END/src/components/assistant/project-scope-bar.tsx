import { FileCheck2, GitBranch, RefreshCw, ShieldCheck } from "lucide-react";
import type {
  ProjectRepository,
  RepositoryBranch,
} from "@/lib/impact-analysis/types";
import type { GitHubSummaryDocumentReference } from "@/lib/github-summary";

export function ProjectScopeBar({
  projectName,
  repositories,
  repositoryId,
  branches,
  branch,
  summary,
  useSummary,
  loading,
  error,
  onRepository,
  onBranch,
  onUseSummary,
  onRefresh,
}: {
  projectName: string;
  repositories: ProjectRepository[];
  repositoryId: string;
  branches: RepositoryBranch[];
  branch: string;
  summary: GitHubSummaryDocumentReference | null;
  useSummary: boolean;
  loading: boolean;
  error: string;
  onRepository: (repositoryId: string) => void;
  onBranch: (branch: string) => void;
  onUseSummary: (selected: boolean) => void;
  onRefresh: () => void;
}) {
  return (
    <section className="assistant-scope">
      <div className="scope-banner">
        <ShieldCheck />
        <span>
          <b>
            {useSummary
              ? "Generated summary scope locked"
              : "Project scope locked"}
          </b>
          <small>
            {useSummary && summary
              ? `Answers use the generated summary for ${summary.repository_full_name} · ${summary.branch}.`
              : `Answers use ${projectName} data only.`}
          </small>
        </span>
      </div>
      <div className="assistant-repository-scope">
        <label>
          <span>
            Repository
            {repositories.length
              ? ` · ${repositories.length} linked from Data Sources`
              : ""}
          </span>
          <select
            aria-label="Assistant repository"
            value={repositoryId}
            disabled={loading || !repositories.length}
            onChange={(event) => onRepository(event.target.value)}
          >
            {!repositories.length && (
              <option value="">No linked repositories</option>
            )}
            {repositories.map((repository) => (
              <option
                key={repository.association_id}
                value={repository.association_id}
              >
                {repository.full_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Branch</span>
          <select
            aria-label="Assistant repository branch"
            value={branch}
            disabled={loading || !branches.length}
            onChange={(event) => onBranch(event.target.value)}
          >
            {!branches.length && <option value="">No branches loaded</option>}
            {branches.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
                {item.protected ? " (protected)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label
          className={`assistant-summary-toggle ${summary ? "available" : ""}`}
        >
          <input
            type="checkbox"
            checked={useSummary}
            disabled={!summary || loading}
            onChange={(event) => onUseSummary(event.target.checked)}
          />
          <FileCheck2 />
          <span>
            <b>Use generated summary</b>
            <small>
              {summary
                ? `${summary.chunk_count} indexed chunks · ${summary.commit_sha.slice(0, 8)} · active automatically`
                : "Generate a summary for this branch in Data Sources → GitHub."}
            </small>
          </span>
        </label>
        <button
          type="button"
          className="assistant-scope-refresh"
          onClick={onRefresh}
          disabled={loading || !repositoryId || !branch}
          aria-label="Refresh generated summary status"
        >
          <RefreshCw className={loading ? "spin" : ""} />
        </button>
        <GitBranch className="assistant-scope-git-icon" aria-hidden="true" />
      </div>
      {error && (
        <small className="assistant-scope-error" role="alert">
          {error}
        </small>
      )}
    </section>
  );
}
