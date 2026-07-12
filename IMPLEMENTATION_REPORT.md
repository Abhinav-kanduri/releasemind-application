# ReleaseMind hierarchy implementation

## Root cause

The checked-in application was a UI-only Next.js prototype. The Releases route used static configuration and there was no AI Generator, database, ORM, API layer, Feature renderer, User Story renderer, or test harness. Consequently there was no persisted Feature/Story relationship to render or synchronize.

## Implementation

- Added a single Prisma/SQLite persistence layer and an initial SQL migration.
- Added Product Space, Project, Release, Feature, User Story, Acceptance Criterion, and AI Generation models with foreign keys and indexes.
- Represented Unassigned exclusively as a nullable `releaseId`; no synthetic Release row is created.
- Added separate runtime-validated Feature and User Story generation endpoints and separate UI renderers.
- Added idempotent, transactional Feature saves and bulk Story saves. Stories require a saved parent Feature and derive Product Space and Project from it.
- Added project-scoped release validation, release creation/rename/archive/restore, linked-record safeguards, and transactional unassign-and-delete.
- Added database-backed AI Generator Recent Work, Releases, Features, User Stories, and Backlog views.
- Saving refreshes the shared workspace query so all product workflow views retrieve current database state on navigation or refresh.

## Key files

- `FRONT-END/prisma/schema.prisma`
- `FRONT-END/prisma/migrations/20260712040000_init/migration.sql`
- `FRONT-END/src/lib/db.ts`
- `FRONT-END/src/app/api/ai/*`
- `FRONT-END/src/app/api/features/*`
- `FRONT-END/src/app/api/workspace/route.ts`
- `FRONT-END/src/components/product/product-workspace.tsx`

## Save and status behavior

Generated output is marked `Generated — Not saved`. Feature and Story persistence only reports Draft or Backlog success after the database transaction returns. AI generation IDs provide duplicate-save protection.

## Verification

- Prisma schema validation: passed.
- Prisma Client generation: passed.
- TypeScript (`tsc --noEmit`): passed.
- ESLint: passed with two pre-existing/config-style warnings and no errors.
- Next.js production build: passed (all routes generated).
- SQLite schema application from the generated migration SQL: passed.
- `prisma migrate deploy` and `prisma db push`: blocked by a local Prisma Windows schema-engine error; schema validation and Client generation pass, and the checked-in SQL migration was applied directly for local verification.

## Remaining limitations

The source repository had no real AI provider, authentication, Sprint/Defect models, TanStack Query, or automated-test infrastructure. Generation is therefore deterministic and local, and advanced edit/move/status dialogs, Roadmap/Board/Reports synchronization, Sprint/Defect counts, Playwright coverage, and provider-backed generation remain follow-up work. These are not claimed complete.
