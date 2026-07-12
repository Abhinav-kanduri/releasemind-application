# Local development

The repository currently contains the solution documentation only. This page defines the bootstrap contract for the implementation when code is added; commands must be updated to match real tooling rather than left as placeholders.

## Intended repository layout

```text
apps/
  web/                 user and administration UI
  api/                 public REST/streaming API
services/
  ingestion/           connector orchestration and jobs
  knowledge/           parsing, extraction, indexing, graph
  query/               retrieval, orchestration, validation
packages/
  contracts/           API/event/schema definitions
  connector-sdk/       connector interfaces and test kit
infra/                 environment and deployment definitions
tests/
  integration/ e2e/ evaluation/ security/ performance/
my-docs/               product and engineering documentation
```

## Developer prerequisites

Document exact supported versions when chosen: Git, container runtime, language runtimes/package managers, database migration tool, and optional local PostgreSQL/pgvector, object storage, queue, search, graph, and telemetry stack.

## Required bootstrap behavior

The implementation should provide a single documented setup command and a single verification command. A fresh checkout must be able to:

1. Copy a safe example configuration without real secrets.
2. Start local dependencies with health checks.
3. Apply schemas/migrations and seed a synthetic two-release demo product.
4. Start API, workers, and UI.
5. Run unit/integration tests and a small release-leakage evaluation.
6. Stop cleanly without deleting persistent data unless explicitly requested.

## Local safety rules

- Use synthetic fixtures; never download production data by default.
- Use a local identity stub only outside production and mark it prominently.
- Do not weaken tenant/release/ACL filters in development code paths.
- Store credentials in ignored local files or a development secret store.
- Ensure generated logs and traces exclude evidence bodies and credentials.

## Seed scenario

The canonical demo should contain releases `1.0` and `2.0`, a requirement, API, implementation, test, and release manifest; `2.0` introduces one fact absent from `1.0`. Tests must prove that a `1.0` query cannot retrieve or cite that fact.

## Documentation required with implementation

Replace this contract with exact clone/setup/run/test/lint/migrate/seed/debug commands, service ports, configuration reference, troubleshooting, and tested examples as soon as tooling is selected.

