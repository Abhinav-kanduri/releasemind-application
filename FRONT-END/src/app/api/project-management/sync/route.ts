import { NextRequest, NextResponse } from "next/server";
import { projectManagementGet } from "@/lib/project-management-api";
type Row = Record<string, unknown>;
type Workspace = {
  product_spaces?: Array<{
    id: string;
    name: string;
    projects?: Array<{ id: string; name: string; key: string }>;
  }>;
};
const value = (row: Row, ...keys: string[]) => {
  for (const key of keys) if (row[key] != null) return String(row[key]);
  return "";
};
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const workspace = (await projectManagementGet("/workspace")) as Workspace;
    const spaces = (workspace.product_spaces || []).map((space) => ({
      ...space,
      projects: space.projects || [],
    }));
    const requested = request.nextUrl.searchParams.get("projectId") || "";
    const requestedSpace =
      request.nextUrl.searchParams.get("productSpaceId") || "";
    const projects = spaces.flatMap((space) =>
      space.projects.map((project) => ({
        ...project,
        productSpaceId: space.id,
      })),
    );
    const project =
      projects.find((item) => item.id === requested) ||
      projects.find((item) => item.productSpaceId === requestedSpace) ||
      projects[0] ||
      null;
    if (!project)
      return NextResponse.json({
        spaces,
        project: null,
        releases: [],
        features: [],
        stories: [],
        sprints: [],
        syncedAt: new Date().toISOString(),
      });
    const filters = new URLSearchParams();
    for (const key of ["piReleaseId", "featureId", "sprintId", "userStoryId"]) {
      const current = request.nextUrl.searchParams.get(key);
      if (
        current &&
        (uuid.test(current) || (key === "sprintId" && current === "unassigned"))
      )
        filters.set(key, current);
    }
    const optionFilters = new URLSearchParams(filters);
    optionFilters.delete("userStoryId");
    const suffix = filters.size ? `?${filters}` : "",
      optionSuffix = optionFilters.size ? `?${optionFilters}` : "";
    const [options, backlog] = await Promise.all([
      projectManagementGet(
        `/projects/${project.id}/planning-options${optionSuffix}`,
      ),
      projectManagementGet(`/projects/${project.id}/backlog${suffix}`),
      projectManagementGet(
        `/projects/${project.id}/planning-hierarchy${suffix}`,
      ),
    ]);
    const releases = (options.piReleases || []).map((row: Row) => ({
      ...row,
      id: value(row, "id"),
      name: value(row, "display_name", "name"),
    }));
    const features = (backlog.features || []).map((row: Row) => ({
      ...row,
      id: value(row, "id"),
      name: value(row, "title"),
      key: value(row, "feature_key"),
      description: value(row, "description") || null,
      status: value(row, "status"),
      priority: value(row, "priority"),
      version: Number(row.version || 1),
      releaseId: value(row, "release_id") || null,
    }));
    const stories = (backlog.user_stories || []).map((row: Row) => ({
      ...row,
      id: value(row, "id"),
      name: value(row, "title"),
      key: value(row, "story_key"),
      storyText: value(row, "story_text") || null,
      status: value(row, "status"),
      priority: value(row, "priority"),
      version: Number(row.version || 1),
      storyPoints: row.story_points == null ? null : Number(row.story_points),
      releaseId: value(row, "release_id") || null,
      featureId: value(row, "feature_id"),
      sprintId: value(row, "sprint_id") || null,
    }));
    const sprints = (options.sprints || []).map((row: Row) => ({
      ...row,
      id: value(row, "id"),
      name: value(row, "display_name", "name"),
      releaseId: value(row, "release_id") || null,
    }));
    return NextResponse.json({
      spaces,
      project,
      releases,
      features,
      stories,
      sprints,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Project Management API is unavailable.",
      },
      { status: 502 },
    );
  }
}
