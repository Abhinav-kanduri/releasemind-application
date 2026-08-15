import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGitHubSummaryPdfBlob,
  buildGitHubSummaryWordHtml,
  githubSummaryFilename,
} from "../src/lib/github-summary-export.ts";

const response = {
  status: "completed",
  generated_at: "2026-08-09T21:00:00Z",
  duration_seconds: 1,
  repository: {
    owner: "example",
    name: "support-api",
    full_name: "example/support-api",
    url: "https://github.com/example/support-api",
    visibility: "public",
    description: null,
    default_branch: "main",
    analyzed_ref: "feature/export",
    commit_sha: "abc123",
    language_bytes: {},
    stars: 0,
    forks: 0,
    open_issues: 0,
    archived: false,
    repository_url: "https://github.com/example/support-api",
    repository_full_name: "example/support-api",
    branch: "feature/export",
  },
  analysis: {
    archive_bytes: 100,
    discovered_files: 10,
    analyzed_files: 8,
    skipped_files: 2,
    analyzed_characters: 1000,
    batches: 1,
    cache_hit: false,
    summary_chunks: 2,
    embedded_chunks: 2,
  },
  summary: {
    title: "Support <API>",
    executive_summary: "Routes & tools.",
    problem_statement: "Support customers.",
    primary_capabilities: ["Answer questions"],
    architecture: ["Service layer"],
    technology_stack: ["TypeScript"],
    key_components: [
      {
        name: "Router",
        paths: ["src/routes.ts"],
        responsibility: "Routes requests",
      },
    ],
    api_endpoints: [
      {
        method: "GET",
        path: "/health",
        purpose: "Health check",
        source_file: "src/routes.ts",
      },
    ],
    data_and_storage: ["Postgres"],
    request_or_processing_flow: ["Request to service"],
    setup_and_run: ["npm start"],
    strengths: ["Typed"],
    risks_and_gaps: ["Coverage"],
    recommended_next_steps: ["Add tests"],
    evidence_files: ["src/routes.ts"],
  },
  summary_markdown: "",
  model: "test-model",
  artifact: null,
};

test("Word export contains the complete structured summary and escapes HTML", () => {
  const html = buildGitHubSummaryWordHtml(response);
  assert.match(html, /Support &lt;API&gt;/);
  assert.match(html, /Routes &amp; tools/);
  assert.match(html, /Primary capabilities/);
  assert.match(html, /Key components/);
  assert.match(html, /GET/);
  assert.match(html, /Recommended next steps/);
  assert.match(html, /Evidence files/);
});

test("summary export filenames include repository and branch safely", () => {
  assert.equal(
    githubSummaryFilename(response, "doc"),
    "example-support-api-feature-export-summary.doc",
  );
  assert.equal(
    githubSummaryFilename(response, "pdf"),
    "example-support-api-feature-export-summary.pdf",
  );
});

test("PDF export produces a real PDF document", async () => {
  const blob = await buildGitHubSummaryPdfBlob(response);
  const signature = new TextDecoder().decode(
    new Uint8Array(await blob.arrayBuffer()).slice(0, 4),
  );

  assert.equal(blob.type, "application/pdf");
  assert.equal(signature, "%PDF");
  assert.ok(blob.size > 1_000);
});
