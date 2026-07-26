import { NextRequest, NextResponse } from "next/server";
import { loadCanonicalProjectManagementWorkspace } from "@/workspace-context/project-management-workspace.server";

function error(status: number, code: string, message: string) {
  return NextResponse.json({ code, error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const productSpaceId = request.nextUrl.searchParams.get("productSpaceId");
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!productSpaceId)
      return error(
        409,
        "PRODUCT_SPACE_REQUIRED",
        "Select a Product Space to load this source.",
      );
    if (!projectId)
      return error(
        409,
        "PROJECT_REQUIRED",
        "Select a Project to load this source.",
      );

    const workspace = await loadCanonicalProjectManagementWorkspace();
    const project =
      workspace.projects.find((option) => option.id === projectId) || null;
    if (!project)
      return error(
        404,
        "PROJECT_NOT_FOUND",
        "The selected Project is not available in Project Management.",
      );
    if (project.productSpaceId !== productSpaceId)
      return error(
        422,
        "PROJECT_OUTSIDE_PRODUCT_SPACE",
        "The selected Project does not belong to this Product Space.",
      );

    return NextResponse.json({
      project,
      releases: workspace.releases.filter(
        (release) => release.projectId === projectId,
      ),
      features: [],
      stories: [],
      sprints: [],
      syncedAt: new Date().toISOString(),
    });
  } catch (cause) {
    return error(
      502,
      "PROJECT_MANAGEMENT_UNAVAILABLE",
      cause instanceof Error
        ? cause.message
        : "Project Management API is unavailable.",
    );
  }
}
