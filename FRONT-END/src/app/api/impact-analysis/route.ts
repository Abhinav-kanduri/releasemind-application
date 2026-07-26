import { NextRequest, NextResponse } from "next/server";
import {
  buildImpactAnalysis,
  type PlanningRecord,
} from "@/lib/impact-analysis";
import { projectManagementGet } from "@/lib/project-management-api";
import { loadCanonicalProjectManagementWorkspace } from "@/workspace-context/project-management-workspace.server";

type Row = Record<string, unknown>;

function value(row: Row, ...keys: string[]) {
  for (const key of keys) if (row[key] != null) return String(row[key]);
  return "";
}

function error(status: number, code: string, message: string) {
  return NextResponse.json({ code, error: message }, { status });
}

async function createSnapshot(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const productSpaceId = query.get("productSpaceId");
  const projectId = query.get("projectId");
  if (!productSpaceId)
    return error(
      409,
      "PRODUCT_SPACE_REQUIRED",
      "Select a Product Space to analyze impact.",
    );
  if (!projectId)
    return error(
      409,
      "PROJECT_REQUIRED",
      "Select a Project to analyze impact.",
    );

  const workspace = await loadCanonicalProjectManagementWorkspace();
  const project = workspace.projects.find((option) => option.id === projectId);
  if (!project)
    return error(
      404,
      "PROJECT_NOT_FOUND",
      "The selected Project is not available.",
    );
  if (project.productSpaceId !== productSpaceId)
    return error(
      422,
      "PROJECT_OUTSIDE_PRODUCT_SPACE",
      "The selected Project does not belong to this Product Space.",
    );

  const filters = new URLSearchParams();
  const releaseId = query.get("releaseId");
  const featureId = query.get("featureId");
  const sprintId = query.get("sprintId");
  const userStoryId = query.get("userStoryId");
  if (releaseId) filters.set("piReleaseId", releaseId);
  if (featureId) filters.set("featureId", featureId);
  if (sprintId) filters.set("sprintId", sprintId);
  if (userStoryId) filters.set("userStoryId", userStoryId);
  const suffix = filters.size ? `?${filters}` : "";
  const backlog = (await projectManagementGet(
    `/projects/${encodeURIComponent(projectId)}/backlog${suffix}`,
  )) as { features?: Row[]; user_stories?: Row[] };
  const features: PlanningRecord[] = (backlog.features || []).map((row) => ({
    id: value(row, "id"),
    key: value(row, "feature_key", "key"),
    name: value(row, "title", "name"),
    description: value(row, "description") || null,
    status: value(row, "status"),
    priority: value(row, "priority"),
    releaseId: value(row, "release_id") || null,
  }));
  const stories: PlanningRecord[] = (backlog.user_stories || []).map((row) => ({
    id: value(row, "id"),
    key: value(row, "story_key", "key"),
    name: value(row, "title", "name"),
    storyText: value(row, "story_text", "description") || null,
    status: value(row, "status"),
    priority: value(row, "priority"),
    releaseId: value(row, "release_id") || null,
    featureId: value(row, "feature_id"),
    sprintId: value(row, "sprint_id") || null,
    storyPoints: row.story_points == null ? null : Number(row.story_points),
  }));

  return NextResponse.json(
    buildImpactAnalysis({
      productSpaceId,
      projectId,
      projectName: project.name,
      releaseId,
      featureId,
      sprintId,
      userStoryId,
      features,
      stories,
    }),
  );
}

export async function GET(request: NextRequest) {
  try {
    return await createSnapshot(request);
  } catch (cause) {
    return error(
      502,
      "IMPACT_ANALYSIS_UNAVAILABLE",
      cause instanceof Error
        ? cause.message
        : "Impact Analysis is unavailable.",
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await createSnapshot(request);
  } catch (cause) {
    return error(
      502,
      "IMPACT_ANALYSIS_FAILED",
      cause instanceof Error ? cause.message : "The analysis run failed.",
    );
  }
}
