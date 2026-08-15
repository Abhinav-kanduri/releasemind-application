import { z } from "zod";
import {
  evidenceResponseSchema,
  findingsResponseSchema,
  generatedChangeSchema,
  generatedRemediationPromptSchema,
  historyResponseSchema,
  impactFindingSchema,
  impactGraphSchema,
  impactObservabilitySchema,
  impactRunComparisonSchema,
  impactRunSchema,
  reanalysisResponseSchema,
  requirementsResponseSchema,
} from "./schemas";
import type {
  GeneratedChange,
  GeneratedRemediationPrompt,
  GenerateRemediationPromptOptions,
  ImpactEvidence,
  ImpactFinding,
  ImpactGraph,
  ImpactGraphView,
  ImpactHistoryResponse,
  ImpactObservability,
  ImpactPlanningOptions,
  ImpactRequirement,
  ImpactRun,
  ImpactRunComparison,
  ImpactStatus,
  ProjectRepository,
  PullRequestInfo,
  RepositoryBranch,
  ReanalysisResponse,
  StartImpactAnalysisInput,
} from "./types";
import { ImpactApiError } from "./types";
import { normalizeImpactApiFailure } from "./errors";

type RequestOptions<T> = RequestInit & {
  schema: z.ZodType<T, z.ZodTypeDef, unknown>;
};

async function request<T>(path: string, options: RequestOptions<T>) {
  let response: Response;
  try {
    response = await fetch(path, {
      cache: "no-store",
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError")
      throw cause;
    throw new ImpactApiError({
      code: "IMPACT_NETWORK_ERROR",
      message: "Impact Analysis could not be reached.",
      status: 0,
      details: cause,
      retryable: true,
    });
  }

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      if (response.ok)
        throw new ImpactApiError({
          code: "INVALID_IMPACT_RESPONSE",
          message: "Impact Analysis returned an invalid response.",
          status: response.status,
          details: text.slice(0, 300),
        });
    }
  }

  if (!response.ok) {
    const failure = normalizeImpactApiFailure(body, response.status);
    throw new ImpactApiError({
      code: failure.code,
      message: failure.message,
      status: response.status,
      details: failure.details,
      retryable: failure.retryable,
    });
  }

  const parsed = options.schema.safeParse(body);
  if (!parsed.success)
    throw new ImpactApiError({
      code: "INVALID_IMPACT_RESPONSE",
      message: "Impact Analysis returned an unsupported response.",
      status: response.status,
      details: parsed.error.flatten(),
    });
  return parsed.data;
}

export function startImpactAnalysis(
  input: StartImpactAnalysisInput,
  signal?: AbortSignal,
): Promise<ImpactRun> {
  return request("/api/impact-analysis/runs", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
    schema: impactRunSchema,
  });
}

export function getImpactRun(runId: string, signal?: AbortSignal) {
  return request(`/api/impact-analysis/runs/${encodeURIComponent(runId)}`, {
    signal,
    schema: impactRunSchema,
  }) as Promise<ImpactRun>;
}

export function getImpactObservability(
  runId: string,
  signal?: AbortSignal,
): Promise<ImpactObservability> {
  return request(
    `/api/impact-analysis/runs/${encodeURIComponent(runId)}/observability`,
    { signal, schema: impactObservabilitySchema },
  );
}

export async function getImpactRequirements(
  runId: string,
  signal?: AbortSignal,
): Promise<ImpactRequirement[]> {
  const response = await request(
    `/api/impact-analysis/runs/${encodeURIComponent(runId)}/requirements`,
    { signal, schema: requirementsResponseSchema },
  );
  return response.items;
}

export async function getImpactFindings(
  runId: string,
  filters: {
    status?: ImpactStatus;
    category?: string;
    page?: number;
    pageSize?: number;
  } = {},
  signal?: AbortSignal,
): Promise<ImpactFinding[]> {
  const query = new URLSearchParams();
  if (filters.status) query.set("status", filters.status);
  if (filters.category) query.set("category", filters.category);
  if (filters.page) query.set("page", String(filters.page));
  if (filters.pageSize) query.set("page_size", String(filters.pageSize));
  const suffix = query.size ? `?${query}` : "";
  const response = await request(
    `/api/impact-analysis/runs/${encodeURIComponent(runId)}/findings${suffix}`,
    { signal, schema: findingsResponseSchema },
  );
  return response.items;
}

export function getImpactFinding(
  findingId: string,
  signal?: AbortSignal,
): Promise<ImpactFinding> {
  return request(
    `/api/impact-analysis/findings/${encodeURIComponent(findingId)}`,
    { signal, schema: impactFindingSchema },
  );
}

export async function getFindingEvidence(
  findingId: string,
  signal?: AbortSignal,
): Promise<ImpactEvidence[]> {
  const response = await request(
    `/api/impact-analysis/findings/${encodeURIComponent(findingId)}/evidence`,
    { signal, schema: evidenceResponseSchema },
  );
  return response.items;
}

export function getImpactGraph(
  runId: string,
  view: ImpactGraphView,
  signal?: AbortSignal,
): Promise<ImpactGraph> {
  return request(
    `/api/impact-analysis/runs/${encodeURIComponent(runId)}/graph?view=${view}`,
    { signal, schema: impactGraphSchema },
  );
}

export function getImpactHistory(
  filters: {
    productSpaceId: string;
    projectId: string;
    scopeType?: string;
    scopeId?: string;
  },
  signal?: AbortSignal,
): Promise<ImpactHistoryResponse> {
  const query = new URLSearchParams({
    product_space_id: filters.productSpaceId,
    project_id: filters.projectId,
  });
  if (filters.scopeType) query.set("scope_type", filters.scopeType);
  if (filters.scopeId) query.set("scope_id", filters.scopeId);
  return request(`/api/impact-analysis/history?${query}`, {
    signal,
    schema: historyResponseSchema,
  });
}

export function reanalyzeImpactRun(runId: string): Promise<ReanalysisResponse> {
  return request(
    `/api/impact-analysis/runs/${encodeURIComponent(runId)}/reanalyze`,
    { method: "POST", schema: reanalysisResponseSchema },
  );
}

export function getImpactComparison(
  runId: string,
  baselineRunId: string,
  signal?: AbortSignal,
): Promise<ImpactRunComparison> {
  const query = new URLSearchParams({ baseline_run_id: baselineRunId });
  return request(
    `/api/impact-analysis/runs/${encodeURIComponent(runId)}/comparison?${query}`,
    { signal, schema: impactRunComparisonSchema },
  );
}

export function generateRemediationPrompt(
  runId: string,
  findingId: string,
  options: GenerateRemediationPromptOptions,
): Promise<GeneratedRemediationPrompt> {
  return request(
    `/api/impact-analysis/runs/${encodeURIComponent(runId)}/findings/${encodeURIComponent(findingId)}/remediation-prompt`,
    {
      method: "POST",
      body: JSON.stringify(options),
      schema: generatedRemediationPromptSchema,
    },
  );
}
export function generateChange(findingId: string): Promise<GeneratedChange> {
  return request(
    `/api/impact-analysis/findings/${encodeURIComponent(findingId)}/generated-changes`,
    { method: "POST", schema: generatedChangeSchema },
  );
}

export function getGeneratedChange(
  changeId: string,
  signal?: AbortSignal,
): Promise<GeneratedChange> {
  return request(
    `/api/impact-analysis/generated-changes/${encodeURIComponent(changeId)}`,
    { signal, schema: generatedChangeSchema },
  );
}

export function validateGeneratedChange(
  changeId: string,
): Promise<GeneratedChange> {
  return request(
    `/api/impact-analysis/generated-changes/${encodeURIComponent(changeId)}/validate`,
    { method: "POST", schema: generatedChangeSchema },
  );
}

export function approveGeneratedChange(
  changeId: string,
  decision: "APPROVE" | "REJECT",
  comment: string,
): Promise<GeneratedChange> {
  return request(
    `/api/impact-analysis/generated-changes/${encodeURIComponent(changeId)}/approve`,
    {
      method: "POST",
      body: JSON.stringify({ decision, comment }),
      schema: generatedChangeSchema,
    },
  );
}

const pullRequestResponseSchema = z
  .object({
    number: z.number().int().positive().nullable().optional(),
    url: z.string().url(),
    title: z.string().nullable().optional(),
    state: z.string(),
    draft: z.boolean().optional(),
    head: z.string().nullable().optional(),
    base: z.string().nullable().optional(),
    merged_at: z.string().nullable().optional(),
  })
  .passthrough();

export function createPullRequest(changeId: string): Promise<PullRequestInfo> {
  return request(
    `/api/impact-analysis/generated-changes/${encodeURIComponent(changeId)}/pull-request`,
    { method: "POST", schema: pullRequestResponseSchema },
  );
}

const rowValue = (row: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) if (row[key] != null) return String(row[key]);
  return "";
};

export async function getImpactPlanningOptions(
  productSpaceId: string,
  projectId: string,
  releaseId?: string,
  signal?: AbortSignal,
): Promise<ImpactPlanningOptions> {
  const query = new URLSearchParams({ productSpaceId });
  if (releaseId) query.set("releaseId", releaseId);
  const response = await fetch(
    `/api/project-management/projects/${encodeURIComponent(projectId)}/planning-options?${query}`,
    { cache: "no-store", signal },
  );
  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok)
    throw new ImpactApiError({
      code: String(body.code || "PLANNING_OPTIONS_UNAVAILABLE"),
      message: String(body.error || "Planning options could not be loaded."),
      status: response.status,
    });
  const features = Array.isArray(body.features)
    ? body.features
    : Array.isArray(body.feature_options)
      ? body.feature_options
      : [];
  const stories = Array.isArray(body.user_stories)
    ? body.user_stories
    : Array.isArray(body.userStories)
      ? body.userStories
      : Array.isArray(body.stories)
        ? body.stories
        : Array.isArray(body.userStoryOptions)
          ? body.userStoryOptions
          : [];
  return {
    features: features.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        id: rowValue(row, "id"),
        key: rowValue(row, "key", "feature_key"),
        name: rowValue(row, "name", "title"),
        releaseId: rowValue(row, "releaseId", "release_id") || null,
      };
    }),
    stories: stories.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        id: rowValue(row, "id"),
        key: rowValue(row, "key", "story_key"),
        name: rowValue(row, "name", "title"),
        featureId: rowValue(row, "featureId", "feature_id") || null,
        releaseId: rowValue(row, "releaseId", "release_id") || null,
      };
    }),
  };
}

export async function getProjectRepositories(
  productSpaceId: string,
  projectId: string,
  signal?: AbortSignal,
): Promise<ProjectRepository[]> {
  const query = new URLSearchParams({ productSpaceId, projectId });
  const response = await fetch(`/api/github/repositories/imported?${query}`, {
    cache: "no-store",
    signal,
  });
  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok)
    throw new ImpactApiError({
      code: String(body.code || "REPOSITORIES_UNAVAILABLE"),
      message: String(body.error || "Linked repositories could not be loaded."),
      status: response.status,
    });
  return Array.isArray(body.repositories)
    ? (body.repositories as ProjectRepository[])
    : [];
}

const branchesSchema = z.union([
  z.object({
    branches: z.array(
      z.object({
        name: z.string(),
        commit_sha: z.string().nullable().optional(),
        protected: z.boolean().optional(),
      }),
    ),
  }),
  z
    .array(
      z.object({
        name: z.string(),
        commit_sha: z.string().nullable().optional(),
        protected: z.boolean().optional(),
      }),
    )
    .transform((branches) => ({ branches })),
]);

export async function getRepositoryBranches(
  repositoryUrl: string,
  signal?: AbortSignal,
): Promise<RepositoryBranch[]> {
  const query = new URLSearchParams({ repositoryUrl });
  const response = await request(`/api/github/repositories/branches?${query}`, {
    signal,
    schema: branchesSchema,
  });
  return response.branches;
}
