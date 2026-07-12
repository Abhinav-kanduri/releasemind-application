# Acceptance criteria

These criteria are concise test contracts. Detailed scenarios and evidence are maintained in the test system and linked by ID.

## Integration and ingestion

- **AC-01 Source connectivity:** An administrator can configure, authenticate, test, enable, disable, and monitor every approved connector.
- **AC-02 Initial ingestion:** A full run reports discovered, processed, skipped, failed, duration, and failure reasons for all authorized in-scope artifacts.
- **AC-03 Incremental ingestion:** A changed artifact causes only it and impacted dependencies to be regenerated; unchanged content is not duplicated.
- **AC-04 Duplicate detection:** The same source revision and content hash cannot create duplicate processing results.
- **AC-05 Provenance:** Every knowledge item retains source identity/version/URI, author/time, hash, ACL, release, and processing metadata.

## Releases and snapshots

- **AC-06 Release detection:** Approved tags, pipeline events, manifests, and administrative triggers create release candidates.
- **AC-07 Release manifest:** Every approved release records product/version, tag/SHA, build/deployment, repositories, artifacts, tests, docs, hash, time, and publisher.
- **AC-08 Immutability:** Later source changes do not alter a published snapshot; corrections create a revision.
- **AC-09 Completeness:** Publication is blocked unless required sources, builds, jobs, indexes, graph updates, and release-scope validations pass.
- **AC-10 Historical access:** Authorized users can select and query retained published releases.

## Question answering and citations

- **AC-11 Mandatory scope:** Every product query binds to one explicit or approved-default release, never silently to a development branch.
- **AC-12 Release isolation:** A release-2.5 answer contains no evidence introduced only in release 3.0.
- **AC-13 Natural language:** Users can query architecture, code, APIs, rules, schemas, features, tests, deployments, changes, and decisions.
- **AC-14 Grounding:** Every material product claim has authoritative evidence.
- **AC-15 Insufficient evidence:** Unverifiable answers clearly state the limitation and do not fabricate facts.
- **AC-16 Response context:** Product, release, answer, evidence strength, citations, artifact type, and source location are visible.
- **AC-17 Clickable citations:** Authorized users can open the source or approved internal copy.
- **AC-18 Precise location:** Citations use lines, sections, pages, issue/PR/commit IDs, operations, test cases, or pipeline runs where supported.
- **AC-19 Feature traceability:** Available requirement-to-release links are shown and missing links are explicitly identified.
- **AC-20 Source authority:** Generated content never replaces connected systems as the system of record.

## Comparison, knowledge, and impact

- **AC-21 Two-release comparison:** Users can compare features, architecture, services, APIs, rules, schemas, dependencies, configuration, tests, and deployments.
- **AC-22 Classification:** Differences are added, modified, removed, deprecated, breaking, or unchanged.
- **AC-23 Evidence:** Each reported difference cites one or both selected releases.
- **AC-24 Isolation:** A comparison uses only the two selected releases.
- **AC-25 Summary:** Each change includes old/new state, affected components, related work, test impact, breaking status, and evidence.
- **AC-26 Entities:** Supported product entities are extracted with typed identities.
- **AC-27 Relationships:** Supported relationships are extracted using the approved ontology.
- **AC-28 Versioning:** Changed entities retain connected release-specific versions.
- **AC-29 Confidence:** Extracted facts have confidence and evidence; low-confidence facts follow review/exclusion policy.
- **AC-30 Traversal:** Users can view direct and indirect dependencies within one release.
- **AC-31 Impact:** Changes identify potentially affected services, APIs, data, features, tests, deployments, and docs.
- **AC-32 Explanation:** Impact results show the relationship path and evidence.

## Retrieval, security, and AI safety

- **AC-33 Hybrid search:** Exact, semantic, metadata, release, entity, and source-type search work together.
- **AC-34 Filters:** Product, release, repository, entity, artifact, source, date, author, and environment filters are supported.
- **AC-35 Quality:** Recall@10 >= 85%, NDCG@10 >= 80%, citation precision >= 95%, and release-filter accuracy >= 99% on the approved set.
- **AC-36 Authentication:** Users authenticate with the approved enterprise identity provider.
- **AC-37 ACL propagation:** Unauthorized artifacts never enter search results, answers, citations, or model context.
- **AC-38 Isolation:** Tenant/product data cannot leak through data, caches, logs, analytics, or model context.
- **AC-39 Encryption:** Sensitive data is encrypted in transit, at rest, and in backup.
- **AC-40 Secrets:** Passwords, keys, tokens, connection strings, and secret configuration are excluded or redacted.
- **AC-41 Tool authorization:** Every tool operation validates identity, tenant, product, release, permission, schema, and operation.
- **AC-42 Audit:** Authentication, queries, evidence access, agent/tool runs, connector changes, publication, and administration are recorded.
- **AC-43 Prompt injection:** Retrieved instructions cannot override policy, authorization, release filters, or tool constraints.
- **AC-44 Claim validation:** Material claims are verified against cited evidence before display.
- **AC-45 Citation validation:** Every citation exists, is authorized, matches the release, supports the claim, and has a valid locator.
- **AC-46 Leakage:** Cross-release leakage is below 0.5%; any critical leakage blocks production.

## Performance, reliability, administration, and UX

- **AC-47 Latency:** Search p95 <= 2s, standard Q&A p95 <= 5s, comparison p95 <= 10s under agreed normal load.
- **AC-48 Concurrency:** Agreed concurrent load meets latency and error-rate objectives.
- **AC-49 Efficiency:** For changes touching <10% of a repository, at least 70% of unchanged artifacts avoid reprocessing.
- **AC-50 Scaling:** API and worker tiers scale horizontally without application redesign.
- **AC-51 Idempotency:** Event replay creates no duplicate artifacts, chunks, facts, or snapshots.
- **AC-52 Retry:** Transient failures use bounded exponential backoff.
- **AC-53 Dead letter:** Exhausted jobs retain source event, stage, reason, attempts, and manual retry action.
- **AC-54 Partial failure:** Required index, graph, or validation failure blocks publication.
- **AC-55 Recovery:** Indexes and graphs rebuild from immutable artifacts, manifests, metadata, and events.
- **AC-56 Connector dashboard:** Status, last sync, lag, auth failures, counts, and processing failures are visible.
- **AC-57 Release dashboard:** Snapshot state, completeness, indexing, validation, failures, and publication history are visible.
- **AC-58 Quality dashboard:** Grounding, faithfulness, hallucination, citations, retrieval, leakage, and feedback are visible.
- **AC-59 Operations dashboard:** Latency, errors, queues, throughput, models, tokens, and cost are visible.
- **AC-60 Alerts:** Connector, backlog, validation, leakage, access, outage, cost, and latency alerts route correctly.
- **AC-61 Release visibility:** Selected product and release remain visible.
- **AC-62 Release pinning:** Conversation scope changes only through explicit user action.
- **AC-63 Comparison UX:** Previous/new, added/removed, and breaking changes are visually distinct.
- **AC-64 Feedback:** Users can rate and label incorrect, outdated, wrong-release, missing-citation, incomplete, or unauthorized answers.

## MVP acceptance

MVP requires Git plus one work-management and one documentation connector; two immutable historical snapshots; release-specific cited Q&A; two-release comparison; one requirement-to-code-test-release lineage; incremental processing; source ACL enforcement; operational/audit telemetry; and all approved retrieval, grounding, leakage, security, and latency gates.

## Definition of done

A capability is done only when functional, unit, integration, security, release-isolation, ACL, and AI evaluation tests pass; logs/metrics/traces/alerts exist; API/architecture docs and runbooks are updated; migrations and rollback are tested; and product, security, QA, and operations approvals are recorded where required.

