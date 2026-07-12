# Delivery roadmap

## Phase 0 — foundation

- Confirm product/release ontology, authoritative sources, ACL model, success metrics, threat model, and evaluation dataset.
- Establish repository, CI, infrastructure modules, identity, secret management, telemetry, schema registry, and ADR process.
- Exit: architecture/security approval and runnable platform skeleton.

## Phase 1 — MVP

- Git connector plus one work-management and one documentation connector.
- Full and incremental ingestion with immutable storage, hashing, provenance, retries, and reconciliation.
- PostgreSQL/pgvector search, structural chunks, release manifests, and two historical snapshots.
- Release-pinned search/Q&A with citations and insufficient-evidence behavior.
- Basic comparison, one feature-lineage path, source ACL enforcement, admin status, audit, and evaluation gates.
- Exit: all MVP criteria in [acceptance criteria](acceptance-criteria.md) pass.

## Phase 2 — production v1

- CI/CD, tests, OpenAPI, database migration, release note, and ADR ingestion.
- Dedicated hybrid retrieval/reranking, stronger graph model, impact analysis, snapshot approvals, quality/cost dashboards.
- HA, progressive delivery, tested restore, operational SLOs, security hardening, and production support.

## Phase 3 — enterprise

- Multiple products/tenants, connector SDK, regional/data-residency policies, delegated administration, legal hold/retention, enterprise search and graph scaling.
- Artifact registries, infrastructure, service catalogs, security scans, incident and approved observability summaries.
- Advanced governance, access recertification, chargeback, and quality analytics.

## Phase 4 — advanced intelligence

- Proactive change-impact and release-risk insights.
- Architecture evolution and technical-debt analysis.
- Governed onboarding/report generation and release-readiness recommendations.
- Any write-back automation is separately designed, permissioned, and approved.

## Suggested workstreams

| Workstream | Early deliverables |
| --- | --- |
| Platform | Identity, tenancy, API, queues, stores, telemetry. |
| Connectors | Git first; work-management and docs next; connector contract and test kit. |
| Knowledge | Parsers, schemas, chunks, embeddings, ontology, graph. |
| Release | Resolver, manifest, validation, publication, revision. |
| Experience | Product/release selector, search, Q&A, citations, comparison. |
| Quality/security | Dataset, eval runner, ACL tests, injection suite, audit. |
| Operations | CI/CD, dashboards, alerts, backup/recovery, runbooks. |

## Delivery controls

Each milestone has demonstrable user outcomes, acceptance IDs, security and operational evidence, measured quality/latency/cost, rollback/recovery proof, documentation updates, and named owners. Dates and capacity are intentionally assigned after discovery and estimation.

