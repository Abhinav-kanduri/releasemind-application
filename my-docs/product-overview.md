# Product overview

## Problem statement

Enterprise product knowledge is scattered across source repositories, work-management platforms, documentation, CI/CD, test systems, architecture records, and operational tools. Conventional search can describe the product in general, but it cannot reliably answer which behavior, dependency, API, or decision was true for a particular release.

ReleaseLens AI creates a living, versioned digital twin of a product. It answers release-specific questions, compares releases, and traces statements to immutable evidence without replacing the systems of record.

## Users and jobs to be done

| Persona | Primary job |
| --- | --- |
| Engineer | Understand code, APIs, dependencies, and historical behavior. |
| QA engineer | Connect changed behavior to tests, coverage, and regression risk. |
| Product manager | Trace shipped features to requirements and releases. |
| Support engineer | Investigate incidents against the deployed version. |
| SRE | Understand configurations, deployments, and operational changes. |
| Architect | Analyze evolution, decisions, integrations, and technical debt. |
| Release manager | Verify snapshot completeness and shipped evidence. |
| Security/auditor | Confirm access, provenance, history, and sensitive changes. |
| Administrator | Configure sources, release mapping, policy, and monitoring. |
| New team member | Learn product structure without depending on tribal knowledge. |

## Product outcomes

- Reduce time spent searching across enterprise systems.
- Accelerate incident, defect, and change-impact analysis.
- Preserve historical product knowledge.
- Improve onboarding and release readiness.
- Make answers and release decisions evidence-backed and auditable.

## In scope

- Connector configuration, full sync, incremental sync, and reconciliation.
- Immutable release manifests and snapshot revisions.
- Release-pinned natural-language Q&A with citations.
- Hybrid lexical, semantic, metadata, and graph retrieval.
- Cross-release comparison and change classification.
- Feature lineage, dependency traversal, and impact analysis.
- Administrative, quality, cost, and operational telemetry.
- Enterprise identity, source ACL propagation, audit, and retention.

## Out of scope

- Replacing Git, Jira, documentation, CI/CD, or observability platforms.
- Automatically changing source systems from natural-language answers.
- Indexing secrets or unrestricted raw production telemetry.
- Treating informal chat or model memory as authoritative product evidence.
- Guaranteeing correctness when release-specific evidence is absent.

## Core concepts

| Term | Meaning |
| --- | --- |
| Artifact | A source item such as a file, issue, page, test, build, or schema. |
| Artifact version | An immutable revision of an artifact, identified by source revision and content hash. |
| Canonical entity | A stable concept such as `PaymentService`. |
| Entity version | The release-specific state of a canonical entity. |
| Release manifest | The complete immutable list of artifact versions belonging to a release. |
| Snapshot | Published search, graph, and metadata views created from a manifest. |
| Snapshot revision | A non-destructive correction to a published snapshot. |
| Evidence | Authorized source content that supports a claim. |
| Citation | A precise link to evidence, including location where supported. |

## Representative experiences

1. A user selects product `Payments` and release `2.5`.
2. They ask, “How is a refund authorized?”
3. The platform retrieves only authorized release-2.5 evidence and returns an answer with code, API, requirement, and test citations.
4. The user compares `2.5` to `3.0`; the platform reports added, modified, removed, deprecated, and breaking behavior with evidence from only those releases.
5. The user opens a feature lineage view from requirement through PR, commit, component, test, build, deployment, and release; absent links are shown as gaps.

## Assumptions and dependencies

- Each product has an administratively defined release convention.
- Connectors can access immutable revisions or sufficient history.
- The enterprise identity provider supplies stable user/group claims.
- Source platforms expose ACL metadata or an authorization-check endpoint.
- Product owners define required repositories and evidence for publication.
- Model providers and data regions are approved by security and legal teams.

