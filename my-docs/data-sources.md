# Data sources

## Priority tiers

| Tier | Sources | Purpose |
| --- | --- | --- |
| MVP | Git, Jira/Rally, Confluence/SharePoint, release tags, CI/CD, tests, OpenAPI, DB migrations, release notes, ADRs | Establish release snapshots, Q&A, comparison, and traceability. |
| Next | Artifact registries, infrastructure code, service catalogs, test management, security scans | Improve deployment, dependency, quality, and risk context. |
| Later | Observability, incidents, support, design, analytics, approved collaboration systems | Add runtime, customer, and decision context. |

## Source catalog

1. **Source control:** GitHub, GitLab, Bitbucket, Azure Repos; repositories, branches, tags, commits, PRs, reviews, CODEOWNERS, submodules, README files.
2. **Requirements/work:** Jira, Rally, Azure Boards, GitHub/GitLab Issues, ServiceNow Agile; epics, stories, defects, acceptance criteria, milestones, fix versions.
3. **Documentation:** Confluence, SharePoint, Notion, Drive/OneDrive, internal portals; requirements, designs, ADRs, runbooks, manuals, release notes.
4. **API/integration:** OpenAPI, Postman, GraphQL, AsyncAPI, protobuf, WSDL, gateway policy, event schemas, webhooks, OAuth scopes.
5. **Database/data model:** DDL, Flyway/Liquibase, ORM models, ERDs, procedures, views, dictionaries, schema registries, approved lineage.
6. **Test/quality:** Unit, integration, E2E, regression, performance and security tests; TestRail, Zephyr, Xray, coverage, SonarQube, execution reports.
7. **CI/CD/release:** GitHub Actions, Jenkins, GitLab CI, Azure Pipelines, Argo CD and peers; workflows, builds, approvals, deployment and rollback history.
8. **Artifacts/packages:** Artifactory, Nexus, package/container registries; binaries, images, manifests, checksums, provenance, and SBOMs.
9. **Infrastructure/configuration:** Terraform, CloudFormation, Bicep, Pulumi, Kubernetes, Helm, Docker, Ansible; approved configuration and feature-flag metadata.
10. **Cloud/runtime:** AWS, Azure, GCP, Kubernetes/OpenShift; inventories, deployed versions, regions, dependencies, and scaling metadata.
11. **Observability:** Splunk, Datadog, Dynatrace, New Relic, Prometheus/Grafana, Elastic and cloud monitoring; release-linked summaries, metrics, traces, and alerts.
12. **Incidents/support:** ServiceNow, Jira Service Management, Zendesk, PagerDuty and peers; incidents, RCAs, problems, known errors, and customer defects.
13. **Security/compliance:** SAST, DAST, SCA, secret, container and infrastructure scans; threats, risks, exceptions, evidence, policies, audit reports, SBOMs.
14. **Architecture/dependencies:** C4/UML/data-flow diagrams, Backstage, dependency manifests, service mesh topology, portfolio catalogs.
15. **UX/product experience:** Frontend code, design systems, Storybook, Figma, flows, accessibility, localization, usage analytics, and UI tests.
16. **Collaboration:** Teams, Slack, email, meeting notes, and decision logs, when explicitly governed. These are secondary evidence by default.

## Required artifact envelope

Every ingested artifact version must include:

```yaml
tenant_id: string
product_id: string
source_system: string
source_artifact_id: string
artifact_type: string
immutable_revision: string
content_hash: sha256
source_uri: string
repository_or_project: string
branch_tag_or_version: string|null
commit_sha: string|null
release_candidates: [string]
author: string|null
source_timestamp: datetime
environment: string|null
acl_tags: [string]
classification: string
connector_id: string
processing_status: string
observed_at: datetime
```

## Evidence authority

Authority is configured by claim type. Example precedence:

1. Immutable shipped artifact, signed manifest, code, schema, or deployed configuration.
2. Approved requirement, ADR, release record, test result, or pipeline record.
3. Maintained technical documentation.
4. Ticket discussion, incident notes, or support record.
5. Chat, email, or meeting notes.

Lower-tier evidence may explain intent but must not override contradictory authoritative evidence. Conflicts are surfaced, not silently merged.

## Data-handling rules

- Never ingest secret values, private keys, tokens, credentials, or unrestricted customer data.
- Summarize and release-link production telemetry; do not indiscriminately copy raw logs.
- Preserve source ACLs and classification on all derived chunks and graph facts.
- Honor deletions and legal holds according to policy without rewriting published audit history.
- Connector scopes must be allowlisted and reviewed by source owners.

