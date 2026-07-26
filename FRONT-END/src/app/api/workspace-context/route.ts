import { NextRequest, NextResponse } from "next/server";
import { loadCanonicalProjectManagementWorkspace } from "@/workspace-context/project-management-workspace.server";

const environments = [
  { id: "production", name: "Production" },
  { id: "staging", name: "Staging" },
];

function failure(
  status: number,
  code: string,
  error: string,
  retryable = false,
) {
  return NextResponse.json({ code, error, retryable }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const productSpaceId = params.get("productSpaceId");
    const projectId = params.get("projectId");
    const releaseId = params.get("releaseId");
    const environmentId = params.get("environmentId");
    const workspace = await loadCanonicalProjectManagementWorkspace();

    const productSpace = productSpaceId
      ? workspace.productSpaces.find((option) => option.id === productSpaceId)
      : null;
    if (productSpaceId && !productSpace)
      return failure(
        404,
        "PRODUCT_SPACE_NOT_FOUND",
        "The selected Product Space no longer exists.",
      );

    if (projectId && !productSpaceId)
      return failure(
        422,
        "PROJECT_OUTSIDE_PRODUCT_SPACE",
        "Select a Product Space before selecting a Project.",
      );

    const projects = productSpaceId
      ? workspace.projects.filter(
          (option) => option.productSpaceId === productSpaceId,
        )
      : [];
    const project = projectId
      ? workspace.projects.find((option) => option.id === projectId)
      : null;
    if (projectId && !project)
      return failure(
        404,
        "PROJECT_NOT_FOUND",
        "The selected Project no longer exists.",
      );
    if (project && project.productSpaceId !== productSpaceId)
      return failure(
        422,
        "PROJECT_OUTSIDE_PRODUCT_SPACE",
        "The selected Project does not belong to this Product Space.",
      );

    if (releaseId && !projectId)
      return failure(
        422,
        "RELEASE_OUTSIDE_PROJECT",
        "Select a Project before selecting a Release.",
      );
    const releases = projectId
      ? workspace.releases.filter((option) => option.projectId === projectId)
      : [];
    const release = releaseId
      ? workspace.releases.find((option) => option.id === releaseId)
      : null;
    if (releaseId && !release)
      return failure(
        404,
        "RELEASE_NOT_FOUND",
        "The selected Release no longer exists.",
      );
    if (release && release.projectId !== projectId)
      return failure(
        422,
        "RELEASE_OUTSIDE_PROJECT",
        "The selected Release does not belong to this Project.",
      );

    const environment =
      environments.find((option) => option.id === environmentId) || null;
    if (environmentId && !environment)
      return failure(
        422,
        "ENVIRONMENT_UNAVAILABLE",
        "The selected Environment is not available.",
      );

    return NextResponse.json({
      selection: {
        productSpaceId,
        projectId,
        releaseId,
        environmentId,
      },
      resolved: {
        productSpace: productSpace
          ? { id: productSpace.id, name: productSpace.name }
          : null,
        project: project
          ? {
              id: project.id,
              name: project.name,
              key: project.key,
              productSpaceId: project.productSpaceId,
            }
          : null,
        release: release
          ? { id: release.id, name: release.name, projectId: release.projectId }
          : null,
        environment,
      },
      options: {
        productSpaces: workspace.productSpaces,
        projects,
        releases,
        environments,
      },
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (error) {
    return failure(
      503,
      "CONTEXT_UNAVAILABLE",
      error instanceof Error
        ? error.message
        : "Workspace context could not be loaded.",
      true,
    );
  }
}
