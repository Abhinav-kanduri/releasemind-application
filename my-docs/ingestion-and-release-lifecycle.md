# Ingestion and release lifecycle

## Initial ingestion

1. Administrator creates a connector with allowlisted scope and credentials reference.
2. A connection test validates authentication, permissions, rate limits, and source capabilities.
3. Discovery lists authorized immutable artifact versions.
4. Fetchers preserve raw content and metadata in object storage.
5. Secret/PII policy scans content before downstream processing.
6. Type-specific parsers create normalized structural documents.
7. Extractors produce chunks, entities, relationships, assertions, and evidence locations.
8. Schema, ACL, provenance, and quality validators reject invalid records.
9. Index and graph writers publish derived records idempotently.
10. The run reports discovered, processed, skipped, failed, duration, and failure reasons.

## Incremental ingestion

```text
source event -> signature verification -> durable event + idempotency key
             -> immutable fetch -> SHA-256 comparison
             -> semantic diff -> dependency impact set
             -> reparse/re-extract only affected units
             -> validate -> atomic index/graph update
```

Duplicate source revision plus content hash is a no-op. Consumers use deterministic keys. Transient failures use bounded exponential backoff with jitter; exhausted events move to a dead-letter queue. Scheduled reconciliation detects missed events and drift.

## Release snapshot publication

1. Resolve release tag to exact commit SHA.
2. Resolve CI build, artifact, deployment, requirement fix version, tests, documentation, and configurations.
3. Construct a manifest whose entries reference immutable artifact versions and hashes.
4. Materialize or alias release-specific search and graph views.
5. Validate required repositories, jobs, indexing, ACL metadata, evidence locations, and absence of later-release knowledge.
6. Calculate manifest hash and record publisher identity, policy versions, schema versions, and timestamps.
7. Publish metadata and aliases atomically.
8. Sign the manifest where required. A failed validation leaves the release unpublished.

Published snapshots are immutable. A correction creates revision `N+1`, links it to the superseded revision, records the reason and approver, and preserves revision `N` for audit.

## Query lifecycle

1. Authenticate and derive tenant, groups, attributes, and policy context.
2. Resolve product and release to a published snapshot; reject ambiguity.
3. Classify intent and decompose the query when necessary.
4. Apply tenant, product, release, and ACL filters before all searches.
5. Run lexical, semantic, and graph retrieval; rerank and deduplicate.
6. Build a bounded context containing evidence text, location, provenance, release, authority, and confidence.
7. Generate using a model gateway and an explicit evidence-only instruction.
8. Validate each material claim, citation existence, release match, authorization, and source location.
9. Remove unsupported claims or return insufficient evidence.
10. Stream the response and record privacy-safe trace, metrics, cost, and feedback linkage.

## Comparison lifecycle

The platform creates two separately authorized evidence sets, one for each release. A deterministic diff identifies entity and artifact changes. The model may explain those changes, but it cannot introduce a third release or unsupported cause. Each change records previous state, new state, classification, affected components, test impact, breaking status, and citations.

## Idempotency keys

| Operation | Suggested key |
| --- | --- |
| Source event | connector ID + source delivery ID |
| Artifact version | source system + artifact ID + immutable revision + content hash |
| Chunk | artifact-version ID + parser version + structural locator |
| Extraction | chunk ID + extraction schema/prompt/model version |
| Snapshot | product ID + release ID + manifest hash |

## State models

```text
Ingestion: queued -> fetching -> parsing -> extracting -> indexing -> validating -> succeeded
                                      \-> retrying -> dead_letter
Snapshot: draft -> building -> validating -> awaiting_approval -> published
                                     \-> rejected | failed
```

