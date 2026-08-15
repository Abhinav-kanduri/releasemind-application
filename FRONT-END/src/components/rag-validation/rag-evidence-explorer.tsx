import { CheckCircle2, Code2, Database, FileText, Search } from "lucide-react";
import type { ImpactEvidence } from "@/lib/impact-analysis/types";
import styles from "./rag-validation.module.css";

function location(evidence: ImpactEvidence) {
  const line = evidence.start_line
    ? `:${evidence.start_line}${evidence.end_line ? `-${evidence.end_line}` : ""}`
    : "";
  return `${evidence.file_path || evidence.document_name || "Persisted evidence"}${line}`;
}

function methodLabel(evidence: ImpactEvidence) {
  return evidence.retrieval_methods?.length
    ? evidence.retrieval_methods.join(" + ")
    : evidence.retrieval_method || "Not recorded";
}

export function RagEvidenceExplorer({
  evidence,
  selectedId,
  onSelect,
}: {
  evidence: ImpactEvidence[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const selected =
    evidence.find((item) => item.evidence_id === selectedId) || evidence[0];
  if (!evidence.length)
    return (
      <div className={styles.emptyState}>
        <Search />
        <strong>No persisted evidence for this requirement</strong>
        <p>The backend did not return evidence items for the selected finding.</p>
      </div>
    );
  return (
    <div className={styles.evidenceLayout}>
      <div className={styles.evidenceTableWrap}>
        <table className={styles.evidenceTable}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Evidence</th>
              <th>Retrieval path</th>
              <th>Fusion score</th>
              <th>Context</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map((item, index) => (
              <tr
                key={item.evidence_id}
                className={selected?.evidence_id === item.evidence_id ? styles.rowSelected : ""}
                onClick={() => onSelect(item.evidence_id)}
              >
                <td>#{item.rank || index + 1}</td>
                <td>
                  <strong>{item.symbol || location(item)}</strong>
                  <small>{location(item)}</small>
                </td>
                <td>
                  <span className={styles.methodBadge}>{methodLabel(item)}</span>
                </td>
                <td>{item.score == null ? "N/A" : item.score.toFixed(6)}</td>
                <td><CheckCircle2 aria-label="Persisted evaluator evidence" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <aside className={styles.evidenceInspector}>
          <span className="eyebrow">EVIDENCE INSPECTOR</span>
          <h3>{selected.symbol || selected.type.replaceAll("_", " ")}</h3>
          <p>{selected.description}</p>
          <dl>
            <div><dt>Source</dt><dd>{location(selected)}</dd></div>
            <div><dt>Type</dt><dd>{selected.type.replaceAll("_", " ")}</dd></div>
            <div><dt>Method</dt><dd>{methodLabel(selected)}</dd></div>
            <div><dt>Direction</dt><dd>{selected.direction || "Context"}</dd></div>
            <div><dt>Commit</dt><dd>{selected.commit_sha?.slice(0, 12) || "N/A"}</dd></div>
          </dl>
          <div className={styles.excerpt}>
            {selected.type === "DATABASE_MIGRATION" ? <Database /> :
              selected.symbol ? <Code2 /> : <FileText />}
            <pre>{selected.excerpt || "The evidence excerpt was not exposed by this persisted run."}</pre>
          </div>
        </aside>
      )}
    </div>
  );
}
