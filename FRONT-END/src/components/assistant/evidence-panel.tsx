"use client";
import Link from "next/link";
import { memo, useState } from "react";
import { CheckCircle2, ChevronLeft, ExternalLink, X } from "lucide-react";
import { hasMeaningfulScores } from "./assistant-sanitizer";
import type { Source } from "./assistant-types";

const label = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
const SourceCard = memo(function SourceCard({
  source,
  index,
  expanded,
  highlighted,
  showScore,
  onToggle,
}: {
  source: Source;
  index: number;
  expanded: boolean;
  highlighted: boolean;
  showScore: boolean;
  onToggle: () => void;
}) {
  const type = label(source.source_type),
    metadata = [
      source.metadata?.status,
      source.metadata?.priority && `${source.metadata.priority} priority`,
      source.metadata?.release,
    ]
      .filter(Boolean)
      .map(String);
  const entityParam =
    source.source_type === "FEATURE"
      ? "featureId"
      : source.source_type === "USER_STORY"
        ? "userStoryId"
        : null;
  return (
    <article
      id={`evidence-source-${index}`}
      className={highlighted ? "highlighted" : ""}
      tabIndex={-1}
    >
      <div className="source-card-head">
        <span>{index + 1}</span>
        <b>{type}</b>
        {showScore && <em>{Math.round((source.score || 0) * 100)}% match</em>}
      </div>
      {source.source_key && <code>{source.source_key}</code>}
      <h3>{source.title}</h3>
      {source.snippet && (
        <p className={expanded ? "expanded" : ""}>{source.snippet}</p>
      )}
      {metadata.length > 0 && (
        <small className="source-metadata">{metadata.join(" · ")}</small>
      )}
      <footer>
        {source.snippet && source.snippet.length > 150 && (
          <button
            className="show-more"
            aria-expanded={expanded}
            onClick={onToggle}
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
        {entityParam && (
          <Link
            href={`/workspace/data-sources/project-management?${entityParam}=${encodeURIComponent(source.source_id)}`}
          >
            Open {type}
            <ExternalLink />
          </Link>
        )}
      </footer>
    </article>
  );
});

export function EvidencePanel({
  sources,
  onClose,
  highlighted,
}: {
  sources: Source[];
  onClose: () => void;
  highlighted: number | null;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set()),
    showScores = hasMeaningfulScores(sources.map((source) => source.score));
  const toggle = (index: number) =>
    setExpanded((current) => {
      const next = new Set(current);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  return (
    <aside className="evidence-panel" aria-label="Evidence and citations">
      <header>
        <div>
          <h2>Evidence</h2>
          <p>{sources.length} sources used in this answer</p>
        </div>
        <button onClick={onClose} aria-label="Collapse evidence panel">
          <ChevronLeft />
          <X />
        </button>
      </header>
      <div className="evidence-ok">
        <CheckCircle2 />
        <span>
          <b>Structured Project retrieval</b>
          <small>{sources.length} records found</small>
        </span>
      </div>
      <div className="source-list">
        {sources.length === 0 ? (
          <div className="evidence-empty">
            Sources and citations will appear after a grounded answer.
          </div>
        ) : (
          sources.map((source, index) => (
            <SourceCard
              source={source}
              index={index}
              expanded={expanded.has(index)}
              highlighted={highlighted === index}
              showScore={showScores}
              onToggle={() => toggle(index)}
              key={`${source.source_type}-${source.source_id}`}
            />
          ))
        )}
      </div>
    </aside>
  );
}
