"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  FileCode2,
  GitBranch,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  generateRemediationPrompt,
  getRepositoryBranches,
} from "@/lib/impact-analysis/api";
import { formatPercent, impactLabel } from "@/lib/impact-analysis/formatters";
import type {
  GeneratedRemediationPrompt,
  ImpactFinding,
  ImpactRun,
  ProjectRepository,
  RepositoryBranch,
} from "@/lib/impact-analysis/types";

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function safeFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "copilot-remediation-prompt";
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard access is unavailable in this browser.");
}

export function CopilotRemediationPanel({
  finding,
  run,
  repositories,
}: {
  finding: ImpactFinding;
  run: ImpactRun;
  repositories: ProjectRepository[];
}) {
  const sourceRepository = run.repository?.name || "";
  const sourceRef = run.repository?.branch || "";
  const repositoryOptions = useMemo(() => {
    const options = [...repositories];
    if (
      sourceRepository &&
      !options.some((item) => item.full_name === sourceRepository)
    ) {
      options.unshift({
        association_id: run.repository?.repository_id || sourceRepository,
        name: sourceRepository.split("/").at(-1) || sourceRepository,
        full_name: sourceRepository,
        repository_url: `https://github.com/${sourceRepository}`,
        default_branch: sourceRef || "main",
      });
    }
    return options;
  }, [repositories, run.repository?.repository_id, sourceRef, sourceRepository]);

  const [targetRepository, setTargetRepository] = useState(sourceRepository);
  const [targetRef, setTargetRef] = useState(sourceRef);
  const [targetBranches, setTargetBranches] = useState<RepositoryBranch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedRemediationPrompt | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [instruction, setInstruction] = useState("");

  useEffect(() => {
    setTargetRepository(sourceRepository);
    setTargetRef(sourceRef);
    setGenerated(null);
    setModalOpen(false);
    setError("");
  }, [finding.finding_id, run.run_id, sourceRef, sourceRepository]);

  useEffect(() => {
    const repository = repositoryOptions.find(
      (item) => item.full_name === targetRepository,
    );
    if (!repository?.repository_url) {
      setTargetBranches([]);
      return;
    }
    const controller = new AbortController();
    setBranchesLoading(true);
    getRepositoryBranches(repository.repository_url, controller.signal)
      .then((items) => setTargetBranches(items))
      .catch(() => setTargetBranches([]))
      .finally(() => {
        if (!controller.signal.aborted) setBranchesLoading(false);
      });
    return () => controller.abort();
  }, [repositoryOptions, targetRepository]);

  const selectRepository = (name: string) => {
    setTargetRepository(name);
    const selected = repositoryOptions.find((item) => item.full_name === name);
    setTargetRef(
      name === sourceRepository
        ? sourceRef
        : selected?.default_branch || "",
    );
  };

  const generate = async (
    repository = targetRepository,
    ref = targetRef,
  ) => {
    setGenerating(true);
    setError("");
    setCopied(false);
    setInstruction("");
    try {
      const result = await generateRemediationPrompt(run.run_id, finding.finding_id, {
        target: "github_copilot_chat",
        target_repository: repository || null,
        target_ref: ref || null,
        include_related_requirements: true,
        include_test_plan: true,
        include_repository_warning: true,
      });
      setGenerated(result);
      setModalOpen(true);
    } catch (cause) {
      setError(
        messageFrom(cause, "Unable to generate the Copilot remediation prompt."),
      );
    } finally {
      setGenerating(false);
    }
  };

  const copyPrompt = async () => {
    if (!generated?.prompt) return;
    try {
      await copyText(generated.prompt);
      setCopied(true);
      setInstruction(
        "Prompt copied. Open the correct repository in VS Code, open GitHub Copilot Chat in Agent mode, and paste the prompt.",
      );
    } catch (cause) {
      setError(messageFrom(cause, "Unable to copy the prompt."));
    }
  };

  const downloadPrompt = () => {
    if (!generated?.prompt) return;
    const blob = new Blob([generated.prompt], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFileName(generated.requirement_id)}-copilot-remediation.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    setInstruction("Prompt downloaded. Review it before using it in the target repository.");
  };

  const applySuggestedTarget = async () => {
    const suggestion = generated?.suggested_target_repository;
    if (!suggestion?.name) return;
    setTargetRepository(suggestion.name);
    setTargetRef(suggestion.ref || "");
    await generate(suggestion.name, suggestion.ref || "");
  };

  const actionable = finding.status === "MISSING" || finding.status === "PARTIAL";

  return (
    <section className="impact-remediation impact-copilot-remediation">
      <div className="impact-remediation-heading">
        <div>
          <h3>Governed remediation</h3>
          <strong>Generate a GitHub Copilot Chat implementation prompt</strong>
          <p>
            ReleaseMind creates a repository-aware prompt for developer review. It
            does not create files, commits, branches, or pull requests.
          </p>
        </div>
        <ShieldCheck />
      </div>

      {!actionable ? (
        <p className="impact-empty-inline">
          Prompt generation is available for Missing and Partial findings. This
          finding remains {impactLabel(finding.status)}.
        </p>
      ) : (
        <>
          <div className="impact-remediation-targets">
            <label>
              <span>Target repository</span>
              <select
                value={targetRepository}
                onChange={(event) => selectRepository(event.target.value)}
              >
                {repositoryOptions.map((item) => (
                  <option key={item.association_id} value={item.full_name}>
                    {item.full_name === sourceRepository
                      ? `Analyzed · ${item.full_name}`
                      : item.full_name}
                  </option>
                ))}
              </select>
              <small>Recommendations never silently replace the analyzed repository.</small>
            </label>
            <label>
              <span>Target branch / ref</span>
              {targetBranches.length ? (
                <select
                  value={targetRef}
                  onChange={(event) => setTargetRef(event.target.value)}
                >
                  {!targetBranches.some((item) => item.name === targetRef) && targetRef && (
                    <option>{targetRef}</option>
                  )}
                  {targetBranches.map((item) => (
                    <option key={item.name}>{item.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={targetRef}
                  onChange={(event) => setTargetRef(event.target.value)}
                  placeholder={branchesLoading ? "Loading branches..." : "Branch or ref"}
                />
              )}
            </label>
          </div>
          <button
            className="impact-generate-prompt"
            onClick={() => void generate()}
            disabled={generating || !targetRepository || !targetRef}
          >
            {generating ? <LoaderCircle className="spin" /> : <FileCode2 />}
            {generating ? "Generating governed prompt..." : "Generate Copilot Prompt"}
          </button>
          <small className="impact-remediation-note">
            The backend loads the persisted finding, run, evidence, related
            requirements, repository, branch, and pinned commit.
          </small>
        </>
      )}

      {error && <div className="impact-inline-error" role="alert"><AlertTriangle /> {error}</div>}

      {modalOpen && generated && (
        <div
          className="impact-prompt-modal-backdrop"
          role="presentation"
          onMouseDown={() => setModalOpen(false)}
        >
          <section
            className="impact-prompt-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Copilot remediation prompt"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span className="eyebrow">GOVERNED DEVELOPER HANDOFF</span>
                <h2>Copilot Remediation Prompt</h2>
                <p>{generated.title}</p>
              </div>
              <button onClick={() => setModalOpen(false)} aria-label="Close Copilot prompt"><X /></button>
            </header>

            <div className="impact-prompt-summary">
              <div><small>Requirement</small><strong>{generated.requirement_id}</strong></div>
              <div><small>Status</small><strong>{impactLabel(finding.status)}</strong></div>
              <div><small>Confidence</small><strong>{formatPercent(finding.confidence)}</strong></div>
              <div><small>Prompt version</small><strong>{generated.prompt_version}</strong></div>
            </div>

            <div className="impact-prompt-repositories">
              <article>
                <small>Analyzed repository</small>
                <strong>{generated.source_repository.name}</strong>
                <span>{generated.source_repository.ref} · {generated.source_repository.commit_sha.slice(0, 12)}</span>
              </article>
              <GitBranch />
              <article>
                <small>Suggested target repository</small>
                <strong>{generated.suggested_target_repository?.name || "No recommendation returned"}</strong>
                <span>
                  {generated.suggested_target_repository?.ref || "Ref unavailable"}
                  {generated.suggested_target_repository && (
                    <> · {generated.suggested_target_repository.verified ? "Verified" : "Recommendation only"}</>
                  )}
                </span>
              </article>
            </div>

            {generated.repository_suitability !== "suitable" && (
              <section className="impact-repository-warning">
                <AlertTriangle />
                <div>
                  <strong>Repository suitability warning</strong>
                  <p>
                    This finding may require a different implementation layer.
                    Copilot must inspect the workspace and stop without creating
                    speculative files when the required application is absent.
                  </p>
                  {generated.warnings.map((warning) => <span key={warning}>{warning}</span>)}
                </div>
                {generated.suggested_target_repository?.name &&
                  generated.suggested_target_repository.name !== targetRepository && (
                    <button onClick={() => void applySuggestedTarget()} disabled={generating}>
                      Use suggestion & regenerate
                    </button>
                  )}
              </section>
            )}

            <label className="impact-prompt-preview">
              <span>Persisted prompt · read-only</span>
              <textarea value={generated.prompt} readOnly spellCheck={false} />
            </label>

            {instruction && (
              <div className="impact-prompt-instruction" role="status">
                <Check /> {instruction}
              </div>
            )}

            <section className="impact-revalidation-note">
              <RefreshCw />
              <p>
                Copilot completion is not implementation evidence. After changes
                are committed and pushed, run Impact Analysis again to collect
                source and test evidence and reclassify the finding.
              </p>
            </section>

            <footer>
              <button onClick={() => void copyPrompt()}><Copy /> {copied ? "Copied" : "Copy Prompt"}</button>
              <button className="secondary" onClick={downloadPrompt}><Download /> Download .md</button>
              <button
                className="secondary"
                disabled
                title="Requires a trusted VS Code extension or registered local protocol handler"
              >
                Open Copilot Chat
              </button>
              <button className="secondary" onClick={() => void generate()} disabled={generating}>
                <RefreshCw /> Regenerate
              </button>
              <button className="secondary" onClick={() => setModalOpen(false)}>Close</button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
