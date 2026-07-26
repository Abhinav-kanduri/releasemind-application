import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("Knowledge Base UI consumes shared context and manages ingestion", () => {
  const dashboard = read(
    "src/components/knowledge-base/knowledge-base-dashboard.tsx",
  );
  assert.match(dashboard, /useWorkspaceContext/);
  assert.match(dashboard, /release_id/);
  assert.match(dashboard, /environment_id/);
  assert.match(dashboard, /Upload Documents/);
  assert.match(dashboard, /\/retry\?/);
  assert.match(dashboard, /method: "DELETE"/);
  assert.match(dashboard, /window\.setInterval/);
  assert.doesNotMatch(dashboard, /setProductSpaceId|setProjectId/);
});

test("Knowledge Base proxy requires explicit Product Space and Project", () => {
  const proxy = read("src/app/api/knowledge-base/proxy.ts");
  const documents = read(
    "src/app/api/knowledge-base/documents/route.ts",
  );
  assert.match(proxy, /WORKSPACE_CONTEXT_REQUIRED/);
  assert.match(proxy, /product-spaces\/\$\{encodeURIComponent\(productSpaceId\)\}/);
  assert.match(proxy, /projects\/\$\{encodeURIComponent\(projectId\)\}/);
  assert.match(documents, /request\.formData\(\)/);
  assert.match(documents, /method: "POST"/);
});

test("Knowledge Base is rendered instead of the placeholder dashboard", () => {
  const sourceDashboard = read(
    "src/components/data-sources/data-source-dashboard.tsx",
  );
  assert.match(sourceDashboard, /KnowledgeBaseDashboard/);
  assert.doesNotMatch(sourceDashboard, /function Knowledge\(/);
});
