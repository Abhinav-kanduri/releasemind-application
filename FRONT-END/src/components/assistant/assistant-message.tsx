"use client";
import { useState } from "react";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Copy,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { AssistantAnswer } from "./assistant-answer";
import { followUpsFor } from "./assistant-follow-ups";
import type { Message } from "./assistant-types";

export function AssistantMessage({
  message,
  question = "",
  onCitation,
  onViewSources,
  isLatest = false,
  onFollowUp,
  onRegenerate,
}: {
  message: Message;
  question?: string;
  onCitation: (index: number) => void;
  onViewSources: () => void;
  isLatest?: boolean;
  onFollowUp?: (question: string) => void;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false),
    [feedback, setFeedback] = useState<"helpful" | "unhelpful" | null>(null),
    [expanded, setExpanded] = useState(false);
  const sourceCount = message.sources?.length || 0,
    isLong = message.text.length > 1400,
    followUps = followUpsFor(question, message.intent);
  const copy = async () => {
    await navigator.clipboard.writeText(message.text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <article className="message assistant" id={`message-${message.id}`}>
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
        <div className={`assistant-answer-wrap ${isLong && !expanded ? "collapsed" : ""}`}>
          <AssistantAnswer
            text={message.text}
            sources={message.sources}
            onCitation={onCitation}
          />
        </div>
        {isLong && (
          <button
            className="answer-expand"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp /> : <ChevronDown />}
            {expanded ? "Show concise view" : "Show full answer"}
          </button>
        )}
        <div className="answer-facts" aria-label="Answer evidence and latency">
          {sourceCount ? (
            <button onClick={onViewSources}>Sources {sourceCount}</button>
          ) : (
            <span>No project sources were used</span>
          )}
          {message.latencyMs ? (
            <span>{(message.latencyMs / 1000).toFixed(1)}s</span>
          ) : null}
        </div>
        <div className="message-actions" aria-label="Response actions">
          <button onClick={() => void copy()} aria-label="Copy answer">
            <Copy />
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            className={feedback === "helpful" ? "selected" : ""}
            onClick={() => setFeedback(feedback === "helpful" ? null : "helpful")}
            aria-pressed={feedback === "helpful"}
            aria-label="Mark helpful"
            title="Helpful"
          >
            <ThumbsUp />
            <span className="action-label">Helpful</span>
          </button>
          <button
            className={feedback === "unhelpful" ? "selected" : ""}
            onClick={() => setFeedback(feedback === "unhelpful" ? null : "unhelpful")}
            aria-pressed={feedback === "unhelpful"}
            aria-label="Mark not helpful"
            title="Not helpful"
          >
            <ThumbsDown />
            <span className="action-label">Not helpful</span>
          </button>
          {onRegenerate && (
            <button onClick={onRegenerate} aria-label="Regenerate answer">
              <RotateCcw />
              Regenerate
            </button>
          )}
        </div>
        {isLatest && onFollowUp && (
          <div className="follow-up-suggestions" aria-label="Suggested follow-up questions">
            <span>You might also ask</span>
            <div>
              {followUps.map((item) => (
                <button key={item} onClick={() => onFollowUp(item)}>{item}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}