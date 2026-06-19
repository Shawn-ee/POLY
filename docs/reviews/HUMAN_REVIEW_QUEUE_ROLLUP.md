# Human Review Queue Rollup

Task id: DOC-055

Phase: Phase A/D/G - Autonomous state, UI readiness, and beta evidence

Assigned subagents: LeadAgent, ReviewerAgent, SecurityAgent

Risk level: Low for docs-only rollup

## Purpose

This document summarizes open PRs that the autonomous LeadAgent has inspected but must not auto-merge under the current safety policy.

It does not modify any PR branch, source code, tests, UI, backend logic, wallet, ledger, trading, admin auth, bot behavior, deployment, Prisma, migrations, secrets, or production behavior.

## Current Open Review Queue

| PR | Title | Changed files | Classification | Auto-merge decision | Required review |
|---|---|---|---|---|---|
| #25 | `feat: polish admin wallet and pool UI` | `docs/CURRENT_STATE.md`, `docs/agent-reports/2026-06-18-ui-admin-subpages-wallet-pools-light.md`, `src/app/admin/deposits/page.tsx`, `src/app/admin/withdrawals/page.tsx`, `src/app/my-pools/page.tsx`, `src/app/wallet/page.tsx`, `src/components/PoolMarketDetail.tsx` | Draft UI/product-code PR touching wallet/admin/private-pool/pool-detail surfaces | Do not auto-merge | Human, FrontendAgent, SecurityAgent, LedgerWalletReviewerAgent for wallet/funding-adjacent display |
| #134 | `test: add public market detail current-gap checks` | `src/__tests__/public.market-detail.current-gap.test.ts` | Test-only public market-detail current-gap PR | Do not auto-merge by default | BackendAgent, SecurityAgent, TestingAgent, human decision on current-gap assertions |
| #135 | `feat: polish private pool list display` | `src/app/my-pools/page.tsx` | UI product-code PR on action-bearing private pool page | Do not auto-merge | Human, FrontendAgent, SecurityAgent |

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

## PR #134 Review Notes

PR #134 is test-only and uses mocked/local public API checks, but it documents current market-detail extra fields as current gaps.

Autonomous merge remains blocked because reviewers should decide whether current-gap assertions are useful or whether they could accidentally normalize fields that should be removed from the public contract.

Recommended handling:

1. BackendAgent and SecurityAgent review the assertions against `docs/reviews/MARKET_DETAIL_PUBLIC_CONTRACT_DECISION.md`.
2. If reviewers agree the current-gap test is useful, merge after human/specialist review.
3. If reviewers prefer target-contract tests only, revise or close PR #134 and open a target-contract test after implementation is approved.

## PR #135 Review Notes

PR #135 is a smaller UI replacement PR for `/my-pools`, but it still changes `src/app/my-pools/page.tsx`, an action-bearing private-pool page.

Autonomous merge remains blocked because UI product-code is not auto-merged by default and focused lint reports a pre-existing hook-rule issue in the same file.

Recommended handling:

1. FrontendAgent verifies display-only intent line by line.
2. Reviewer confirms existing fetch calls, cancel confirmation, cancel endpoint, reload behavior, links, and action conditions are preserved.
3. Decide whether to address the pre-existing `useEffect` lint issue in a separate PR.
4. Merge only after human/specialist review.

## Shared Non-Auto-Merge Reasons

The open queue includes source-code or test-code changes outside the docs-only auto-merge lane:

- PR #25 changes multiple `src/` UI surfaces.
- PR #134 changes `src/__tests__/` and documents public API current gaps.
- PR #135 changes `src/app/my-pools/page.tsx`.

None should be auto-merged by the autonomous LeadAgent under the current policy.

## Safe Next Autonomous Work

Autonomous work may continue on:

- docs-only evidence/status updates
- docs-only review packets
- low-risk public/read-only mocked tests that do not involve market-detail current-gap ambiguity
- small UI PRs opened for review, not auto-merged, if they avoid wallet/funding/admin/trading/auth/bot/deployment behavior

## Non-Goals

This rollup does not:

- approve or reject the open PRs permanently
- modify open PR branches
- merge PR #25, #134, or #135
- change UI, tests, API behavior, wallet, ledger, trading, admin auth, bot, Prisma, migrations, deployment, secrets, or production behavior
