import { NextRequest, NextResponse } from "next/server";
import { projectManagementFetch } from "@/lib/project-management-api";
import { loadCanonicalProjectManagementWorkspace } from "@/workspace-context/project-management-workspace.server";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { projectId } = await context.params;
  const productSpaceId = request.nextUrl.searchParams.get("productSpaceId");
  if (!productSpaceId)
    return NextResponse.json(
      {
        code: "PRODUCT_SPACE_REQUIRED",
        error: "Select a Product Space.",
      },
      { status: 409 },
    );
  try {
    const workspace = await loadCanonicalProjectManagementWorkspace();
    const project = workspace.projects.find((item) => item.id === projectId);
    if (!project)
      return NextResponse.json(
        { code: "PROJECT_NOT_FOUND", error: "The Project is unavailable." },
        { status: 404 },
      );
    if (project.productSpaceId !== productSpaceId)
      return NextResponse.json(
        {
          code: "PROJECT_OUTSIDE_PRODUCT_SPACE",
          error: "The Project does not belong to this Product Space.",
        },
        { status: 422 },
      );
    const query = new URLSearchParams();
    const releaseId = request.nextUrl.searchParams.get("releaseId");
    if (releaseId) query.set("piReleaseId", releaseId);
    const suffix = query.size ? `?${query}` : "";
    const response = await projectManagementFetch(
      `/projects/${encodeURIComponent(projectId)}/planning-options${suffix}`,
    );
    const body = await response.text();
    return new NextResponse(body || null, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        code: "PLANNING_OPTIONS_UNAVAILABLE",
        error: "Planning options could not be loaded.",
      },
      { status: 502 },
    );
  }
}
