"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  ChevronRight,
  Database,
  FileText,
  FolderGit2,
  GitBranch,
  RefreshCw,
  RotateCw,
  Upload,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";

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
const titles = {
  github: "GitHub",
  "project-management": "Project Management Tool",
  "knowledge-base": "Knowledge Base",
};

export function DataSourceDashboard({ source }: { source: Source }) {
  const router = useRouter(),
    params = useSearchParams(),
    productSpaceId = useAppStore((s) => s.productSpaceId),
    storedProjectId = useAppStore((s) => s.projectId),
    setContext = useAppStore((s) => s.setContext);
  const [data, setData] = useState<Data | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [spaceId, setSpaceId] = useState(
    params.get("productSpaceId") || productSpaceId || "",
  );
  const [projectId, setProjectId] = useState(
    params.get("projectId") || storedProjectId || "",
  );
  const [releaseId, setReleaseId] = useState(params.get("piReleaseId") || ""),
    [featureId, setFeatureId] = useState(params.get("featureId") || ""),
    [sprintId, setSprintId] = useState(params.get("sprintId") || ""),
    [storyId, setStoryId] = useState(params.get("userStoryId") || "");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (spaceId) query.set("productSpaceId", spaceId);
      if (projectId) query.set("projectId", projectId);
      if (source === "project-management") {
        if (releaseId) query.set("piReleaseId", releaseId);
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
      const next: Data = body;
      setData(next);
      const p = next.project;
      if (p) {
        setProjectId(p.id);
        setSpaceId(p.productSpaceId);
        setContext({ projectId: p.id, productSpaceId: p.productSpaceId });
      }
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
    spaceId,
    projectId,
    source,
    releaseId,
    featureId,
    sprintId,
    storyId,
    setContext,
  ]);
  useEffect(() => {
    void load();
  }, [load]);
  const space = data?.spaces.find((x) => x.id === spaceId),
    projects = space?.projects ?? [];
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
  const changeSpace = (id: string) => {
    setSpaceId(id);
    setProjectId("");
    setReleaseId("");
    setFeatureId("");
    setSprintId("");
    setStoryId("");
    setContext({
      productSpaceId: id,
      projectId: "",
      piReleaseId: "",
      featureId: "",
      sprintId: "",
      userStoryId: "",
    });
    syncUrl({
      productSpaceId: id,
      projectId: "",
      piReleaseId: "",
      featureId: "",
      sprintId: "",
      userStoryId: "",
    });
  };
  const changeProject = (id: string) => {
    setProjectId(id);
    setReleaseId("");
    setFeatureId("");
    setSprintId("");
    setStoryId("");
    setContext({
      projectId: id,
      productSpaceId: spaceId,
      piReleaseId: "",
      featureId: "",
      sprintId: "",
      userStoryId: "",
    });
    syncUrl({
      productSpaceId: spaceId,
      projectId: id,
      piReleaseId: "",
      featureId: "",
      sprintId: "",
      userStoryId: "",
    });
  };
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
        <span
          className={`source-health ${source === "knowledge-base" ? "delayed" : "healthy"}`}
        >
          <i />
          {source === "knowledge-base" ? "Sync delayed" : "Healthy"}
        </span>
      </div>
      <section className="card context-card">
        <div className="context-title">
          <div>
            <small>WORKSPACE CONTEXT</small>
            <strong>
              Product Space <ChevronRight /> Project
            </strong>
          </div>
          <span>Shared across ReleaseLens</span>
        </div>
        <div className="context-selectors">
          <label>
            <span>Product Space</span>
            <select
              value={spaceId}
              onChange={(e) => changeSpace(e.target.value)}
              disabled={loading}
            >
              <option value="">Select product space</option>
              {data?.spaces.map((x) => (
                <option value={x.id} key={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Project</span>
            <select
              value={projectId}
              onChange={(e) => changeProject(e.target.value)}
              disabled={loading || !spaceId}
            >
              <option value="">Select project</option>
              {projects.map((x) => (
                <option value={x.id} key={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      {error ? (
        <section className="card source-state error">
          <AlertCircle />
          <div>
            <h2>Unable to load this dashboard</h2>
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
            const setters = {
              releaseId: setReleaseId,
              featureId: setFeatureId,
              sprintId: setSprintId,
              userStoryId: setStoryId,
            };
            setters[key](value);
            const urlKey = key === "releaseId" ? "piReleaseId" : key;
            setContext({ [urlKey]: value });
            syncUrl({ [urlKey]: value });
          }}
          clear={() => {
            setReleaseId("");
            setFeatureId("");
            setSprintId("");
            setStoryId("");
            setContext({
              piReleaseId: "",
              featureId: "",
              sprintId: "",
              userStoryId: "",
            });
            syncUrl({
              piReleaseId: "",
              featureId: "",
              sprintId: "",
              userStoryId: "",
            });
          }}
          refresh={load}
        />
      ) : source === "github" ? (
        <GitHub project={data.project.name} />
      ) : (
        <Knowledge project={data.project.name} />
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
function GitHub({ project }: { project: string }) {
  return (
    <>
      <section className="source-metrics">
        <Metric label="Repositories" value="0" icon={<FolderGit2 />} />
        <Metric label="Indexed artifacts" value="0" icon={<FileText />} />
        <Metric label="Sync status" value="Ready" icon={<GitBranch />} />
      </section>
      <Empty
        icon={<FolderGit2 />}
        title="No GitHub repositories are connected to this project."
        text={`Connect a repository to ${project} to index branches, files, pull requests, and commits.`}
      />
    </>
  );
}
function Knowledge({ project }: { project: string }) {
  return (
    <>
      <section className="source-metrics">
        <Metric label="Documents" value="0" icon={<BookOpen />} />
        <Metric label="Chunks" value="0" icon={<FileText />} />
        <Metric label="Embedded" value="0" icon={<Database />} />
      </section>
      <Empty
        icon={<Upload />}
        title="No Knowledge Base documents exist for this project."
        text={`Upload or connect documents for ${project} to begin release-aware ingestion.`}
      />
    </>
  );
}
