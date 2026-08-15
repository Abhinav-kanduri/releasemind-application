import { Fragment } from "react";
import { sanitizeAssistantAnswer } from "./assistant-sanitizer";
import type { Source } from "./assistant-types";

function Inline({
  text,
  sources,
  onCitation,
}: {
  text: string;
  sources: Source[];
  onCitation: (index: number) => void;
}) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, index) => {
        if (/^`.*`$/.test(part))
          return <code key={index}>{part.slice(1, -1)}</code>;
        if (/^\*\*.*\*\*$/.test(part))
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        const bracket = part.match(/^\[([^\]]+)\]$/);
        if (bracket) {
          const numeric = Number(bracket[1]) - 1;
          const sourceIndex =
            Number.isInteger(numeric) && numeric >= 0
              ? numeric
              : sources.findIndex(
                  (source) =>
                    source.source_key?.toLowerCase() ===
                    bracket[1].toLowerCase(),
                );
          if (sourceIndex >= 0 && sourceIndex < sources.length)
            return (
              <button
                className="inline-citation"
                key={index}
                onClick={() => onCitation(sourceIndex)}
                aria-label={`Open citation ${sourceIndex + 1}: ${sources[sourceIndex].source_key || sources[sourceIndex].title}`}
              >
                {Number.isInteger(numeric) ? part : `${bracket[1]} ↗`}
              </button>
            );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

const majorHeading = /^(project backlog summary|project:\s+.+)$/i;
const sectionHeading =
  /^(overview|planning overview|feature(?::\s+.+)?|user stories(?:\s*\([^)]*\))?|backlog metrics|delivery status|primary risks|key risks(?:\s+.+)?|notable dependencies(?:\s+.+)?|acceptance test focus areas(?:\s+.+)?|suggested follow-ups|high-level|backlog items|acceptance criteria|summary|recommendations|if you.+)$/i;

export function AssistantAnswer({
  text,
  sources = [],
  onCitation,
}: {
  text: string;
  sources?: Source[];
  onCitation: (index: number) => void;
}) {
  const lines = sanitizeAssistantAnswer(text).split(/\r?\n/),
    nodes: React.ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const raw = lines[index],
      line = raw.trim();
    if (!line) {
      index++;
      continue;
    }
    if (/^---+$/.test(line)) {
      nodes.push(<hr key={nodes.length} />);
      index++;
      continue;
    }
    if (
      /^#{1,3}\s+/.test(line) ||
      majorHeading.test(line) ||
      sectionHeading.test(line)
    ) {
      const level =
          line.match(/^#+/)?.[0].length || (majorHeading.test(line) ? 2 : 3),
        content = line.replace(/^#{1,3}\s+/, "");
      nodes.push(
        level <= 2 ? (
          <h2 key={nodes.length}>
            <Inline text={content} sources={sources} onCitation={onCitation} />
          </h2>
        ) : (
          <h3 key={nodes.length}>
            <Inline text={content} sources={sources} onCitation={onCitation} />
          </h3>
        ),
      );
      index++;
      continue;
    }
    if (/^>\s?/.test(line)) {
      nodes.push(
        <blockquote key={nodes.length}>
          <Inline
            text={line.replace(/^>\s?/, "")}
            sources={sources}
            onCitation={onCitation}
          />
        </blockquote>,
      );
      index++;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index++;
      }
      nodes.push(
        <ul key={nodes.length}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>
              <Inline text={item} sources={sources} onCitation={onCitation} />
            </li>
          ))}
        </ul>,
      );
      continue;
    }
    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
        items.push(lines[index].trim().replace(/^\d+[.)]\s+/, ""));
        index++;
      }
      nodes.push(
        <ol key={nodes.length}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>
              <Inline text={item} sources={sources} onCitation={onCitation} />
            </li>
          ))}
        </ol>,
      );
      continue;
    }
    if (
      line.includes("|") &&
      index + 1 < lines.length &&
      /^\s*\|?\s*:?-+/.test(lines[index + 1])
    ) {
      const rows: string[][] = [],
        headers = line
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((cell) => cell.trim());
      index += 2;
      while (index < lines.length && lines[index].includes("|")) {
        rows.push(
          lines[index]
            .trim()
            .replace(/^\||\|$/g, "")
            .split("|")
            .map((cell) => cell.trim()),
        );
        index++;
      }
      nodes.push(
        <div className="answer-table-wrap" key={nodes.length}>
          <table>
            <thead>
              <tr>
                {headers.map((header, cell) => (
                  <th key={cell}>
                    <Inline
                      text={header}
                      sources={sources}
                      onCitation={onCitation}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>
                      <Inline
                        text={cell}
                        sources={sources}
                        onCitation={onCitation}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    nodes.push(
      <p key={nodes.length}>
        <Inline text={line} sources={sources} onCitation={onCitation} />
      </p>,
    );
    index++;
  }
  return <div className="answer-content">{nodes}</div>;
}
