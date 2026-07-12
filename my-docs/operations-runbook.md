# Operations runbook

## Service objectives

Initial objectives are 99.9% platform availability, search p95 <= 2 seconds, standard query p95 <= 5 seconds, comparison p95 <= 10 seconds, ingestion success >= 99.5%, and approved snapshot completion within the agreed release window. Final SLIs and measurement windows require production baselining.

## Dashboards

| Dashboard | Signals |
| --- | --- |
| Online | Request rate/errors/duration, retrieval and model latency, cache hit rate, saturation. |
| Ingestion | Event lag, queue depth, throughput, retries, DLQ, parser/index failure, connector rate limits. |
| Release | Manifest completeness, outstanding jobs, validation failures, index/graph state, publication history. |
| Quality | Retrieval, grounding, citations, abstention, leakage, feedback, model/prompt/parser versions. |
| Security | Denials, stale ACLs, prompt-injection detections, secret quarantines, anomalous evidence access. |
| Cost | Tokens, embeddings, storage, egress, cost/query, cost/release, budgets and anomalies. |

## Alert priorities

- **P1:** confirmed tenant/ACL/release leakage, snapshot integrity compromise, widespread outage, unrecoverable data loss.
- **P2:** severe latency/error SLO breach, publication blocked near release deadline, search/database/identity outage, sustained backlog.
- **P3:** individual connector failure, rising DLQ, quality regression, cost anomaly, stale reconciliation.

## Universal incident procedure

1. Acknowledge, assign commander, record correlation/time/scope.
2. Protect users: disable affected connector/model/workflow, fail closed, or revert alias/deployment.
3. Preserve audit logs, manifests, traces, configuration versions, and evidence hashes.
4. Determine tenant/product/release and whether unauthorized content was exposed.
5. Restore from known-good application/snapshot state; do not mutate published snapshots.
6. Validate security, correctness, and SLOs before reopening.
7. Notify required stakeholders and complete RCA with actions and owners.

## Common procedures

### Connector authentication failure

Confirm secret-manager reference and source status; inspect expiry/scopes without printing credentials; rotate or reauthorize through approved process; test connection; replay only failed idempotent jobs; verify reconciliation and ACL freshness.

### Growing dead-letter queue

Group by connector, error code, parser version, and artifact type. Quarantine malicious/corrupt content. Fix transient configuration or deploy a tested parser correction. Replay a sample, check for duplicates, then drain at a controlled rate.

### Snapshot validation failure

Keep snapshot unpublished. Inspect missing requirements, tag/SHA mismatch, later-release canaries, index/graph referential errors, ACL absence, and citation failures. Repair inputs or pipeline, create a new build attempt, and retain failed validation evidence.

### Suspected cross-release or ACL leakage

Treat as P1. Disable affected query path/model cache, preserve traces, revoke exposed links, scope impacted users and messages, verify filter and cache keys, run isolation suite, notify security/privacy, and only restore after independent validation.

### Model degradation/outage

Activate approved fallback only if classification and residency policy permit. Reduce optional synthesis, serve search/evidence results, or return a transparent unavailable/insufficient-evidence response. Never bypass citation validation.

### Cost spike

Check traffic, retries, prompt/context growth, embedding churn, cache misses, and model routing. Apply rate/budget controls, stop runaway jobs, and verify that mitigation does not weaken security or evidence requirements.

## Maintenance

- Daily: failed jobs, backlog, connector health, SLOs, security events, budgets.
- Weekly: reconciliation drift, DLQ aging, quality slices, capacity, access exceptions.
- Monthly: dependency/model/parser updates, cost review, retention jobs, access recertification samples.
- Quarterly: restore and disaster-recovery exercise, incident game day, threat model and runbook review.

