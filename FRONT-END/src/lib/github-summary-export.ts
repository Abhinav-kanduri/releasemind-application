import type { GitHubRepositorySummaryResponse } from "@/lib/github-summary";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeFilename(value: string) {
  return (
    value
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "repository"
  );
}

export function githubSummaryFilename(
  response: GitHubRepositorySummaryResponse,
  extension: "doc" | "pdf",
) {
  return `${safeFilename(response.repository.full_name)}-${safeFilename(
    response.repository.branch,
  )}-summary.${extension}`;
}

function list(items: string[]) {
  return items.length
    ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "<p>None reported.</p>";
}

function section(title: string, items: string[]) {
  return `<h2>${escapeHtml(title)}</h2>${list(items)}`;
}

export function buildGitHubSummaryWordHtml(
  response: GitHubRepositorySummaryResponse,
) {
  const summary = response.summary;
  const documentId = response.artifact?.document_id || "Not persisted";
  const components = summary.key_components.length
    ? summary.key_components
        .map(
          (component) => `<tr>
            <td>${escapeHtml(component.name)}</td>
            <td>${escapeHtml(component.paths.join(", ") || "—")}</td>
            <td>${escapeHtml(component.responsibility)}</td>
          </tr>`,
        )
        .join("")
    : '<tr><td colspan="3">No components were identified.</td></tr>';
  const endpoints = summary.api_endpoints.length
    ? summary.api_endpoints
        .map(
          (endpoint) => `<tr>
            <td>${escapeHtml(endpoint.method)}</td>
            <td>${escapeHtml(endpoint.path)}</td>
            <td>${escapeHtml(endpoint.purpose)}</td>
            <td>${escapeHtml(endpoint.source_file || "—")}</td>
          </tr>`,
        )
        .join("")
    : '<tr><td colspan="4">No API endpoints were identified.</td></tr>';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(summary.title)}</title>
  <style>
    @page { size: A4; margin: 0.7in; }
    body { color: #172033; font-family: Aptos, Calibri, Arial, sans-serif; font-size: 10.5pt; line-height: 1.45; }
    h1 { color: #1457d9; font-size: 22pt; margin: 0 0 8pt; }
    h2 { border-bottom: 1px solid #d9e0eb; color: #172033; font-size: 14pt; margin: 20pt 0 7pt; padding-bottom: 4pt; }
    p { margin: 0 0 9pt; }
    .meta { color: #526176; font-size: 9pt; margin-bottom: 18pt; }
    .lead { background: #f3f7ff; border-left: 4px solid #1457d9; padding: 10pt; }
    table { border-collapse: collapse; margin: 6pt 0 12pt; width: 100%; }
    th, td { border: 1px solid #d9e0eb; padding: 6pt; text-align: left; vertical-align: top; }
    th { background: #eef3fb; font-size: 9pt; }
    li { margin-bottom: 4pt; }
    code { color: #1457d9; font-family: Consolas, monospace; }
  </style>
</head>
<body>
  <h1>${escapeHtml(summary.title)}</h1>
  <p class="meta">
    Repository: ${escapeHtml(response.repository.full_name)}<br>
    Branch: ${escapeHtml(response.repository.branch)}<br>
    Commit: ${escapeHtml(response.repository.commit_sha || "Unavailable")}<br>
    Generated: ${escapeHtml(new Date(response.generated_at).toLocaleString())}<br>
    Analyzed files: ${response.analysis.analyzed_files} of ${response.analysis.discovered_files}<br>
    Model: ${escapeHtml(response.model)}<br>
    Document ID: ${escapeHtml(documentId)}
  </p>
  <p class="lead">${escapeHtml(summary.executive_summary)}</p>
  <h2>Problem statement</h2>
  <p>${escapeHtml(summary.problem_statement || "Not reported.")}</p>
  ${section("Primary capabilities", summary.primary_capabilities)}
  ${section("Architecture", summary.architecture)}
  ${section("Technology stack", summary.technology_stack)}
  <h2>Key components</h2>
  <table>
    <thead><tr><th>Component</th><th>Files</th><th>Responsibility</th></tr></thead>
    <tbody>${components}</tbody>
  </table>
  <h2>API endpoints</h2>
  <table>
    <thead><tr><th>Method</th><th>Path</th><th>Purpose</th><th>Source</th></tr></thead>
    <tbody>${endpoints}</tbody>
  </table>
  ${section("Data and storage", summary.data_and_storage)}
  ${section("Request or processing flow", summary.request_or_processing_flow)}
  ${section("Setup and run", summary.setup_and_run)}
  ${section("Strengths", summary.strengths)}
  ${section("Risks and gaps", summary.risks_and_gaps)}
  ${section("Recommended next steps", summary.recommended_next_steps)}
  ${section("Evidence files", summary.evidence_files)}
</body>
</html>`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadGitHubSummaryWord(
  response: GitHubRepositorySummaryResponse,
) {
  downloadBlob(
    new Blob(["\ufeff", buildGitHubSummaryWordHtml(response)], {
      type: "application/msword;charset=utf-8",
    }),
    githubSummaryFilename(response, "doc"),
  );
}

export async function buildGitHubSummaryPdfBlob(
  response: GitHubRepositorySummaryResponse,
) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  const contentWidth = 180;
  const pageBottom = 282;
  let y = 18;

  const ensureSpace = (height: number) => {
    if (y + height <= pageBottom) return;
    pdf.addPage();
    y = 18;
  };
  const write = (
    value: string,
    options: { size?: number; bold?: boolean; gap?: number } = {},
  ) => {
    const size = options.size || 10;
    pdf.setFont("helvetica", options.bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(value || "None reported.", contentWidth);
    const lineHeight = size * 0.42;
    ensureSpace(lines.length * lineHeight + (options.gap || 3));
    pdf.text(lines, margin, y);
    y += lines.length * lineHeight + (options.gap || 3);
  };
  const heading = (value: string) => {
    ensureSpace(12);
    y += 3;
    write(value, { size: 14, bold: true, gap: 4 });
  };
  const bullets = (items: string[]) => {
    if (!items.length) {
      write("None reported.");
      return;
    }
    items.forEach((item) => write(`• ${item}`, { gap: 2 }));
  };

  write(response.summary.title, { size: 20, bold: true, gap: 6 });
  write(
    [
      `Repository: ${response.repository.full_name}`,
      `Branch: ${response.repository.branch}`,
      `Commit: ${response.repository.commit_sha || "Unavailable"}`,
      `Generated: ${new Date(response.generated_at).toLocaleString()}`,
      `Analyzed files: ${response.analysis.analyzed_files} of ${response.analysis.discovered_files}`,
    ].join("\n"),
    { size: 9, gap: 6 },
  );
  write(response.summary.executive_summary, { size: 11, gap: 5 });

  const textSection = (title: string, value: string) => {
    heading(title);
    write(value || "Not reported.");
  };
  const listSection = (title: string, items: string[]) => {
    heading(title);
    bullets(items);
  };

  textSection("Problem statement", response.summary.problem_statement);
  listSection("Primary capabilities", response.summary.primary_capabilities);
  listSection("Architecture", response.summary.architecture);
  listSection("Technology stack", response.summary.technology_stack);
  heading("Key components");
  if (response.summary.key_components.length) {
    response.summary.key_components.forEach((component) => {
      write(component.name, { bold: true, gap: 1 });
      write(`Files: ${component.paths.join(", ") || "—"}`, {
        size: 9,
        gap: 1,
      });
      write(component.responsibility, { gap: 4 });
    });
  } else {
    write("No components were identified.");
  }
  heading("API endpoints");
  if (response.summary.api_endpoints.length) {
    response.summary.api_endpoints.forEach((endpoint) => {
      write(`${endpoint.method} ${endpoint.path}`, { bold: true, gap: 1 });
      write(endpoint.purpose, { gap: 1 });
      write(`Source: ${endpoint.source_file || "—"}`, {
        size: 9,
        gap: 4,
      });
    });
  } else {
    write("No API endpoints were identified.");
  }
  listSection("Data and storage", response.summary.data_and_storage);
  listSection(
    "Request or processing flow",
    response.summary.request_or_processing_flow,
  );
  listSection("Setup and run", response.summary.setup_and_run);
  listSection("Strengths", response.summary.strengths);
  listSection("Risks and gaps", response.summary.risks_and_gaps);
  listSection(
    "Recommended next steps",
    response.summary.recommended_next_steps,
  );
  listSection("Evidence files", response.summary.evidence_files);

  return pdf.output("blob");
}

export async function downloadGitHubSummaryPdf(
  response: GitHubRepositorySummaryResponse,
) {
  downloadBlob(
    await buildGitHubSummaryPdfBlob(response),
    githubSummaryFilename(response, "pdf"),
  );
}
