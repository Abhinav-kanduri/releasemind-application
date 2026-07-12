# ReleaseLens AI documentation

ReleaseLens AI is a release-aware product knowledge platform. It builds immutable, evidence-backed knowledge snapshots from engineering systems so users can ask how a product worked in a specific release, compare releases, and trace answers to authoritative sources.

> Project status: solution blueprint. The documents in this directory define the target product and implementation contract; they do not claim that the platform has already been implemented.

## Start here

| Audience | Recommended documents |
| --- | --- |
| Product and business | [Product overview](product-overview.md), [requirements](requirements.md), [roadmap](roadmap.md) |
| Architects and engineers | [Architecture](architecture.md), [data model](data-model.md), [API specification](api-specification.md) |
| Data and integration teams | [Data sources](data-sources.md), [ingestion and release lifecycle](ingestion-and-release-lifecycle.md) |
| Security and governance | [Security and governance](security-and-governance.md) |
| QA and release management | [Acceptance criteria](acceptance-criteria.md), [test strategy](test-strategy.md) |
| Platform and SRE | [Deployment](deployment.md), [operations runbook](operations-runbook.md) |
| Contributors | [Local development](local-development.md), [contributing](contributing.md) |

## Documentation map

1. [Product overview](product-overview.md) — problem, users, goals, scope, and terminology.
2. [Requirements](requirements.md) — functional and non-functional requirements.
3. [Architecture](architecture.md) — construction and consumption planes, component responsibilities, and key flows.
4. [Data sources](data-sources.md) — supported source categories, priorities, and minimum provenance.
5. [Ingestion and release lifecycle](ingestion-and-release-lifecycle.md) — initial sync, incremental processing, snapshot publication, and query flow.
6. [Data model](data-model.md) — relational, search, graph, and temporal knowledge models.
7. [API specification](api-specification.md) — REST resources, request examples, errors, and API rules.
8. [Security and governance](security-and-governance.md) — identity, ACL propagation, isolation, AI safety, audit, and retention.
9. [Acceptance criteria](acceptance-criteria.md) — testable AC-01 through AC-64 and definition of done.
10. [Test strategy](test-strategy.md) — test levels, AI evaluation, leakage tests, performance, and release gates.
11. [Deployment](deployment.md) — environments, topology, CI/CD, configuration, rollback, and recovery.
12. [Operations runbook](operations-runbook.md) — dashboards, alerts, incident procedures, backups, and SLOs.
13. [Roadmap](roadmap.md) — phased delivery plan and MVP exit criteria.
14. [Local development](local-development.md) — intended repository layout and developer bootstrap contract.
15. [Contributing](contributing.md) — documentation and code contribution standards.

## Core invariants

- Every product query is scoped to one explicit product and release.
- Product-specific claims require authorized evidence and precise citations.
- Published release snapshots are immutable; corrections create revisions.
- Source systems remain authoritative; generated knowledge is derived data.
- Source ACLs are enforced before retrieval and before response generation.
- Reprocessing is idempotent and driven by immutable versions and content hashes.
- Retrieved content is data, never trusted instruction.

## Reference architecture at a glance

```text
Git/Jira/Docs/CI/Test/API/DB sources
              |
       connectors + webhooks
              |
 event bus -> fetch -> preserve -> parse -> detect impact
              |                         |
       metadata/object store      extraction + validation
              |                         |
          PostgreSQL <-> search index <-> knowledge graph
                              |
User -> auth -> release resolver -> hybrid retrieval -> model gateway
                              |
                 grounding + citation validation -> answer
```

## Success targets

| Metric | Initial target |
| --- | ---: |
| Release-filter accuracy | >= 99% |
| Cross-release leakage | < 0.5% |
| Citation precision | >= 95% |
| Grounded-answer rate | >= 90% |
| Retrieval Recall@10 | >= 85% |
| Retrieval NDCG@10 | >= 80% |
| Standard question p95 | <= 5 seconds |
| Release comparison p95 | <= 10 seconds |
| Ingestion success | >= 99.5% |
| Availability | 99.9% |

Targets must be baselined and approved against representative repositories and evaluation questions before becoming contractual SLOs.

## Ownership and change control

- Product owns scope, personas, requirements, and acceptance.
- Architecture owns architectural decisions and system boundaries.
- Security owns identity, authorization, retention, and AI-risk controls.
- Platform/SRE owns deployment, SLOs, observability, and recovery.
- QA owns test evidence and production quality gates.
- Material design decisions should be recorded using [the ADR template](adr-template.md).

