import { AlertTriangle, ArrowRight, Database, Network, Waypoints } from "lucide-react";
import type { ImpactGraph } from "@/lib/impact-analysis/types";
import styles from "./rag-validation.module.css";

export type GraphHealth = {
  status: string;
  version?: string;
  framework?: string;
};

function GraphSide({ label, graph }: { label: string; graph: ImpactGraph | null }) {
  const groups = new Map<string, number>();
  for (const node of graph?.nodes || []) {
    const key = node.type || "UNCLASSIFIED";
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  return (
    <article className={styles.graphSide}>
      <div>
        <span className="eyebrow">{label}</span>
        <strong>{graph?.nodes.length || 0} nodes</strong>
        <small>{graph?.edges.length || 0} relationships</small>
      </div>
      <div className={styles.graphCloud}>
        {[...groups.entries()].slice(0, 12).map(([type, count]) => (
          <span key={type}><Network /> {type.replaceAll("_", " ")} <b>{count}</b></span>
        ))}
        {!groups.size && <p>No graph nodes were returned for this run.</p>}
      </div>
    </article>
  );
}

export function RagGraphPanel({
  expected,
  actual,
  health,
  retrievalUsed,
  error,
}: {
  expected: ImpactGraph | null;
  actual: ImpactGraph | null;
  health: GraphHealth | null;
  retrievalUsed: boolean;
  error: string;
}) {
  return (
    <div className={styles.graphPanel}>
      <section className={styles.graphStatusRow}>
        <article>
          <Database />
          <div><small>Neo4j service</small><strong>{health?.status === "ok" ? "Connected" : "Unavailable"}</strong></div>
        </article>
        <article>
          <Waypoints />
          <div><small>Impact graph</small><strong>{actual?.nodes.length ? "Built for run" : "No run graph"}</strong></div>
        </article>
        <article className={retrievalUsed ? styles.goodSignal : styles.warningSignal}>
          {retrievalUsed ? <Network /> : <AlertTriangle />}
          <div><small>Graph retrieval</small><strong>{retrievalUsed ? "Used in evidence retrieval" : "Not used in this run"}</strong></div>
        </article>
      </section>
      {!retrievalUsed && (
        <div className={styles.truthNotice}>
          <AlertTriangle />
          <p>
            Neo4j stores the expected and actual architecture for this run, but the persisted retrieval methods do not show Graph RAG participation. Graph availability is not the same as graph retrieval.
          </p>
        </div>
      )}
      {error && <div className={styles.inlineError}>{error}</div>}
      <div className={styles.graphComparison}>
        <GraphSide label="EXPECTED ARCHITECTURE" graph={expected} />
        <div className={styles.graphBridge}>
          <ArrowRight />
          <strong>Compare</strong>
          <small>Node and relationship evidence</small>
        </div>
        <GraphSide label="ACTUAL IMPLEMENTATION" graph={actual} />
      </div>
      <section className={styles.relationshipList}>
        <div><span className="eyebrow">ACTUAL RELATIONSHIPS</span><h3>What the repository graph proves</h3></div>
        {(actual?.edges || []).slice(0, 12).map((edge, index) => (
          <div className={styles.relationshipRow} key={edge.id || `${edge.source}-${edge.target}-${index}`}>
            <code>{edge.source}</code><span>{(edge.type || edge.label || "RELATED_TO").replaceAll("_", " ")}</span><code>{edge.target}</code>
          </div>
        ))}
        {!actual?.edges.length && <p className={styles.muted}>No actual relationships are available for this persisted run.</p>}
      </section>
    </div>
  );
}
