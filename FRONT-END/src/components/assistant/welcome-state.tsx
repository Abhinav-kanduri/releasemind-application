import {
  ArrowUpRight,
  BookOpen,
  GitCompare,
  Layers3,
  ListChecks,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
const prompts = [
  {
    title: "Summarize the current backlog",
    detail: "Releases, Features, Stories, points, and status",
    icon: Layers3,
    question: "Summarize the current Project backlog",
  },
  {
    title: "Show active PI Features",
    detail: "Explore work planned for the active release",
    icon: BookOpen,
    question: "Show Features in the active PI Release",
  },
  {
    title: "Find work in progress",
    detail: "Review User Stories currently being delivered",
    icon: ListChecks,
    question: "Which User Stories are currently in progress?",
  },
  {
    title: "Explain Acceptance Criteria",
    detail: "Inspect expected behavior for CSA-BOT-F-001",
    icon: Sparkles,
    question: "Explain the Acceptance Criteria for CSA-BOT-F-001",
  },
  {
    title: "Review delivery risks",
    detail: "Surface dependencies, risks, and assumptions",
    icon: ShieldAlert,
    question: "Show delivery risks for the current Project",
  },
  {
    title: "Compare supporting knowledge",
    detail: "Trace a Feature to connected documents",
    icon: GitCompare,
    question: "Compare a Feature with its supporting documents",
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
        Explore Releases, Features, User Stories, Acceptance Criteria, backlog
        status, and connected knowledge for {projectName}.
      </p>
      <div className="suggested">
        {prompts.map(({ title, detail, icon: Icon, question }) => (
          <button key={question} onClick={() => onAsk(question)}>
            <Icon />
            <span>
              <b>{title}</b>
              <small>{detail}</small>
            </span>
            <ArrowUpRight />
          </button>
        ))}
      </div>
    </section>
  );
}
