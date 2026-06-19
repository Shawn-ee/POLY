# Admin Auth Test Implementation Scope

Task id: DOC-051

Phase: Phase F/G - Admin/security review preparation

Assigned subagents: SecurityAgent, TestingAgent, BackendAgent

Risk level: High by auth/admin topic, docs-only in this task

## Purpose

This document scopes a future first admin auth test implementation PR.

It does not add tests, change admin auth, change middleware, change admin routes, change product code, change Prisma, deploy, or alter runtime behavior.

## Source Documents

- `docs/reviews/ADMIN_AUTH_TEST_MATRIX.md`
- `docs/reviews/API_ROUTE_OWNERSHIP_INVENTORY.md`
- `docs/reviews/BROAD_TEST_SUITE_STABILIZATION_PLAN.md`
- `docs/HIGH_RISK_AREAS.md`

## First Implementation Goal

The first admin auth test PR should verify read-only access boundaries without executing admin mutations.

Target checks:

- signed-out user receives expected unauthorized response
- signed-in non-admin user receives expected forbidden response
- admin user can access selected read-only admin route responses
- no route response exposes secret-like fields in the tested fixtures

## Candidate First Route Set

Prefer read-only or status routes:

- `/api/admin/system`
- `/api/admin/market-ops-stats`
- `/api/admin/agents/status`
- `/api/admin/agents/activity`
- `/api/admin/markets` read path if it can be mocked safely

Avoid finance and bot mutation routes in the first PR.

## Forbidden First PR Scope

Do not include:

- deposit rescan
- withdrawal complete/reject
- market resolve/cancel/pause/close mutations
- reference market import/seed-bot/refresh-snapshot mutations
- bot create/update/live controls
- agent file/log reads that could expose sensitive data unless separately reviewed
- middleware or auth implementation changes
- admin route behavior changes
- Prisma schema or migrations
- package/workflow/script changes
- production credentials or production data

## Mocking Requirements

Future tests should:

- mock session/auth helpers
- mock admin requirement helpers
- mock Prisma or service reads
- use local fixture data only
- avoid production DB and real credentials
- avoid reading `.env` contents

If a route cannot be mocked without importing broad runtime dependencies, write a follow-up docs note instead of forcing implementation.

## Validation Required For Future Test PR

```bash
git diff --check
npx jest --runInBand --detectOpenHandles <new-admin-auth-test-file>
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
git diff --cached --check
```

## Auto-Merge Boundary

Do not auto-merge the first admin auth test implementation by default.

Reason:

- Admin auth is high-risk by topic.
- Tests may encode route/auth behavior that needs SecurityAgent review.
- Some admin routes may expose operational details that require no-leak review.

The PR may be opened after validation, but it should remain open for SecurityAgent and human/specialist review.

## Review Requirements

Required reviewers:

- SecurityAgent
- TestingAgent
- BackendAgent if route mocks/read contracts are involved
- LedgerWalletReviewerAgent if finance admin routes are included
- BotAgent if bot/reference routes are included
- DeploymentAgent if system/deployment config routes are included

## Acceptance Criteria

A future first implementation PR is acceptable when:

- it is test-only
- tests are mocked/local
- no admin mutation route is executed
- no production data or secrets are required
- validation passes
- PR body explains auth states tested
- PR remains open for review unless a later explicit policy allows merge

## Non-Goals

This scope does not:

- implement tests
- change admin auth
- change middleware
- change admin route behavior
- change wallet, deposit, withdrawal, ledger, matching, settlement, trading, bot, Prisma, migrations, package scripts, workflows, deployment, secrets, or production behavior
