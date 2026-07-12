# Contributing

## Working agreement

- Keep changes scoped and link them to a requirement, acceptance criterion, issue, or ADR.
- Preserve release, tenant, authorization, provenance, and immutability invariants.
- Add tests at the lowest useful layer and an end-to-end/evaluation case for changed user behavior.
- Do not commit credentials, source evidence, customer data, generated model payloads, or production exports.
- Update documentation and runbooks in the same change as behavior.

## Pull request checklist

- Purpose, user impact, risks, and rollback are described.
- API/event/schema changes are compatible or include migration/versioning.
- Authorization and data classification are reviewed.
- Unit, integration, isolation, evaluation, and relevant load tests pass.
- Logs, metrics, traces, alerts, and cost impact are addressed.
- Generated artifacts are reproducible and dependency changes are justified.
- Material architectural decisions include an ADR.

## Documentation style

- Use concise Markdown, descriptive headings, relative links, and runnable examples.
- Distinguish implemented behavior from proposed design.
- Use normative **must** only for requirements; use **should** for recommendations.
- Define acronyms and avoid unstated vendor assumptions.
- Never paste secret values or sensitive source content into docs.
- Validate links and Mermaid diagrams in CI.

## Commit guidance

Prefer small, reviewable commits with imperative summaries. Avoid mixing formatting-only edits with behavior. Do not rewrite another contributor’s changes without coordination.

## Review ownership

Product reviews requirements and UX; architecture reviews boundaries and ADRs; security reviews data/access/model changes; data/source owners review connectors and authority; QA reviews evidence and gates; SRE reviews deployment, observability, failure modes, and recovery.

