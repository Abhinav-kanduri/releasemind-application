import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("Graph Analysis exposes health, schema, and semantic search", () => {
  const dashboard = read(
    "src/components/graph-analysis/graph-analysis-dashboard.tsx",
  );
  assert.match(dashboard, /\/api\/graph\/health/);
  assert.match(dashboard, /\/api\/graph\/schema/);
  assert.match(dashboard, /\/api\/graph\/search/);
  assert.match(dashboard, /document_chunk_embedding/);
  assert.match(dashboard, /No answer generation was performed/);
});

test("Graph Analysis communicates the current global-scope limitation", () => {
  const dashboard = read(
    "src/components/graph-analysis/graph-analysis-dashboard.tsx",
  );
  assert.match(dashboard, /Global retrieval/);
  assert.match(dashboard, /does not yet enforce/);
  assert.match(dashboard, /Product Space, Project, Release, or Environment/);
});

test("Graph API proxy preserves upstream errors and validates search input", () => {
  const proxy = read("src/app/api/graph/graph-proxy.ts");
  const search = read("src/app/api/graph/search/route.ts");
  assert.match(proxy, /\/graph\/\$\{path\}/);
  assert.match(proxy, /GRAPH_API_UNAVAILABLE/);
  assert.match(proxy, /detail\?\.message/);
  assert.match(search, /query\.length > 4000/);
  assert.match(search, /k < 1 \|\| k > 20/);
  assert.match(search, /JSON\.stringify\(\{ query, k \}\)/);
});

test("Graph Analysis is registered as the fifth datasource", () => {
  const workspace = read("src/components/shared/workspace-page.tsx");
  const catchAll = read("src/app/[...slug]/page.tsx");
  assert.match(workspace, /Graph Analysis/);
  assert.match(workspace, /5 categories/);
  assert.match(workspace, /graph-analysis/);
  assert.match(catchAll, /GraphAnalysisDashboard/);
  assert.match(catchAll, /graph-analysis/);
});
