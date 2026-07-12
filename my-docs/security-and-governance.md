# Security and governance

## Threat model summary

Key risks are cross-tenant or cross-release leakage, stale source permissions, prompt injection in retrieved artifacts, malicious connectors, secret ingestion, over-privileged tools, model-provider exposure, citation spoofing, and snapshot tampering.

## Identity and authorization

- Authenticate users through enterprise OIDC/SAML federation with MFA policy inherited from the IdP.
- Use workload identity and short-lived tokens for services.
- Evaluate RBAC plus ABAC using tenant, product, release, source, classification, purpose, and group claims.
- Propagate source ACLs to artifact versions, chunks, graph facts, caches, and citations.
- Recheck authorization when opening a citation; do not rely solely on ingestion-time permission.
- Fail closed when ACL state is missing, stale beyond policy, or the policy service is unavailable.

## Isolation

Tenant and product identifiers are mandatory partition keys in metadata, cache, search, graph, analytics, logs, and model context. Release ID and snapshot revision are mandatory retrieval constraints. Automated tests seed canary records to detect leakage.

Example retrieval predicate:

```sql
WHERE tenant_id = :tenant
  AND product_id = :product
  AND release_id = :release
  AND snapshot_revision_id = :snapshot
  AND acl_tags && :authorized_tags
```

## AI safety controls

- Retrieved text is delimited as untrusted evidence and cannot override system policy.
- Only allowlisted, typed tools are exposed to workflows.
- Tool authorization validates actor, tenant, product, release, operation, and input schema.
- Model output cannot widen retrieval filters or construct direct datastore queries.
- Material claims must map to citations; citations must exist, be authorized, match the release, and support the claim.
- Low-evidence responses use an explicit insufficient-evidence path.
- Provider requests minimize data, use approved regions/retention, and omit secrets and unnecessary identity data.

## Secrets and sensitive data

- Store connector credentials only in an approved secret manager.
- Scan before persistence/embedding and quarantine or redact secret-like values.
- Never log prompts, evidence, tokens, or response text by default; use governed sampling with redaction.
- Classify source data and enforce retention, residency, export, and model-routing policy by classification.
- Do not ingest raw customer production data without an approved use case and data-protection assessment.

## Encryption and integrity

- TLS 1.2+ in transit and managed encryption keys at rest and in backup.
- Rotate keys and credentials according to enterprise policy.
- Content hashes identify artifact versions; manifest hashes and optional signatures protect snapshot integrity.
- Object retention/versioning prevents silent mutation of published evidence.

## Audit events

Record authentication, authorization decisions, queries, release selection, evidence access, connector changes, ingestion runs, tool calls, snapshot approvals/publications, policy changes, exports, and administrative actions. Events include actor, tenant, resource, action, outcome, timestamp, correlation/trace ID, and policy version; sensitive payloads are excluded.

## Governance roles

| Role | Responsibility |
| --- | --- |
| Data/source owner | Approves connector scope and evidence authority. |
| Product owner | Defines release requirements and publication readiness. |
| Security owner | Approves classification, model use, threats, and access policy. |
| Snapshot publisher | Approves an immutable release snapshot; cannot alter evidence. |
| Auditor | Reviews manifests, access, provenance, and change history. |
| Platform operator | Operates services without routine access to source content. |

## Security release gates

- SAST, dependency, container, IaC, and secret scans pass approved thresholds.
- Tenant/product/release/ACL isolation tests pass with zero critical leakage.
- Prompt-injection and tool-abuse suites pass.
- Citation authorization and open-time revalidation pass.
- Threat model, data flow, incident runbook, recovery test, and audit review are current.

