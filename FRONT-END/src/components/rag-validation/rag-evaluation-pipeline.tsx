import { ArrowRight, FileCheck2, GitCompareArrows, MessageSquareText, SearchCheck, Target } from "lucide-react";
import styles from "./rag-evaluation.module.css";

const stages = [
  {
    icon: <Target />,
    label: "Atomic requirement",
    detail: "The evaluation case and expected intent",
    metrics: "Case scope",
  },
  {
    icon: <SearchCheck />,
    label: "Query & retrieval",
    detail: "What was found and how it ranked",
    metrics: "Recall · Precision · Hit Rate · MRR · NDCG",
  },
  {
    icon: <FileCheck2 />,
    label: "Context assembly",
    detail: "What evidence reached the evaluator",
    metrics: "Context Relevance · Context Recall",
  },
  {
    icon: <MessageSquareText />,
    label: "Evaluator output",
    detail: "Whether claims answer and follow evidence",
    metrics: "Faithfulness · Relevance · Groundedness · Hallucination",
  },
  {
    icon: <GitCompareArrows />,
    label: "Impact finding",
    detail: "Present, partial, missing, or unknown",
    metrics: "Implementation score contribution",
  },
];

export function EvaluationPipeline() {
  return (
    <div className={styles.evaluationPipeline} aria-label="RAG evaluation pipeline">
      {stages.map((stage, index) => (
        <div className={styles.evaluationStageWrap} key={stage.label}>
          <article className={styles.evaluationStage}>
            <span>{stage.icon}</span>
            <div>
              <strong>{stage.label}</strong>
              <p>{stage.detail}</p>
              <small>{stage.metrics}</small>
            </div>
          </article>
          {index < stages.length - 1 && <ArrowRight className={styles.pipelineArrow} />}
        </div>
      ))}
    </div>
  );
}
