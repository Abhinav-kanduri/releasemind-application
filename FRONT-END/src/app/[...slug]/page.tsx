import { AppShell } from "@/components/layout/app-shell";
import { WorkspacePage } from "@/components/shared/workspace-page";
import { DataSourceDashboard } from "@/components/data-sources/data-source-dashboard";
import { ImpactAnalysisDashboard } from "@/components/impact-analysis/impact-analysis-dashboard";
import { notFound } from "next/navigation";
const removedRoutes = new Set([
  "ai-generator",
  "releases",
  "features",
  "user-stories",
  "backlog",
]);
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const normalized = slug[0] === "workspace" ? slug.slice(1) : slug;
  if (!normalized.length)
    return (
      <AppShell>
        <WorkspacePage section="dashboard" />
      </AppShell>
    );
  if (removedRoutes.has(normalized[0])) notFound();
  if (normalized[0] === "data-sources" && normalized[1]) {
    if (normalized[1] === "impact-analysis")
      return (
        <AppShell>
          <ImpactAnalysisDashboard />
        </AppShell>
      );
    if (
      !["github", "project-management", "knowledge-base"].includes(
        normalized[1],
      )
    )
      notFound();
    return (
      <AppShell>
        <DataSourceDashboard
          source={
            normalized[1] as "github" | "project-management" | "knowledge-base"
          }
        />
      </AppShell>
    );
  }
  const section = normalized[0] === "admin" ? "admin" : normalized[0];
  return (
    <AppShell>
      <WorkspacePage section={section} />
    </AppShell>
  );
}
