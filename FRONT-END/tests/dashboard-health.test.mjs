import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("Data Sources exposes all five functional dashboards", () => {
  const workspace = read("src/components/shared/workspace-page.tsx");
  const catchAll = read("src/app/[...slug]/page.tsx");
  assert.match(workspace, /5 categories/);
  assert.match(workspace, /"Impact Analysis · Ready"/);
  assert.match(workspace, /"impact-analysis"/);
  assert.match(catchAll, /normalized\[1\] === "impact-analysis"/);
  assert.match(catchAll, /<ImpactAnalysisDashboard \/>/);
  assert.match(workspace, /Graph Analysis/);
  assert.match(catchAll, /<GraphAnalysisDashboard \/>/);
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

test("GitHub dashboard loads and links repositories to the selected project", () => {
  const source = read("src/components/data-sources/data-source-dashboard.tsx");
  const listProxy = read("src/app/api/github/repositories/route.ts");
  const importedProxy = read(
    "src/app/api/github/repositories/imported/route.ts",
  );
  const importProxy = read("src/app/api/github/repositories/import/route.ts");
  assert.match(source, /GitHub project \/ repository/);
  assert.match(source, /Link selected repository/);
  assert.match(source, /Already linked/);
  assert.match(source, /githubRepositoryId/);
  assert.match(listProxy, /project_id/);
  assert.match(importedProxy, /\/github\/repositories\/imported/);
  assert.match(importProxy, /\/github\/repositories\/import/);
  assert.match(importProxy, /github_repository_id/);
  assert.match(importProxy, /product_space_id/);
  assert.match(importProxy, /project_id/);
});

test("linked GitHub repositories refresh and synchronize any selected branch", () => {
  const source = read("src/components/data-sources/data-source-dashboard.tsx");
  const branchProxy = read(
    "src/app/api/github/project-repositories/[repositoryId]/branches/route.ts",
  );
  const syncProxy = read(
    "src/app/api/github/project-repositories/[repositoryId]/sync/route.ts",
  );
  const unlinkProxy = read(
    "src/app/api/github/project-repositories/[repositoryId]/route.ts",
  );
  assert.match(source, /Refresh branches/);
  assert.match(source, /Sync branch/);
  assert.match(source, /Branches refreshed:/);
  assert.match(source, /Last branch sync:/);
  assert.match(source, /forceRefresh: false/);
  assert.match(source, /Unlink repository/);
  assert.match(source, /window\.confirm/);
  assert.match(branchProxy, /resolveProjectManagementActor/);
  assert.match(syncProxy, /resolveProjectManagementActor/);
  assert.match(syncProxy, /force_refresh/);
  assert.match(syncProxy, /X-Actor/);
  assert.match(unlinkProxy, /export async function DELETE/);
  assert.match(unlinkProxy, /resolveProjectManagementActor/);
  assert.match(unlinkProxy, /X-Actor/);
});

test("GitHub summary workflow selects a repository and branch and renders tables", () => {
  const source = read("src/components/data-sources/data-source-dashboard.tsx");
  const branchProxy = read("src/app/api/github/repositories/branches/route.ts");
  const summaryProxy = read("src/app/api/github/summary/route.ts");
  const exportProxy = read(
    "src/app/api/github/summary/[documentId]/export/route.ts",
  );
  assert.match(source, /Repository branch/);
  assert.match(source, /Fetch summary/);
  assert.match(source, /GitHubSummaryTables/);
  assert.match(source, /Key components/);
  assert.match(source, /API endpoints/);
  assert.match(source, /Download Word/);
  assert.match(source, /Download PDF/);
  assert.match(source, /repository-summary\.\$\{format\}/);
  assert.match(exportProxy, /Content-Disposition/);
  assert.match(exportProxy, /wordprocessingml\.document/);
  assert.match(branchProxy, /\/github\/repositories\/branches/);
  assert.match(branchProxy, /repository_url/);
  assert.match(summaryProxy, /\/github\/summary/);
  assert.match(summaryProxy, /repository_url/);
  assert.match(summaryProxy, /force_refresh/);
});

test("the credential sign-in experience is removed from the application UI", () => {
  const source = read("src/components/data-sources/data-source-dashboard.tsx");
  const sidebar = read("src/components/layout/app-sidebar.tsx");
  const signInPage = read("src/app/sign-in/page.tsx");
  assert.doesNotMatch(source, /href="\/sign-in\?next=/);
  assert.doesNotMatch(sidebar, /Sign in|Sign out|Authenticated session/);
  assert.match(signInPage, /redirect\("\/data-sources\/github"\)/);
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
    "/rag-validation",
    "/workspace/data-sources/impact-analysis",
    "/workspace/data-sources/graph-analysis",
  ]) {
    assert.ok(verifier.includes(route), `missing runtime audit for ${route}`);
  }
  assert.match(verifier, /horizontalOverflow/);
  assert.match(verifier, /errorDialog/);
});
