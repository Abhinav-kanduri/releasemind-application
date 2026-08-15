export type ImpactLevel =
  "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NO_IMPACT" | "UNKNOWN";

export type ReviewState =
  "AI_IDENTIFIED" | "UNDER_REVIEW" | "CONFIRMED" | "REJECTED";

export type PlanningRecord = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  storyText?: string | null;
  status?: string;
  priority?: string;
  releaseId?: string | null;
  featureId?: string;
  sprintId?: string | null;
  storyPoints?: number | null;
};

export type ArchitectureComponent = {
  id: string;
  name: string;
  kind: string;
  risk: ImpactLevel;
  impactedRecords: number;
  x: number;
  y: number;
};

export type Evidence = {
  id: string;
  sourceDocument: string;
  page: string;
  component: string;
  relationship: string;
  planningRecord: string;
  method: string;
  confidence: number;
  timestamp: string;
};

export type ImpactResult = {
  id: string;
  recordType: "FEATURE" | "USER_STORY";
  recordId: string;
  releaseId: string | null;
  parentFeatureId: string | null;
  sprintId: string | null;
  key: string;
  name: string;
  planningStatus: string;
  impactLevel: ImpactLevel;
  impactScore: number | null;
  deliveryRisk: number | null;
  riskLevel: ImpactLevel;
  correlationConfidence: number;
  components: string[];
  reviewState: ReviewState;
  requiredAction: string;
  evidence: Evidence[];
  factors: Array<{ label: string; value: number; contribution: number }>;
};

export type ImpactAnalysisSnapshot = {
  snapshot: {
    id: string;
    status: "CURRENT" | "PARTIAL" | "STALE" | "FAILED";
    analyzedAt: string;
    algorithmVersion: string;
    architectureVersion: string;
    architectureStatus: "APPROVED" | "UNAVAILABLE";
    scope: {
      productSpaceId: string;
      projectId: string;
      projectName: string;
      releaseId: string | null;
      featureId: string | null;
      sprintId: string | null;
      userStoryId: string | null;
    };
  };
  summary: {
    architectureComponents: number;
    analyzedFeatures: number;
    impactedFeatures: number;
    highRiskFeatures: number;
    impactedStories: number;
    unmappedFeatures: number;
    overallProjectRisk: ImpactLevel;
  };
  components: ArchitectureComponent[];
  features: ImpactResult[];
  stories: ImpactResult[];
  riskDistribution: Record<ImpactLevel, number>;
  generatedFrom: {
    featureCount: number;
    storyCount: number;
    coveragePercent: number;
  };
};

type ComponentRule = {
  id: string;
  name: string;
  kind: string;
  terms: string[];
  x: number;
  y: number;
};

const componentRules: ComponentRule[] = [
  {
    id: "web-app",
    name: "Web Application",
    kind: "APPLICATION",
    terms: [
      "screen",
      "page",
      "user interface",
      "frontend",
      "portal",
      "dashboard",
    ],
    x: 12,
    y: 28,
  },
  {
    id: "api-gateway",
    name: "API Gateway",
    kind: "API",
    terms: ["api", "endpoint", "integration", "request", "gateway"],
    x: 37,
    y: 28,
  },
  {
    id: "identity-service",
    name: "Identity Service",
    kind: "SERVICE",
    terms: ["login", "identity", "auth", "permission", "access", "role"],
    x: 62,
    y: 12,
  },
  {
    id: "workflow-service",
    name: "Workflow Service",
    kind: "SERVICE",
    terms: ["workflow", "order", "release", "process", "approval", "status"],
    x: 62,
    y: 45,
  },
  {
    id: "notification-service",
    name: "Notification Service",
    kind: "SERVICE",
    terms: ["notification", "email", "alert", "message", "reminder"],
    x: 85,
    y: 28,
  },
  {
    id: "project-data-store",
    name: "Project Data Store",
    kind: "DATABASE",
    terms: [
      "data",
      "document",
      "record",
      "database",
      "persist",
      "save",
      "search",
    ],
    x: 62,
    y: 78,
  },
];

const levels: ImpactLevel[] = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "NO_IMPACT",
  "UNKNOWN",
];

function stableHash(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function bounded(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function classify(score: number): ImpactLevel {
  if (score >= 85) return "CRITICAL";
  if (score >= 68) return "HIGH";
  if (score >= 45) return "MEDIUM";
  return "LOW";
}

function severity(level: ImpactLevel) {
  return levels.indexOf(level);
}

function maxLevel(current: ImpactLevel, next: ImpactLevel) {
  if (current === "UNKNOWN") return next;
  if (next === "UNKNOWN") return current;
  return severity(next) < severity(current) ? next : current;
}

function matchedComponents(record: PlanningRecord) {
  const content =
    `${record.name} ${record.description || ""} ${record.storyText || ""}`.toLowerCase();
  return componentRules.filter((component) =>
    component.terms.some((term) => content.includes(term)),
  );
}

function analyzeRecord(
  record: PlanningRecord,
  recordType: "FEATURE" | "USER_STORY",
  analyzedAt: string,
): ImpactResult {
  const components = matchedComponents(record);
  const priority = (record.priority || "MEDIUM").toUpperCase();
  const status = (record.status || "UNKNOWN").toUpperCase();
  const jitter = stableHash(record.id) % 9;
  const priorityExposure =
    priority === "CRITICAL"
      ? 94
      : priority === "HIGH"
        ? 78
        : priority === "LOW"
          ? 38
          : 58;
  const completionExposure = /DONE|COMPLETE|CLOSED|RELEASED/.test(status)
    ? 72
    : 48;
  const implementationExposure = bounded(36 + components.length * 18 + jitter);
  const testCoverageGap = bounded(
    32 + (recordType === "USER_STORY" ? 7 : 15) + jitter,
  );
  const dependencySeverity = bounded(
    components.length * 24 + priorityExposure * 0.35,
  );
  const releaseProximity = record.releaseId ? 64 : 28;
  const documentationFreshness = 42;
  const unresolvedDefects =
    priority === "CRITICAL" ? 74 : priority === "HIGH" ? 55 : 32;
  const unresolvedDependencyRisk = bounded(components.length * 17 + jitter);
  const correlationConfidence =
    components.length === 0
      ? 0.22
      : Math.min(0.96, 0.68 + components.length * 0.07);

  if (!components.length) {
    return {
      id: `impact-${recordType.toLowerCase()}-${record.id}`,
      recordType,
      recordId: record.id,
      releaseId: record.releaseId || null,
      parentFeatureId: record.featureId || null,
      sprintId: record.sprintId || null,
      key: record.key || record.id,
      name: record.name,
      planningStatus: status,
      impactLevel: "UNKNOWN",
      impactScore: null,
      deliveryRisk: null,
      riskLevel: "UNKNOWN",
      correlationConfidence,
      components: [],
      reviewState: "UNDER_REVIEW",
      requiredAction: "Map to architecture",
      evidence: [],
      factors: [],
    };
  }

  const impactScore = bounded(
    implementationExposure * 0.45 +
      dependencySeverity * 0.35 +
      priorityExposure * 0.2,
  );
  const deliveryRisk = bounded(
    dependencySeverity * 0.25 +
      implementationExposure * 0.2 +
      completionExposure * 0.15 +
      testCoverageGap * 0.15 +
      releaseProximity * 0.1 +
      unresolvedDefects * 0.05 +
      documentationFreshness * 0.05 +
      unresolvedDependencyRisk * 0.05,
  );
  const impactLevel = classify(impactScore);
  const riskLevel = classify(deliveryRisk);
  const completed = /DONE|COMPLETE|CLOSED|RELEASED/.test(status);
  const requiredAction =
    completed && deliveryRisk >= 68
      ? "Regression testing required"
      : deliveryRisk >= 68
        ? "Review delivery plan"
        : impactScore >= 68
          ? "Update acceptance criteria"
          : "Monitor";

  return {
    id: `impact-${recordType.toLowerCase()}-${record.id}`,
    recordType,
    recordId: record.id,
    releaseId: record.releaseId || null,
    parentFeatureId: record.featureId || null,
    sprintId: record.sprintId || null,
    key: record.key || record.id,
    name: record.name,
    planningStatus: status,
    impactLevel,
    impactScore,
    deliveryRisk,
    riskLevel,
    correlationConfidence,
    components: components.map((component) => component.name),
    reviewState:
      correlationConfidence >= 0.82 ? "AI_IDENTIFIED" : "UNDER_REVIEW",
    requiredAction,
    evidence: components.map((component) => ({
      id: `evidence-${record.id}-${component.id}`,
      sourceDocument: "Project Management planning record",
      page: "Not applicable",
      component: component.name,
      relationship:
        component.id === "web-app"
          ? "CALLS API Gateway"
          : component.id === "project-data-store"
            ? "WRITES_TO Project Data Store"
            : "DEPENDS_ON",
      planningRecord: `${record.key || record.id} - ${record.name}`,
      method: "Normalized component-name match",
      confidence: correlationConfidence,
      timestamp: analyzedAt,
    })),
    factors: [
      {
        label: "Architecture dependency severity",
        value: dependencySeverity,
        contribution: 25,
      },
      {
        label: "Implementation change exposure",
        value: implementationExposure,
        contribution: 20,
      },
      {
        label: "Completion exposure",
        value: completionExposure,
        contribution: 15,
      },
      { label: "Test coverage gap", value: testCoverageGap, contribution: 15 },
      { label: "Release proximity", value: releaseProximity, contribution: 10 },
      {
        label: "Unresolved defects",
        value: unresolvedDefects,
        contribution: 5,
      },
      {
        label: "Documentation freshness",
        value: documentationFreshness,
        contribution: 5,
      },
      {
        label: "Dependency risk",
        value: unresolvedDependencyRisk,
        contribution: 5,
      },
    ],
  };
}

export function buildImpactAnalysis(input: {
  productSpaceId: string;
  projectId: string;
  projectName: string;
  releaseId?: string | null;
  featureId?: string | null;
  sprintId?: string | null;
  userStoryId?: string | null;
  features: PlanningRecord[];
  stories: PlanningRecord[];
  analyzedAt?: string;
}): ImpactAnalysisSnapshot {
  const analyzedAt = input.analyzedAt || new Date().toISOString();
  const features = input.features
    .filter(
      (record) => !input.releaseId || record.releaseId === input.releaseId,
    )
    .filter((record) => !input.featureId || record.id === input.featureId)
    .map((record) => analyzeRecord(record, "FEATURE", analyzedAt));
  const featureIds = new Set(features.map((feature) => feature.recordId));
  const stories = input.stories
    .filter(
      (record) => !input.releaseId || record.releaseId === input.releaseId,
    )
    .filter(
      (record) => !input.featureId || featureIds.has(record.featureId || ""),
    )
    .filter((record) => !input.sprintId || record.sprintId === input.sprintId)
    .filter((record) => !input.userStoryId || record.id === input.userStoryId)
    .map((record) => analyzeRecord(record, "USER_STORY", analyzedAt));
  const allResults = [...features, ...stories];
  const componentResults = componentRules
    .map((component) => {
      const related = allResults.filter((result) =>
        result.components.includes(component.name),
      );
      return {
        id: component.id,
        name: component.name,
        kind: component.kind,
        risk: related.reduce(
          (highest, result) => maxLevel(highest, result.riskLevel),
          "UNKNOWN" as ImpactLevel,
        ),
        impactedRecords: related.length,
        x: component.x,
        y: component.y,
      };
    })
    .filter((component) => component.impactedRecords > 0);
  const mapped = allResults.filter(
    (result) => result.impactLevel !== "UNKNOWN",
  );
  const riskDistribution = Object.fromEntries(
    levels.map((level) => [
      level,
      allResults.filter((result) => result.riskLevel === level).length,
    ]),
  ) as Record<ImpactLevel, number>;
  const overallProjectRisk = mapped.length
    ? mapped.reduce(
        (highest, result) => maxLevel(highest, result.riskLevel),
        "LOW" as ImpactLevel,
      )
    : ("UNKNOWN" as ImpactLevel);
  const snapshotSeed = [
    input.projectId,
    input.releaseId,
    input.featureId,
    input.sprintId,
    input.userStoryId,
    ...allResults.map((result) => result.recordId),
  ]
    .filter(Boolean)
    .join(":");

  return {
    snapshot: {
      id: `ias-${stableHash(snapshotSeed).toString(36)}`,
      status: !allResults.length
        ? "PARTIAL"
        : mapped.length < allResults.length
          ? "PARTIAL"
          : "CURRENT",
      analyzedAt,
      algorithmVersion: "delivery-risk-1.0.0",
      architectureVersion: componentResults.length
        ? "derived-baseline-1"
        : "Unavailable",
      architectureStatus: componentResults.length ? "APPROVED" : "UNAVAILABLE",
      scope: {
        productSpaceId: input.productSpaceId,
        projectId: input.projectId,
        projectName: input.projectName,
        releaseId: input.releaseId || null,
        featureId: input.featureId || null,
        sprintId: input.sprintId || null,
        userStoryId: input.userStoryId || null,
      },
    },
    summary: {
      architectureComponents: componentResults.length,
      analyzedFeatures: features.length,
      impactedFeatures: features.filter(
        (result) =>
          result.impactLevel !== "UNKNOWN" &&
          result.impactLevel !== "NO_IMPACT",
      ).length,
      highRiskFeatures: features.filter((result) =>
        ["CRITICAL", "HIGH"].includes(result.riskLevel),
      ).length,
      impactedStories: stories.filter(
        (result) =>
          result.impactLevel !== "UNKNOWN" &&
          result.impactLevel !== "NO_IMPACT",
      ).length,
      unmappedFeatures: features.filter(
        (result) => result.impactLevel === "UNKNOWN",
      ).length,
      overallProjectRisk,
    },
    components: componentResults,
    features,
    stories,
    riskDistribution,
    generatedFrom: {
      featureCount: input.features.length,
      storyCount: input.stories.length,
      coveragePercent: allResults.length
        ? Math.round((mapped.length / allResults.length) * 100)
        : 0,
    },
  };
}
