"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Binary,
  Bot,
  Boxes,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleDotDashed,
  CloudCog,
  Code2,
  Database,
  FileSearch,
  FileText,
  Filter,
  GitBranch,
  GitMerge,
  Layers3,
  LockKeyhole,
  Network,
  Orbit,
  PackageCheck,
  Radar,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Waypoints,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useWorkspaceContext } from "@/workspace-context";
import styles from "./architecture-workspace.module.css";

type Maturity = "live" | "separate" | "target";
type ViewMode = "complete" | "current" | "target";

type Layer = {
  id: number;
  title: string;
  plane: string;
  maturity: Maturity;
  icon: LucideIcon;
  summary: string;
  inputs: string[];
  responsibilities: string[];
  outputs: string[];
  implementation: string;
};

const layers: Layer[] = [
  {
    id: 1,
    title: "Experience",
    plane: "Control plane",
    maturity: "live",
    icon: Sparkles,
    summary:
      "Dashboards, Data Sources, Architecture, Impact Analysis and Ask ReleaseLens form one release-aware workspace.",
    inputs: ["User intent", "Navigation", "Selected workspace"],
    responsibilities: [
      "Present one consistent application shell",
      "Expose evidence and source health",
      "Keep decisions human-controlled",
    ],
    outputs: ["Questions", "Source actions", "Release decisions"],
    implementation: "Next.js application shell and Project-scoped workspaces",
  },
  {
    id: 2,
    title: "Workspace context",
    plane: "Control plane",
    maturity: "live",
    icon: Target,
    summary:
      "Product Space, Project, PI Release and Environment establish the active data and decision boundary.",
    inputs: ["Product Space", "Project", "Release", "Environment"],
    responsibilities: [
      "Share context across ReleaseLens",
      "Reset incompatible child selections",
      "Provide filters to downstream APIs",
    ],
    outputs: ["Canonical scope", "Project IDs", "Filter metadata"],
    implementation: "Shared Zustand-backed Workspace Context provider",
  },
  {
    id: 3,
    title: "Identity & scope guard",
    plane: "Control plane",
    maturity: "separate",
    icon: LockKeyhole,
    summary:
      "Every operation must prove that the actor, Project, Release, repository and document belong to the same authorized scope.",
    inputs: ["Actor", "Workspace IDs", "Requested resource"],
    responsibilities: [
      "Validate hierarchy membership",
      "Prevent cross-Project evidence",
      "Enforce read and write permissions",
    ],
    outputs: ["Authorized request", "Typed scope error", "Audit identity"],
    implementation:
      "Scope checks exist; production authentication still needs to replace local-user",
  },
  {
    id: 4,
    title: "Enterprise connectors",
    plane: "Control plane",
    maturity: "live",
    icon: CloudCog,
    summary:
      "Project Management, GitHub, Knowledge Base and Impact Analysis provide complementary release evidence.",
    inputs: ["Planning database", "GitHub API", "Uploaded documents"],
    responsibilities: [
      "Connect authoritative sources",
      "Surface availability and freshness",
      "Associate every source with a Project",
    ],
    outputs: [
      "Planning records",
      "Repository links",
      "Documents",
      "Risk snapshot",
    ],
    implementation:
      "Four Data Source areas are available with different maturity levels",
  },
  {
    id: 5,
    title: "Ingestion pipelines",
    plane: "Knowledge plane",
    maturity: "separate",
    icon: Workflow,
    summary:
      "Source-specific pipelines validate, parse, summarize and prepare records without losing provenance.",
    inputs: ["Features and stories", "Repository archive", "PDF/DOCX/MD/TXT"],
    responsibilities: [
      "Validate input and scope",
      "Parse or summarize content",
      "Track jobs, retries and failure state",
    ],
    outputs: ["Normalized text", "Summary artifacts", "Ingestion events"],
    implementation:
      "Knowledge ingestion and GitHub summary indexing work independently",
  },
  {
    id: 6,
    title: "Normalization & catalog",
    plane: "Knowledge plane",
    maturity: "separate",
    icon: GitMerge,
    summary:
      "Source records are converted into stable identifiers, human-readable keys, version metadata and Project associations.",
    inputs: ["Provider metadata", "Extracted text", "Planning hierarchy"],
    responsibilities: [
      "Normalize source contracts",
      "Preserve branch, commit, page and section metadata",
      "Separate linked, indexed and searchable states",
    ],
    outputs: ["Catalog records", "Source provenance", "Traceability keys"],
    implementation:
      "Catalogs exist, but one shared artifact contract is still a target",
  },
  {
    id: 7,
    title: "Storage & indexes",
    plane: "Knowledge plane",
    maturity: "live",
    icon: Database,
    summary:
      "PostgreSQL stores structured truth and audit state; pgvector stores semantic indexes; the artifact store preserves generated files.",
    inputs: ["Structured records", "Chunks", "Embeddings", "Artifacts"],
    responsibilities: [
      "Persist scoped source data",
      "Index relational and vector fields",
      "Retain version and processing metadata",
    ],
    outputs: ["SQL rows", "Vector chunks", "Versioned artifacts"],
    implementation:
      "PostgreSQL, pgvector and filesystem artifacts are implemented",
  },
  {
    id: 8,
    title: "Retrieval planner",
    plane: "Intelligence plane",
    maturity: "target",
    icon: Route,
    summary:
      "A Project-scoped planner should translate each question into structured, keyword, vector and impact searches.",
    inputs: ["Question", "Intent", "Workspace scope", "Source readiness"],
    responsibilities: [
      "Choose retrieval strategies",
      "Apply Release and Environment filters",
      "Set source, result and token budgets",
    ],
    outputs: ["Search plan", "Authorized queries", "Retrieval budget"],
    implementation:
      "Chat currently uses a keyword intent classifier and structured Project SQL only",
  },
  {
    id: 9,
    title: "Evidence fusion",
    plane: "Intelligence plane",
    maturity: "target",
    icon: Orbit,
    summary:
      "Results from planning, code, documents and impact analysis must be ranked, deduplicated and assembled into one evidence bundle.",
    inputs: [
      "SQL results",
      "GitHub chunks",
      "Document chunks",
      "Impact records",
    ],
    responsibilities: [
      "Rerank heterogeneous evidence",
      "Remove duplicates and low-confidence matches",
      "Preserve citation-ready provenance",
    ],
    outputs: ["Bounded context", "Citation map", "Retrieval diagnostics"],
    implementation:
      "This is the central integration gap described by the planning guides",
  },
  {
    id: 10,
    title: "Intelligence services",
    plane: "Intelligence plane",
    maturity: "separate",
    icon: BrainCircuit,
    summary:
      "Ask ReleaseLens generates grounded answers while Impact Analysis derives component exposure and delivery risk.",
    inputs: ["Question and evidence", "Planning records", "Algorithm version"],
    responsibilities: [
      "Generate grounded Markdown",
      "Calculate explainable risk",
      "Acknowledge unsupported conclusions",
    ],
    outputs: ["Answer", "Impact scores", "Recommended actions"],
    implementation:
      "Both capabilities work, but chat does not yet retrieve GitHub, Knowledge Base or Impact evidence",
  },
  {
    id: 11,
    title: "Trust & persistence",
    plane: "Intelligence plane",
    maturity: "separate",
    icon: ShieldCheck,
    summary:
      "Guardrails, citations, idempotency and audit records make every response reviewable and safe to retry.",
    inputs: ["Model answer", "Evidence bundle", "Run metadata", "Actor"],
    responsibilities: [
      "Validate and sanitize output",
      "Persist messages and retrieval events",
      "Keep source and model provenance",
    ],
    outputs: ["Safe response", "Audit trail", "Evidence metadata"],
    implementation:
      "Chat persistence and sanitization exist; unified citation validation remains target work",
  },
  {
    id: 12,
    title: "Outcomes & feedback",
    plane: "Intelligence plane",
    maturity: "target",
    icon: PackageCheck,
    summary:
      "People review evidence, decide release actions and feed actual outcomes back into retrieval quality and risk calibration.",
    inputs: ["Answer", "Evidence", "Risk", "Human review"],
    responsibilities: [
      "Support release decisions",
      "Capture corrections and outcomes",
      "Improve ranking and risk calibration",
    ],
    outputs: ["Approved action", "Traceability", "Quality feedback"],
    implementation:
      "Dashboards support review; a closed-loop quality system is the target state",
  },
];

const sourceNodes = [
  [
    "Project Management",
    "Releases · Features · Stories · Criteria",
    Boxes,
    "blue",
    "Current chat source",
  ],
  [
    "GitHub",
    "Repository · Branch · Commit · Code",
    GitBranch,
    "violet",
    "Linked + separately indexed",
  ],
  [
    "Knowledge Base",
    "Documents · Pages · Sections · Chunks",
    FileText,
    "amber",
    "Embedded independently",
  ],
  [
    "Impact Analysis",
    "Components · Scores · Evidence · Actions",
    Waypoints,
    "rose",
    "Planning-derived today",
  ],
] satisfies ReadonlyArray<
  readonly [string, string, LucideIcon, string, string]
>;

const metrics = [
  ["12", "Architecture layers", Layers3],
  ["4", "Enterprise sources", CloudCog],
  ["3", "Retrieval strategies", Search],
  ["1", "Evidence chain", GitMerge],
] satisfies ReadonlyArray<readonly [string, string, LucideIcon]>;

const storySteps = [
  ["01", "Scope", "Select the decision boundary", Target],
  ["02", "Connect", "Attach authoritative sources", CloudCog],
  ["03", "Index", "Create searchable knowledge", Database],
  ["04", "Reason", "Retrieve, rank and explain", BrainCircuit],
  ["05", "Decide", "Review evidence and act", PackageCheck],
] satisfies ReadonlyArray<readonly [string, string, string, LucideIcon]>;

const controls = [
  [LockKeyhole, "Authorization", "Tenant and Project boundaries"],
  [ShieldCheck, "Security", "Secrets, redaction and safe output"],
  [Activity, "Observability", "Runs, latency, errors and health"],
  [Workflow, "Reliability", "Jobs, retries and idempotency"],
  [FileSearch, "Governance", "Provenance, retention and audit"],
  [Filter, "Quality", "Thresholds, citations and feedback"],
] satisfies ReadonlyArray<readonly [LucideIcon, string, string]>;

function maturityLabel(maturity: Maturity) {
  if (maturity === "live") return "Operating";
  if (maturity === "separate") return "Operating separately";
  return "Target integration";
}

function ArchitectureNode({
  layer,
  selected,
  onSelect,
}: {
  layer: Layer;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = layer.icon;
  return (
    <button
      type="button"
      className={`${styles.architectureNode} ${styles[layer.maturity]} ${selected ? styles.selected : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className={styles.nodeNumber}>
        {String(layer.id).padStart(2, "0")}
      </span>
      <span className={styles.nodeIcon}>
        <Icon />
      </span>
      <span className={styles.nodeCopy}>
        <strong>{layer.title}</strong>
        <small>{maturityLabel(layer.maturity)}</small>
      </span>
      <ChevronRight className={styles.nodeChevron} />
    </button>
  );
}

function FlowArrow({
  dashed = false,
  label,
}: {
  dashed?: boolean;
  label?: string;
}) {
  return (
    <span className={`${styles.flowArrow} ${dashed ? styles.dashed : ""}`}>
      {label && <small>{label}</small>}
      <i />
      <ArrowRight />
    </span>
  );
}

function VerticalBridge({
  label,
  dashed = false,
}: {
  label: string;
  dashed?: boolean;
}) {
  return (
    <div className={`${styles.verticalBridge} ${dashed ? styles.dashed : ""}`}>
      <span>{label}</span>
      <i />
      <ArrowDown />
    </div>
  );
}

export function ArchitectureWorkspace() {
  const project = useWorkspaceContext((state) => state.project);
  const release = useWorkspaceContext((state) => state.release);
  const environment = useWorkspaceContext((state) => state.environment);
  const [selectedLayerId, setSelectedLayerId] = useState(9);
  const [viewMode, setViewMode] = useState<ViewMode>("complete");
  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selectedLayerId) || layers[8],
    [selectedLayerId],
  );
  const DetailIcon = selectedLayer.icon;

  const chooseLayer = (id: number) => {
    setSelectedLayerId(id);
    document
      .getElementById("layer-detail")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <main className={`dashboard ${styles.architecturePage}`}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <span className={styles.kicker}>
            <Network /> PLATFORM BLUEPRINT · RELEASE INTELLIGENCE SYSTEM
          </span>
          <h1>
            From enterprise artifacts
            <span>to evidence-backed release decisions.</span>
          </h1>
          <p>
            Explore the twelve layers that connect planning, source code,
            documents, retrieval, AI and human review inside one controlled
            Project scope.
          </p>
          <div className={styles.heroActions}>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("architecture-map")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore the system <ArrowDown />
            </button>
            <span>
              <CircleDotDashed /> Dotted paths identify the integration target
            </span>
          </div>
        </div>
        <aside className={styles.scopeCard}>
          <span>CURRENT BLUEPRINT SCOPE</span>
          <strong>{project?.name || "Select a Project"}</strong>
          <dl>
            <div>
              <dt>Release</dt>
              <dd>{release?.name || "All releases"}</dd>
            </div>
            <div>
              <dt>Environment</dt>
              <dd>{environment?.name || "All environments"}</dd>
            </div>
          </dl>
          <small>
            <ShieldCheck /> Scope follows Workspace Context
          </small>
        </aside>
      </section>

      <section className={styles.metrics} aria-label="Architecture summary">
        {metrics.map(([value, label, Icon]) => (
          <article className="card" key={label}>
            <span>
              <Icon />
            </span>
            <div>
              <strong>{value}</strong>
              <small>{label}</small>
            </div>
          </article>
        ))}
      </section>

      <section className={`card ${styles.operatingModel}`}>
        <header>
          <div>
            <span className={styles.sectionKicker}>THE OPERATING MODEL</span>
            <h2>Five moves from context to confidence</h2>
          </div>
          <div className={styles.legend}>
            <span>
              <i className={styles.solidLegend} /> Operating path
            </span>
            <span>
              <i className={styles.dottedLegend} /> Target integration
            </span>
          </div>
        </header>
        <div className={styles.storyline}>
          {storySteps.map(([number, title, note, Icon], index) => (
            <div className={styles.storyStep} key={title}>
              <article>
                <span>{number}</span>
                <Icon />
                <strong>{title}</strong>
                <small>{note}</small>
              </article>
              {index < storySteps.length - 1 && (
                <FlowArrow dashed={index === 2} />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className={`card ${styles.systemMap}`} id="architecture-map">
        <header className={styles.mapHeader}>
          <div>
            <span className={styles.sectionKicker}>INTERACTIVE SYSTEM MAP</span>
            <h2>One platform. Three planes. Twelve layers.</h2>
            <p>Select a layer to inspect its role in the end-to-end flow.</p>
          </div>
          <div
            className={styles.viewToggle}
            role="group"
            aria-label="Architecture view"
          >
            {(
              [
                ["complete", "Complete system"],
                ["current", "Current state"],
                ["target", "Target state"],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={viewMode === value ? styles.activeView : ""}
                onClick={() => setViewMode(value)}
                aria-pressed={viewMode === value}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className={styles.mapViewport}>
          <div className={`${styles.mapCanvas} ${styles[viewMode]}`}>
            <div className={styles.planeLabel}>
              <span>01</span>
              <div>
                <strong>Control plane</strong>
                <small>Identity, intent and scope</small>
              </div>
            </div>
            <div className={styles.planeTrack}>
              {layers.slice(0, 4).map((layer, index) => (
                <div className={styles.trackItem} key={layer.id}>
                  <ArchitectureNode
                    layer={layer}
                    selected={selectedLayerId === layer.id}
                    onSelect={() => chooseLayer(layer.id)}
                  />
                  {index < 3 && <FlowArrow dashed={layer.id === 2} />}
                </div>
              ))}
            </div>

            <VerticalBridge label="Authorized source access" />

            <div className={styles.sourceFanout}>
              {sourceNodes.map(([title, note, Icon, tone, state]) => (
                <article
                  className={`${styles.sourceNode} ${styles[tone]}`}
                  key={title}
                >
                  <span>
                    <Icon />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <small>{note}</small>
                  </div>
                  <em>{state}</em>
                </article>
              ))}
            </div>

            <VerticalBridge label="Validate · parse · summarize · embed" />

            <div className={styles.planeLabel}>
              <span>02</span>
              <div>
                <strong>Knowledge plane</strong>
                <small>Ingestion, provenance and indexes</small>
              </div>
            </div>
            <div className={`${styles.planeTrack} ${styles.threeColumns}`}>
              {layers.slice(4, 7).map((layer, index) => (
                <div className={styles.trackItem} key={layer.id}>
                  <ArchitectureNode
                    layer={layer}
                    selected={selectedLayerId === layer.id}
                    onSelect={() => chooseLayer(layer.id)}
                  />
                  {index < 2 && <FlowArrow />}
                </div>
              ))}
            </div>

            <div className={styles.storageRail}>
              <span>
                <Database /> PostgreSQL <small>structured truth + audit</small>
              </span>
              <span>
                <Binary /> pgvector <small>semantic chunks</small>
              </span>
              <span>
                <FileText /> Artifacts <small>summaries + manifests</small>
              </span>
            </div>

            <VerticalBridge label="Unified Project evidence" dashed />

            <div className={styles.planeLabel}>
              <span>03</span>
              <div>
                <strong>Intelligence plane</strong>
                <small>Retrieval, reasoning and decisions</small>
              </div>
            </div>
            <div className={`${styles.planeTrack} ${styles.fiveColumns}`}>
              {layers.slice(7).map((layer, index) => (
                <div className={styles.trackItem} key={layer.id}>
                  <ArchitectureNode
                    layer={layer}
                    selected={selectedLayerId === layer.id}
                    onSelect={() => chooseLayer(layer.id)}
                  />
                  {index < 4 && <FlowArrow dashed={index < 2} />}
                </div>
              ))}
            </div>

            <div className={styles.answerRail}>
              <span>
                <Bot /> Ask ReleaseLens
              </span>
              <ArrowRight />
              <span>
                <FileSearch /> Verifiable citations
              </span>
              <ArrowRight />
              <span>
                <Radar /> Impact & readiness
              </span>
              <ArrowRight />
              <span>
                <Check /> Human-approved action
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.realitySection}>
        <header>
          <div>
            <span className={styles.sectionKicker}>
              CURRENT REALITY → CONNECTED TARGET
            </span>
            <h2>The integration gap, made explicit</h2>
          </div>
        </header>
        <div className={styles.realityGrid}>
          <article className={`card ${styles.realityCard}`}>
            <span className={styles.currentBadge}>OPERATING TODAY</span>
            <h3>Capabilities work in parallel</h3>
            <div className={styles.miniFlow}>
              <span>
                <Boxes /> Planning
              </span>
              <FlowArrow />
              <span>
                <Bot /> Chat
              </span>
            </div>
            <ul>
              <li>Chat grounds answers in structured Project records.</li>
              <li>GitHub linking and summary indexing are separate actions.</li>
              <li>Knowledge documents are embedded independently.</li>
              <li>Impact is derived from planning text and fixed rules.</li>
            </ul>
          </article>

          <div className={styles.gapBridge}>
            <span>UNIFIED RETRIEVAL LAYER</span>
            <i />
            <ArrowRight />
            <small>scope · search · rank · cite</small>
          </div>

          <article
            className={`card ${styles.realityCard} ${styles.targetCard}`}
          >
            <span className={styles.targetBadge}>CONNECTED TARGET</span>
            <h3>Evidence converges by Project scope</h3>
            <div className={styles.fusionOrbit}>
              <span>
                <Boxes /> SQL
              </span>
              <span>
                <Code2 /> Code
              </span>
              <strong>
                <Orbit /> Evidence
              </strong>
              <span>
                <FileText /> Docs
              </span>
              <span>
                <Activity /> Risk
              </span>
            </div>
            <ul>
              <li>Release and Environment filters apply consistently.</li>
              <li>SQL, keyword, vector and impact retrieval work together.</li>
              <li>Every answer carries source and version provenance.</li>
              <li>Release intent traces to code, documents and risk.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className={`card ${styles.layerExplorer}`}>
        <header>
          <div>
            <span className={styles.sectionKicker}>LAYER EXPLORER</span>
            <h2>Inspect the platform contract</h2>
          </div>
          <span className={styles.selectedCounter}>
            Layer {selectedLayer.id} of 12
          </span>
        </header>
        <div className={styles.layerLayout}>
          <nav className={styles.layerNav} aria-label="Architecture layers">
            {layers.map((layer) => {
              const Icon = layer.icon;
              return (
                <button
                  type="button"
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={
                    selectedLayer.id === layer.id ? styles.selectedLayer : ""
                  }
                  aria-current={
                    selectedLayer.id === layer.id ? "step" : undefined
                  }
                >
                  <span>{String(layer.id).padStart(2, "0")}</span>
                  <Icon />
                  <strong>{layer.title}</strong>
                  <i className={styles[layer.maturity]} />
                </button>
              );
            })}
          </nav>

          <article className={styles.layerDetail} id="layer-detail">
            <header>
              <span
                className={`${styles.detailIcon} ${styles[selectedLayer.maturity]}`}
              >
                <DetailIcon />
              </span>
              <div>
                <small>
                  {selectedLayer.plane} · LAYER{" "}
                  {String(selectedLayer.id).padStart(2, "0")}
                </small>
                <h3>{selectedLayer.title}</h3>
              </div>
              <em className={styles[selectedLayer.maturity]}>
                {maturityLabel(selectedLayer.maturity)}
              </em>
            </header>
            <p>{selectedLayer.summary}</p>
            <div className={styles.contractGrid}>
              <section>
                <span>INPUTS</span>
                {selectedLayer.inputs.map((item) => (
                  <small key={item}>{item}</small>
                ))}
              </section>
              <section>
                <span>RESPONSIBILITY</span>
                {selectedLayer.responsibilities.map((item) => (
                  <small key={item}>{item}</small>
                ))}
              </section>
              <section>
                <span>OUTPUTS</span>
                {selectedLayer.outputs.map((item) => (
                  <small key={item}>{item}</small>
                ))}
              </section>
            </div>
            <footer>
              <Activity />
              <span>
                <small>IMPLEMENTATION NOTE</small>
                <strong>{selectedLayer.implementation}</strong>
              </span>
            </footer>
          </article>
        </div>
      </section>

      <section className={styles.crossCutting}>
        <div>
          <span className={styles.sectionKicker}>
            EVERY LAYER, EVERY REQUEST
          </span>
          <h2>Cross-cutting platform controls</h2>
          <p>Trust is not a final step. It surrounds the entire workflow.</p>
        </div>
        <div className={styles.controlGrid}>
          {controls.map(([Icon, title, note]) => (
            <article key={title}>
              <Icon />
              <span>
                <strong>{title}</strong>
                <small>{note}</small>
              </span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
