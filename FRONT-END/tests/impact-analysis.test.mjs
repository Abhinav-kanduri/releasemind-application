import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildImpactAnalysis } from "../src/lib/impact-analysis.ts";

const read = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

const base = {
  productSpaceId: "space-1",
  projectId: "project-1",
  projectName: "Project One",
  analyzedAt: "2026-07-25T12:00:00.000Z",
  features: [
    {
      id: "feature-1",
      key: "PROJ-F-001",
      name: "Add role access API",
      description: "Persist role permissions and expose an API endpoint.",
      status: "DONE",
      priority: "HIGH",
      releaseId: "release-1",
    },
    {
      id: "feature-2",
      key: "PROJ-F-002",
      name: "Clarify business terminology",
      description: "Resolve the open wording.",
      status: "BACKLOG",
      priority: "LOW",
      releaseId: "release-1",
    },
  ],
  stories: [
    {
      id: "story-1",
      key: "PROJ-001",
      name: "Save role permissions",
      storyText: "Persist identity role access data.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      releaseId: "release-1",
      featureId: "feature-1",
      sprintId: "sprint-1",
    },
  ],
};

test("impact analysis is deterministic for versioned inputs", () => {
  const first = buildImpactAnalysis(base);
  const second = buildImpactAnalysis(base);
  assert.deepEqual(second, first);
  assert.equal(first.snapshot.algorithmVersion, "delivery-risk-1.0.0");
  assert.match(first.snapshot.id, /^ias-/);
});

test("impact, delivery risk, and correlation confidence remain separate", () => {
  const result = buildImpactAnalysis(base).features[0];
  assert.equal(typeof result.impactScore, "number");
  assert.equal(typeof result.deliveryRisk, "number");
  assert.equal(typeof result.correlationConfidence, "number");
  assert.ok(result.correlationConfidence <= 1);
  assert.equal(
    result.factors.reduce((sum, factor) => sum + factor.contribution, 0),
    100,
  );
  assert.ok(result.evidence.length > 0);
});

test("missing mapping produces UNKNOWN instead of NO_IMPACT", () => {
  const snapshot = buildImpactAnalysis(base);
  const unmapped = snapshot.features.find(
    (feature) => feature.recordId === "feature-2",
  );
  assert.equal(unmapped?.impactLevel, "UNKNOWN");
  assert.equal(unmapped?.riskLevel, "UNKNOWN");
  assert.equal(unmapped?.impactScore, null);
  assert.equal(unmapped?.evidence.length, 0);
  assert.equal(snapshot.snapshot.status, "PARTIAL");
  assert.equal(snapshot.summary.unmappedFeatures, 1);
});

test("release and optional planning scope filters every result", () => {
  const snapshot = buildImpactAnalysis({
    ...base,
    releaseId: "release-1",
    featureId: "feature-1",
    sprintId: "sprint-1",
    userStoryId: "story-1",
  });
  assert.deepEqual(
    snapshot.features.map((item) => item.recordId),
    ["feature-1"],
  );
  assert.deepEqual(
    snapshot.stories.map((item) => item.recordId),
    ["story-1"],
  );
});

test("dashboard route and API enforce shared project context", () => {
  const api = read("src/app/api/impact-analysis/route.ts");
  const dashboard = read(
    "src/components/impact-analysis/impact-analysis-dashboard.tsx",
  );
  const workspace = read("src/components/shared/workspace-page.tsx");
  assert.match(api, /PRODUCT_SPACE_REQUIRED/);
  assert.match(api, /PROJECT_OUTSIDE_PRODUCT_SPACE/);
  assert.match(api, /buildImpactAnalysis/);
  assert.match(dashboard, /useWorkspaceContext/);
  assert.match(dashboard, /params\.get\("productSpaceId"\)/);
  assert.match(dashboard, /Unknown,\s*not No Impact/);
  assert.match(dashboard, /window\.print/);
  assert.match(dashboard, /text\/csv/);
  assert.match(workspace, /Impact Analysis · Ready/);
});
