# Public Route Smoke Command Scope

Task id: DOC-050

Phase: Phase B/D/G - Public route smoke readiness

Assigned subagents: TestingAgent, SecurityAgent, DeploymentAgent

Risk level: Low for docs-only scoping

## Purpose

This document scopes future public route smoke commands before any package script, workflow, or Playwright implementation is proposed.

It does not add package scripts, change workflows, add tests, run browsers, change UI, deploy, or alter runtime behavior.

## Safe Command Principle

Public route smoke commands must be local-only, read-only, and evidence-oriented.

They may load pages and record non-sensitive results. They must not mutate production state, require production credentials, execute funding/trading/admin/bot actions, or become required CI without a separate human-reviewed package/workflow PR.

## Candidate Manual Commands

Future smoke evidence may use commands like these only after the app is running locally with safe test data:

```bash
git diff --check
npm run test:ci
# Optional future route smoke command, not currently implemented:
# npm run test:public-routes
```

Do not add `test:public-routes` in the same PR as this scope. A package-script PR must remain human-reviewed.

## Candidate Route Set

First route smoke command should prefer anonymous public routes:

- `/`
- `/markets`
- `/events`
- `/sports`
- `/sports/soccer`
- `/sports/soccer/world-cup`
- `/login`

Routes requiring local fixtures or auth should be separate:

- `/markets/[id]`
- `/events/[slug]`
- `/portfolio`
- `/wallet`

## Forbidden Command Behavior

Public route smoke commands must not:

- use production URLs
- use production credentials
- read or print `.env` contents
- use real chain RPC or custody providers
- execute wallet, deposit, withdrawal, faucet, or funding actions
- execute order placement, order cancellation, fills, trades, matching, settlement, or position mutations
- execute admin operations
- start bot live or dry-run runtime actions
- depend on external APIs unless explicitly mocked or disabled
- write screenshots containing secrets, private data, private keys, credentials, or production customer data

## Future Implementation Boundary

A future command implementation PR may be opened only if it clearly states whether it changes:

- `package.json`
- Playwright config
- test files
- scripts
- CI workflows

Auto-merge defaults:

- docs-only plan: may be auto-merged after validation
- test-only local mocked/read-only smoke: review required if package scripts change
- package script changes: not auto-mergeable
- workflow changes: not auto-mergeable
- deployment/system changes: not auto-mergeable

## Required Evidence Output

Future command output should support `docs/reviews/PUBLIC_ROUTE_SMOKE_EVIDENCE_TEMPLATE.md` by recording:

- route
- user state
- pass/fail
- command
- environment
- screenshot/artifact path if any
- no-leak observation
- limitations

The output should summarize results without printing secrets or full HTML dumps that may contain sensitive data.

## Validation For Future Implementation

If future work changes only docs:

```bash
git diff --check
```

If future work changes tests, package scripts, or smoke command code:

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
git diff --cached --check
```

Run the new targeted smoke command only against local safe test data.

## Non-Goals

This scope does not:

- add `test:public-routes`
- add Playwright tests
- change CI
- change package scripts
- start a dev server
- capture screenshots
- deploy
- approve public beta
- alter wallet, deposit, withdrawal, ledger, matching, settlement, trading, admin auth, bot, Prisma, migrations, secrets, or production behavior
