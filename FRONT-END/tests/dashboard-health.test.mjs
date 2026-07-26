import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("Data Sources exposes all four functional dashboards", () => {
  const workspace = read("src/components/shared/workspace-page.tsx");
  const catchAll = read("src/app/[...slug]/page.tsx");
  assert.match(workspace, /"Connected",\s*"4",\s*"4 categories"/);
  assert.match(workspace, /"Impact Analysis · Ready"/);
  assert.match(workspace, /"impact-analysis"/);
  assert.match(catchAll, /normalized\[1\] === "impact-analysis"/);
  assert.match(catchAll, /<ImpactAnalysisDashboard \/>/);
});

test("source dashboards preserve loading, empty, error, and live-data states", () => {
  const source = read("src/components/data-sources/data-source-dashboard.tsx");
  const knowledge = read(
    "src/components/knowledge-base/knowledge-base-dashboard.tsx",
  );
  assert.match(source, /function LoadingState/);
  assert.match(source, /source-state error/);
  assert.match(source, /Select a Product Space/);
  assert.match(source, /Select a Project/);
  assert.match(source, /<Planning/);
  assert.match(source, /<KnowledgeBaseDashboard/);
  assert.match(knowledge, /knowledge-table/);
  assert.match(knowledge, /knowledge-empty/);
  assert.match(knowledge, /knowledge-error/);
});

test("planning filters cannot widen the mobile dashboard viewport", () => {
  const layout = read("src/app/layout.tsx");
  const fixes = read("src/app/dashboard-fixes.css");
  assert.match(layout, /dashboard-fixes\.css/);
  assert.match(fixes, /\.planning-grid label\s*\{[^}]*min-width:\s*0/s);
  assert.match(fixes, /\.planning-grid select\s*\{[^}]*width:\s*100%/s);
  assert.match(fixes, /max-width:\s*100%/);
});

test("dashboard runtime audit covers every primary surface", () => {
  const verifier = read("scripts/verify-dashboard-routes.mjs");
  for (const route of [
    "/dashboard",
    "/data-sources",
    "/workspace/data-sources/github",
    "/workspace/data-sources/project-management",
    "/workspace/data-sources/knowledge-base",
    "/impact-analysis",
    "/workspace/data-sources/impact-analysis",
  ]) {
    assert.ok(verifier.includes(route), `missing runtime audit for ${route}`);
  }
  assert.match(verifier, /horizontalOverflow/);
  assert.match(verifier, /errorDialog/);
});
