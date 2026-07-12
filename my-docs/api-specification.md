# API specification

## Conventions

- Base path: `/api/v1`.
- JSON request and response bodies; UTF-8.
- OAuth 2.0/OIDC bearer tokens for users; workload identity for services.
- `X-Correlation-Id` is accepted and returned.
- Mutating retryable requests accept `Idempotency-Key`.
- Cursor pagination uses `page_size` and `cursor`.
- Timestamps use RFC 3339 UTC.
- IDs are opaque strings. APIs never expose credential material.

## Products and releases

```http
GET /api/v1/products
GET /api/v1/products/{productId}/releases?status=published
GET /api/v1/releases/{releaseId}/manifest?revision=latest
```

Release responses include snapshot revision, publication status, tag, commit SHA, manifest hash, completeness result, and authorized source counts.

## Query

```http
POST /api/v1/chat/query
Content-Type: application/json

{
  "product_id": "payments",
  "release_id": "2.5",
  "conversation_id": "optional",
  "question": "How is a refund authorized?",
  "filters": {"artifact_types": ["CODE", "OPENAPI", "REQUIREMENT"]},
  "stream": true
}
```

Non-streaming response:

```json
{
  "message_id": "msg-123",
  "product_id": "payments",
  "release_id": "2.5",
  "snapshot_revision": 1,
  "answer": "...",
  "evidence_strength": "high",
  "citations": [
    {
      "citation_id": "cit-1",
      "artifact_type": "CODE",
      "source_uri": "https://source.example/...",
      "path": "src/RefundAuthorizer.java",
      "locator": {"start_line": 28, "end_line": 41},
      "authorized_proxy_uri": "/api/v1/citations/cit-1/open"
    }
  ],
  "trace_id": "trace-123"
}
```

Release is mandatory unless the product has an explicitly configured approved default; the resolved release is always returned. A conversation remains pinned until an authorized user explicitly changes it.

## Comparison and traceability

```http
POST /api/v1/releases/compare
GET  /api/v1/features/{featureId}/lineage?product_id=payments&release_id=3.0
POST /api/v1/impact-analysis
```

Comparison body:

```json
{
  "product_id": "payments",
  "from_release_id": "2.5",
  "to_release_id": "3.0",
  "scope": {"entity_types": ["API", "BUSINESS_RULE", "SCHEMA"]}
}
```

Impact body identifies one immutable artifact version, entity, or proposed diff and a release. Results include affected items, relationship paths, confidence, and evidence.

## Ingestion and administration

```http
POST /api/v1/admin/connectors
POST /api/v1/admin/connectors/{id}/test
POST /api/v1/admin/connectors/{id}/sync
GET  /api/v1/admin/ingestion-runs/{runId}
POST /api/v1/admin/jobs/{jobId}/retry
POST /api/v1/admin/releases/{releaseId}/build
POST /api/v1/admin/snapshots/{snapshotId}/publish
POST /api/v1/admin/snapshots/{snapshotId}/reject
```

Administrative operations require explicit scopes, reason capture where appropriate, idempotency, and audit logging. Credentials are supplied by secret-manager references, not API values returned to clients.

## Feedback

```http
POST /api/v1/messages/{messageId}/feedback

{
  "rating": -1,
  "reasons": ["WRONG_RELEASE", "MISSING_CITATION"],
  "comment": "Optional governed text"
}
```

## Standard errors

```json
{
  "error": {
    "code": "RELEASE_NOT_RESOLVED",
    "message": "A published release is required.",
    "correlation_id": "...",
    "details": []
  }
}
```

| Status | Example code |
| --- | --- |
| 400 | `INVALID_REQUEST`, `RELEASE_NOT_RESOLVED` |
| 401 | `AUTHENTICATION_REQUIRED` |
| 403 | `SOURCE_ACCESS_DENIED`, `ADMIN_SCOPE_REQUIRED` |
| 404 | `PRODUCT_NOT_FOUND`, `SNAPSHOT_NOT_FOUND` |
| 409 | `SNAPSHOT_IMMUTABLE`, `IDEMPOTENCY_CONFLICT` |
| 422 | `SNAPSHOT_VALIDATION_FAILED` |
| 429 | `RATE_LIMITED` |
| 503 | `DEPENDENCY_UNAVAILABLE`, `MODEL_UNAVAILABLE` |

Errors do not reveal whether an unauthorized source resource exists.

