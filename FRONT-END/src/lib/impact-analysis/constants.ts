import type {
  ImpactGraphView,
  ImpactRunStatus,
  ImpactStatus,
} from "./types";

export const IMPACT_STATUSES: ImpactStatus[] = [
  "PRESENT",
  "PARTIAL",
  "MISSING",
  "UNKNOWN",
];

export const IMPACT_GRAPH_VIEWS: ImpactGraphView[] = [
  "expected",
  "actual",
  "comparison",
];

export const TERMINAL_RUN_STATUSES = new Set<ImpactRunStatus>([
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

export const IMPACT_POLL_INTERVAL_MS = 3000;

export const IMPACT_STAGE_LABELS: Record<string, string> = {
  SCOPE_RESOLUTION: "Resolving analysis scope",
  REQUIREMENT_LOADING: "Loading requirements",
  REQUIREMENT_DECOMPOSITION: "Decomposing requirements",
  EXPECTED_ARCHITECTURE: "Building expected architecture",
  REPOSITORY_SNAPSHOT: "Capturing repository snapshot",
  SOURCE_INDEXING: "Indexing repository source",
  ACTUAL_GRAPH: "Building actual graph",
  EVIDENCE_RETRIEVAL: "Retrieving evidence",
  COMPARISON: "Comparing expected and actual implementation",
  CLASSIFICATION: "Classifying findings",
  SCORE_CALCULATION: "Calculating implementation score",
  SAVING_RESULTS: "Saving persisted results",
};
