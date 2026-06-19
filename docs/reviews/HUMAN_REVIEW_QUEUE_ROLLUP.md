# Human Review Queue Rollup

Task id: DOC-055

Phase: Phase A/D/G - Autonomous state, UI readiness, and beta evidence

Assigned subagents: LeadAgent, ReviewerAgent, SecurityAgent

Risk level: Low for docs-only rollup

## Purpose

This document summarizes open PRs that the autonomous LeadAgent has inspected but must not auto-merge under the current safety policy. The latest merged checkpoint refresh is PR #199 at `59cad63`.

It does not modify any PR branch, source code, tests, UI, backend logic, wallet, ledger, trading, admin auth, bot behavior, deployment, Prisma, migrations, secrets, or production behavior.

## Current Open Review Queue

| PR | Title | Changed files | Classification | Auto-merge decision | Required review |
|---|---|---|---|---|---|
| #25 | `feat: polish admin wallet and pool UI` | `docs/CURRENT_STATE.md`, `docs/agent-reports/2026-06-18-ui-admin-subpages-wallet-pools-light.md`, `src/app/admin/deposits/page.tsx`, `src/app/admin/withdrawals/page.tsx`, `src/app/my-pools/page.tsx`, `src/app/wallet/page.tsx`, `src/components/PoolMarketDetail.tsx` | Draft UI/product-code PR touching wallet/admin/private-pool/pool-detail surfaces | Do not auto-merge | Human, FrontendAgent, SecurityAgent, LedgerWalletReviewerAgent for wallet/funding-adjacent display |
| #177 | `docs: refresh UI post-merge state` | `docs/reviews/AUTONOMOUS_EXECUTION_STATE.md`, `docs/reviews/AUTONOMOUS_PROGRESS_REPORT.md`, `docs/reviews/UI_PAGE_STATUS_MATRIX.md`, `docs/reviews/UI_STANDARDIZATION_PROGRESS.md` | Docs-only state refresh from older `8db1fd7` checkpoint | Do not merge as-is | Maintainer should close as superseded or update from current `dev` |
| #192 | `docs: refresh autonomous checkpoint after pr191` | `docs/reviews/AUTONOMOUS_CONTINUATION_PROMPT.md`, `docs/reviews/AUTONOMOUS_DECISION_LOG.md`, `docs/reviews/AUTONOMOUS_EXECUTION_STATE.md`, `docs/reviews/AUTONOMOUS_PROGRESS_REPORT.md`, `docs/reviews/UI_PAGE_STATUS_MATRIX.md`, `docs/reviews/UI_STANDARDIZATION_PROGRESS.md` | Draft docs-only checkpoint after PR #191 | Do not merge as-is | Maintainer should close as superseded by merged PR #193 or update from current `dev` |

## PR #25 Review Notes

PR #25 is broad and draft. It changes multiple `src/` UI surfaces, including:

- wallet page
- admin deposits page
- admin withdrawals page
- private pool list page
- pool market detail component

Autonomous merge remains blocked because the changed surfaces are wallet/funding/admin/private-pool adjacent and too broad for a safe automatic merge. Existing docs-only reviews should be used before any split/replacement work:

- `docs/reviews/PR25_UI_REVIEW_CHECKLIST.md`
- `docs/reviews/PR25_SPLIT_MERGE_DECISION.md`
- `docs/reviews/PR25_ADMIN_FUNDING_UI_REVIEW_PACKET.md`
- `docs/reviews/PRIVATE_POOL_LIST_UI_REPLACEMENT_SCOPE.md`

Recommended handling:

1. Keep PR #25 open as draft or close it after human confirmation.
2. Prefer smaller replacement PRs by route/surface.
3. Require human review for wallet/admin/funding-adjacent UI even if display-only.
4. Do not merge any replacement that changes request payloads, action handlers, confirmations, balances, funding copy, admin operation controls, auth behavior, or trading behavior without explicit review.

## Resolved Review Notes

PR #134 was updated from current `dev`, fully validated, and merged after autonomous review confirmed it was mocked, local, read-only, and changed only `src/__tests__/public.market-detail.current-gap.test.ts`.

PR #135 was closed as superseded after PR #154 merged. PR #154 applied the focused private pool list display polish with a lint-safe initial load path and passed full validation, including `npm run lint -- src/app/my-pools/page.tsx`.

## Shared Non-Auto-Merge Reasons

The remaining open queue includes one broad source-code PR and two stale docs-only PRs:

- PR #25 changes multiple `src/` UI surfaces.
- PR #177 is docs-only, but its state-refresh content is stale and superseded by later `dev` commits, so merging as-is would regress the tracker language.
- PR #192 is docs-only and draft, but its checkpoint intent was superseded by merged PR #193.

PR #25 should not be auto-merged by the autonomous LeadAgent under the current policy.

## Safe Next Autonomous Work

Autonomous work may continue on:

- docs-only evidence/status updates
- docs-only review packets
- low-risk public/read-only mocked tests that do not repeat the merged market-detail current-gap task
- small UI PRs opened for review, not auto-merged, if they avoid wallet/funding/admin/trading/auth/bot/deployment behavior
- stale docs-only PR cleanup or closure when a maintainer confirms the superseded state for PR #177 or PR #192

## Non-Goals

This rollup does not:

- approve or reject the open PRs permanently
- modify open PR branches
- merge PR #25
- change UI, tests, API behavior, wallet, ledger, trading, admin auth, bot, Prisma, migrations, deployment, secrets, or production behavior
