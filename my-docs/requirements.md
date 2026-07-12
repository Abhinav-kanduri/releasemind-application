# Requirements

## Functional requirements

### Product and release management

- **FR-01:** Administrators can create products and map repositories, projects, spaces, pipelines, environments, and release conventions.
- **FR-02:** The platform detects Git tags, CI/CD release events, manifests, and approved manual publication requests.
- **FR-03:** Every published release has an immutable manifest and one or more auditable snapshot revisions.
- **FR-04:** Users can browse retained releases and pin a release for a conversation.

### Ingestion

- **FR-05:** Administrators can configure, authenticate, test, enable, disable, and monitor connectors.
- **FR-06:** The platform supports initial full ingestion, event-driven incremental ingestion, and scheduled reconciliation.
- **FR-07:** Content hashing and idempotency prevent duplicated artifacts, chunks, graph facts, and jobs.
- **FR-08:** Change detection and dependency analysis limit regeneration to changed and impacted knowledge.
- **FR-09:** Failures use bounded retry, dead-letter handling, diagnostics, and manual replay.
- **FR-10:** Every derived item retains source version, provenance, ACL, release, and processing metadata.

### Query and discovery

- **FR-11:** Every product query resolves an explicit product and release before retrieval.
- **FR-12:** Users can ask about architecture, components, APIs, rules, schemas, features, tests, deployments, configurations, and decisions.
- **FR-13:** Search combines metadata filters, lexical retrieval, vector retrieval, graph expansion, reranking, deduplication, and compression.
- **FR-14:** Every material claim includes authorized supporting evidence or the response states that evidence is insufficient.
- **FR-15:** Users can filter by release, repository, entity, source, artifact type, date, author, and environment.

### Comparison and traceability

- **FR-16:** Users can compare two releases without retrieving evidence from other releases.
- **FR-17:** Changes are classified as added, modified, removed, deprecated, breaking, or unchanged.
- **FR-18:** Users can explore canonical entities, release-specific versions, dependencies, and impact paths.
- **FR-19:** Feature lineage can connect requirement, decision, PR, commit, component, test, build, deployment, and release.

### Administration

- **FR-20:** Administrators can review connector health, job state, snapshot readiness, validation results, and failures.
- **FR-21:** Authorized publishers can approve or reject snapshot publication.
- **FR-22:** Users can rate answers and label wrong release, missing citation, incomplete, incorrect, outdated, or unauthorized content.
- **FR-23:** The platform exposes quality, usage, latency, reliability, model, token, and cost telemetry.

## Non-functional requirements

### Security and privacy

- **NFR-01:** Enterprise SSO is required; service identities use short-lived credentials.
- **NFR-02:** Tenant, product, release, and source ACL checks occur before content enters retrieval or model context.
- **NFR-03:** Data is encrypted in transit, at rest, and in backups.
- **NFR-04:** Secrets are detected, excluded or redacted, and never embedded.
- **NFR-05:** Security-sensitive actions and all evidence access are auditable.

### Reliability and recovery

- **NFR-06:** Ingestion is at-least-once with idempotent consumers.
- **NFR-07:** Snapshot publication is atomic and fails closed.
- **NFR-08:** Search and graph views can be rebuilt from immutable artifacts, manifests, metadata, and replayable events.
- **NFR-09:** Backups and recovery procedures meet approved RPO and RTO.

### Performance and scale

- **NFR-10:** Standard Q&A p95 is <= 5 seconds, comparison p95 <= 10 seconds, and search p95 <= 2 seconds under agreed load.
- **NFR-11:** Stateless APIs and worker pools scale horizontally.
- **NFR-12:** Online queries are isolated from batch ingestion workloads.
- **NFR-13:** Indexes partition by tenant, product, and release family where scale requires it.

### Quality and maintainability

- **NFR-14:** Retrieval, generation, citation, leakage, security, and latency evaluation gates run before production promotion.
- **NFR-15:** Connector, schema, ontology, prompt, and model versions are explicit and backward-compatible or migratable.
- **NFR-16:** Model providers are accessed through a provider-independent gateway.
- **NFR-17:** Infrastructure and policy are version controlled.

## Constraints

- The retrieval layer—not the model—enforces release and authorization scope.
- Published snapshots are never updated in place.
- Generated summaries cannot become sole evidence for product claims.
- Missing relationships are displayed as missing and are not fabricated.
- Write-capable tools require separate explicit authorization and are disabled by default.

See [acceptance criteria](acceptance-criteria.md) for the testable contract.

