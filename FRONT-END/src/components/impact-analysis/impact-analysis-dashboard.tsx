"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  FileCode2,
  GitBranch,
  History,
  LoaderCircle,
  Network,
  Play,
  Printer,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  getFindingEvidence,
  getImpactFinding,
  getImpactFindings,
  getImpactComparison,
  getImpactGraph,
  getImpactHistory,
  getImpactPlanningOptions,
  getImpactRequirements,
  getImpactRun,
  getProjectRepositories,
  getRepositoryBranches,
  reanalyzeImpactRun,
  startImpactAnalysis,
} from "@/lib/impact-analysis/api";
import {
  IMPACT_GRAPH_VIEWS,
  IMPACT_POLL_INTERVAL_MS,
  IMPACT_STAGE_LABELS,
  IMPACT_STATUSES,
  TERMINAL_RUN_STATUSES,
} from "@/lib/impact-analysis/constants";
import {
  formatPercent,
  formatScore,
  impactLabel,
  safeCsvCell,
} from "@/lib/impact-analysis/formatters";
import type {
  ImpactEvidence,
  ImpactFinding,
  ImpactGraph,
  ImpactGraphView,
  ImpactHistoryItem,
  ImpactPlanningOptions,
  ImpactRequirement,
  ImpactRun,
  ImpactRunComparison,
  ImpactScopeType,
  ImpactStatus,
  ProjectRepository,
  RepositoryBranch,
} from "@/lib/impact-analysis/types";
import { useWorkspaceContext } from "@/workspace-context";
import { CopilotRemediationPanel } from "./copilot-remediation-prompt";

const emptyPlanning: ImpactPlanningOptions = { features: [], stories: [] };

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function ImpactAnalysisDashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const productSpaceId = useWorkspaceContext((state) => state.productSpaceId);
  const projectId = useWorkspaceContext((state) => state.projectId);
  const releaseId = useWorkspaceContext((state) => state.releaseId);
  const environment = useWorkspaceContext((state) => state.environment);
  const project = useWorkspaceContext((state) => state.project);
  const release = useWorkspaceContext((state) => state.release);

  const [scopeType, setScopeType] = useState<ImpactScopeType>("FEATURE");
  const [featureId, setFeatureId] = useState("");
  const [storyId, setStoryId] = useState("");
  const [repositoryId, setRepositoryId] = useState("");
  const [branch, setBranch] = useState("");
  const [planning, setPlanning] = useState(emptyPlanning);
  const [repositories, setRepositories] = useState<ProjectRepository[]>([]);
  const [branches, setBranches] = useState<RepositoryBranch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [selectorsLoading, setSelectorsLoading] = useState(false);
  const [selectorError, setSelectorError] = useState("");
  const [branchWarning, setBranchWarning] = useState("");

  const [runId, setRunId] = useState(params.get("runId") || "");
  const [run, setRun] = useState<ImpactRun | null>(null);
  const [runLoading, setRunLoading] = useState(Boolean(runId));
  const [submitting, setSubmitting] = useState(false);
  const [runError, setRunError] = useState("");
  const [requirements, setRequirements] = useState<ImpactRequirement[]>([]);
  const [findings, setFindings] = useState<ImpactFinding[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [comparison, setComparison] = useState<ImpactRunComparison | null>(
    null,
  );

  const [graphView, setGraphView] = useState<ImpactGraphView>("comparison");
  const [graph, setGraph] = useState<ImpactGraph | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState("");
  const [historyItems, setHistoryItems] = useState<ImpactHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ImpactStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedFindingId, setSelectedFindingId] = useState("");
  const [selectedFinding, setSelectedFinding] = useState<ImpactFinding | null>(
    null,
  );
  const [evidence, setEvidence] = useState<ImpactEvidence[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState("");
  const [notice, setNotice] = useState("");

  const setRunUrl = useCallback(
    (nextRunId: string) => {
      const query = new URLSearchParams(params.toString());
      if (nextRunId) query.set("runId", nextRunId);
      else query.delete("runId");
      router.replace(`?${query.toString()}`, { scroll: false });
      setRunId(nextRunId);
    },
    [params, router],
  );

  useEffect(() => {
    setScopeType("FEATURE");
    setFeatureId("");
    setStoryId("");
    setRepositoryId("");
    setBranch("");
    setPlanning(emptyPlanning);
    setRepositories([]);
    setBranches([]);
    setRun(null);
    setRequirements([]);
    setFindings([]);
    setComparison(null);
    setGraph(null);
    setSelectedFindingId("");
    setSelectedFinding(null);
    setRunUrl("");
  }, [projectId, releaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!productSpaceId || !projectId) return;
    const controller = new AbortController();
    setSelectorsLoading(true);
    setSelectorError("");
    Promise.all([
      getImpactPlanningOptions(
        productSpaceId,
        projectId,
        releaseId || undefined,
        controller.signal,
      ),
      getProjectRepositories(productSpaceId, projectId, controller.signal),
    ])
      .then(([options, linked]) => {
        setPlanning(options);
        setRepositories(linked.filter((repository) => !repository.archived));
        setFeatureId((current) =>
          options.features.some((feature) => feature.id === current)
            ? current
            : options.features[0]?.id || "",
        );
        setRepositoryId((current) =>
          linked.some((repository) => repository.association_id === current)
            ? current
            : linked[0]?.association_id || "",
        );
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setSelectorError(
            messageFrom(error, "Analysis selectors could not be loaded."),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setSelectorsLoading(false);
      });
    return () => controller.abort();
  }, [productSpaceId, projectId, releaseId]);

  const selectedRepository = repositories.find(
    (repository) => repository.association_id === repositoryId,
  );

  useEffect(() => {
    if (!repositoryId || !selectedRepository) {
      setBranches([]);
      setBranch("");
      return;
    }
    const controller = new AbortController();
    setBranchWarning("");
    setBranch(selectedRepository.default_branch);
    setBranchesLoading(true);
    getRepositoryBranches(selectedRepository.repository_url, controller.signal)
      .then((items) => {
        const next = items.length
          ? items
          : [{ name: selectedRepository.default_branch }];
        setBranches(next);
        setBranch((current) =>
          next.some((item) => item.name === current)
            ? current
            : selectedRepository.default_branch,
        );
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setBranches([{ name: selectedRepository.default_branch }]);
        setBranchWarning(
          `${messageFrom(error, "Branches could not be loaded.")} Using the repository default branch.`,
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setBranchesLoading(false);
      });
    return () => controller.abort();
  }, [repositoryId, selectedRepository]);

  const loadCompletedResults = useCallback(async (completedRunId: string) => {
    setResultsLoading(true);
    try {
      const [nextRequirements, nextFindings] = await Promise.all([
        getImpactRequirements(completedRunId),
        getImpactFindings(completedRunId, { pageSize: 200 }),
      ]);
      setRequirements(nextRequirements);
      setFindings(nextFindings);
    } catch (error) {
      setRunError(messageFrom(error, "Persisted results could not be loaded."));
    } finally {
      setResultsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!runId) {
      setRunLoading(false);
      return;
    }
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const next = await getImpactRun(runId);
        if (!active) return;
        setRun(next);
        setRunLoading(false);
        setRunError("");
        if (next.status === "COMPLETED") {
          await loadCompletedResults(runId);
          return;
        }
        if (!TERMINAL_RUN_STATUSES.has(next.status))
          timer = setTimeout(poll, IMPACT_POLL_INTERVAL_MS);
      } catch (error) {
        if (!active) return;
        setRunLoading(false);
        setRunError(
          messageFrom(error, "The analysis run could not be loaded."),
        );
      }
    };
    setRunLoading(true);
    void poll();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [runId, loadCompletedResults]);

  useEffect(() => {
    if (!runId || run?.status !== "COMPLETED") return;
    const controller = new AbortController();
    setGraphLoading(true);
    setGraphError("");
    getImpactGraph(runId, graphView, controller.signal)
      .then(setGraph)
      .catch((error) => {
        if (!controller.signal.aborted)
          setGraphError(messageFrom(error, "Graph evidence is unavailable."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setGraphLoading(false);
      });
    return () => controller.abort();
  }, [runId, run?.status, graphView]);

  useEffect(() => {
    if (!runId || run?.status !== "COMPLETED" || !run.previous_run_id) {
      setComparison(null);
      return;
    }
    const controller = new AbortController();
    getImpactComparison(runId, run.previous_run_id, controller.signal)
      .then(setComparison)
      .catch(() => setComparison(null));
    return () => controller.abort();
  }, [runId, run?.status, run?.previous_run_id]);

  const refreshHistory = useCallback(() => {
    if (!productSpaceId || !projectId) return;
    setHistoryLoading(true);
    setHistoryError("");
    void getImpactHistory({ productSpaceId, projectId })
      .then((response) => setHistoryItems(response.items))
      .catch((error) =>
        setHistoryError(messageFrom(error, "Analysis history is unavailable.")),
      )
      .finally(() => setHistoryLoading(false));
  }, [productSpaceId, projectId]);

  useEffect(() => refreshHistory(), [refreshHistory, run?.status]);

  useEffect(() => {
    if (!selectedFindingId) return;
    const controller = new AbortController();
    setDrawerLoading(true);
    setDrawerError("");
    Promise.all([
      getImpactFinding(selectedFindingId, controller.signal),
      getFindingEvidence(selectedFindingId, controller.signal),
    ])
      .then(([finding, items]) => {
        setSelectedFinding(finding);
        setEvidence(items);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setDrawerError(
            messageFrom(error, "Finding evidence is unavailable."),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setDrawerLoading(false);
      });
    return () => controller.abort();
  }, [selectedFindingId]);

  const scopedStories = useMemo(
    () => planning.stories.filter((story) => story.featureId === featureId),
    [planning.stories, featureId],
  );

  useEffect(() => {
    if (scopeType === "FEATURE") {
      setStoryId("");
      return;
    }
    setStoryId((current) =>
      scopedStories.some((story) => story.id === current)
        ? current
        : scopedStories[0]?.id || "",
    );
  }, [scopeType, scopedStories]);

  const categories = useMemo(
    () =>
      Array.from(new Set(findings.map((finding) => finding.category))).sort(),
    [findings],
  );
  const visibleFindings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return findings.filter(
      (finding) =>
        (!statusFilter || finding.status === statusFilter) &&
        (!categoryFilter || finding.category === categoryFilter) &&
        (!query ||
          [
            finding.requirement,
            finding.category,
            finding.technical_reason,
            finding.recommendation,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)),
    );
  }, [findings, statusFilter, categoryFilter, search]);

  const canSubmit =
    Boolean(
      productSpaceId && projectId && featureId && repositoryId && branch,
    ) &&
    (scopeType === "FEATURE" || Boolean(storyId));

  const start = async () => {
    if (!productSpaceId || !projectId || !canSubmit) return;
    setSubmitting(true);
    setRunError("");
    try {
      const next = await startImpactAnalysis({
        product_space_id: productSpaceId,
        project_id: projectId,
        release_id: releaseId || null,
        scope_type: scopeType,
        scope_id: scopeType === "FEATURE" ? featureId : storyId,
        project_repository_id: repositoryId,
        ref: branch,
        force_repository_refresh: false,
        client_request_id: crypto.randomUUID(),
      });
      setRun(next);
      setRequirements([]);
      setFindings([]);
      setGraph(null);
      setRunUrl(next.run_id);
    } catch (error) {
      setRunError(messageFrom(error, "Impact Analysis could not be started."));
    } finally {
      setSubmitting(false);
    }
  };

  const share = async () => {
    if (!runId) return;
    await navigator.clipboard.writeText(window.location.href);
    setNotice("Immutable run link copied.");
  };

  const exportCsv = () => {
    if (!run) return;
    const rows = visibleFindings.map((finding) => [
      run.run_id,
      run.repository?.commit_sha || "",
      finding.requirement_id,
      finding.requirement,
      finding.status,
      finding.confidence == null ? "" : finding.confidence,
      finding.what_present || "",
      finding.what_missing || "",
      finding.technical_reason || "",
      finding.impact || "",
      finding.recommendation || "",
      finding.evidence_count,
      finding.score_contribution ?? "",
    ]);
    const csv = [
      [
        "Run ID",
        "Commit SHA",
        "Requirement ID",
        "Requirement",
        "Status",
        "Confidence",
        "What Present",
        "What Missing",
        "Technical Reason",
        "Impact",
        "Recommendation",
        "Evidence Count",
        "Score Contribution",
      ],
      ...rows,
    ]
      .map((row) => row.map(safeCsvCell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${run.run_id}-impact-analysis.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const reanalyze = async () => {
    if (!runId) return;
    setSubmitting(true);
    try {
      const response = await reanalyzeImpactRun(runId);
      setNotice(`Re-analysis started from ${response.previous_run_id}.`);
      setRunUrl(response.new_run_id);
    } catch (error) {
      setRunError(messageFrom(error, "Re-analysis could not be started."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="dashboard impact-dashboard impact-evidence-dashboard">
      <div className="source-back">
        <Link href="/data-sources">Data Sources</Link>
        <ChevronRight />
        <span>Impact Analysis</span>
      </div>

      <header className="impact-heading">
        <div>
          <span className="eyebrow">BACKEND-DRIVEN PROJECT INTELLIGENCE</span>
          <h1>Impact Analysis</h1>
          <p>
            Evidence-backed implementation analysis for{" "}
            <b>{project?.name || "the selected Project"}</b>
            {release?.name ? `, ${release.name}` : ""}.
          </p>
        </div>
        <div>
          <button className="secondary" onClick={share} disabled={!runId}>
            <Copy /> Share
          </button>
          <button
            className="secondary"
            onClick={exportCsv}
            disabled={!run || !visibleFindings.length}
          >
            <Download /> CSV
          </button>
          <button
            className="secondary"
            onClick={() => window.print()}
            disabled={!run}
          >
            <Printer /> PDF
          </button>
        </div>
      </header>

      {notice && (
        <div className="impact-notice" role="status">
          <CheckCircle2 /> {notice}
        </div>
      )}

      {!productSpaceId || !projectId ? (
        <ImpactState
          title={
            !productSpaceId ? "Select a Product Space" : "Select a Project"
          }
          text="Impact Analysis inherits Product Space, Project, Release, and Environment from Workspace Context."
        />
      ) : (
        <>
          <section className="card impact-config-card">
            <div className="impact-config-heading">
              <div>
                <span className="eyebrow">ANALYSIS REQUEST</span>
                <h2>Choose implementation scope</h2>
              </div>
              {selectorsLoading && (
                <span className="impact-inline-loading">
                  <LoaderCircle className="spin" /> Loading selectors
                </span>
              )}
            </div>
            {selectorError && <InlineError message={selectorError} />}
            <div className="impact-config-grid">
              <fieldset className="impact-radio-group">
                <legend>Analysis level</legend>
                {(["FEATURE", "USER_STORY"] as ImpactScopeType[]).map(
                  (type) => (
                    <label key={type}>
                      <input
                        type="radio"
                        checked={scopeType === type}
                        onChange={() => setScopeType(type)}
                      />
                      {impactLabel(type)}
                    </label>
                  ),
                )}
              </fieldset>
              <SelectField
                label="Feature"
                value={featureId}
                set={(value) => {
                  setFeatureId(value);
                  setStoryId("");
                }}
                items={planning.features.map((feature) => ({
                  id: feature.id,
                  label: `${feature.key} · ${feature.name}`,
                }))}
                empty="No Features available"
              />
              {scopeType === "USER_STORY" && (
                <SelectField
                  label="User Story"
                  value={storyId}
                  set={setStoryId}
                  items={scopedStories.map((story) => ({
                    id: story.id,
                    label: `${story.key} · ${story.name}`,
                  }))}
                  empty="No User Stories for this Feature"
                />
              )}
              <SelectField
                label="GitHub repository"
                value={repositoryId}
                set={setRepositoryId}
                items={repositories.map((repository) => ({
                  id: repository.association_id,
                  label: repository.full_name,
                }))}
                empty="No linked repositories"
              />
              <SelectField
                label="Branch / ref"
                value={branch}
                set={setBranch}
                disabled={branchesLoading}
                items={branches.map((item) => ({
                  id: item.name,
                  label: item.name,
                }))}
                empty={
                  branchesLoading
                    ? "Loading branches..."
                    : "No branches available"
                }
              />
            </div>
            {branchWarning && <p className="impact-warning">{branchWarning}</p>}
            {!repositories.length && !selectorsLoading && (
              <p className="impact-empty-inline">
                No GitHub repository is connected to this Project.{" "}
                <Link href="/data-sources/github">
                  Go to GitHub Data Source
                </Link>
              </p>
            )}
            <div className="impact-request-preview">
              <dl>
                <Preview label="Project" value={project?.name} />
                <Preview
                  label="Release"
                  value={release?.name || "All Releases"}
                />
                <Preview
                  label="Environment"
                  value={environment?.name || "All Environments"}
                />
                <Preview label="Level" value={impactLabel(scopeType)} />
                <Preview
                  label="Work item"
                  value={
                    scopeType === "FEATURE"
                      ? planning.features.find((item) => item.id === featureId)
                          ?.key
                      : scopedStories.find((item) => item.id === storyId)?.key
                  }
                />
                <Preview
                  label="Repository"
                  value={selectedRepository?.full_name}
                />
                <Preview label="Ref" value={branch} />
              </dl>
              <button onClick={start} disabled={!canSubmit || submitting}>
                {submitting ? <LoaderCircle className="spin" /> : <Play />}
                {submitting ? "Submitting" : "Run Impact Analysis"}
              </button>
            </div>
          </section>

          {runError && <InlineError message={runError} />}
          {runLoading && !run && (
            <ImpactState
              title="Loading saved analysis"
              text="Retrieving the persisted run and its exact repository version."
              loading
            />
          )}
          {run && <RunProgress run={run} />}

          {run?.status === "COMPLETED" && (
            <>
              <RunSummary run={run} onReanalyze={reanalyze} busy={submitting} />
              {resultsLoading ? (
                <ImpactState
                  title="Loading persisted results"
                  text="Loading atomic requirements and backend-classified findings."
                  loading
                />
              ) : (
                <div className="impact-result-layout">
                  <div className="impact-result-main">
                    {comparison && <ComparisonPanel comparison={comparison} />}
                    <RequirementsPanel requirements={requirements} />
                    <section className="card impact-findings-card">
                      <SectionHeading
                        eyebrow="IMPLEMENTATION FINDINGS"
                        title="Evidence-backed findings"
                        aside={`${visibleFindings.length} of ${findings.length}`}
                      />
                      <div className="impact-finding-filters">
                        <label>
                          <Search />
                          <input
                            aria-label="Search findings"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search requirement, reason, recommendation"
                          />
                        </label>
                        <select
                          aria-label="Filter by status"
                          value={statusFilter}
                          onChange={(event) =>
                            setStatusFilter(
                              event.target.value as ImpactStatus | "",
                            )
                          }
                        >
                          <option value="">All statuses</option>
                          {IMPACT_STATUSES.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                        <select
                          aria-label="Filter by category"
                          value={categoryFilter}
                          onChange={(event) =>
                            setCategoryFilter(event.target.value)
                          }
                        >
                          <option value="">All categories</option>
                          {categories.map((category) => (
                            <option key={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <FindingsTable
                        findings={visibleFindings}
                        select={setSelectedFindingId}
                      />
                    </section>
                    <GraphPanel
                      graph={graph}
                      view={graphView}
                      setView={setGraphView}
                      loading={graphLoading}
                      error={graphError}
                    />
                  </div>
                  <HistoryPanel
                    items={historyItems}
                    activeRunId={runId}
                    loading={historyLoading}
                    error={historyError}
                    open={setRunUrl}
                    refresh={refreshHistory}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

      {selectedFindingId && (
        <FindingDrawer
          finding={selectedFinding}
          evidence={evidence}
          run={run}
          repositories={repositories}
          loading={drawerLoading}
          error={drawerError}
          close={() => {
            setSelectedFindingId("");
            setSelectedFinding(null);
            setEvidence([]);
          }}
        />
      )}
    </main>
  );
}

function SelectField({
  label,
  value,
  set,
  items,
  empty,
  disabled = false,
}: {
  label: string;
  value: string;
  set: (value: string) => void;
  items: Array<{ id: string; label: string }>;
  empty: string;
  disabled?: boolean;
}) {
  return (
    <label className="impact-select-field">
      <span>{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => set(event.target.value)}
      >
        {!items.length && <option value="">{empty}</option>}
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Preview({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "Not selected"}</dd>
    </div>
  );
}

function RunProgress({ run }: { run: ImpactRun }) {
  const timeline = run.timeline || [];
  const currentStep =
    timeline.find((item) =>
      ["ACTIVE", "FAILED", "CANCELLED"].includes(item.status),
    ) || timeline[timeline.length - 1];
  const stage =
    currentStep?.label ||
    IMPACT_STAGE_LABELS[run.stage] ||
    impactLabel(run.stage);
  const failed = run.status === "FAILED";
  const completed = run.status === "COMPLETED";
  return (
    <section className="card impact-progress-card" aria-live="polite">
      <div className="impact-progress-header">
        {failed ? (
          <AlertCircle />
        ) : completed ? (
          <CheckCircle2 />
        ) : (
          <LoaderCircle className="spin" />
        )}
        <div>
          <span className="eyebrow">BACKEND PIPELINE · {run.status}</span>
          <h2>{stage || "Impact Analysis is running"}</h2>
          <p>
            {run.message || "The backend is processing persisted evidence."}
          </p>
        </div>
        <strong>{Math.round(run.progress_percent)}%</strong>
      </div>
      <progress value={run.progress_percent} max={100}>
        {run.progress_percent}%
      </progress>
      {!!timeline.length && (
        <ol className="impact-pipeline" aria-label="Backend analysis pipeline">
          {timeline.map((item) => (
            <li
              className={`impact-pipeline-step ${item.status.toLowerCase()}`}
              key={item.stage}
            >
              <span className="impact-step-marker" aria-hidden="true">
                {item.status === "COMPLETED" ? (
                  <CheckCircle2 />
                ) : item.status === "FAILED" ? (
                  <X />
                ) : item.status === "ACTIVE" ? (
                  <LoaderCircle className="spin" />
                ) : (
                  <Clock3 />
                )}
              </span>
              <span className="impact-step-copy">
                <strong>{item.label}</strong>
                <small>{item.message || impactLabel(item.status)}</small>
              </span>
              <small>{item.progress_percent}%</small>
            </li>
          ))}
        </ol>
      )}
      {run.error && (
        <details className="impact-backend-error" open>
          <summary>
            Backend error · {run.error.code} ·{" "}
            {IMPACT_STAGE_LABELS[run.error.stage] ||
              impactLabel(run.error.stage)}
          </summary>
          <pre>{run.error.message}</pre>
        </details>
      )}
      <small className="impact-run-id">Run {run.run_id}</small>
    </section>
  );
}

function RunSummary({
  run,
  onReanalyze,
  busy,
}: {
  run: ImpactRun;
  onReanalyze: () => void;
  busy: boolean;
}) {
  const counts = run.counts || {
    present: 0,
    partial: 0,
    missing: 0,
    unknown: 0,
  };
  return (
    <section className="card impact-run-summary">
      <div className="impact-run-context">
        <span className="eyebrow">COMPLETED PERSISTED RUN</span>
        <h2>{run.scope?.key || run.scope?.title || "Impact Analysis"}</h2>
        <p>
          <GitBranch /> {run.repository?.name || "Repository unavailable"} ·{" "}
          {run.repository?.branch || "Unknown ref"}
        </p>
        <code title={run.repository?.commit_sha || ""}>
          {run.repository?.commit_sha || "Commit SHA unavailable"}
        </code>
        <small>
          <Clock3 />{" "}
          {run.completed_at
            ? new Date(run.completed_at).toLocaleString()
            : "Completion time unavailable"}
        </small>
      </div>
      <div className="impact-score-card">
        <span>Implementation score</span>
        <strong>{formatScore(run.score)}</strong>
        <small>Backend-calculated</small>
      </div>
      {IMPACT_STATUSES.map((status) => (
        <div
          className={`impact-count-card ${status.toLowerCase()}`}
          key={status}
        >
          <StatusBadge status={status} />
          <strong>{counts[status.toLowerCase() as keyof typeof counts]}</strong>
        </div>
      ))}
      <button
        className="secondary impact-reanalyze"
        onClick={onReanalyze}
        disabled={busy}
      >
        <RefreshCw className={busy ? "spin" : ""} /> Re-analyze
      </button>
    </section>
  );
}

function RequirementsPanel({
  requirements,
}: {
  requirements: ImpactRequirement[];
}) {
  return (
    <section className="card impact-requirements-card">
      <SectionHeading
        eyebrow="REQUIREMENTS ANALYZED"
        title="Atomic requirements"
        aside={String(requirements.length)}
      />
      {!requirements.length ? (
        <p className="impact-empty-inline">
          No atomic requirements were returned.
        </p>
      ) : (
        <div className="impact-requirements-list">
          {requirements.map((requirement) => (
            <article key={requirement.requirement_id}>
              <div>
                <strong>{requirement.requirement_id}</strong>
                <span>{impactLabel(requirement.type)}</span>
              </div>
              <p>{requirement.text}</p>
              {requirement.status && (
                <StatusBadge status={requirement.status} />
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ComparisonPanel({ comparison }: { comparison: ImpactRunComparison }) {
  return (
    <section className="card impact-comparison-card">
      <SectionHeading
        eyebrow="BEFORE AND AFTER"
        title="Re-analysis comparison"
        aside={`${comparison.requirement_changes.length} requirement changes`}
      />
      <div className="impact-comparison-scores">
        <span>
          Previous <b>{formatScore(comparison.previous_score)}</b>
        </span>
        <span>
          New <b>{formatScore(comparison.new_score)}</b>
        </span>
        <span>
          Delta <b>{formatScore(comparison.score_delta)}</b>
        </span>
      </div>
      <div className="impact-comparison-list">
        {comparison.requirement_changes.map((item) => (
          <article key={item.requirement_id}>
            <strong>{item.requirement_id}</strong>
            <span>{item.requirement}</span>
            <small>{impactLabel(item.change)}</small>
            <div>
              {item.previous_status ? (
                <StatusBadge status={item.previous_status} />
              ) : (
                <em>Not present</em>
              )}
              <ChevronRight />
              {item.new_status ? (
                <StatusBadge status={item.new_status} />
              ) : (
                <em>Removed</em>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FindingsTable({
  findings,
  select,
}: {
  findings: ImpactFinding[];
  select: (id: string) => void;
}) {
  if (!findings.length)
    return (
      <p className="impact-empty-inline">
        No findings match the current filters.
      </p>
    );
  return (
    <div className="impact-table-scroll">
      <table className="impact-table impact-findings-table">
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Category</th>
            <th>Status</th>
            <th>Confidence</th>
            <th>Evidence</th>
            <th>Score</th>
            <th>Code fix</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((finding) => (
            <tr key={finding.finding_id}>
              <td>
                <strong>{finding.requirement_id}</strong>
                <span>{finding.requirement}</span>
              </td>
              <td>{impactLabel(finding.category)}</td>
              <td>
                <StatusBadge status={finding.status} />
              </td>
              <td>{formatPercent(finding.confidence)}</td>
              <td>{finding.evidence_count}</td>
              <td>{formatScore(finding.score_contribution)}</td>
              <td>{finding.code_generation_available ? "Eligible" : "No"}</td>
              <td>
                <button onClick={() => select(finding.finding_id)}>
                  Review <ChevronRight />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GraphPanel({
  graph,
  view,
  setView,
  loading,
  error,
}: {
  graph: ImpactGraph | null;
  view: ImpactGraphView;
  setView: (view: ImpactGraphView) => void;
  loading: boolean;
  error: string;
}) {
  const names = new Map(
    graph?.nodes.map((node) => [node.id, node.label]) || [],
  );
  return (
    <section className="card impact-graph-card">
      <SectionHeading
        eyebrow="ARCHITECTURE EVIDENCE"
        title="Expected versus actual graph"
        aside={
          graph
            ? `${graph.nodes.length} nodes · ${graph.edges.length} edges`
            : ""
        }
      />
      <div className="impact-graph-tabs" role="tablist">
        {IMPACT_GRAPH_VIEWS.map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={view === item}
            className={view === item ? "active" : ""}
            onClick={() => setView(item)}
          >
            {impactLabel(item)}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="impact-inline-loading">
          <LoaderCircle className="spin" /> Loading {view} graph
        </p>
      ) : error ? (
        <InlineError message={error} />
      ) : !graph?.nodes.length ? (
        <p className="impact-empty-inline">
          No graph evidence is available for this view.
        </p>
      ) : (
        <>
          <div
            className="impact-graph-nodes"
            aria-label={`${impactLabel(view)} graph nodes`}
          >
            {graph.nodes.map((node) => (
              <article
                key={node.id}
                className={(node.status || "unknown").toLowerCase()}
              >
                <Network />
                <strong>{node.label}</strong>
                <span>{node.type ? impactLabel(node.type) : "Node"}</span>
                {node.status && <small>{impactLabel(node.status)}</small>}
              </article>
            ))}
          </div>
          <div className="impact-edge-list">
            <h3>Relationships</h3>
            {graph.edges.map((edge, index) => (
              <div key={edge.id || `${edge.source}-${edge.target}-${index}`}>
                <span>{names.get(edge.source) || edge.source}</span>
                <b>{edge.label || edge.type || "RELATES_TO"}</b>
                <span>{names.get(edge.target) || edge.target}</span>
                {edge.status && <em>{impactLabel(edge.status)}</em>}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function HistoryPanel({
  items,
  activeRunId,
  loading,
  error,
  open,
  refresh,
}: {
  items: ImpactHistoryItem[];
  activeRunId: string;
  loading: boolean;
  error: string;
  open: (runId: string) => void;
  refresh: () => void;
}) {
  return (
    <aside className="card impact-history-card">
      <SectionHeading
        eyebrow="AUDITABLE HISTORY"
        title="Previous runs"
        aside={
          <button onClick={refresh} aria-label="Refresh analysis history">
            <RefreshCw />
          </button>
        }
      />
      {loading ? (
        <p className="impact-inline-loading">
          <LoaderCircle className="spin" /> Loading history
        </p>
      ) : error ? (
        <InlineError message={error} />
      ) : !items.length ? (
        <p className="impact-empty-inline">
          No persisted runs exist for this Project.
        </p>
      ) : (
        <div className="impact-history-list">
          {items.map((item) => (
            <button
              key={item.run_id}
              className={item.run_id === activeRunId ? "active" : ""}
              onClick={() => open(item.run_id)}
            >
              <History />
              <span>
                <strong>{item.scope?.key || item.run_id}</strong>
                <small>
                  {item.repository?.branch || "Unknown ref"} ·{" "}
                  {item.repository?.commit_sha?.slice(0, 8) || "No commit"}
                </small>
                <small>
                  {item.completed_at
                    ? new Date(item.completed_at).toLocaleString()
                    : impactLabel(item.status)}
                </small>
              </span>
              <b>{formatScore(item.score)}</b>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}

function FindingDrawer({
  finding,
  evidence,
  run,
  repositories,
  loading,
  error,
  close,
}: {
  finding: ImpactFinding | null;
  evidence: ImpactEvidence[];
  run: ImpactRun | null;
  repositories: ProjectRepository[];
  loading: boolean;
  error: string;
  close: () => void;
}) {
  const [tab, setTab] = useState("SOURCE_CODE");
  const evidenceTypes = Array.from(new Set(evidence.map((item) => item.type)));
  useEffect(() => {
    if (evidenceTypes.length && !evidenceTypes.includes(tab))
      setTab(evidenceTypes[0]);
  }, [evidenceTypes, tab]);
  return (
    <div
      className="impact-drawer-backdrop"
      role="presentation"
      onMouseDown={close}
    >
      <aside
        className="impact-drawer impact-evidence-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Impact finding details"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span className="eyebrow">FINDING DETAILS</span>
            <h2>{finding?.requirement || "Loading finding"}</h2>
            {finding && <StatusBadge status={finding.status} />}
          </div>
          <button onClick={close} aria-label="Close finding details">
            <X />
          </button>
        </header>
        {loading ? (
          <ImpactState
            title="Loading finding evidence"
            text="Loading persisted detail and exact evidence references."
            loading
          />
        ) : error ? (
          <InlineError message={error} />
        ) : finding ? (
          <>
            <div className="impact-detail-grid">
              <Detail label="What should exist" value={finding.requirement} />
              <Detail label="What is present" value={finding.what_present} />
              <Detail label="What is missing" value={finding.what_missing} />
              <Detail
                label="Technical reason"
                value={finding.technical_reason}
              />
              <Detail label="Explanation" value={finding.explanation} />
              <Detail label="Impact" value={finding.impact} />
              <Detail label="Recommendation" value={finding.recommendation} />
            </div>
            <div className="impact-detail-metrics">
              <span>
                Confidence <b>{formatPercent(finding.confidence)}</b>
              </span>
              <span>
                Completion <b>{formatPercent(finding.completion)}</b>
              </span>
              <span>
                Score <b>{formatScore(finding.score_contribution)}</b>
              </span>
            </div>
            <section className="impact-evidence-section">
              <h3>Validated evidence</h3>
              {evidenceTypes.length ? (
                <>
                  <div className="impact-evidence-tabs">
                    {evidenceTypes.map((type) => (
                      <button
                        key={type}
                        className={tab === type ? "active" : ""}
                        onClick={() => setTab(type)}
                      >
                        {impactLabel(type)}
                      </button>
                    ))}
                  </div>
                  {evidence
                    .filter((item) => item.type === tab)
                    .map((item) => (
                      <EvidenceCard key={item.evidence_id} item={item} />
                    ))}
                </>
              ) : (
                <p className="impact-empty-inline">
                  No validated evidence is available. The backend finding status
                  remains authoritative.
                </p>
              )}
            </section>
            {run ? (
              <CopilotRemediationPanel
                finding={finding}
                run={run}
                repositories={repositories}
              />
            ) : (
              <p className="impact-empty-inline">Run context is unavailable for remediation.</p>
            )}
          </>
        ) : null}
      </aside>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <h3>{label}</h3>
      <p>{value || "Not provided by the analysis backend."}</p>
    </div>
  );
}

function EvidenceCard({ item }: { item: ImpactEvidence }) {
  return (
    <article className="impact-evidence-card">
      <div>
        <FileCode2 />
        <strong>
          {item.file_path || item.document_name || impactLabel(item.type)}
        </strong>
        {item.supports && <StatusBadge status={item.supports} />}
      </div>
      <p>{item.description}</p>
      <dl>
        {item.symbol && <Preview label="Symbol" value={item.symbol} />}
        {(item.start_line || item.end_line) && (
          <Preview
            label="Lines"
            value={`${item.start_line || "?"}–${item.end_line || "?"}`}
          />
        )}
        {item.section && <Preview label="Section" value={item.section} />}
        {item.commit_sha && <Preview label="Commit" value={item.commit_sha} />}
        {item.retrieval_method && (
          <Preview
            label="Retrieved by"
            value={impactLabel(item.retrieval_method)}
          />
        )}
      </dl>
    </article>
  );
}

function StatusBadge({ status }: { status: ImpactStatus }) {
  return (
    <span className={`impact-status ${status.toLowerCase()}`}>
      {impactLabel(status)}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  aside,
}: {
  eyebrow: string;
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="impact-section-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {aside && <span>{aside}</span>}
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="impact-inline-error" role="alert">
      <AlertCircle /> {message}
    </div>
  );
}

function ImpactState({
  title,
  text,
  loading = false,
}: {
  title: string;
  text: string;
  loading?: boolean;
}) {
  return (
    <section className="card impact-state">
      {loading ? <LoaderCircle className="spin" /> : <AlertCircle />}
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </section>
  );
}
