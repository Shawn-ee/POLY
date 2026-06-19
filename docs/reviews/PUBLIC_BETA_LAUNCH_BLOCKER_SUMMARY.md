# Public Beta Launch Blocker Summary

Task id: DOC-062

Phase: Phase G - Public beta readiness evidence

Assigned subagents: PlannerAgent, SecurityAgent, LeadAgent

Risk level: Low for docs-only summary; high by launch topic

## Purpose

This document summarizes the current blockers that prevent POLY from being considered public-beta ready.

It does not approve public beta, deploy production, enable funding, change code, change configuration, modify wallet/ledger/trading/admin/bot behavior, or make legal/product go/no-go decisions.

## Current Launch Decision

Public beta remains **blocked**.

The autonomous LeadAgent may prepare evidence and docs, but it must not mark public beta ready. A human must make the final go/no-go decision after reviewing product, legal, security, wallet, ledger, trading, admin, bot, and deployment evidence.

## Blocker Summary

| Area | Status | Why blocked | Primary evidence |
|---|---|---|---|
| Product/UX | Blocked | Sports-first UI and route smoke evidence are not complete. | `docs/reviews/MVP_INFORMATION_ARCHITECTURE.md`, `docs/reviews/PUBLIC_ROUTE_SMOKE_EVIDENCE_2026_06_18_NOT_RUN.md` |
| Public API contracts | Blocked/partial | Public no-leak coverage expanded, but market detail and reference/liquidity boundaries remain review-gated. | `docs/reviews/PUBLIC_API_NO_LEAK_COVERAGE_MAP.md`, PR #134 |
| Public route smoke | Blocked/not run | Manual smoke evidence exists only as a not-run placeholder. | `docs/reviews/PUBLIC_ROUTE_SMOKE_EVIDENCE_STATUS.md`, `docs/reviews/PUBLIC_ROUTE_SMOKE_EVIDENCE_2026_06_18_NOT_RUN.md` |
| UI replacement | Blocked/open review | PR #25 is broad and draft; PR #135 is UI code on an action-bearing page. | `docs/reviews/HUMAN_REVIEW_QUEUE_ROLLUP.md` |
| Wallet/funding | Blocked/high-risk | Deposit, withdrawal, custody, and funding gates need human-approved architecture and tests. | `docs/reviews/FINANCIAL_SAFETY_REVIEW.md`, `docs/LEDGER_AND_WALLET_RULES.md` |
| Ledger/trading/settlement | Blocked/high-risk | Ledger invariants, matching, settlement, orders, fills, trades, and positions need human-reviewed evidence. | `docs/reviews/FINANCIAL_SAFETY_REVIEW.md` |
| Admin auth | Blocked/high-risk | Admin auth test implementation remains scoped but not implemented or approved. | `docs/reviews/ADMIN_AUTH_TEST_IMPLEMENTATION_SCOPE.md` |
| Bot/liquidity | Blocked/high-risk | Bot dry-run/live separation and runtime controls remain review-gated; live bot launch is human-only. | `docs/reviews/BOT_DRY_RUN_TEST_IMPLEMENTATION_SCOPE.md` |
| Deployment | Blocked/high-risk | Production deployment and rollback evidence remain human-owned. | `docs/reviews/LAUNCH_EVIDENCE_CHECKLIST.md` |
| Legal/product decision | Blocked/human-only | Public beta go/no-go and risk disclosures need human/legal/product approval. | `docs/reviews/HUMAN_DECISION_REQUIRED.md` |

## Autonomous Work Still Allowed

Autonomous agents may continue:

- docs-only evidence updates
- docs-only readiness checklists
- docs-only open PR review rollups
- low-risk mocked public/read-only tests
- local-only no-leak/response-shape tests that do not touch runtime behavior
- small UI PRs only when explicitly display-only and still review-gated unless strict UI auto-merge conditions are met

## Autonomous Work Still Forbidden

Autonomous agents must not:

- enable public beta
- deploy production
- merge to `main`
- enable deposits or withdrawals
- approve custody/private-key handling
- change ledger, matching, settlement, order, fill, trade, or position behavior
- change admin auth behavior
- enable bot live trading
- change bot liquidity runtime behavior
- modify Prisma schema or migrations
- expose secrets or production data
- change package/workflow/test lanes without human review

## Human Decisions Required Before Public Beta

Before public beta can be considered, humans must decide:

1. Product scope: what is included in public beta versus internal beta only.
2. Legal/compliance scope: jurisdictions, disclosures, and user eligibility.
3. Funding/custody scope: whether real deposits/withdrawals are enabled or disabled.
4. Ledger/trading readiness: whether invariant and reconciliation evidence is sufficient.
5. Admin/auth readiness: whether admin access controls and tests are sufficient.
6. Bot/liquidity scope: whether bots are disabled, dry-run only, or live.
7. Deployment readiness: production target, rollback plan, monitoring, and incident owners.
8. Open PR disposition: whether to merge, revise, split, or close PR #25, PR #134, and PR #135.

## Current Recommended Next Evidence

1. Complete a local-only anonymous public route smoke run and record safe evidence.
2. Decide PR #134 with BackendAgent/SecurityAgent review.
3. Decide PR #135 with FrontendAgent/SecurityAgent review.
4. Split or close PR #25 after human review.
5. Keep wallet/funding, ledger/trading, admin auth, bot, package/workflow, and deployment implementation human-reviewed.

## Non-Goals

This summary does not:

- approve launch
- change launch criteria
- run tests
- run browsers
- change code
- change configuration
- change package scripts or workflows
- deploy
- alter wallet, deposit, withdrawal, ledger, matching, settlement, trading, admin auth, bot, Prisma, migrations, secrets, or production behavior
