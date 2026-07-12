# Test strategy

## Test layers

| Layer | Coverage |
| --- | --- |
| Unit | Parsers, hashes, release resolution, authorization predicates, schemas, diffs, citation locators. |
| Contract | Connector APIs, event schemas, model gateway, search/graph adapters, identity claims. |
| Integration | Fetch-to-index, ACL propagation, graph writes, retries/DLQ, snapshot construction. |
| End to end | Release-pinned Q&A, comparison, lineage, feedback, administration, citation opening. |
| Security | Tenant/product/ACL isolation, prompt injection, tool abuse, secrets, SSRF, audit integrity. |
| Resilience | Dependency failure, replay, partial writes, back-pressure, restore, regional recovery. |
| Performance | Search, Q&A, comparison, ingestion throughput, concurrency, and large release publication. |
| AI evaluation | Retrieval, grounding, faithfulness, citations, abstention, and release leakage. |

## Evaluation dataset

Use representative public-safe or approved internal products with at least two materially different releases. The set includes answerable questions, intentionally unanswerable questions, ambiguous product/release phrases, change comparisons, multi-hop lineage, ACL-restricted facts, conflicting sources, malicious instructions, and facts introduced only in later releases.

Each case stores product/release, question, expected claims, acceptable evidence IDs, prohibited evidence IDs, expected abstention, user ACL persona, and scoring rubric. Dataset changes are reviewed and versioned.

## Metrics and gates

| Metric | Gate |
| --- | ---: |
| Recall@10 | >= 85% |
| NDCG@10 | >= 80% |
| Citation precision | >= 95% |
| Grounded-answer rate | >= 90% |
| Release-filter accuracy | >= 99% |
| Cross-release leakage | < 0.5%, zero critical cases |
| Standard query p95 | <= 5 seconds |
| Comparison p95 | <= 10 seconds |

Report confidence intervals and slice results by product, release, artifact type, query type, language, and ACL persona. Averages cannot mask a critical security or leakage failure.

## Required adversarial suites

- Retrieved files that say “ignore previous instructions.”
- Citations pointing to a different release, tenant, or unauthorized source.
- Homonymous services across products.
- Deleted/revoked source access after ingestion.
- Malformed and oversized documents, zip bombs, parser exploits, and poisoned metadata.
- Tool parameters containing injection, path traversal, SSRF, or unexpected fields.
- A release missing required artifacts or containing a later commit.
- Model timeout, malformed structured output, and provider fallback.

## Snapshot certification

Before publication, verify manifest hash, tag/SHA resolution, required source coverage, completed jobs, zero critical parse/index errors, search/graph referential integrity, ACL presence, release-isolation canaries, citation locators, and signature policy. Preserve results with the snapshot revision.

## Test evidence

CI publishes machine-readable results, coverage, evaluation version, model/prompt/parser versions, load profile, security scan reports, and release decision. Failures link to owner and remediation; waivers require risk owner, expiry, and compensating controls.

