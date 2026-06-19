# Open PR Review Lane Checklist

Task id: DOC-049

Phase: Phase A/D/G - Autonomous state and review-lane hygiene

Assigned subagents: LeadAgent, ReviewerAgent, SecurityAgent, TestingAgent, FrontendAgent, BackendAgent

Risk level: Low for docs-only checklist

## Purpose

This checklist records how to review the open autonomous PRs that were intentionally not auto-merged.

It does not modify those PR branches, merge them, change product code, change tests, deploy, or approve high-risk behavior.

## Open PRs

| PR | Task | Type | Status | Auto-merge decision |
|---|---|---|---|---|
| #134 | TST-027 market detail current-gap checks | Test-only | Open for specialist/human review | Not eligible |
| #135 | FE-001 private pool list display polish | UI code | Open for specialist/human review | Not eligible |

PR #25 remains an older draft UI/product-code PR and is still not part of this review lane unless a human explicitly selects it.

## PR #134 Review Checklist

PR: <https://github.com/Shawn-ee/POLY/pull/134>

Files:

- `src/__tests__/public.market-detail.current-gap.test.ts`

Required reviewers:

- TestingAgent
- BackendAgent
- SecurityAgent

Review questions:

- Does the test remain mocked/local?
- Does it avoid real DB, secrets, external services, production data, chain RPC, wallet keys, money movement, and admin credentials?
- Does it avoid route implementation changes?
- Does it clearly frame owner/reference/market-making fields as current gaps rather than desired public contract?
- Does it avoid blessing internal fields as permanent public response shape?
- Do targeted Jest, Prisma generate/validate, TypeScript, and `npm run test:ci` results remain current?
- Should the test merge now, be revised, or wait for market detail cleanup?

Merge only after reviewer agreement.

## PR #135 Review Checklist

PR: <https://github.com/Shawn-ee/POLY/pull/135>

Files:

- `src/app/my-pools/page.tsx`

Required reviewers:

- FrontendAgent
- ReviewerAgent
- SecurityAgent
- Human reviewer if action semantics are ambiguous

Review questions:

- Are the changes display-only?
- Are `/api/pool-markets/mine` and `POST /api/pool-markets/[id]/cancel` unchanged?
- Is the confirmation prompt before cancellation unchanged?
- Are link targets unchanged?
- Are owner/member status semantics unchanged?
- Is reload-after-cancel behavior unchanged?
- Does copy avoid real-money/funding readiness claims?
- Does mobile layout remain readable?
- Is the pre-existing `react-hooks/set-state-in-effect` lint issue acceptable to defer, or should it be fixed in a separate PR?
- Should the PR merge, be revised, or be held until visual QA is available?

Merge only after reviewer agreement.

## Do Not Auto-Merge

Do not auto-merge:

- PR #134
- PR #135
- PR #25

Reasons:

- PR #134 documents medium-risk public API contract gaps.
- PR #135 changes UI product code on an action-bearing private pool page.
- PR #25 is broad, draft, stale, and touches wallet/admin/private-pool surfaces.

## Safe Next Actions

Autonomous agents may:

- update docs-only state if reviewers comment
- create docs-only follow-up checklists
- open additional small docs-only planning PRs

Autonomous agents must not:

- merge PR #134 or #135 without review
- merge or modify PR #25
- change wallet, ledger, trading, admin auth, bot, deployment, Prisma, package, workflow, or secret behavior

## Non-Goals

This checklist does not:

- approve PR #134 or PR #135
- modify PR #134 or PR #135
- close PR #25
- merge any PR
- change product/runtime behavior
