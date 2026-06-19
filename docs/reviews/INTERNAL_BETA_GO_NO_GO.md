# Internal Beta Go/No-Go

Last updated: 2026-06-19

Decision basis: actual recovery-pass evidence in `docs/reviews/INTERNAL_BETA_TEST_EVIDENCE.md`, current review queue state, and existing safety blockers. This document does not change source code, tests, package scripts, workflows, Prisma, migrations, wallet, ledger, matching, settlement, admin auth, bot behavior, deployment, secrets, or production behavior.

## Classification

**Ready for Internal Use with Warnings**

This is not public beta readiness.

## Why This Improved From Limited Internal Use Only

The recovery pass produced real evidence that the requested anonymous public routes load locally:

- `/`
- `/sports`
- `/events`
- `/markets`
- `/login`

Each route returned HTTP 200 at desktop `1440x900` and mobile `390x844`, with no horizontal overflow and no obvious secret-pattern matches in visible page text.

This moves the app toward internal use because a small anonymous tester group can inspect public discovery and login entry surfaces locally without using production, real credentials, real money, admin actions, trading actions, or bot actions.

## Warnings

- This decision is based on a local dev server smoke pass, not production.
- Full `npm run test:ci`, TypeScript, and Prisma validation were not rerun because this pass changed docs only.
- The smoke pass observed anonymous 401 responses for wallet/orders/positions/user-order stream requests during public page behavior or prefetching. These were not mutations and did not expose secrets, but they are noisy and should be reviewed.
- The homepage and login page intentionally display wallet-related beta/funding boundary copy. That is acceptable for internal testing but should remain product-reviewed.
- `gh` was unavailable, so live open PR state was not independently queried.
- Several stale checkpoint PRs remain open or need maintainer cleanup.
- PR #25 remains human-only.

## Not Ready For Public Beta

Public beta remains blocked by:

- public beta go/no-go decision not made
- real-money funding/custody decisions not approved
- wallet/deposit/withdrawal readiness not approved
- admin auth readiness not approved
- bot live trading not approved
- trading, ledger, matching, settlement, order, position, and reconciliation readiness not approved
- production deployment and OAuth/env readiness not approved
- stale PR cleanup incomplete
- full CI/release validation not recorded in this recovery pass

## Allowed Internal Use Boundary

Permitted for internal use with warnings:

- Anonymous inspection of public discovery routes.
- Local/dev data only.
- Test credits only.
- No production deployment.
- No real credentials.
- No sign-in unless separately approved.
- No wallet connection.
- No deposit or withdrawal action.
- No order placement, cancellation, matching, settlement, or ledger mutation.
- No admin actions.
- No bot actions.

## Next Gate To Ready For Internal Use

To move from **Ready for Internal Use with Warnings** to **Ready for Internal Use**, complete:

1. Close or reconcile stale PRs #177, #192, #198, #205, #206, #207, and #210.
2. Human-review and resolve PR #25.
3. Run full local validation with Node/npm available: Prisma generate/validate, TypeScript, and `npm run test:ci`.
4. Review and, if appropriate, reduce noisy anonymous auth-only requests from public pages.
5. Add separately approved evidence for authenticated internal tester flows without production credentials or real money.
