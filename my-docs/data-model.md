# Data model

## Relational metadata

Core tables and key fields:

| Table | Key fields |
| --- | --- |
| `tenants` | `id`, `name`, `status`, `policy_version` |
| `users` / `groups` | external identity IDs and tenant membership |
| `products` | `id`, `tenant_id`, `name`, `default_release_policy` |
| `connectors` | source type, scope, credentials reference, status, last sync |
| `repositories` | product, connector, source ID, default branch |
| `releases` | product, version, tag, commit SHA, lifecycle status |
| `snapshot_revisions` | release, revision, manifest URI/hash, status, publisher |
| `artifacts` | stable source identity and type |
| `artifact_versions` | revision, hash, URI, author, timestamps, classification |
| `release_artifacts` | snapshot revision to artifact-version membership |
| `ingestion_runs` / `jobs` | state, counts, attempts, timings, error codes |
| `acl_bindings` | resource, subject/attribute, permission, source revision |
| `conversations` / `messages` | tenant, user, product, pinned release, response metadata |
| `citations` | message claim, artifact version, locator, release, validation status |
| `feedback` | rating, reason, comment, evaluation linkage |
| `audit_events` | actor, action, resource, outcome, policy context, timestamp |

All tenant-owned primary and unique indexes begin with `tenant_id`. Common indexes include `(tenant_id, product_id, release_id)`, artifact content hash, source revision, job status/next-attempt, and audit timestamp.

## Canonical and versioned entities

```text
CanonicalEntity: PaymentService
  |- EntityVersion: PaymentService@2.5
  |- EntityVersion: PaymentService@3.0
```

Canonical identity enables history and comparison; version nodes preserve release-specific attributes and relationships. Every fact includes evidence, confidence, and temporal scope.

## Graph ontology

Entity types include Product, Release, Repository, Service, Module, Component, Class, Function, API, Endpoint, Event, Queue, Database, Table, Column, Rule, Feature, Journey, Requirement, Defect, Test, Deployment, Environment, Configuration, ADR, and Integration.

Representative relationships:

```text
SERVICE CONTAINS MODULE
MODULE DEFINES API
SERVICE READS TABLE
SERVICE PUBLISHES EVENT
SERVICE DEPENDS_ON SERVICE
FEATURE IMPLEMENTED_BY COMPONENT
REQUIREMENT DELIVERED_IN RELEASE
TEST VALIDATES FEATURE
COMMIT MODIFIES ENTITY
PULL_REQUEST RESOLVES DEFECT
ADR JUSTIFIES ARCHITECTURE_CHANGE
RELEASE INCLUDES ARTIFACT_VERSION
```

Relationships are allowlisted and schema validated. Unknown types are quarantined for ontology review.

## Temporal model

Each versioned entity/fact carries:

```yaml
valid_from_release: release-id
valid_to_release: release-id|null
observed_at: datetime
superseded_at: datetime|null
source_artifact_version_id: uuid
snapshot_revision_id: uuid
confidence: 0.0-1.0
extraction_version: string
```

Valid time describes when the fact was true in the product. System time describes when ReleaseLens learned or corrected it. Published snapshot queries bind to snapshot revision and do not infer current truth.

## Search chunk schema

```json
{
  "tenant_id": "t-1",
  "product_id": "payments",
  "release_id": "2.5",
  "snapshot_revision_id": "sr-123",
  "artifact_version_id": "av-456",
  "entity_id": "endpoint-refund",
  "artifact_type": "OPENAPI_OPERATION",
  "content": "...",
  "source_uri": "...",
  "path": "openapi/payments.yaml",
  "locator": {"start_line": 120, "end_line": 155},
  "commit_sha": "...",
  "acl_tags": ["team:payments"],
  "content_hash": "sha256:...",
  "authority": 1,
  "embedding_version": "..."
}
```

Fixed-size splitting is only a fallback. Preferred chunks follow code symbols, API operations, migrations, tests, acceptance criteria, document sections, and pipeline stages.

## Retention and deletion

- Raw artifacts, manifests, derived records, and audit logs have separately configurable policies.
- Legal hold overrides normal expiry.
- Source deletion removes user access promptly and schedules governed deletion where policy permits.
- Immutable snapshot audit metadata may retain hashes and provenance after content removal, without retaining prohibited content.

