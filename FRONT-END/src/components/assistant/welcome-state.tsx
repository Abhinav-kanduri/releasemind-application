import { Sparkles } from "lucide-react";
const prompts = [
  {
    title: "Executive summary",
    question: "Give me an executive summary for the current release",
  },
  {
    title: "Active PI features",
    question: "Show Features in the active PI Release",
  },
  {
    title: "Work in progress",
    question: "Which User Stories are currently in progress?",
  },
  {
    title: "Acceptance criteria",
    question: "Explain the Acceptance Criteria for CSA-BOT-F-001",
  },
  {
    title: "What's at risk?",
    question: "Show delivery risks for the current Project",
  },
  {
    title: "Release readiness",
    question: "Assess release readiness for the current Project",
  },
];
export function WelcomeState({
  projectName,
  onAsk,
}: {
  projectName: string;
  onAsk: (question: string) => void;
}) {
  return (
    <section className="welcome-state">
      <span className="welcome-icon">
        <Sparkles />
      </span>
      <h2>Ask ReleaseLens</h2>
      <p>
        What do you want to understand about <strong>{projectName}</strong>?
      </p>
      <div className="suggested" aria-label="Suggested questions">
        {prompts.map(({ title, question }) => (
          <button key={question} onClick={() => onAsk(question)}>
            {title}
          </button>
        ))}
      </div>
      <div className="welcome-examples">
        <span>Try asking</span>
        <button onClick={() => onAsk("Compare planned work with GitHub implementation")}>Compare planned work with GitHub implementation</button>
        <button onClick={() => onAsk("Which user stories have incomplete acceptance criteria?")}>Find stories with incomplete acceptance criteria</button>
      </div>
    </section>
  );
}
