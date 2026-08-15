import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("RAG Evaluation is the fifth integrated RAG Validation tab", () => {
  const dashboard = read(
    "src/components/rag-validation/rag-validation-dashboard.tsx",
  );
  const evaluation = read(
    "src/components/rag-validation/rag-evaluation-tab.tsx",
  );

  assert.match(dashboard, /"graph", "evaluation"/);
  assert.match(dashboard, /"RAG Evaluation"/);
  assert.match(dashboard, /<RagEvaluationTab/);
  assert.match(evaluation, /Implementation Score/);
  assert.match(evaluation, /RAG Quality/);
  assert.match(evaluation, /Evaluation Cases/);
  assert.match(evaluation, /RequirementEvaluation/);
});

test("all requested metrics use one normalized, inspectable model", () => {
  const types = read(
    "src/components/rag-validation/rag-evaluation.types.ts",
  );
  const policy = read(
    "src/components/rag-validation/rag-evaluation-policy.ts",
  );
  const inspector = read(
    "src/components/rag-validation/rag-metric-inspector.tsx",
  );

  for (const metric of [
    "recall_at_k",
    "precision_at_k",
    "hit_rate",
    "mrr",
    "ndcg_at_k",
    "context_relevance",
    "context_recall",
    "faithfulness",
    "answer_relevance",
    "groundedness",
    "hallucination_rate",
  ]) assert.match(types, new RegExp(`"${metric}"`));

  assert.match(types, /numerator\?: number \| null/);
  assert.match(types, /denominator\?: number \| null/);
  assert.match(types, /expected: RagEvidenceEvaluation\[\]/);
  assert.match(types, /claims: RagClaimEvaluation\[\]/);
  assert.match(inspector, /Actual calculation unavailable/);
  assert.match(inspector, /Missing backend field/);
  assert.match(inspector, /RELATED TRACE SURFACES/);
  assert.doesNotMatch(types, /\bany\b/);
  assert.doesNotMatch(policy, /Math\.random|mock/i);
});

test("missing golden labels never become fabricated retrieval scores", () => {
  const adapter = read(
    "src/components/rag-validation/rag-evaluation-adapter.ts",
  );
  const policy = read(
    "src/components/rag-validation/rag-evaluation-policy.ts",
  );

  assert.match(adapter, /GOLDEN_DATASET_REQUIRED/);
  assert.match(adapter, /Do not average/);
  assert.match(adapter, /distinct[\s\S]+aggregation rules/);
  assert.match(policy, /Similarity scores alone cannot establish relevance/);
  assert.match(policy, /id === "hallucination_rate"/);
  assert.match(policy, /score <= RAG_EVALUATION_POLICY\.inverseQuality\.pass/);
});

test("metric scores remain clickable and trace to existing product surfaces", () => {
  const card = read(
    "src/components/rag-validation/rag-metric-card.tsx",
  );
  const inspector = read(
    "src/components/rag-validation/rag-metric-inspector.tsx",
  );
  const pipeline = read(
    "src/components/rag-validation/rag-evaluation-pipeline.tsx",
  );

  assert.match(card, /onClick=\{\(\) => onOpen\(metric\)\}/);
  assert.match(inspector, /view: "trace"/);
  assert.match(inspector, /view: "evidence"/);
  assert.match(inspector, /view: "graph"/);
  assert.match(pipeline, /Recall · Precision · Hit Rate · MRR · NDCG/);
  assert.match(pipeline, /Faithfulness · Relevance · Groundedness · Hallucination/);
});
