"use client";
import { useState } from "react";
import { Bot, Copy, Link2, ThumbsDown, ThumbsUp } from "lucide-react";
import { AssistantAnswer } from "./assistant-answer";
import type { Message } from "./assistant-types";
const sentence = (value?: string) =>
  value
    ? value
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^./, (letter) => letter.toUpperCase())
    : "Grounded answer";
export function AssistantMessage({
  message,
  onCitation,
  onViewSources,
}: {
  message: Message;
  onCitation: (index: number) => void;
  onViewSources: () => void;
}) {
  const [copied, setCopied] = useState(false),
    [feedback, setFeedback] = useState<"helpful" | "unhelpful" | null>(null);
  const copy = async () => {
    await navigator.clipboard.writeText(message.text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <article className="message assistant">
      <div className="message-avatar" aria-hidden="true">
        <Bot />
      </div>
      <div className="message-body assistant-card">
        <header>
          <div>
            <strong>ReleaseLens AI</strong>
            {message.createdAt && (
              <time>
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            )}
          </div>
        </header>
        <AssistantAnswer
          text={message.text}
          sources={message.sources}
          onCitation={onCitation}
        />
        {message.sources && (
          <>
            <div className="answer-facts" aria-label="Answer metadata">
              <span title="The assistant classified this question by intent">
                {sentence(message.intent)}
              </span>
              <i>·</i>
              <span title="Grounded in structured Project database records">
                Structured retrieval
              </span>
              <i>·</i>
              <button onClick={onViewSources}>
                {message.sources.length} sources
              </button>
              {message.latencyMs && (
                <>
                  <i>·</i>
                  <span>{(message.latencyMs / 1000).toFixed(1)}s</span>
                </>
              )}
            </div>
            <div className="message-actions">
              <button onClick={() => void copy()} aria-label="Copy answer">
                <Copy />
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                className={feedback === "helpful" ? "selected" : ""}
                onClick={() =>
                  setFeedback(feedback === "helpful" ? null : "helpful")
                }
                aria-pressed={feedback === "helpful"}
                aria-label="Mark helpful"
              >
                <ThumbsUp />
                Helpful
              </button>
              <button
                className={feedback === "unhelpful" ? "selected" : ""}
                onClick={() =>
                  setFeedback(feedback === "unhelpful" ? null : "unhelpful")
                }
                aria-pressed={feedback === "unhelpful"}
                aria-label="Mark not helpful"
              >
                <ThumbsDown />
                Not helpful
              </button>
              <button onClick={onViewSources}>
                <Link2 />
                View sources
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
