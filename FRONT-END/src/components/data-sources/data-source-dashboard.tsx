"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ChevronRight,
  Database,
  Download,
  FileText,
  FolderGit2,
  GitBranch,
  RefreshCw,
  RotateCw,
} from "lucide-react";
import { useWorkspaceContext } from "@/workspace-context";
import { KnowledgeBaseDashboard } from "@/components/knowledge-base/knowledge-base-dashboard";
import type {
  GitHubRepositorySummaryResponse,
  GitHubSummaryBranch,
} from "@/lib/github-summary";


type Source = "github" | "project-management" | "knowledge-base";
type Item = {
  id: string;
  name: string;
  key?: string;
  description?: string | null;
  storyText?: string | null;
  status?: string;
  priority?: string;
  version?: number;
  storyPoints?: number | null;
  releaseId?: string | null;
  featureId?: string;
  sprintId?: string | null;
};
type Space = {
  id: string;
  name: string;
  projects: { id: string; name: string; key: string }[];
};
type Data = {
  spaces: Space[];
  project: { id: string; name: string; productSpaceId: string } | null;
  releases: Item[];
  features: Item[];
  stories: Item[];
  sprints: Item[];
  syncedAt?: string;
};
type GitHubRepository = {
  id: number;
  owner: string;
  name: string;
  full_name: string;
  repository_url: string;
  description: string | null;
  default_branch: string;
  visibility: string;
  private: boolean;
  archived: boolean;
  imported: boolean;
  association_id: string | null;
  updated_at: string | null;
};
type ImportedGitHubRepository = {
  association_id: string;
  catalog_repository_id: string;
  github_repository_id: number;
  product_space_id: string;
  product_space_name: string;
  project_id: string;
  project_name: string;
  owner: string;
  name: string;
  full_name: string;
  repository_url: string;
  description: string | null;
  default_branch: string;
  visibility: string;
  private: boolean;
  archived: boolean;
  linked_at: string;
  synced_at: string;
};
type RepositoryBranch = {
  name: string;
  commit_sha?: string | null;
  protected?: boolean;
  snapshot_id?: string | null;
  sync_status?: string | null;
  last_synced_at?: string | null;
};
type RepositoryBranchList = {
  branches: RepositoryBranch[];
  refreshed_at: string;
};
type RepositoryBranchSync = {
  snapshot_id: string;
  branch: string;
  commit_sha: string;
  status: string;
  cache_hit: boolean;
  synced_at: string;
  discovered_files: number;
  indexed_files: number;
  skipped_files: number;
  coverage_percent: number;
};
type AuthenticationStatus = "loading" | "authenticated" | "anonymous";
type ProjectAccessFailure = "none" | "authentication" | "membership";

const PROJECT_REPOSITORY_AUTH_MESSAGE =
  "Repository operations are unavailable until backend access is configured.";
const PROJECT_REPOSITORY_MEMBERSHIP_MESSAGE =
  "Your account is signed in but is not a member of the selected Project. Ask a Project administrator to grant access.";

const titles = {
  github: "GitHub",
  "project-management": "Project Management Tool",
  "knowledge-base": "Knowledge Base",
};

export function DataSourceDashboard({ source }: { source: Source }) {
  const router = useRouter(),
    params = useSearchParams();
  const productSpaceId = useWorkspaceContext((state) => state.productSpaceId),
    projectId = useWorkspaceContext((state) => state.projectId),
    releaseId = useWorkspaceContext((state) => state.releaseId) || "",
    selectRelease = useWorkspaceContext((state) => state.selectRelease);
  const [data, setData] = useState<Data | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [featureId, setFeatureId] = useState(params.get("featureId") || ""),
    [sprintId, setSprintId] = useState(params.get("sprintId") || ""),
    [storyId, setStoryId] = useState(params.get("userStoryId") || "");
  const previousProjectId = useRef(projectId);
  const load = useCallback(async () => {
    if (!productSpaceId || !projectId) {
      setData(null);
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      query.set("productSpaceId", productSpaceId);
      query.set("projectId", projectId);
      if (source === "project-management") {
        if (releaseId) query.set("releaseId", releaseId);
        if (featureId) query.set("featureId", featureId);
        if (sprintId) query.set("sprintId", sprintId);
        if (storyId) query.set("userStoryId", storyId);
      }
      const endpoint =
        source === "project-management"
          ? "/api/project-management/sync"
          : "/api/data-sources";
      const r = await fetch(`${endpoint}?${query}`, { cache: "no-store" });
      const body = await r.json();
      if (!r.ok)
        throw new Error(body.error || "Project Management API is unavailable.");
      setData(body as Data);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Project Management API is unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    productSpaceId,
    projectId,
    source,
    releaseId,
    featureId,
    sprintId,
    storyId,
  ]);
  useEffect(() => {
    void load();
  }, [load]);
  const features = useMemo(
    () =>
      data?.features.filter((x) => !releaseId || x.releaseId === releaseId) ??
      [],
    [data, releaseId],
  );
  const sprints = useMemo(
    () =>
      data?.sprints.filter(
        (s) =>
          !featureId ||
          data.stories.some(
            (x) => x.featureId === featureId && x.sprintId === s.id,
          ),
      ) ?? [],
    [data, featureId],
  );
  const stories = useMemo(
    () =>
      data?.stories.filter(
        (x) =>
          (!releaseId || x.releaseId === releaseId) &&
          (!featureId || x.featureId === featureId) &&
          (!sprintId || x.sprintId === sprintId),
      ) ?? [],
    [data, releaseId, featureId, sprintId],
  );
  const syncUrl = useCallback(
    (values: Record<string, string>) => {
      const q = new URLSearchParams(params.toString());
      Object.entries(values).forEach(([k, v]) =>
        v ? q.set(k, v) : q.delete(k),
      );
      router.replace(`?${q.toString()}`, { scroll: false });
    },
    [params, router],
  );
  useEffect(() => {
    if (previousProjectId.current === projectId) return;
    previousProjectId.current = projectId;
    setFeatureId("");
    setSprintId("");
    setStoryId("");
    syncUrl({ featureId: "", sprintId: "", userStoryId: "" });
  }, [projectId, syncUrl]);
  useEffect(() => {
    if (featureId && !features.some((x) => x.id === featureId)) {
      setFeatureId("");
      setSprintId("");
      setStoryId("");
      syncUrl({ featureId: "", sprintId: "", userStoryId: "" });
    }
  }, [featureId, features, syncUrl]);
  useEffect(() => {
    if (sprintId && !sprints.some((x) => x.id === sprintId)) {
      setSprintId("");
      setStoryId("");
      syncUrl({ sprintId: "", userStoryId: "" });
    }
  }, [sprintId, sprints, syncUrl]);
  useEffect(() => {
    if (storyId && !stories.some((x) => x.id === storyId)) {
      setStoryId("");
      syncUrl({ userStoryId: "" });
    }
  }, [storyId, stories, syncUrl]);
  return (
    <main className="dashboard source-dashboard">
      <div className="source-back">
        <Link href="/data-sources">Data Sources</Link>
        <ChevronRight />
        <span>{titles[source]}</span>
      </div>
      <div className="source-hero">
        <div>
          <span className="eyebrow">CONNECTED SOURCE</span>
          <h1>{titles[source]}</h1>
          <p>
            Project-scoped integration health, indexed content, and
            synchronization controls.
          </p>
        </div>
        <span className="source-health healthy">
          <i />
          {source === "knowledge-base" ? "Connected" : "Healthy"}
        </span>
      </div>
      {!productSpaceId ? (
        <Empty
          icon={<Database />}
          title="Select a Product Space"
          text="Choose a Product Space in Workspace Context to load its available Projects."
        />
      ) : !projectId ? (
        <Empty
          icon={<Database />}
          title="Select a Project"
          text="Choose a Project in Workspace Context to load project-scoped records and synchronization health."
        />
      ) : error ? (
        <section className="card source-state error">
          <AlertCircle />
          <div>
            <h2>
              {source === "project-management"
                ? "Project Management source unavailable"
                : `${titles[source]} source unavailable`}
            </h2>
            <p>{error}</p>
            <button onClick={load}>
              <RefreshCw />
              Try again
            </button>
          </div>
        </section>
      ) : loading ? (
        <LoadingState />
      ) : !data?.project ? (
        <Empty
          icon={<Database />}
          title="No projects are available"
          text="Create a Product Space and Project before connecting a source."
        />
      ) : source === "project-management" ? (
        <Planning
          data={data}
          releaseId={releaseId}
          featureId={featureId}
          sprintId={sprintId}
          storyId={storyId}
          features={features}
          sprints={sprints}
          stories={stories}
          set={(key, value) => {
            if (key === "releaseId") {
              selectRelease(value || null);
              return;
            }
            const setters = {
              featureId: setFeatureId,
              sprintId: setSprintId,
              userStoryId: setStoryId,
            };
            setters[key](value);
            syncUrl({ [key]: value });
          }}
          clear={() => {
            selectRelease(null);
            setFeatureId("");
            setSprintId("");
            setStoryId("");
            syncUrl({
              featureId: "",
              sprintId: "",
              userStoryId: "",
            });
          }}
          refresh={load}
        />
      ) : source === "github" ? (
        <GitHub
          project={data.project.name}
          productSpaceId={productSpaceId}
          projectId={projectId}
        />
      ) : (
        <KnowledgeBaseDashboard project={data.project.name} />
      )}
    </main>
  );
}
function LoadingState() {
  return (
    <section className="source-loading" aria-label="Loading dashboard">
      <div className="card skeleton" />
      <div className="card skeleton" />
      <div className="card skeleton wide" />
    </section>
  );
}
function Empty({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <section className="card source-state">
      {icon}
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </section>
  );
}
function Planning({
  data,
  releaseId,
  featureId,
  sprintId,
  storyId,
  features,
  sprints,
  stories,
  set,
  clear,
  refresh,
}: {
  data: Data;
  releaseId: string;
  featureId: string;
  sprintId: string;
  storyId: string;
  features: Item[];
  sprints: Item[];
  stories: Item[];
  set: (
    k: "releaseId" | "featureId" | "sprintId" | "userStoryId",
    v: string,
  ) => void;
  clear: () => void;
  refresh: () => void;
}) {
  const selected = [
    data.releases.find((x) => x.id === releaseId),
    data.features.find((x) => x.id === featureId),
    data.sprints.find((x) => x.id === sprintId),
    data.stories.find((x) => x.id === storyId),
  ].filter(Boolean) as Item[];
  return (
    <>
      <section className="card planning-card">
        <div className="section-head">
          <div>
            <span className="eyebrow">PLANNING CONTEXT</span>
            <h2>Filter project work</h2>
            {data.syncedAt && (
              <small>
                Last synced {new Date(data.syncedAt).toLocaleTimeString()}
              </small>
            )}
          </div>
          <div>
            <button className="quiet" onClick={clear}>
              Clear
            </button>
            <button onClick={refresh}>
              <RefreshCw />
              Sync from database
            </button>
          </div>
        </div>
        <div className="planning-grid">
          <Select
            label="PI Release"
            value={releaseId}
            all="All PI Releases"
            items={data.releases}
            onChange={(v) => set("releaseId", v)}
          />
          <Select
            label="Feature"
            value={featureId}
            all="All Features"
            items={features}
            onChange={(v) => set("featureId", v)}
          />
          <Select
            label="Sprint"
            value={sprintId}
            all="All Sprints"
            items={sprints}
            onChange={(v) => set("sprintId", v)}
          />
          <Select
            label="User Story"
            value={storyId}
            all="All User Stories"
            items={stories}
            onChange={(v) => set("userStoryId", v)}
          />
        </div>
        {selected.length > 0 && (
          <div className="context-chips" aria-label="Selected planning context">
            {selected.map((x, i) => (
              <span key={x.id}>
                {i > 0 && <ChevronRight />}
                <b title={x.name}>{x.name}</b>
              </span>
            ))}
          </div>
        )}
      </section>
      <section className="source-metrics">
        <Metric
          label="PI releases"
          value={String(data.releases.length)}
          icon={<RotateCw />}
        />
        <Metric
          label="Features"
          value={String(features.length)}
          icon={<Database />}
        />
        <Metric
          label="User stories"
          value={String(stories.length)}
          icon={<FileText />}
        />
      </section>
      <ProjectWork
        features={features}
        stories={stories}
        releases={data.releases}
        sprints={data.sprints}
      />
    </>
  );
}
function ProjectWork({
  features,
  stories,
  releases,
  sprints,
}: {
  features: Item[];
  stories: Item[];
  releases: Item[];
  sprints: Item[];
}) {
  const releaseName = (id?: string | null) =>
    releases.find((item) => item.id === id)?.name || "Unassigned";
  const sprintName = (id?: string | null) =>
    sprints.find((item) => item.id === id)?.name || "Unassigned";
  return (
    <section className="card project-work">
      <header>
        <span className="eyebrow">PROJECT WORK</span>
        <h2>Features and user stories</h2>
        <p>
          Complete content saved in the selected project and planning context.
        </p>
      </header>
      {features.length === 0 ? (
        <p className="project-work-empty">
          No Features match the current filters.
        </p>
      ) : (
        <div className="feature-list">
          {features.map((feature) => {
            const featureStories = stories.filter(
              (story) => story.featureId === feature.id,
            );
            return (
              <article className="feature-detail" key={feature.id}>
                <div className="work-heading">
                  <span className="work-key">{feature.key || "FEATURE"}</span>
                  <span className="work-status">
                    {feature.status || "Unknown"}
                  </span>
                </div>
                <h3>{feature.name}</h3>
                <p className="work-content">
                  {feature.description ||
                    "No Feature description has been saved."}
                </p>
                <dl className="work-metadata">
                  <div>
                    <dt>Priority</dt>
                    <dd>{feature.priority || "Unassigned"}</dd>
                  </div>
                  <div>
                    <dt>PI Release</dt>
                    <dd>{releaseName(feature.releaseId)}</dd>
                  </div>
                  <div>
                    <dt>Version</dt>
                    <dd>{feature.version ?? 1}</dd>
                  </div>
                  <div>
                    <dt>User Stories</dt>
                    <dd>{featureStories.length}</dd>
                  </div>
                </dl>
                <div className="story-list">
                  <h4>User Stories</h4>
                  {featureStories.length === 0 ? (
                    <p className="project-work-empty">
                      No User Stories match the current filters.
                    </p>
                  ) : (
                    featureStories.map((story) => (
                      <article className="story-detail" key={story.id}>
                        <div className="work-heading">
                          <span className="work-key">
                            {story.key || "STORY"}
                          </span>
                          <span className="work-status">
                            {story.status || "Unknown"}
                          </span>
                        </div>
                        <h5>{story.name}</h5>
                        <p className="work-content">
                          {story.storyText ||
                            "No User Story text has been saved."}
                        </p>
                        <dl className="work-metadata">
                          <div>
                            <dt>Priority</dt>
                            <dd>{story.priority || "Unassigned"}</dd>
                          </div>
                          <div>
                            <dt>Story points</dt>
                            <dd>{story.storyPoints ?? "Unestimated"}</dd>
                          </div>
                          <div>
                            <dt>Sprint</dt>
                            <dd>{sprintName(story.sprintId)}</dd>
                          </div>
                          <div>
                            <dt>Version</dt>
                            <dd>{story.version ?? 1}</dd>
                          </div>
                        </dl>
                      </article>
                    ))
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
function Select({
  label,
  value,
  all,
  items,
  onChange,
}: {
  label: string;
  value: string;
  all: string;
  items: Item[];
  onChange: (v: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{all}</option>
        {items.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
    </label>
  );
}
function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="card source-metric">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
function GitHub({
  project,
  productSpaceId,
  projectId,
}: {
  project: string;
  productSpaceId: string;
  projectId: string;
}) {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [linkedRepositories, setLinkedRepositories] = useState<
    ImportedGitHubRepository[]
  >([]);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState("");
  const [loadingRepositories, setLoadingRepositories] = useState(true);
  const [linking, setLinking] = useState(false);
  const [githubError, setGitHubError] = useState("");
  const [githubMessage, setGitHubMessage] = useState("");
  const [hasNextPage, setHasNextPage] = useState(false);
  const [summaryBranches, setSummaryBranches] = useState<GitHubSummaryBranch[]>(
    [],
  );
  const [selectedSummaryBranch, setSelectedSummaryBranch] = useState("");
  const [loadingSummaryBranches, setLoadingSummaryBranches] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [repositorySummary, setRepositorySummary] =
    useState<GitHubRepositorySummaryResponse | null>(null);

  const loadRepositories = useCallback(async () => {
    setLoadingRepositories(true);
    setGitHubError("");
    try {
      const query = new URLSearchParams({ projectId, perPage: "100" });
      const importedQuery = new URLSearchParams({ productSpaceId, projectId });
      const [availableResponse, importedResponse] = await Promise.all([
        fetch(`/api/github/repositories?${query}`, { cache: "no-store" }),
        fetch(`/api/github/repositories/imported?${importedQuery}`, {
          cache: "no-store",
        }),
      ]);
      const [availableBody, importedBody] = await Promise.all([
        availableResponse.json(),
        importedResponse.json(),
      ]);
      if (!availableResponse.ok)
        throw new Error(
          availableBody.error || "GitHub repositories could not be loaded.",
        );
      if (!importedResponse.ok)
        throw new Error(
          importedBody.error || "Linked repositories could not be loaded.",
        );
      setRepositories((availableBody.repositories || []) as GitHubRepository[]);
      setLinkedRepositories(
        (importedBody.repositories || []) as ImportedGitHubRepository[],
      );
      setHasNextPage(Boolean(availableBody.has_next_page));
    } catch (error) {
      setRepositories([]);
      setLinkedRepositories([]);
      setGitHubError(
        error instanceof Error
          ? error.message
          : "GitHub repositories could not be loaded.",
      );
    } finally {
      setLoadingRepositories(false);
    }
  }, [productSpaceId, projectId]);

  useEffect(() => {
    setSelectedRepositoryId("");
    setGitHubMessage("");
    void loadRepositories();
  }, [loadRepositories]);

  const linkRepository = async () => {
    const githubRepositoryId = Number(selectedRepositoryId);
    if (!githubRepositoryId) return;
    setLinking(true);
    setGitHubError("");
    setGitHubMessage("");
    try {
      const response = await fetch("/api/github/repositories/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubRepositoryId,
          productSpaceId,
          projectId,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || "The repository could not be linked.");
      setGitHubMessage(`${body.full_name} linked to ${body.project_name}.`);
      await loadRepositories();
    } catch (error) {
      setGitHubError(
        error instanceof Error
          ? error.message
          : "The repository could not be linked.",
      );
    } finally {
      setLinking(false);
    }
  };

  const selected = repositories.find(
    (repository) => String(repository.id) === selectedRepositoryId,
  );

  const loadSummaryBranches = async (repository: GitHubRepository) => {
    setLoadingSummaryBranches(true);
    setSummaryError("");
    setRepositorySummary(null);
    try {
      const query = new URLSearchParams({
        repositoryUrl: repository.repository_url,
      });
      const response = await fetch(
        `/api/github/repositories/branches?${query}`,
        {
          cache: "no-store",
        },
      );
      const body = (await response.json()) as {
        branches?: GitHubSummaryBranch[];
        error?: string;
        message?: string;
      };
      if (!response.ok)
        throw new Error(
          body.error ||
            body.message ||
            "Repository branches could not be loaded.",
        );
      const branches = Array.isArray(body.branches) ? body.branches : [];
      setSummaryBranches(branches);
      setSelectedSummaryBranch(
        branches.find((branch) => branch.name === repository.default_branch)
          ?.name ||
          branches[0]?.name ||
          "",
      );
    } catch (reason) {
      setSummaryBranches([]);
      setSelectedSummaryBranch("");
      setSummaryError(
        reason instanceof Error
          ? reason.message
          : "Repository branches could not be loaded.",
      );
    } finally {
      setLoadingSummaryBranches(false);
    }
  };

  const generateRepositorySummary = async () => {
    if (!selected || !selectedSummaryBranch) return;
    setGeneratingSummary(true);
    setSummaryError("");
    setRepositorySummary(null);
    try {
      const response = await fetch("/api/github/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryUrl: selected.repository_url,
          branch: selectedSummaryBranch,
          forceRefresh: false,
        }),
      });
      const body = (await response.json()) as
        GitHubRepositorySummaryResponse | { error?: string; message?: string };
      if (!response.ok)
        throw new Error(
          ("error" in body && body.error) ||
            ("message" in body && body.message) ||
            "The repository summary could not be generated.",
        );
      setRepositorySummary(body as GitHubRepositorySummaryResponse);
    } catch (reason) {
      setSummaryError(
        reason instanceof Error
          ? reason.message
          : "The repository summary could not be generated.",
      );
    } finally {
      setGeneratingSummary(false);
    }
  };
  return (
    <>
      <section className="source-metrics">
        <Metric
          label="Repositories"
          value={loadingRepositories ? "…" : String(repositories.length)}
          icon={<FolderGit2 />}
        />
        <Metric
          label="Linked repositories"
          value={String(linkedRepositories.length)}
          icon={<FileText />}
        />
        <Metric
          label="Connection status"
          value={
            linking
              ? "Linking"
              : linkedRepositories.length
                ? "Connected"
                : "Ready"
          }
          icon={<GitBranch />}
        />
      </section>
      <section className="card github-sync-card">
        <div className="section-head">
          <div>
            <span className="eyebrow">GITHUB PROJECT</span>
            <h2>Select a repository for {project}</h2>
            <p>
              Repositories accessible to the backend GitHub token are loaded
              directly from GitHub.
            </p>
          </div>
          <button
            className="quiet"
            onClick={loadRepositories}
            disabled={loadingRepositories || linking}
          >
            <RefreshCw />
            Refresh projects
          </button>
        </div>
        {githubError && (
          <div className="github-inline-error" role="alert">
            <AlertCircle />
            <span>{githubError}</span>
          </div>
        )}
        {githubMessage && (
          <div className="github-inline-success" role="status">
            <GitBranch />
            <span>{githubMessage}</span>
          </div>
        )}
        <div className="github-project-picker">
          <label>
            <span>GitHub project / repository</span>
            <select
              aria-label="GitHub project / repository"
              value={selectedRepositoryId}
              disabled={loadingRepositories || linking}
              onChange={(event) => {
                const repository = repositories.find(
                  (item) => String(item.id) === event.target.value,
                );
                setSelectedRepositoryId(event.target.value);
                setGitHubError("");
                setGitHubMessage("");
                setSummaryBranches([]);
                setSelectedSummaryBranch("");
                setRepositorySummary(null);
                setSummaryError("");
                if (repository) void loadSummaryBranches(repository);
              }}
            >
              <option value="">
                {loadingRepositories
                  ? "Loading GitHub projects…"
                  : "Select a GitHub project"}
              </option>
              {repositories.map((repository) => (
                <option key={repository.id} value={repository.id}>
                  {repository.imported ? "[Linked] " : ""}
                  {repository.full_name}
                  {repository.private ? " (Private)" : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={linkRepository}
            disabled={
              !selectedRepositoryId ||
              loadingRepositories ||
              linking ||
              selected?.imported
            }
          >
            <RotateCw />
            {linking
              ? "Linking repository..."
              : selected?.imported
                ? "Already linked"
                : "Link selected repository"}
          </button>
        </div>
        {selected && (
          <div className="github-selection">
            <strong>{selected.full_name}</strong>
            <span>
              {selected.description || "No repository description."} Default
              branch: {selected.default_branch}.{" "}
              {selected.imported
                ? "Already linked to this Project."
                : "Ready to link."}
            </span>
          </div>
        )}
        {selected && (
          <div className="github-summary-workflow">
            <label>
              <span>Repository branch</span>
              <select
                aria-label="Repository branch"
                value={selectedSummaryBranch}
                disabled={loadingSummaryBranches || generatingSummary}
                onChange={(event) => {
                  setSelectedSummaryBranch(event.target.value);
                  setRepositorySummary(null);
                  setSummaryError("");
                }}
              >
                <option value="">
                  {loadingSummaryBranches
                    ? "Loading branches..."
                    : "Select a branch"}
                </option>
                {summaryBranches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                    {branch.protected ? " (protected)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="quiet"
              disabled={loadingSummaryBranches || generatingSummary}
              onClick={() => void loadSummaryBranches(selected)}
            >
              <RefreshCw />
              Refresh branches
            </button>
            <button
              disabled={
                !selectedSummaryBranch ||
                loadingSummaryBranches ||
                generatingSummary
              }
              onClick={() => void generateRepositorySummary()}
            >
              <FileText />
              {generatingSummary ? "Generating summary..." : "Fetch summary"}
            </button>
          </div>
        )}
        {summaryError && (
          <div className="github-inline-error" role="alert">
            <AlertCircle />
            <span>{summaryError}</span>
          </div>
        )}
        {hasNextPage && (
          <p className="github-page-note">
            More repositories are available on the next backend API page.
          </p>
        )}
      </section>
      {repositorySummary && (
        <GitHubSummaryTables response={repositorySummary} />
      )}
      {linkedRepositories.length ? (
        <section className="card github-linked-card">
          <span className="eyebrow">LINKED TO THIS PROJECT</span>
          <h2>Connected GitHub repositories</h2>
          <div className="github-linked-list">
            {linkedRepositories.map((repository) => (
              <article key={repository.association_id}>
                <div>
                  <strong>{repository.full_name}</strong>
                  <span>
                    {repository.private ? "Private" : "Public"} repository ·{" "}
                    {repository.default_branch}
                  </span>
                </div>
                <time dateTime={repository.linked_at}>
                  Linked {new Date(repository.linked_at).toLocaleDateString()}
                </time>
              </article>
            ))}
          </div>
        </section>
      ) : !loadingRepositories && repositories.length === 0 && !githubError ? (
        <Empty
          icon={<FolderGit2 />}
          title="No GitHub projects are available."
          text="Check that GITHUB_TOKEN can read at least one repository."
        />
      ) : null}
    </>
  );
}

function GitHubSummaryTables({
  response,
}: {
  response: GitHubRepositorySummaryResponse;
}) {
  const persistedDocumentId = response.artifact?.document_id || "";
  const documentId = persistedDocumentId || "Not persisted";
  const [exporting, setExporting] = useState<"docx" | "pdf" | null>(null);
  const [exportError, setExportError] = useState("");
  const exportSummary = async (format: "docx" | "pdf") => {
    if (!persistedDocumentId || exporting) return;
    setExporting(format);
    setExportError("");
    try {
      const downloadResponse = await fetch(
        `/api/github/summary/${encodeURIComponent(persistedDocumentId)}/export?format=${format}`,
        { cache: "no-store" },
      );
      if (!downloadResponse.ok) {
        const body = (await downloadResponse.json().catch(() => null)) as {
          error?: string;
          message?: string;
        } | null;
        throw new Error(
          body?.error ||
            body?.message ||
            "The complete repository summary could not be downloaded.",
        );
      }
      const disposition = downloadResponse.headers.get("content-disposition") || "";
      const filename =
        /filename="?([^";]+)"?/i.exec(disposition)?.[1] ||
        `repository-summary.${format}`;
      const url = URL.createObjectURL(await downloadResponse.blob());
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (reason) {
      setExportError(
        reason instanceof Error
          ? reason.message
          : `The ${format.toUpperCase()} download could not be created.`,
      );
    } finally {
      setExporting(null);
    }
  };
  return (
    <section className="card github-summary-results">
      <header className="github-summary-results-header">
        <div>
          <span className="eyebrow">REPOSITORY SUMMARY</span>
          <h2>{response.summary.title}</h2>
          <p>{response.summary.executive_summary}</p>
        </div>
        <div className="github-summary-export-actions">
          <button
            type="button"
            disabled={!persistedDocumentId || exporting !== null}
            onClick={() => void exportSummary("docx")}
            title={
              !persistedDocumentId
                ? "The summary must be persisted before it can be exported."
                : undefined
            }
          >
            <Download />
            {exporting === "docx" ? "Creating Word..." : "Download Word"}
          </button>
          <button
            type="button"
            disabled={!persistedDocumentId || exporting !== null}
            onClick={() => void exportSummary("pdf")}
            title={
              !persistedDocumentId
                ? "The summary must be persisted before it can be exported."
                : undefined
            }
          >
            <Download />
            {exporting === "pdf" ? "Creating PDF..." : "Download PDF"}
          </button>
        </div>
      </header>
      {exportError && (
        <div className="github-inline-error" role="alert">
          <AlertCircle />
          <span>{exportError}</span>
        </div>
      )}

      <h3>Analysis result</h3>
      <div className="github-summary-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Repository</th>
              <th>Branch</th>
              <th>Commit</th>
              <th>Status</th>
              <th>Analyzed / discovered</th>
              <th>Components</th>
              <th>APIs</th>
              <th>Cache</th>
              <th>Generated</th>
              <th>Document ID</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{response.repository.full_name}</td>
              <td>{response.repository.branch}</td>
              <td>
                <code>
                  {response.repository.commit_sha?.slice(0, 12) || "—"}
                </code>
              </td>
              <td>{response.status}</td>
              <td>
                {response.analysis.analyzed_files} /{" "}
                {response.analysis.discovered_files}
              </td>
              <td>{response.summary.key_components.length}</td>
              <td>{response.summary.api_endpoints.length}</td>
              <td>{response.analysis.cache_hit ? "Hit" : "Miss"}</td>
              <td>{new Date(response.generated_at).toLocaleString()}</td>
              <td>
                <code>{documentId}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Key components</h3>
      <div className="github-summary-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Files</th>
              <th>Responsibility</th>
            </tr>
          </thead>
          <tbody>
            {response.summary.key_components.length ? (
              response.summary.key_components.map((component) => (
                <tr key={`${component.name}-${component.paths.join("|")}`}>
                  <td>{component.name}</td>
                  <td>{component.paths.join(", ") || "—"}</td>
                  <td>{component.responsibility}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>No components were identified.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3>API endpoints</h3>
      <div className="github-summary-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Purpose</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {response.summary.api_endpoints.length ? (
              response.summary.api_endpoints.map((endpoint, index) => (
                <tr key={`${endpoint.method}-${endpoint.path}-${index}`}>
                  <td>{endpoint.method}</td>
                  <td>
                    <code>{endpoint.path}</code>
                  </td>
                  <td>{endpoint.purpose}</td>
                  <td>{endpoint.source_file || "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>No API endpoints were identified.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="github-summary-detail-grid">
        <SummaryList
          title="Technology stack"
          items={response.summary.technology_stack}
        />
        <SummaryList title="Strengths" items={response.summary.strengths} />
        <SummaryList
          title="Risks and gaps"
          items={response.summary.risks_and_gaps}
        />
        <SummaryList
          title="Recommended next steps"
          items={response.summary.recommended_next_steps}
        />
      </div>
    </section>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <article>
      <h4>{title}</h4>
      {items.length ? (
        <ul>
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>None reported.</p>
      )}
    </article>
  );
}

function GitHubRepositorySyncControls({
  repository,
  authenticationStatus,
  onUnlinked,
}: {
  repository: ImportedGitHubRepository;
  authenticationStatus: AuthenticationStatus;
  onUnlinked: () => Promise<void>;
}) {
  const [branches, setBranches] = useState<RepositoryBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState(
    repository.default_branch,
  );
  const [refreshedAt, setRefreshedAt] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [accessFailure, setAccessFailure] =
    useState<ProjectAccessFailure>("none");
  const accessBlocked =
    authenticationStatus !== "authenticated" || accessFailure !== "none";

  const loadBranches = useCallback(async () => {
    if (authenticationStatus !== "authenticated") {
      setBranches([]);
      setError("");
      setLoadingBranches(authenticationStatus === "loading");
      return;
    }
    setLoadingBranches(true);
    setError("");
    try {
      const response = await fetch(
        `/api/github/project-repositories/${encodeURIComponent(repository.association_id)}/branches`,
        { cache: "no-store" },
      );
      const body = (await response.json()) as Partial<RepositoryBranchList> & {
        error?: string;
        message?: string;
      };
      if (response.status === 401) {
        setAccessFailure("authentication");
        throw new Error(PROJECT_REPOSITORY_AUTH_MESSAGE);
      }
      if (response.status === 403) {
        setAccessFailure("membership");
        throw new Error(PROJECT_REPOSITORY_MEMBERSHIP_MESSAGE);
      }
      if (!response.ok)
        throw new Error(
          body.error ||
            body.message ||
            "Repository branches could not be loaded.",
        );
      const loaded = Array.isArray(body.branches) ? body.branches : [];
      setBranches(loaded);
      setAccessFailure("none");
      setRefreshedAt(body.refreshed_at || new Date().toISOString());
      setSelectedBranch((current) =>
        loaded.some((branch) => branch.name === current)
          ? current
          : loaded.find((branch) => branch.name === repository.default_branch)
              ?.name ||
            loaded[0]?.name ||
            repository.default_branch,
      );
    } catch (reason) {
      setBranches([]);
      setError(
        reason instanceof Error
          ? reason.message
          : "Repository branches could not be loaded.",
      );
    } finally {
      setLoadingBranches(false);
    }
  }, [
    authenticationStatus,
    repository.association_id,
    repository.default_branch,
  ]);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  const syncBranch = async () => {
    if (!selectedBranch || accessBlocked) return;
    setSyncing(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/github/project-repositories/${encodeURIComponent(repository.association_id)}/sync`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ branch: selectedBranch, forceRefresh: false }),
        },
      );
      const body = (await response.json()) as Partial<RepositoryBranchSync> & {
        error?: string;
        message?: string;
      };
      if (response.status === 401) {
        setAccessFailure("authentication");
        throw new Error(PROJECT_REPOSITORY_AUTH_MESSAGE);
      }
      if (response.status === 403) {
        setAccessFailure("membership");
        throw new Error(PROJECT_REPOSITORY_MEMBERSHIP_MESSAGE);
      }
      if (!response.ok)
        throw new Error(
          body.error ||
            body.message ||
            "The selected branch could not be synchronized.",
        );
      setMessage(
        `${selectedBranch} synchronized: ${body.indexed_files || 0} files indexed at ${new Date(body.synced_at || Date.now()).toLocaleString()}.`,
      );
      await loadBranches();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The selected branch could not be synchronized.",
      );
    } finally {
      setSyncing(false);
    }
  };

  const unlinkRepository = async () => {
    if (accessBlocked) return;
    const confirmed = window.confirm(
      `Unlink ${repository.full_name} from this Project? The GitHub repository will not be deleted.`,
    );
    if (!confirmed) return;
    setUnlinking(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/github/project-repositories/${encodeURIComponent(repository.association_id)}`,
        { method: "DELETE" },
      );
      const body = (await response.json()) as {
        error?: string;
        message?: string;
      };
      if (response.status === 401) {
        setAccessFailure("authentication");
        throw new Error(PROJECT_REPOSITORY_AUTH_MESSAGE);
      }
      if (response.status === 403) {
        setAccessFailure("membership");
        throw new Error(PROJECT_REPOSITORY_MEMBERSHIP_MESSAGE);
      }
      if (!response.ok)
        throw new Error(
          body.error ||
            body.message ||
            "The repository could not be unlinked from this Project.",
        );
      await onUnlinked();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The repository could not be unlinked from this Project.",
      );
    } finally {
      setUnlinking(false);
    }
  };

  const selected = branches.find((branch) => branch.name === selectedBranch);
  return (
    <div className="github-branch-sync">
      <div className="github-branch-controls">
        <label>
          <span>Branch</span>
          <select
            value={selectedBranch}
            disabled={
              accessBlocked ||
              loadingBranches ||
              syncing ||
              branches.length === 0
            }
            onChange={(event) => {
              setSelectedBranch(event.target.value);
              setMessage("");
            }}
          >
            {branches.length === 0 ? (
              <option value={repository.default_branch}>
                {loadingBranches
                  ? "Loading branches..."
                  : repository.default_branch}
              </option>
            ) : (
              branches.map((branch) => (
                <option key={branch.name} value={branch.name}>
                  {branch.name}
                  {branch.protected ? " (protected)" : ""}
                </option>
              ))
            )}
          </select>
        </label>
        <button
          className="quiet"
          disabled={accessBlocked || loadingBranches || syncing}
          onClick={() => void loadBranches()}
        >
          <RefreshCw />
          {loadingBranches ? "Refreshing..." : "Refresh branches"}
        </button>
        <button
          disabled={
            accessBlocked || !selectedBranch || loadingBranches || syncing
          }
          onClick={() => void syncBranch()}
        >
          <RotateCw />
          {syncing ? "Syncing branch..." : "Sync branch"}
        </button>
      </div>
      <div className="github-sync-dates">
        <span>
          Branches refreshed:{" "}
          {refreshedAt ? new Date(refreshedAt).toLocaleString() : "Not yet"}
        </span>
        <span>
          Last branch sync:{" "}
          {selected?.last_synced_at
            ? new Date(selected.last_synced_at).toLocaleString()
            : "Never"}
        </span>
        {selected?.commit_sha && (
          <code>{selected.commit_sha.slice(0, 12)}</code>
        )}
      </div>
      <div className="github-unlink-actions">
        <button
          className="danger"
          disabled={accessBlocked || loadingBranches || syncing || unlinking}
          onClick={() => void unlinkRepository()}
        >
          {unlinking ? "Unlinking..." : "Unlink repository"}
        </button>
      </div>
      {accessBlocked && authenticationStatus !== "loading" && (
        <div className="github-auth-required" role="status">
          <span>
            {accessFailure === "membership"
              ? PROJECT_REPOSITORY_MEMBERSHIP_MESSAGE
              : PROJECT_REPOSITORY_AUTH_MESSAGE}
          </span>
        </div>
      )}
      {error && !accessBlocked && (
        <div className="github-inline-error">{error}</div>
      )}
      {message && <div className="github-inline-success">{message}</div>}
    </div>
  );
}
