"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  Copy,
  FileSearch,
  Filter,
  GitBranch,
  Network,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Waypoints,
  X,
} from "lucide-react";
import type {
  Evidence,
  ImpactAnalysisSnapshot,
  ImpactLevel,
  ImpactResult,
} from "@/lib/impact-analysis";
import { useWorkspaceContext } from "@/workspace-context";

type Filters = {
  impact: string;
  risk: string;
  confidence: string;
  planningStatus: string;
  component: string;
  reviewState: string;
  action: string;
};
const emptyFilters: Filters = {
  impact: "",
  risk: "",
  confidence: "",
  planningStatus: "",
  component: "",
  reviewState: "",
  action: "",
};
const levels: ImpactLevel[] = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "NO_IMPACT",
  "UNKNOWN",
];
const label = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
const unique = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean))).sort();
const confidence = (value: number) =>
  value >= 0.8 ? "HIGH" : value >= 0.55 ? "MEDIUM" : "LOW";
const matches = (result: ImpactResult, filters: Filters, search: string) => {
  const text =
    `${result.key} ${result.name} ${result.components.join(" ")} ${result.requiredAction}`.toLowerCase();
  return (
    (!search || text.includes(search.toLowerCase())) &&
    (!filters.impact || result.impactLevel === filters.impact) &&
    (!filters.risk || result.riskLevel === filters.risk) &&
    (!filters.confidence ||
      confidence(result.correlationConfidence) === filters.confidence) &&
    (!filters.planningStatus ||
      result.planningStatus === filters.planningStatus) &&
    (!filters.component || result.components.includes(filters.component)) &&
    (!filters.reviewState || result.reviewState === filters.reviewState) &&
    (!filters.action || result.requiredAction === filters.action)
  );
};

export function ImpactAnalysisDashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const contextProductSpaceId = useWorkspaceContext(
    (state) => state.productSpaceId,
  );
  const contextProjectId = useWorkspaceContext((state) => state.projectId);
  const contextReleaseId = useWorkspaceContext((state) => state.releaseId);
  const productSpaceId =
    contextProductSpaceId || params.get("productSpaceId") || "";
  const projectId = contextProjectId || params.get("projectId") || "";
  const releaseId = contextReleaseId || params.get("releaseId") || "";
  const project = useWorkspaceContext((state) => state.project);
  const release = useWorkspaceContext((state) => state.release);
  const [data, setData] = useState<ImpactAnalysisSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [featureId, setFeatureId] = useState(params.get("featureId") || "");
  const [sprintId, setSprintId] = useState(params.get("sprintId") || "");
  const [storyId, setStoryId] = useState(params.get("userStoryId") || "");
  const [selected, setSelected] = useState<ImpactResult | null>(null);
  const [tableMode, setTableMode] = useState<"features" | "stories">(
    "features",
  );
  const [notice, setNotice] = useState("");

  const syncScope = useCallback(
    (next: Record<string, string>) => {
      const query = new URLSearchParams(params.toString());
      Object.entries(next).forEach(([key, value]) =>
        value ? query.set(key, value) : query.delete(key),
      );
      router.replace(`?${query}`, { scroll: false });
    },
    [params, router],
  );
  const load = useCallback(
    async (run = false) => {
      if (!productSpaceId || !projectId) {
        setData(null);
        return;
      }
      run ? setRunning(true) : setLoading(true);
      setError("");
      try {
        const query = new URLSearchParams({ productSpaceId, projectId });
        if (releaseId) query.set("releaseId", releaseId);
        const response = await fetch(`/api/impact-analysis?${query}`, {
          method: run ? "POST" : "GET",
          cache: "no-store",
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error || "Impact Analysis is unavailable.");
        setData(body);
        setSelected(null);
        if (run) setNotice("A new compatible analysis snapshot is active.");
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Impact Analysis is unavailable.",
        );
      } finally {
        setLoading(false);
        setRunning(false);
      }
    },
    [productSpaceId, projectId, releaseId],
  );
  useEffect(() => void load(), [load]);
  useEffect(() => {
    setFeatureId("");
    setSprintId("");
    setStoryId("");
    setFilters(emptyFilters);
  }, [projectId, releaseId]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const scopedStories = useMemo(
    () =>
      (data?.stories || []).filter(
        (story) => !featureId || story.parentFeatureId === featureId,
      ),
    [data, featureId],
  );
  const sprintOptions = useMemo(
    () => unique(scopedStories.map((story) => story.sprintId || "")),
    [scopedStories],
  );
  const features = useMemo(
    () =>
      (data?.features || [])
        .filter((result) => !featureId || result.recordId === featureId)
        .filter((result) => matches(result, filters, search)),
    [data, featureId, filters, search],
  );
  const stories = useMemo(
    () =>
      (data?.stories || [])
        .filter((result) => !featureId || result.parentFeatureId === featureId)
        .filter((result) => !sprintId || result.sprintId === sprintId)
        .filter((result) => !storyId || result.recordId === storyId)
        .filter((result) => matches(result, filters, search)),
    [data, featureId, sprintId, storyId, filters, search],
  );
  const results = useMemo(() => [...features, ...stories], [features, stories]);
  const all = [...(data?.features || []), ...(data?.stories || [])];
  const activeCount =
    Object.values(filters).filter(Boolean).length +
    [search, featureId, sprintId, storyId].filter(Boolean).length;
  const actions = useMemo(() => {
    const groups = new Map<string, ImpactResult[]>();
    results.forEach((result) =>
      groups.set(result.requiredAction, [
        ...(groups.get(result.requiredAction) || []),
        result,
      ]),
    );
    return [...groups.entries()].sort(
      (left, right) =>
        Math.max(...right[1].map((item) => item.deliveryRisk || 0)) -
        Math.max(...left[1].map((item) => item.deliveryRisk || 0)),
    );
  }, [results]);
  const setFilter = (key: keyof Filters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const clear = () => {
    setFilters(emptyFilters);
    setSearch("");
    setFeatureId("");
    setSprintId("");
    setStoryId("");
    syncScope({ featureId: "", sprintId: "", userStoryId: "" });
  };
  const share = async () => {
    if (!data) return;
    const url = new URL(window.location.href);
    url.searchParams.set("snapshot", data.snapshot.id);
    await navigator.clipboard.writeText(url.toString());
    setNotice("Snapshot link copied.");
  };
  const exportCsv = () => {
    if (!data) return;
    const cell = (value: unknown) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = results.map((result) => [
      data.snapshot.id,
      result.recordType,
      result.key,
      result.name,
      result.impactLevel,
      result.impactScore ?? "Unknown",
      result.deliveryRisk ?? "Unknown",
      result.riskLevel,
      `${Math.round(result.correlationConfidence * 100)}%`,
      result.components.join("; "),
      result.requiredAction,
      result.evidence.map((item) => item.id).join("; "),
    ]);
    const csv = [
      [
        "Snapshot",
        "Type",
        "Key",
        "Name",
        "Impact",
        "Impact score",
        "Delivery risk",
        "Risk",
        "Confidence",
        "Components",
        "Action",
        "Evidence",
      ],
      ...rows,
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${data.snapshot.id}-impact-analysis.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="dashboard impact-dashboard">
      <div className="source-back">
        <Link href="/data-sources">Data Sources</Link>
        <ChevronRight />
        <span>Impact Analysis</span>
      </div>
      <div className="impact-heading">
        <div>
          <span className="eyebrow">PROJECT INTELLIGENCE</span>
          <h1>Impact Analysis</h1>
          <p>
            Investigate architectural effect and delivery risk for{" "}
            <b>{project?.name || "the selected Project"}</b>
            {release?.name ? `, ${release.name}` : ""}.
          </p>
        </div>
        <div>
          <button className="secondary" onClick={share} disabled={!data}>
            <Copy /> Share
          </button>
          <button onClick={() => void load(true)} disabled={running}>
            <RefreshCw className={running ? "spin" : ""} />
            {running ? "Analyzing" : "Run analysis"}
          </button>
        </div>
      </div>
      {notice && (
        <div className="impact-notice" role="status">
          <CheckCircle2 /> {notice}
        </div>
      )}
      {!productSpaceId || !projectId ? (
        <State
          icon={<Waypoints />}
          title={
            !productSpaceId ? "Select a Product Space" : "Select a Project"
          }
          text="Impact Analysis inherits its authoritative scope from Workspace Context."
        />
      ) : error ? (
        <State
          icon={<AlertCircle />}
          title="Impact analysis unavailable"
          text={error}
          action="Try again"
          onAction={() => void load()}
          error
        />
      ) : loading ? (
        <Loading />
      ) : data ? (
        <>
          <Snapshot data={data} />
          <Scope
            data={data}
            featureId={featureId}
            sprintId={sprintId}
            storyId={storyId}
            stories={scopedStories}
            sprints={sprintOptions}
            setFeature={(value) => {
              setFeatureId(value);
              setSprintId("");
              setStoryId("");
              syncScope({ featureId: value, sprintId: "", userStoryId: "" });
            }}
            setSprint={(value) => {
              setSprintId(value);
              setStoryId("");
              syncScope({ sprintId: value, userStoryId: "" });
            }}
            setStory={(value) => {
              setStoryId(value);
              syncScope({ userStoryId: value });
            }}
          />
          <Summary data={data} setFilter={setFilter} setMode={setTableMode} />
          <section className="impact-filter-bar">
            <label className="impact-search">
              <Search />
              <input
                aria-label="Search impact records"
                placeholder="Search records or components"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <FilterSelect
              name="Impact"
              value={filters.impact}
              values={levels}
              set={(value) => setFilter("impact", value)}
            />
            <FilterSelect
              name="Risk"
              value={filters.risk}
              values={levels}
              set={(value) => setFilter("risk", value)}
            />
            <FilterSelect
              name="Confidence"
              value={filters.confidence}
              values={["HIGH", "MEDIUM", "LOW"]}
              set={(value) => setFilter("confidence", value)}
            />
            <details className="impact-more">
              <summary>
                <SlidersHorizontal /> More
                {activeCount > 0 && <span>{activeCount}</span>}
              </summary>
              <div>
                <FilterSelect
                  name="Planning status"
                  value={filters.planningStatus}
                  values={unique(all.map((item) => item.planningStatus))}
                  set={(value) => setFilter("planningStatus", value)}
                />
                <FilterSelect
                  name="Component"
                  value={filters.component}
                  values={unique(all.flatMap((item) => item.components))}
                  set={(value) => setFilter("component", value)}
                />
                <FilterSelect
                  name="Review state"
                  value={filters.reviewState}
                  values={unique(all.map((item) => item.reviewState))}
                  set={(value) => setFilter("reviewState", value)}
                />
                <FilterSelect
                  name="Required action"
                  value={filters.action}
                  values={unique(all.map((item) => item.requiredAction))}
                  set={(value) => setFilter("action", value)}
                />
              </div>
            </details>
            {activeCount > 0 && (
              <button className="impact-clear" onClick={clear}>
                <X /> Clear
              </button>
            )}
          </section>
          {!results.length ? (
            <State
              icon={<Filter />}
              title="No records match these filters"
              text="Clear or adjust the dashboard filters to restore contributing records."
              action="Clear filters"
              onAction={clear}
            />
          ) : (
            <>
              <div className="impact-overview-grid">
                <ArchitectureMap
                  data={data}
                  results={results}
                  onComponent={(value) =>
                    setFilter(
                      "component",
                      filters.component === value ? "" : value,
                    )
                  }
                />
                <Distribution results={results} setFilter={setFilter} />
              </div>
              <div className="impact-work-grid">
                <ResultsTable
                  mode={tableMode}
                  setMode={setTableMode}
                  features={features}
                  stories={stories}
                  select={setSelected}
                  exportCsv={exportCsv}
                />
                <Actions actions={actions} select={setSelected} />
              </div>
            </>
          )}
        </>
      ) : null}
      {selected && (
        <EvidenceDrawer result={selected} close={() => setSelected(null)} />
      )}
    </main>
  );
}

function Snapshot({ data }: { data: ImpactAnalysisSnapshot }) {
  const partial = data.snapshot.status === "PARTIAL";
  return (
    <section className={`impact-snapshot ${partial ? "partial" : "current"}`}>
      {partial ? <AlertCircle /> : <CheckCircle2 />}
      <div>
        <strong>
          {partial ? "Partial analysis" : "Current analysis snapshot"}
        </strong>
        <span>
          {data.snapshot.id} · Architecture {data.snapshot.architectureVersion}{" "}
          · Algorithm {data.snapshot.algorithmVersion}
        </span>
      </div>
      <span>
        <Clock3 /> {new Date(data.snapshot.analyzedAt).toLocaleString()}
      </span>
    </section>
  );
}

function Scope({
  data,
  featureId,
  sprintId,
  storyId,
  stories,
  sprints,
  setFeature,
  setSprint,
  setStory,
}: {
  data: ImpactAnalysisSnapshot;
  featureId: string;
  sprintId: string;
  storyId: string;
  stories: ImpactResult[];
  sprints: string[];
  setFeature: (value: string) => void;
  setSprint: (value: string) => void;
  setStory: (value: string) => void;
}) {
  return (
    <section className="card impact-scope">
      <div>
        <span className="eyebrow">ANALYSIS SCOPE</span>
        <strong>{data.snapshot.scope.projectName}</strong>
        <small>Optional filters narrow every dashboard view.</small>
      </div>
      <ScopeSelect
        name="Feature"
        value={featureId}
        set={setFeature}
        items={data.features.map((item) => [
          item.recordId,
          `${item.key} · ${item.name}`,
        ])}
      />
      <ScopeSelect
        name="Sprint"
        value={sprintId}
        set={setSprint}
        items={sprints.map((id) => [id, `Sprint ${id.slice(0, 8)}`])}
      />
      <ScopeSelect
        name="User Story"
        value={storyId}
        set={setStory}
        items={stories
          .filter((item) => !sprintId || item.sprintId === sprintId)
          .map((item) => [item.recordId, `${item.key} · ${item.name}`])}
      />
    </section>
  );
}

function ScopeSelect({
  name,
  value,
  items,
  set,
}: {
  name: string;
  value: string;
  items: string[][];
  set: (value: string) => void;
}) {
  return (
    <label>
      <span>{name}</span>
      <select value={value} onChange={(event) => set(event.target.value)}>
        <option value="">
          All {name === "User Story" ? "User Stories" : `${name}s`}
        </option>
        {items.map(([id, itemLabel]) => (
          <option key={id} value={id}>
            {itemLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function Summary({
  data,
  setFilter,
  setMode,
}: {
  data: ImpactAnalysisSnapshot;
  setFilter: (key: keyof Filters, value: string) => void;
  setMode: (value: "features" | "stories") => void;
}) {
  const metrics = [
    [
      "Architecture components",
      data.summary.architectureComponents,
      <Network key="architecture" />,
    ],
    [
      "Analyzed Features",
      data.summary.analyzedFeatures,
      <FileSearch key="analyzed" />,
    ],
    [
      "Impacted Features",
      data.summary.impactedFeatures,
      <GitBranch key="impacted" />,
    ],
    [
      "High-risk Features",
      data.summary.highRiskFeatures,
      <ShieldAlert key="high-risk" />,
    ],
    [
      "Impacted User Stories",
      data.summary.impactedStories,
      <Waypoints key="stories" />,
    ],
    [
      "Unmapped Features",
      data.summary.unmappedFeatures,
      <AlertCircle key="unmapped" />,
    ],
    [
      "Overall project risk",
      label(data.summary.overallProjectRisk),
      <CircleGauge key="overall" />,
    ],
  ] as const;
  const click = (index: number) => {
    if (index === 3) setFilter("risk", "HIGH");
    if (index === 5) setFilter("impact", "UNKNOWN");
    if (index === 6) setFilter("risk", data.summary.overallProjectRisk);
    setMode(index === 4 ? "stories" : "features");
  };
  return (
    <section className="impact-summary">
      {metrics.map(([metric, value, icon], index) => (
        <button
          className="card impact-metric"
          key={metric}
          onClick={() => click(index)}
        >
          <span>{icon}</span>
          <small>{metric}</small>
          <strong>{value}</strong>
          <ChevronRight />
        </button>
      ))}
    </section>
  );
}

function ArchitectureMap({
  data,
  results,
  onComponent,
}: {
  data: ImpactAnalysisSnapshot;
  results: ImpactResult[];
  onComponent: (value: string) => void;
}) {
  const components = data.components.filter((component) =>
    results.some((result) => result.components.includes(component.name)),
  );
  return (
    <section className="card impact-map-card">
      <SectionHead
        eyebrow="ARCHITECTURE IMPACT MAP"
        title="Impacted component paths"
        note={`${components.length} in scope`}
      />
      <div className="impact-map">
        <i className="map-line horizontal" />
        <i className="map-line vertical" />
        {components.map((component) => (
          <button
            key={component.id}
            className={`impact-node ${component.risk.toLowerCase()}`}
            style={{ left: `${component.x}%`, top: `${component.y}%` }}
            onClick={() => onComponent(component.name)}
            aria-label={`${component.name}, ${label(component.risk)} risk`}
          >
            <Network />
            <span>
              <strong>{component.name}</strong>
              <small>
                {label(component.risk)} · {component.impactedRecords} records
              </small>
            </span>
          </button>
        ))}
      </div>
      <div className="impact-legend">
        {["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"].map((level) => (
          <span key={level}>
            <i className={level.toLowerCase()} /> {label(level)}
          </span>
        ))}
      </div>
    </section>
  );
}

function Distribution({
  results,
  setFilter,
}: {
  results: ImpactResult[];
  setFilter: (key: keyof Filters, value: string) => void;
}) {
  const counts = levels.map(
    (level) => results.filter((result) => result.riskLevel === level).length,
  );
  const maximum = Math.max(1, ...counts);
  return (
    <section className="card risk-card">
      <SectionHead
        eyebrow="DELIVERY RISK"
        title="Risk distribution"
        note={`${results.length} records`}
      />
      <div className="risk-bars">
        {levels.map((level, index) => (
          <button key={level} onClick={() => setFilter("risk", level)}>
            <span>{label(level)}</span>
            <i>
              <b
                className={level.toLowerCase()}
                style={{ width: `${(counts[index] / maximum) * 100}%` }}
              />
            </i>
            <strong>{counts[index]}</strong>
          </button>
        ))}
      </div>
      <p>
        <AlertCircle /> Unknown records need mapping evidence before a
        conclusion.
      </p>
    </section>
  );
}

function ResultsTable({
  mode,
  setMode,
  features,
  stories,
  select,
  exportCsv,
}: {
  mode: "features" | "stories";
  setMode: (value: "features" | "stories") => void;
  features: ImpactResult[];
  stories: ImpactResult[];
  select: (value: ImpactResult) => void;
  exportCsv: () => void;
}) {
  const rows = mode === "features" ? features : stories;
  return (
    <section className="card impact-table-card">
      <div className="impact-table-toolbar">
        <div className="impact-tabs" role="tablist">
          {(["features", "stories"] as const).map((tab) => (
            <button
              key={tab}
              className={mode === tab ? "active" : ""}
              onClick={() => setMode(tab)}
              role="tab"
              aria-selected={mode === tab}
            >
              {tab === "features" ? "Features" : "User Stories"}{" "}
              <span>
                {tab === "features" ? features.length : stories.length}
              </span>
            </button>
          ))}
        </div>
        <div>
          <button title="Export visible records to CSV" onClick={exportCsv}>
            <ArrowDownToLine /> CSV
          </button>
          <button
            title="Open print dialog for PDF"
            onClick={() => window.print()}
          >
            <Printer /> PDF
          </button>
        </div>
      </div>
      <div className="impact-table-scroll">
        <table className="impact-table">
          <thead>
            <tr>
              <th>Record</th>
              <th>Impact</th>
              <th>Delivery risk</th>
              <th>Confidence</th>
              <th>Components</th>
              <th>Required action</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((result) => (
              <tr key={result.id}>
                <td>
                  <button
                    className="record-link"
                    onClick={() => select(result)}
                  >
                    <span>{result.key}</span>
                    <strong>{result.name}</strong>
                    <small>{label(result.planningStatus)}</small>
                  </button>
                </td>
                <td>
                  <Badge level={result.impactLevel} />
                  <small>
                    {result.impactScore == null
                      ? "Not scored"
                      : `${result.impactScore}/100`}
                  </small>
                </td>
                <td>
                  <Badge level={result.riskLevel} />
                  <small>
                    {result.deliveryRisk == null
                      ? "Not scored"
                      : `${result.deliveryRisk}/100`}
                  </small>
                </td>
                <td>
                  <strong>
                    {Math.round(result.correlationConfidence * 100)}%
                  </strong>
                  <small>
                    {label(confidence(result.correlationConfidence))}
                  </small>
                </td>
                <td>
                  <div className="component-list">
                    {result.components.length ? (
                      result.components
                        .slice(0, 2)
                        .map((component) => (
                          <span key={component}>{component}</span>
                        ))
                    ) : (
                      <em>Unmapped</em>
                    )}
                  </div>
                </td>
                <td>{result.requiredAction}</td>
                <td>
                  <button
                    className="evidence-count"
                    onClick={() => select(result)}
                  >
                    <FileSearch /> {result.evidence.length}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Actions({
  actions,
  select,
}: {
  actions: Array<[string, ImpactResult[]]>;
  select: (value: ImpactResult) => void;
}) {
  return (
    <section className="card actions-card">
      <SectionHead
        eyebrow="NEXT ACTIONS"
        title="Prioritized recommendations"
        icon={<Sparkles />}
      />
      <div>
        {actions.map(([action, records], index) => (
          <button key={action} onClick={() => select(records[0])}>
            <span>{index + 1}</span>
            <div>
              <strong>{action}</strong>
              <small>
                {records.length} records · Highest risk{" "}
                {Math.max(...records.map((record) => record.deliveryRisk || 0))}
              </small>
            </div>
            <ChevronRight />
          </button>
        ))}
      </div>
      <p>
        Recommendations are advisory and never change official planning status
        without human approval.
      </p>
    </section>
  );
}

function EvidenceDrawer({
  result,
  close,
}: {
  result: ImpactResult;
  close: () => void;
}) {
  return (
    <div className="impact-drawer-backdrop" onMouseDown={close}>
      <aside
        className="impact-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span className="eyebrow">TRACEABLE EVIDENCE</span>
            <h2 id="evidence-title">{result.key}</h2>
            <p>{result.name}</p>
          </div>
          <button onClick={close} aria-label="Close evidence panel">
            <X />
          </button>
        </header>
        <section className="evidence-scores">
          {[
            [
              "Impact score",
              result.impactScore ?? "Unknown",
              result.impactLevel,
            ],
            [
              "Delivery risk",
              result.deliveryRisk ?? "Unknown",
              result.riskLevel,
            ],
            [
              "Correlation",
              `${Math.round(result.correlationConfidence * 100)}%`,
              result.reviewState,
            ],
          ].map(([name, value, note]) => (
            <div key={name}>
              <span>{name}</span>
              <strong>{value}</strong>
              <small>{label(String(note))}</small>
            </div>
          ))}
        </section>
        <section className="evidence-section">
          <h3>Scoring factors</h3>
          {result.factors.length ? (
            result.factors.map((factor) => (
              <div className="factor-row" key={factor.label}>
                <span>
                  <b>{factor.label}</b>
                  <small>{factor.contribution}% weight</small>
                </span>
                <i>
                  <b style={{ width: `${factor.value}%` }} />
                </i>
                <strong>{factor.value}</strong>
              </div>
            ))
          ) : (
            <p>
              Scoring is withheld until defensible architecture evidence exists.
            </p>
          )}
        </section>
        <section className="evidence-section">
          <h3>Evidence bundle</h3>
          {result.evidence.length ? (
            result.evidence.map((evidence) => (
              <EvidenceCard evidence={evidence} key={evidence.id} />
            ))
          ) : (
            <p className="evidence-empty">
              <AlertCircle /> No approved mapping is available. This is Unknown,
              not No Impact.
            </p>
          )}
        </section>
        <footer>
          <span>
            Recommended action <strong>{result.requiredAction}</strong>
          </span>
          <button onClick={close}>Done</button>
        </footer>
      </aside>
    </div>
  );
}

function EvidenceCard({ evidence }: { evidence: Evidence }) {
  return (
    <article className="evidence-card">
      <div>
        <FileSearch />
        <span>
          <strong>{evidence.sourceDocument}</strong>
          <small>{evidence.id}</small>
        </span>
        <b>{Math.round(evidence.confidence * 100)}%</b>
      </div>
      <dl>
        {[
          ["Page", evidence.page],
          ["Component", evidence.component],
          ["Relationship", evidence.relationship],
          ["Planning record", evidence.planningRecord],
          ["Method", evidence.method],
          ["Analyzed", new Date(evidence.timestamp).toLocaleString()],
        ].map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function FilterSelect({
  name,
  value,
  values,
  set,
}: {
  name: string;
  value: string;
  values: readonly string[];
  set: (value: string) => void;
}) {
  return (
    <label className="impact-filter-select">
      <span>{name}</span>
      <select
        aria-label={`Filter by ${name}`}
        value={value}
        onChange={(event) => set(event.target.value)}
      >
        <option value="">All</option>
        {values.map((option) => (
          <option key={option} value={option}>
            {label(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function SectionHead({
  eyebrow,
  title,
  note,
  icon,
}: {
  eyebrow: string;
  title: string;
  note?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="impact-section-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {icon || <span>{note}</span>}
    </div>
  );
}
function Badge({ level }: { level: ImpactLevel }) {
  return (
    <span className={`level-badge ${level.toLowerCase()}`}>
      <i /> {label(level)}
    </span>
  );
}
function State({
  icon,
  title,
  text,
  action,
  onAction,
  error,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
  error?: boolean;
}) {
  return (
    <section className={`card impact-state ${error ? "error" : ""}`}>
      {icon}
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
        {action && <button onClick={onAction}>{action}</button>}
      </div>
    </section>
  );
}
function Loading() {
  return (
    <div className="impact-loading" aria-label="Loading impact analysis">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton wide" />
    </div>
  );
}
