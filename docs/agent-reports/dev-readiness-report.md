# Dev Readiness Report

Audit branch: `audit/full-platform-verification`

Date: 2026-06-16

## PRs Created From This Audit

None yet.

This audit found blockers that should be split into focused sub-agent branches before merge decisions.

## What Passed

- CI Phase 1 baseline commands pass locally.
- Prisma schema validates.
- All migrations apply to disposable PostgreSQL 16.
- Focused Jest smoke suite passes.
- Public market APIs and market detail UI load with seeded markets.
- Secret pattern scan found no high-confidence secrets.

## What Failed

- Sports pages return 404.
- Sports/event APIs return empty arrays after NBA seed.
- Broad Jest suite fails.
- Ledger Phase 3 Vitest suite has one runner mismatch.
- Full authenticated user/admin browser flows are not verified.

## Blocking Issues

1. Sports UI routes missing.
2. Sports event seed/API alignment missing.
3. Broad DB-backed test suites not green.
4. Authenticated admin/user E2E path missing on `main`.
5. Orderbook/ledger/settlement broad QA not green.
6. Production safety guard audit for auth/admin/deposit/withdrawal remains incomplete.

## Non-Blocking Issues

- npm audit warnings.
- Prisma config deprecation warning.
- Next.js dev server root warning due to a user-level lockfile outside the repo.
- Committed screenshot artifact should be reviewed.

## Recommended Merge Order

1. Audit documentation branch.
2. Test runner isolation fixes.
3. Ledger Phase 3 runner fix.
4. Sports event seed/API alignment.
5. Sports UI pages.
6. Auth/admin dev-login QA.
7. Orderbook/ledger/settlement QA.
8. Browser smoke/Playwright Phase 1.
9. Bot discovery QA.
10. Security production guard audit.

## Is Dev Ready For Main?

No. `dev` is currently behind `main` and should be reconciled intentionally before it receives additional branches.

## Is The Project Pre-Money Launch Ready?

No.

## Can Deposit/Withdrawal Phase Begin?

No. Deposit/withdrawal should remain restricted until the platform has green DB-backed trading/ledger tests, authenticated E2E coverage, and a dedicated production safety review.
