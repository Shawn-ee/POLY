# Decision 0001: CI Phase 1 Scope

## Status

Accepted for current baseline.

## Context

The full test surface includes Jest smoke tests, DB-backed integration tests, Vitest suites, browser flows, and bot compatibility checks. The broad suites are not currently green as single commands.

## Decision

CI Phase 1 remains focused on:

- install
- Prisma generate
- Prisma validate
- TypeScript
- focused Jest smoke tests

Playwright, Vitest, and broad DB-backed suites are deferred until their isolation issues are fixed.

## Consequences

- PRs to `main` now receive automatic validation.
- CI does not yet prove full launch readiness.
- Follow-up branches must expand coverage incrementally without hiding known failures.
