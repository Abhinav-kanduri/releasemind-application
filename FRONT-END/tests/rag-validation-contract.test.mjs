import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("RAG Validation is a separate navigable application surface", () => {
  const route = read("src/app/[...slug]/page.tsx");
  const sidebar = read("src/components/layout/app-sidebar.tsx");

  assert.match(route, /normalized\[0\] === "rag-validation"/);
  assert.match(route, /<RagValidationDashboard \/>/);
  assert.match(sidebar, /\["RAG Validation", "\/rag-validation", Workflow\]/);
});

test("the console reads persisted retrieval, evidence, graph, and vector truth", () => {
  const dashboard = read(
    "src/components/rag-validation/rag-validation-dashboard.tsx",
  );
  const api = read("src/lib/impact-analysis/api.ts");
  const proxy = read("src/app/api/impact-analysis/proxy.ts");

  assert.match(dashboard, /getImpactObservability/);
  assert.match(dashboard, /getImpactGraph/);
  assert.match(dashboard, /getFindingEvidence/);
  assert.match(dashboard, /Postgres pgvector/);
  assert.match(dashboard, /Neo4j Graph RAG/);
  assert.match(dashboard, /Not instrumented/);
  assert.match(
    api,
    /runs\/\$\{encodeURIComponent\(runId\)\}\/observability/,
  );
  assert.match(proxy, /observability/);
});

test("graph construction and graph retrieval are not presented as equivalent", () => {
  const graph = read("src/components/rag-validation/rag-graph-panel.tsx");
  const dashboard = read(
    "src/components/rag-validation/rag-validation-dashboard.tsx",
  );

  assert.match(graph, /Graph availability is not the same as graph retrieval/);
  assert.match(dashboard, /Connected \/ not retrieved/);
  assert.match(
    dashboard,
    /current Impact Analysis retriever does not query Knowledge Base chunks/,
  );
  assert.doesNotMatch(dashboard, /91\s*\/\s*100|287ms|1,842 tokens/);
});

test("every pipeline stage opens a backend-grounded explainability inspector", () => {
  const dashboard = read(
    "src/components/rag-validation/rag-validation-dashboard.tsx",
  );
  const pipeline = read("src/components/rag-validation/rag-pipeline.tsx");
  const inspector = read(
    "src/components/rag-validation/rag-stage-inspector.tsx",
  );

  assert.match(dashboard, /buildRagStageDetail/);
  assert.match(dashboard, /<RagStageInspector/);
  assert.match(pipeline, /id: "evaluation"/);
  assert.match(pipeline, /Golden retrieval \+ online evaluator metrics/);
  assert.match(inspector, /01<\/small> Input/);
  assert.match(inspector, /02<\/small> Processing/);
  assert.match(inspector, /03<\/small> Output/);
  assert.match(inspector, /04 · AI EXPLANATION/);
  assert.match(inspector, /05<\/small> Quality/);
  assert.match(inspector, /06<\/small> Lineage/);
  assert.match(inspector, /AI explanation not persisted/);
  assert.match(inspector, /browser will not invent/);
  assert.match(inspector, /Golden dataset required/);
});
