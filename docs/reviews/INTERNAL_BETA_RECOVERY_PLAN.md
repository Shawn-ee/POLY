# Internal Beta Recovery Plan

Last updated: 2026-06-19

Branch: `agent/beta-recovery-smoke-evidence-go-no-go`

Purpose: recover from the overnight autonomous checkpoint loop by recording real evidence and the remaining blockers for internal beta readiness. This document does not change source code, package scripts, workflows, Prisma, migrations, wallet, ledger, matching, settlement, admin auth, bot behavior, deployment, secrets, or production behavior.

## Current State

- Main app repo is clean on `dev` at `ca0d2f5` before this recovery branch.
- `gh` was not available in this shell, so live PR metadata could not be queried.
- Open PR state is based on `docs/reviews/OPEN_PR_REVIEW_QUEUE.md`, recent git history, and overnight runner logs.
- A local-only anonymous public route smoke pass was run against `http://127.0.0.1:3001` during this recovery pass and is recorded in `docs/reviews/INTERNAL_BETA_TEST_EVIDENCE.md`.

## Stale PRs To Close Or Reconcile

These PRs should not be merged as-is:

| PR | Status | Recommended action |
|---|---|---|
| #177 | Stale docs-only state refresh from old `8db1fd7` checkpoint | Close, or update only if it contains non-duplicative information not already present on `dev`. |
| #192 | Superseded draft checkpoint after PR #191 | Close. Later checkpoint docs already supersede it. |
| #198 | Superseded draft checkpoint after PR #196 | Close. Later checkpoint docs and queue updates already supersede it. |
| #205 | Duplicate post-PR #204 checkpoint/evidence refresh | Close or manually reconcile any unique evidence placeholder, but do not merge as-is. |
| #206 | Duplicate post-PR #204 checkpoint refresh | Close. |
| #207 | Duplicate post-PR #204 checkpoint refresh | Close. |
| #210 | Stale checkpoint after PR #209 | Close or manually reconcile; superseded by PRs #211, #212, and #213. |

## PR #25 Status

PR #25, `feat: polish admin wallet and pool UI`, remains human-only.

Reasons:

- It is a broad draft UI/product-code PR.
- It touches wallet, admin deposit, admin withdrawal, private pool, and pool detail surfaces.
- Those areas are action-bearing and adjacent to funding, admin operations, private pools, and trading flows.
- The autonomous policy explicitly blocks wallet/funding, admin/auth, trading, settlement, ledger, bot, deployment, package/workflow, Prisma, and production-secret changes.
- The safe path is human review, then either closure or narrow replacement PRs with focused validation.

## Meaningful Overnight Work

The overnight runner produced some useful work before the checkpoint loop dominated:

- PR #175: app-wide display standardization milestone.
- PR #179: cross-page UI state terminology map.
- PR #180: homepage wallet/admin surface decision.
- PR #181: market-detail screenshot/smoke checklist.
- PR #191: anonymous route smoke checklist.
- PR #197: mobile viewport route-smoke checklist.
- PR #203: focused event-detail loading/error/empty-state copy polish with validation.
- PR #208 and PR #209: useful queue/checkpoint cleanup around PR #203 and duplicate checkpoint PRs.

## Repetitive Or Noisy Overnight Work

The runner repeatedly created and sometimes merged checkpoint refreshes whose main purpose was to record the prior checkpoint refresh:

- Repeated checkpoint docs: PRs #183, #184, #185, #186, #188, #190, #193, #196, #199, #200, #202, #204, #209, #211, #212, and #213.
- Duplicate draft checkpoint PRs: #205, #206, and #207.
- Stale checkpoint PR #210 superseded by later checkpoint PRs.
- Repeated local validation caveat: Node/npm checks were skipped in several runs because Node/npm were not on PATH in those shells.

## Exact Remaining Blockers

### Human Decision Required

- Public beta go/no-go.
- PR #25 disposition.
- Stale PR cleanup.
- Approval for any package/workflow changes such as a promoted public no-leak CI lane.

### Real Money, Wallet, And Funding

- Real deposits and withdrawals are not approved.
- Custody model, private key handling, real chain RPC/provider credentials, and payment/custody provider choices remain unapproved.
- Wallet/funding copy and flows remain review-gated.

### Admin And Auth

- Admin auth behavior and permission model remain human-reviewed.
- Admin route tests and operating procedures are not approved as complete.

### Bot And Live Trading

- Live bots are not enabled or approved.
- Bot credentials, custody, risk limits, and runtime behavior remain human-reviewed.
- Bot dry-run test implementation remains review-gated.

### Trading, Ledger, And Settlement

- Ledger/balance invariants, matching, settlement, order placement, cancellation, fills, trades, and positions remain high-risk areas.
- No recovery-pass changes were made in these areas.

### Public Route Smoke Evidence

- The requested anonymous routes now have local smoke evidence for desktop and mobile viewports.
- The route set was limited to `/`, `/sports`, `/events`, `/markets`, and `/login`.
- No screenshots were captured.
- Homepage and login still surface wallet-related text as beta/funding boundary copy.
- Anonymous 401 responses were observed for wallet/orders/positions API calls triggered by client behavior/prefetching; those did not require sign-in and did not mutate data.

### Test And CI

- Full `npm run test:ci` was not run in this docs-only recovery pass.
- Playwright's bundled Chromium was not installed; the smoke pass succeeded using installed Chrome via Playwright's `channel: "chrome"`.

### Deployment, Env, And OAuth

- No production deployment was performed.
- No production secrets were printed.
- OAuth and production environment readiness remain manually required.

## Recovery Direction

The next useful work should be evidence-producing, not checkpoint-producing:

1. Close stale checkpoint PRs.
2. Human-review or close PR #25.
3. Repeat the anonymous smoke pass after any UI changes.
4. Run full validation with local Node/npm available before any code PR.
5. Promote readiness only when evidence exists for auth/admin, wallet/funding boundaries, public routes, and test/CI status.
