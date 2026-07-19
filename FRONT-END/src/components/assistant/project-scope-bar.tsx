import { ShieldCheck } from "lucide-react";
export function ProjectScopeBar({ projectName }: { projectName: string }) {
  return (
    <div className="scope-banner">
      <ShieldCheck />
      <span>
        <b>Project scope locked</b>
        <small>Answers use {projectName} data only.</small>
      </span>
    </div>
  );
}
