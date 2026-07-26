import { projectManagementGet } from "@/lib/project-management-api";

export type ProjectManagementWorkspace = {
  product_spaces?: Array<{
    id: string;
    name: string;
    key?: string | null;
    projects?: Array<{
      id: string;
      name: string;
      key?: string | null;
    }>;
  }>;
  releases?: Array<{
    id: string;
    project_id: string;
    name?: string | null;
    display_name?: string | null;
  }>;
};

export type CanonicalWorkspaceProject = {
  id: string;
  name: string;
  key?: string;
  productSpaceId: string;
};

export type CanonicalWorkspaceRelease = {
  id: string;
  name: string;
  projectId: string;
};

export type CanonicalProjectManagementWorkspace = {
  productSpaces: Array<{ id: string; name: string }>;
  projects: CanonicalWorkspaceProject[];
  releases: CanonicalWorkspaceRelease[];
};

export async function loadCanonicalProjectManagementWorkspace(): Promise<CanonicalProjectManagementWorkspace> {
  const workspace = (await projectManagementGet(
    "/workspace",
  )) as ProjectManagementWorkspace;
  const spaces = workspace.product_spaces || [];

  return {
    productSpaces: spaces
      .map((space) => ({ id: space.id, name: space.name }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    projects: spaces
      .flatMap((space) =>
        (space.projects || []).map((project) => ({
          id: project.id,
          name: project.name,
          ...(project.key ? { key: project.key } : {}),
          productSpaceId: space.id,
        })),
      )
      .sort((left, right) => left.name.localeCompare(right.name)),
    releases: (workspace.releases || [])
      .map((release) => ({
        id: release.id,
        name: release.display_name || release.name || release.id,
        projectId: release.project_id,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
}
