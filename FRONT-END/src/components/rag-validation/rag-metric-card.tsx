import { ArrowUpRight, DatabaseZap, Info } from "lucide-react";
import { availabilityLabel, metricDisplay } from "./rag-evaluation-adapter";
import type { RagEvaluationMetric } from "./rag-evaluation.types";
import styles from "./rag-evaluation.module.css";

export function MetricScoreCard({
  metric,
  onOpen,
  compact = false,
}: {
  metric: RagEvaluationMetric;
  onOpen: (metric: RagEvaluationMetric) => void;
  compact?: boolean;
}) {
  const unavailable = metric.normalizedScore == null;
  return (
    <button
      type="button"
      className={styles.metricCard}
      data-status={metric.status}
      data-compact={compact}
      onClick={() => onOpen(metric)}
      aria-label={`Inspect ${metric.name}`}
      title={`${metric.definition} ${metric.interpretation}`}
    >
      <span className={styles.metricCardTop}>
        <span className={styles.modeBadge} data-mode={metric.evaluationMode}>
          {metric.evaluationMode === "GOLDEN_DATASET" ? <DatabaseZap /> : <Info />}
          {metric.evaluationMode === "GOLDEN_DATASET" ? "GOLDEN DATASET" : "ONLINE"}
        </span>
        <ArrowUpRight />
      </span>
      <strong>{metric.k && metric.name.includes("@K") ? metric.name.replace("@K", `@${metric.k}`) : metric.name}</strong>
      <span className={styles.metricValue}>{metricDisplay(metric)}</span>
      <span className={styles.metricFooter}>
        <b data-status={metric.status}>{unavailable ? availabilityLabel(metric.dataAvailability) : metric.status}</b>
        <em>{metric.unavailableReason || "View calculation and data"}</em>
      </span>
    </button>
  );
}
