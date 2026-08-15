import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildImpactAnalysis } from "../src/lib/impact-analysis.ts";
import {
  formatPercent,
  safeCsvCell,
} from "../src/lib/impact-analysis/formatters.ts";
import { normalizeImpactApiFailure } from "../src/lib/impact-analysis/errors.ts";
import { resolveDevelopmentActor } from "../src/lib/project-management-actor.ts";

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

test("legacy analysis remains deterministic for rollback compatibility", () => {
  const first = buildImpactAnalysis(base);
  const second = buildImpactAnalysis(base);
  assert.deepEqual(second, first);
  assert.equal(first.snapshot.algorithmVersion, "delivery-risk-1.0.0");
  assert.match(first.snapshot.id, /^ias-/);
});

test("legacy impact, delivery risk, and confidence remain separate", () => {
  const result = buildImpactAnalysis(base).features[0];
  assert.equal(typeof result.impactScore, "number");
  assert.equal(typeof result.deliveryRisk, "number");
  assert.equal(typeof result.correlationConfidence, "number");
  assert.ok(result.correlationConfidence <= 1);
  assert.equal(
    result.factors.reduce((sum, factor) => sum + factor.contribution, 0),
    100,
  );
});

test("legacy missing mapping remains UNKNOWN rather than NO_IMPACT", () => {
  const snapshot = buildImpactAnalysis(base);
  const unmapped = snapshot.features.find(
    (feature) => feature.recordId === "feature-2",
  );
  assert.equal(unmapped?.impactLevel, "UNKNOWN");
  assert.equal(unmapped?.riskLevel, "UNKNOWN");
  assert.equal(unmapped?.impactScore, null);
});

test("backend-driven dashboard uses persisted run APIs", () => {
  const route = read("src/app/api/impact-analysis/route.ts");
  const proxy = read("src/app/api/impact-analysis/proxy.ts");
  const client = read("src/lib/impact-analysis/api.ts");
  const dashboard = read(
    "src/components/impact-analysis/impact-analysis-dashboard.tsx",
  );
  const actor = read("src/lib/project-management-actor.ts");
  assert.doesNotMatch(route, /buildImpactAnalysis/);
  assert.match(route, /proxyImpactRequest/);
  assert.match(proxy, /projectManagementFetch/);
  assert.match(proxy, /X-Actor/);
  assert.doesNotMatch(proxy, /local-user/);
  assert.match(proxy, /localAnonymousAnalysisEnabled/);
  assert.match(proxy, /privilegedGeneratedChangePath/);
  assert.match(proxy, /ALLOW_LOCAL_ANONYMOUS_IMPACT_ANALYSIS/);
  assert.match(actor, /PROJECT_MANAGEMENT_ACTOR_ID/);
  assert.match(proxy, /generated-changes/);
  assert.match(client, /startImpactAnalysis/);
  assert.match(client, /getImpactRequirements/);
  assert.match(client, /getFindingEvidence/);
  assert.match(client, /getImpactGraph/);
  assert.match(client, /github\/repositories\/branches/);
  assert.match(client, /repositoryUrl/);
  assert.match(client, /body\.userStories/);
  assert.match(dashboard, /useWorkspaceContext/);
  assert.match(dashboard, /project_repository_id/);
  assert.match(dashboard, /scopeType === "FEATURE" \? featureId : storyId/);
  assert.match(dashboard, /ref: branch/);
  assert.match(dashboard, /commit_sha/);
  assert.match(dashboard, /Backend analysis pipeline/);
  assert.match(dashboard, /run\.timeline/);
  assert.match(dashboard, /run\.error/);
  assert.match(dashboard, /Backend error/);
  assert.match(dashboard, /IMPACT_STATUSES/);
  assert.match(dashboard, /RemediationPanel/);
  assert.match(dashboard, /window\.print/);
  assert.match(dashboard, /text\/csv;charset=utf-8/);
});

test("the local actor fallback is UUID-only and development-only", () => {
  assert.equal(resolveDevelopmentActor("", "development").ok, false);
  assert.equal(resolveDevelopmentActor("local-user", "development").ok, false);
  assert.deepEqual(
    resolveDevelopmentActor(
      "9513d1fd-7b10-4cd2-88bb-aa011ccf1b53",
      "development",
    ),
    {
      ok: true,
      actor: "9513d1fd-7b10-4cd2-88bb-aa011ccf1b53",
      source: "development",
    },
  );
  assert.equal(
    resolveDevelopmentActor(
      "9513d1fd-7b10-4cd2-88bb-aa011ccf1b53",
      "production",
    ).ok,
    false,
  );
});

test("FastAPI nested error envelopes retain code and message", () => {
  assert.deepEqual(
    normalizeImpactApiFailure(
      {
        error: {
          code: "REQUEST_VALIDATION_FAILED",
          message: "The request did not pass validation.",
          details: { errors: ["invalid actor"] },
        },
      },
      422,
    ),
    {
      code: "REQUEST_VALIDATION_FAILED",
      message: "The request did not pass validation.",
      details: { errors: ["invalid actor"] },
      retryable: undefined,
    },
  );
  assert.deepEqual(
    normalizeImpactApiFailure(
      {
        detail: {
          code: "ANALYSIS_ACCESS_DENIED",
          message: "Actor is not a member of the Project.",
          retryable: false,
        },
      },
      403,
    ),
    {
      code: "ANALYSIS_ACCESS_DENIED",
      message: "Actor is not a member of the Project.",
      details: {
        code: "ANALYSIS_ACCESS_DENIED",
        message: "Actor is not a member of the Project.",
        retryable: false,
      },
      retryable: false,
    },
  );
});

test("export formatting protects spreadsheet consumers", () => {
  assert.equal(safeCsvCell('a"b'), '"a""b"');
  assert.equal(safeCsvCell("=1+1"), '"\'=1+1"');
  assert.equal(formatPercent(0.934), "93%");
  assert.equal(formatPercent(null), "Unavailable");
});
test("Generate Code creates a governed Copilot prompt without mutating a repository", () => {
  const dashboard = read(
    "src/components/impact-analysis/impact-analysis-dashboard.tsx",
  );
  const component = read(
    "src/components/impact-analysis/copilot-remediation-prompt.tsx",
  );
  const api = read("src/lib/impact-analysis/api.ts");
  const proxy = read("src/app/api/impact-analysis/proxy.ts");

  assert.match(dashboard, /<CopilotRemediationPanel/);
  assert.doesNotMatch(dashboard, /<RemediationPanel/);
  assert.match(component, /Generate Copilot Prompt/);
  assert.match(component, /does not create files, commits, branches, or pull requests/);
  assert.match(component, /repository_suitability/);
  assert.match(component, /Repository suitability warning/);
  assert.match(component, /Use suggestion & regenerate/);
  assert.match(component, /Copy Prompt/);
  assert.match(component, /Download \.md/);
  assert.match(component, /Open Copilot Chat/);
  assert.match(component, /Copilot completion is not implementation evidence/);
  assert.match(component, /readOnly/);
  assert.match(api, /generateRemediationPrompt/);
  assert.match(api, /remediation-prompt/);
  assert.match(api, /body: JSON\.stringify\(options\)/);
  assert.match(proxy, /remediation-prompt/);
  const privilegedPaths = proxy.match(
    /function privilegedGeneratedChangePath[\s\S]*?\n}/,
  )?.[0];
  assert.ok(privilegedPaths);
  assert.doesNotMatch(privilegedPaths, /remediation-prompt/);
  assert.match(privilegedPaths, /generated-changes/);
});
