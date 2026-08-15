import { z } from "zod";

export const impactStatusSchema = z.enum([
  "PRESENT",
  "PARTIAL",
  "MISSING",
  "UNKNOWN",
]);

export const impactRunStatusSchema = z.enum([
  "QUEUED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

const nullableString = z.string().nullable().optional();
const nullableNumber = z.number().finite().nullable().optional();

export const impactRunSchema = z
  .object({
    run_id: z.string().min(1),
    status: impactRunStatusSchema,
    stage: z.string().default(""),
    progress_percent: z.number().finite().min(0).max(100).default(0),
    message: nullableString,
    timeline: z
      .array(
        z.object({
          stage: z.string(),
          label: z.string(),
          status: z.enum([
            "PENDING",
            "ACTIVE",
            "COMPLETED",
            "FAILED",
            "CANCELLED",
          ]),
          progress_percent: z.number().finite().min(0).max(100),
          message: nullableString,
        }),
      )
      .default([]),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        stage: z.string(),
      })
      .nullable()
      .optional(),
    created_at: nullableString,
    started_at: nullableString,
    completed_at: nullableString,
    score: nullableNumber,
    scope: z
      .object({
        type: z.enum(["FEATURE", "USER_STORY"]),
        id: z.string(),
        key: nullableString,
        title: nullableString,
      })
      .nullable()
      .optional(),
    repository: z
      .object({
        repository_id: z.string(),
        name: z.string(),
        branch: z.string(),
        commit_sha: z.string(),
      })
      .nullable()
      .optional(),
    counts: z
      .object({
        present: z.number().int().nonnegative(),
        partial: z.number().int().nonnegative(),
        missing: z.number().int().nonnegative(),
        unknown: z.number().int().nonnegative(),
      })
      .nullable()
      .optional(),
    previous_run_id: nullableString,
  })
  .passthrough();

export const impactRequirementSchema = z
  .object({
    requirement_id: z.string(),
    text: z.string(),
    type: z.string(),
    weight: nullableNumber,
    status: impactStatusSchema.nullable().optional(),
  })
  .passthrough();

export const impactFindingSchema = z
  .object({
    finding_id: z.string(),
    requirement_id: z.string(),
    requirement: z.string(),
    category: z.string(),
    status: impactStatusSchema,
    what_present: z.string().nullable().default(null),
    what_missing: z.string().nullable().default(null),
    reason_code: z.string().nullable().default(null),
    technical_reason: z.string().nullable().default(null),
    explanation: z.string().nullable().default(null),
    impact: z.string().nullable().default(null),
    recommendation: z.string().nullable().default(null),
    confidence: nullableNumber,
    weight: nullableNumber,
    completion: nullableNumber,
    score_contribution: nullableNumber,
    evidence_count: z.number().int().nonnegative().default(0),
    code_generation_available: z.boolean().default(false),
    predicate_results: z.array(z.record(z.unknown())).default([]),
    model_name: nullableString,
    prompt_version: nullableString,
    evaluation_metadata: z.record(z.unknown()).default({}),
  })
  .passthrough();

export const impactEvidenceSchema = z
  .object({
    evidence_id: z.string(),
    type: z.string(),
    repository: nullableString,
    commit_sha: nullableString,
    file_path: nullableString,
    symbol: nullableString,
    start_line: z.number().int().positive().nullable().optional(),
    end_line: z.number().int().positive().nullable().optional(),
    document_id: nullableString,
    document_name: nullableString,
    section: nullableString,
    retrieval_method: nullableString,
    retrieval_methods: z.array(z.string()).default([]),
    supports: impactStatusSchema.nullable().optional(),
    direction: nullableString,
    rank: z.number().int().positive().nullable().optional(),
    score: nullableNumber,
    description: z.string(),
    excerpt: nullableString,
    metadata: z.record(z.unknown()).nullable().optional(),
  })
  .passthrough();

export const impactGraphSchema = z
  .object({
    view: z.enum(["expected", "actual", "comparison"]).optional(),
    nodes: z.array(
      z
        .object({
          id: z.string(),
          label: z.string(),
          type: nullableString,
          status: nullableString,
          group: nullableString,
          metadata: z.record(z.unknown()).nullable().optional(),
        })
        .passthrough(),
    ),
    edges: z.array(
      z
        .object({
          id: nullableString,
          source: z.string(),
          target: z.string(),
          type: nullableString,
          label: nullableString,
          status: nullableString,
          metadata: z.record(z.unknown()).nullable().optional(),
        })
        .passthrough(),
    ),
  })
  .passthrough();

export const generatedChangeSchema = z
  .object({
    change_id: z.string(),
    finding_id: nullableString,
    status: z.string(),
    repository: nullableString,
    base_ref: nullableString,
    base_commit_sha: nullableString,
    created_at: nullableString,
    files: z
      .array(
        z
          .object({
            path: z.string(),
            status: nullableString,
            additions: z.number().int().nonnegative().nullable().optional(),
            deletions: z.number().int().nonnegative().nullable().optional(),
            diff: nullableString,
          })
          .passthrough(),
      )
      .optional(),
    diff: nullableString,
    validation: z
      .object({
        status: z.string(),
        checks: z
          .array(
            z
              .object({
                name: z.string(),
                status: z.string(),
                duration_ms: nullableNumber,
                summary: nullableString,
                details_url: nullableString,
              })
              .passthrough(),
          )
          .optional(),
      })
      .nullable()
      .optional(),
    approval: z
      .object({
        decision: z.string(),
        actor: nullableString,
        comment: nullableString,
        decided_at: nullableString,
      })
      .nullable()
      .optional(),
    pull_request: z
      .object({
        number: z.number().int().positive().nullable().optional(),
        url: z.string().url(),
        title: nullableString,
        state: z.string(),
        draft: z.boolean().optional(),
        head: nullableString,
        base: nullableString,
        merged_at: nullableString,
      })
      .nullable()
      .optional(),
  })
  .passthrough();

export const generatedRemediationPromptSchema = z
  .object({
    prompt_id: z.string().min(1),
    run_id: z.string().min(1),
    requirement_id: z.string().min(1),
    title: z.string().min(1),
    target: z.literal("github_copilot_chat"),
    prompt_version: z.string().min(1),
    prompt: z.string().min(1),
    prompt_hash: nullableString,
    source_repository: z.object({
      name: z.string().min(1),
      ref: z.string().min(1),
      commit_sha: z.string().min(1),
    }),
    suggested_target_repository: z
      .object({
        name: z.string().min(1),
        ref: z.string().min(1),
        verified: z.boolean(),
      })
      .nullable()
      .optional(),
    repository_suitability: z.enum([
      "suitable",
      "possible_mismatch",
      "unsuitable",
    ]),
    warnings: z.array(z.string()).default([]),
    generated_at: z.string().min(1),
  })
  .passthrough();
export const requirementsResponseSchema = z.object({
  items: z.array(impactRequirementSchema),
});

export const findingsResponseSchema = z.object({
  items: z.array(impactFindingSchema),
});

export const evidenceResponseSchema = z.union([
  z.object({ items: z.array(impactEvidenceSchema) }),
  z.array(impactEvidenceSchema).transform((items) => ({ items })),
]);

const vectorStoreSchema = z
  .object({
    total_chunks: z.number().int().nonnegative(),
    embedded_chunks: z.number().int().nonnegative(),
    embedding_model: nullableString,
    embedding_dimensions: z.number().int().positive().nullable().optional(),
    vector_status: z.string(),
    embedding_coverage_percent: z.number().finite().min(0).max(100),
  })
  .passthrough();

export const impactObservabilitySchema = z
  .object({
    run_id: z.string(),
    postgres: z.object({
      status: z.string(),
      repository_index: vectorStoreSchema.extend({
        searchable_chunks: z.number().int().nonnegative(),
      }),
      knowledge_base: vectorStoreSchema.extend({
        documents: z.number().int().nonnegative(),
      }),
    }),
    retrieval: z.object({
      persisted_evidence: z.number().int().nonnegative(),
      method_counts: z.record(z.number().int().nonnegative()),
      evidence_type_counts: z.record(z.number().int().nonnegative()),
      average_score: z.number().finite().nullable(),
      maximum_score: z.number().finite().nullable(),
      rejected_candidates: z.number().int().nonnegative().nullable(),
    }),
    instrumentation: z.record(z.boolean()),
  })
  .passthrough();

export const historyResponseSchema = z.union([
  z
    .object({
      items: z.array(impactRunSchema),
      page: z.number().int().positive().optional(),
      page_size: z.number().int().positive().optional(),
      total: z.number().int().nonnegative().optional(),
    })
    .passthrough(),
  z.array(impactRunSchema).transform((items) => ({ items })),
]);

export const reanalysisResponseSchema = z
  .object({
    previous_run_id: z.string(),
    new_run_id: z.string(),
    status: impactRunStatusSchema,
  })
  .passthrough();

export const impactRunComparisonSchema = z
  .object({
    baseline_run_id: z.string(),
    current_run_id: z.string(),
    previous_score: z.number().finite().nullable(),
    new_score: z.number().finite().nullable(),
    score_delta: z.number().finite().nullable(),
    requirement_changes: z.array(
      z
        .object({
          requirement_id: z.string(),
          requirement: z.string(),
          previous_status: impactStatusSchema.nullable(),
          new_status: impactStatusSchema.nullable(),
          change: z.string(),
        })
        .passthrough(),
    ),
  })
  .passthrough();
