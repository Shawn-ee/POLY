# PR #25 Resolution Plan

Last updated: 2026-06-18

Task id: DOC-065

PR: https://github.com/Shawn-ee/POLY/pull/25

## Purpose

This document records the autonomous review decision for PR #25 and defines the recommended resolution path.

This plan does not modify PR #25, close PR #25, merge PR #25, change UI code, change wallet/funding/admin behavior, deploy, or approve public beta.

## Current Decision

Do not merge PR #25 directly.

Keep PR #25 open as draft unless a human decides to close it as superseded.

## Why PR #25 Is Not Auto-Mergeable

PR #25 is broad and touches multiple sensitive or action-bearing UI surfaces:

- wallet page
- admin deposits page
- admin withdrawals page
- private pool list page
- pool market detail component

It also includes source-code changes under `src/`, so it is not docs-only. Even if the stated intent is display-only, the changed surfaces are wallet/funding-adjacent, admin-operation-adjacent, and private-pool action-adjacent.

Strict autonomous UI auto-merge rules require changes to be small, display-only, validated, reversible, and free of wallet/funding/admin/action-surface ambiguity. PR #25 does not meet those conditions.

## Recommended Resolution

Preferred path:

1. Leave PR #25 as draft.
2. Create smaller replacement PRs by route/surface.
3. Merge only the safe replacement PRs after validation and review.
4. Close PR #25 as superseded only after replacement PRs are accepted or a human explicitly chooses to abandon the draft.

## Suggested Split Plan

| Replacement PR | Scope | Auto-merge default | Reviewers |
|---|---|---|---|
| Public shell/display-only PR | Public pages with no wallet, auth, admin, trading, or pool actions | Maybe, only if strict UI rules pass | FrontendAgent, SecurityAgent |
| Private pool list PR | `/my-pools` display polish only | No by default if action-bearing | FrontendAgent, SecurityAgent |
| Pool detail PR | `PoolMarketDetail` display polish only | No by default because betting/cancel/resolve surface | FrontendAgent, SecurityAgent, LedgerWalletReviewerAgent if any financial copy/action changes |
| Wallet page PR | Wallet display polish only | Human review required | FrontendAgent, SecurityAgent, LedgerWalletReviewerAgent |
| Admin deposits PR | Admin deposit display polish only | Human review required | FrontendAgent, SecurityAgent, LedgerWalletReviewerAgent |
| Admin withdrawals PR | Admin withdrawal display polish only | Human review required | FrontendAgent, SecurityAgent, LedgerWalletReviewerAgent |

## Forbidden In Replacement PRs Without Human Approval

Replacement PRs must not change:

- API calls
- request payloads
- action handlers
- wallet/deposit/withdrawal behavior
- balance or position calculations
- ledger, matching, settlement, orders, fills, or trades
- admin auth behavior
- admin completion/rejection semantics
- bot behavior
- deployment config
- Prisma schema or migrations
- package scripts or workflows

## Validation Required For Replacement PRs

For any UI-code replacement PR:

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npm run lint -- <changed-ui-file>
```

Run Playwright or browser screenshots only when a safe local app instance and non-sensitive data are available.

## Current Recommendation

Treat PR #25 as a design/reference draft, not a merge candidate.

Use PR #135 or future smaller PRs as replacement candidates, but do not auto-merge action-bearing UI changes unless validation is clean and the strict UI auto-merge policy is satisfied.
