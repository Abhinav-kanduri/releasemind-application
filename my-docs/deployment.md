# Deployment

## Environment model

Use isolated development, test, staging, and production environments with separate identity registrations, secrets, encryption keys, object buckets, databases, indexes, graphs, queues, model endpoints, and telemetry destinations. Production data is not copied to lower environments unless approved and sanitized.

## Runtime topology

Separate two workload groups:

- **Online:** API gateway, web UI, authentication, conversation, release resolver, retrieval, graph query, model gateway, validation, cache.
- **Processing:** webhook gateway, connectors, fetchers, parsers, extractors, embedding workers, index/graph writers, snapshot builders, reconciliation.

Stateless services deploy across at least two failure domains. Durable stores use managed high availability where available. Queue-based back-pressure prevents ingestion from degrading online queries.

## Configuration contract

Configuration is environment-driven and validated at startup. Expected categories:

```text
DATABASE_URL, OBJECT_STORE_*, EVENT_BUS_*, SEARCH_*, GRAPH_*, REDIS_*
OIDC_ISSUER, OIDC_AUDIENCE, POLICY_ENDPOINT
MODEL_GATEWAY_ENDPOINT, APPROVED_MODEL_POLICY
OTEL_EXPORTER_*, LOG_LEVEL
TENANT_POLICY_SOURCE, ENCRYPTION_KEY_REFERENCE
```

Actual secret values live in a secret manager. Do not commit `.env` files. Provide a safe `.env.example` when implementation begins.

## CI/CD pipeline

1. Validate formatting, schemas, generated clients, migrations, and docs links.
2. Run unit, contract, integration, and deterministic evaluation smoke tests.
3. Run SAST, dependency, secret, container, and IaC scans.
4. Build immutable images and create SBOM/provenance attestations.
5. Deploy to test; run E2E, isolation, prompt-injection, and migration tests.
6. Deploy to staging; run full evaluation, load, resilience, and restore tests.
7. Require approvals for production; deploy progressively with automatic rollback signals.
8. Record deployment, configuration, schema, prompt, model, and evaluation versions.

## Database and index changes

Use expand/migrate/contract migrations. Services remain compatible with the previous schema during rolling deployment. New indexes build out of band and switch by atomic alias. Snapshot segments are never overwritten. Graph migrations are replayable from immutable artifacts.

## Release and rollback

- Prefer canary or blue/green release for online services.
- Worker rollouts pause or drain leases safely.
- Roll back application versions automatically on SLO or security gate breach.
- Never roll back by mutating published knowledge; switch to the prior snapshot alias/revision.
- Forward-fix data migrations unless a tested reversible migration exists.

## Backup and disaster recovery

Back up PostgreSQL, object metadata/content, graph metadata if not reproducible within RTO, configuration, policy, and audit data. Search and graph derived data must be rebuildable. Define and approve RPO/RTO per store, test restore at least quarterly, and document recovery evidence.

## Production readiness checklist

- Capacity/load test and dependency quotas approved.
- Dashboards, alerts, on-call routing, runbooks, and status communications tested.
- Backups restored successfully and regional failure procedure exercised.
- Security review, threat model, privacy assessment, and access recertification complete.
- Evaluation gates pass on production model, prompt, parser, and index versions.
- Cost budgets and kill switches configured.

