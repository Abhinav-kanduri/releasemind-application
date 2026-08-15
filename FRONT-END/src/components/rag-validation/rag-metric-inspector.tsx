"use client";

import { useEffect } from "react";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  DatabaseZap,
  FileQuestion,
  GitBranch,
  Link2,
  Network,
  X,
  XCircle,
} from "lucide-react";
import { availabilityLabel, metricDisplay } from "./rag-evaluation-adapter";
import type {
  RagClaimEvaluation,
  RagEvaluationMetric,
  RagEvidenceEvaluation,
} from "./rag-evaluation.types";
import styles from "./rag-evaluation.module.css";

export type EvaluationNavigationTarget = {
  view: "trace" | "evidence" | "graph";
  requirementId?: string | null;
  evidenceId?: string | null;
};

export function RagMetricInspector({
  metric,
  onClose,
  onNavigate,
}: {
  metric: RagEvaluationMetric | null;
  onClose: () => void;
  onNavigate: (target: EvaluationNavigationTarget) => void;
}) {
  useEffect(() => {
    if (!metric) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [metric, onClose]);

  if (!metric) return null;
  const details = metric.details;
  const hasEvaluationRecords =
    details.expected.length +
      details.retrieved.length +
      details.matched.length +
      details.missed.length +
      details.irrelevant.length +
      details.claims.length +
      details.rankings.length +
      details.requiredFacts.length +
      details.concepts.length >
    0;

  return (
    <div className={styles.drawerBackdrop} role="presentation" onMouseDown={onClose}>
      <aside
        className={styles.metricInspector}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rag-metric-inspector-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.inspectorHeader}>
          <div>
            <span className={styles.modeBadge} data-mode={metric.evaluationMode}>
              <DatabaseZap /> {metric.evaluationMode === "GOLDEN_DATASET" ? "GOLDEN DATASET" : "ONLINE"}
            </span>
            <h2 id="rag-metric-inspector-title">RagMetricInspector</h2>
            <p>{metric.name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close metric inspector">
            <X />
          </button>
        </header>

        <div className={styles.inspectorBody}>
          <section className={styles.inspectorScore} data-status={metric.status}>
            <div>
              <small>Score</small>
              <strong>{metricDisplay(metric)}</strong>
            </div>
            <div>
              <small>Status</small>
              <b>{metric.status}</b>
            </div>
            <div>
              <small>Data availability</small>
              <b>{availabilityLabel(metric.dataAvailability)}</b>
            </div>
          </section>

          <section className={styles.inspectorSection}>
            <span className={styles.inspectorEyebrow}>WHAT THIS METRIC MEANS</span>
            <h3>{metric.definition}</h3>
            <p><strong>Why it matters:</strong> {metric.whyItMatters}</p>
            <p><strong>How to interpret it:</strong> {metric.interpretation}</p>
          </section>

          <section className={styles.formulaPanel}>
            <Calculator />
            <div>
              <small>Formula</small>
              <strong>{metric.formula}</strong>
              <code>{metric.calculation || "Actual calculation unavailable"}</code>
            </div>
          </section>

          <section className={styles.inspectorFacts}>
            <Fact label="Run ID" value={metric.runId} />
            <Fact label="Requirement ID" value={metric.requirementId || "Run-level metric"} />
            <Fact label="K value" value={metric.k == null ? "N/A" : String(metric.k)} />
            <Fact label="Numerator" value={metric.numerator == null ? "N/A" : String(metric.numerator)} />
            <Fact label="Denominator" value={metric.denominator == null ? "N/A" : String(metric.denominator)} />
            <Fact label="Evaluation mode" value={metric.evaluationMode.replace("_", " ")} />
          </section>

          {metric.dataAvailability !== "AVAILABLE" && (
            <section className={styles.dataGap}>
              <FileQuestion />
              <div>
                <span>{metric.unavailableReason || "Evaluation data is incomplete"}</span>
                <h3>No score was inferred from similarity or confidence</h3>
                <dl>
                  <div><dt>Required data</dt><dd>{metric.requiredData}</dd></div>
                  <div><dt>Existing API / table</dt><dd>{metric.existingDataSource}</dd></div>
                  <div><dt>Missing backend field</dt><dd>{metric.missingBackendField || "None"}</dd></div>
                </dl>
              </div>
            </section>
          )}

          {hasEvaluationRecords && (
            <>
              <EvidenceSection title="Expected evidence" items={details.expected} onNavigate={onNavigate} />
              <EvidenceSection title="Retrieved evidence" items={details.retrieved} onNavigate={onNavigate} />
              <EvidenceSection title="Matched evidence" items={details.matched} onNavigate={onNavigate} />
              <EvidenceSection title="Missed evidence" items={details.missed} onNavigate={onNavigate} />
              <EvidenceSection title="Irrelevant evidence" items={details.irrelevant} onNavigate={onNavigate} />
              <ClaimsSection claims={details.claims} onNavigate={onNavigate} />
              {details.rankings.length > 0 && (
                <section className={styles.inspectorSection}>
                  <span className={styles.inspectorEyebrow}>CASE-LEVEL RANKING</span>
                  <div className={styles.rankingTableWrap}>
                    <table><thead><tr><th>Case</th><th>First relevant</th><th>Reciprocal</th><th>DCG</th><th>IDCG</th><th>NDCG</th></tr></thead><tbody>
                      {details.rankings.map((row) => <tr key={row.caseId}><td>{row.label}</td><td>{row.firstRelevantRank ?? "No hit"}</td><td>{row.reciprocalRank ?? "N/A"}</td><td>{row.dcg ?? "N/A"}</td><td>{row.idcg ?? "N/A"}</td><td>{row.ndcg ?? "N/A"}</td></tr>)}
                    </tbody></table>
                  </div>
                </section>
              )}
              <FactComparison metric={metric} />
            </>
          )}

          <section className={styles.relatedLinks}>
            <span className={styles.inspectorEyebrow}>RELATED TRACE SURFACES</span>
            <div>
              <button type="button" onClick={() => onNavigate({ view: "trace", requirementId: metric.requirementId })}><GitBranch /> Requirement Trace <ArrowRight /></button>
              <button type="button" onClick={() => onNavigate({ view: "evidence", requirementId: metric.requirementId })}><Link2 /> Evidence <ArrowRight /></button>
              <button type="button" onClick={() => onNavigate({ view: "graph", requirementId: metric.requirementId })}><Network /> Graph &amp; Vector <ArrowRight /></button>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div><small>{label}</small><strong title={value}>{value}</strong></div>;
}

function EvidenceSection({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: RagEvidenceEvaluation[];
  onNavigate: (target: EvaluationNavigationTarget) => void;
}) {
  if (!items.length) return null;
  return (
    <section className={styles.inspectorSection}>
      <span className={styles.inspectorEyebrow}>{title.toUpperCase()}</span>
      <div className={styles.evaluationEvidenceList}>
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => onNavigate({ view: "evidence", requirementId: item.requirementId, evidenceId: item.id })}>
            <span>{item.relevance === "IRRELEVANT" ? <XCircle /> : <CheckCircle2 />}</span>
            <div><strong>{item.label}</strong><small>{item.source || item.reason || "Persisted evaluation evidence"}</small></div>
            <dl><div><dt>Rank</dt><dd>{item.rank ?? "N/A"}</dd></div><div><dt>Score</dt><dd>{item.score ?? "N/A"}</dd></div><div><dt>Label</dt><dd>{item.relevance || "UNKNOWN"}</dd></div></dl>
          </button>
        ))}
      </div>
    </section>
  );
}

function ClaimsSection({
  claims,
  onNavigate,
}: {
  claims: RagClaimEvaluation[];
  onNavigate: (target: EvaluationNavigationTarget) => void;
}) {
  if (!claims.length) return null;
  return (
    <section className={styles.inspectorSection}>
      <span className={styles.inspectorEyebrow}>EVALUATOR CLAIMS &amp; SUPPORT</span>
      <div className={styles.claimList}>
        {claims.map((claim) => (
          <article key={claim.id} data-status={claim.status}>
            <header><span>Claim</span><b>{claim.status}</b></header>
            <p>{claim.claim}</p>
            <div><small>Supporting evidence</small>{claim.evidence.length ? claim.evidence.map((item) => <button key={item.id} type="button" onClick={() => onNavigate({ view: "evidence", requirementId: claim.requirementId, evidenceId: item.id })}>{item.label}</button>) : <em>None</em>}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FactComparison({ metric }: { metric: RagEvaluationMetric }) {
  const details = metric.details;
  if (!details.requiredFacts.length && !details.concepts.length) return null;
  return (
    <section className={styles.inspectorSection}>
      <span className={styles.inspectorEyebrow}>FACT / CONCEPT COVERAGE</span>
      <div className={styles.factCoverage}>
        {details.requiredFacts.map((fact) => {
          const available = details.availableFacts.includes(fact);
          return <div key={fact}>{available ? <CheckCircle2 /> : <XCircle />}<span>{fact}</span><b>{available ? "Available" : "Missing"}</b></div>;
        })}
        {details.concepts.map((concept) => <div key={concept.name}>{concept.addressed ? <CheckCircle2 /> : <XCircle />}<span>{concept.name}</span><b>{concept.addressed == null ? "Unknown" : concept.addressed ? "Addressed" : "Missed"}</b></div>)}
      </div>
    </section>
  );
}
