import { Database, GitBranch, LockKeyhole, X } from "lucide-react";
import type {
  ProjectRepository,
  RepositoryBranch,
} from "@/lib/impact-analysis/types";
import type { GitHubSummaryDocumentReference } from "@/lib/github-summary";
import { ProjectScopeBar } from "./project-scope-bar";

export function ConversationContextDrawer({
  projectName,
  release,
  environment,
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
  onClose,
}: {
  projectName: string;
  release: string;
  environment: string;
  repositories: ProjectRepository[];
  repositoryId: string;
  branches: RepositoryBranch[];
  branch: string;
  summary: GitHubSummaryDocumentReference | null;
  useSummary: boolean;
  loading: boolean;
  error: string;
  onRepository: (value: string) => void;
  onBranch: (value: string) => void;
  onUseSummary: (value: boolean) => void;
  onRefresh: () => void;
  onClose: () => void;
}) {
  return (
    <aside
      className="context-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Conversation context"
    >
      <header>
        <div>
          <h2>Conversation context</h2>
          <p>Choose what ReleaseLens can use in this conversation.</p>
        </div>
        <button onClick={onClose} aria-label="Close conversation context">
          <X />
        </button>
      </header>
      <div className="context-overview">
        <span><LockKeyhole /></span>
        <dl>
          <div><dt>Project</dt><dd>{projectName}</dd></div>
          <div><dt>Release</dt><dd>{release}</dd></div>
          <div><dt>Environment</dt><dd>{environment}</dd></div>
        </dl>
      </div>
      <div className="context-sources">
        <h3>Connected knowledge</h3>
        <span><Database /> Project Management</span>
        <span><GitBranch /> GitHub and generated summaries</span>
      </div>
      <ProjectScopeBar
        projectName={projectName}
        repositories={repositories}
        repositoryId={repositoryId}
        branches={branches}
        branch={branch}
        summary={summary}
        useSummary={useSummary}
        loading={loading}
        error={error}
        onRepository={onRepository}
        onBranch={onBranch}
        onUseSummary={onUseSummary}
        onRefresh={onRefresh}
      />
    </aside>
  );
}
