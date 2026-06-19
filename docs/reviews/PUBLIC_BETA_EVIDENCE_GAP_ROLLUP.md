# Public Beta Evidence Gap Rollup

Task id: DOC-046

Phase: Phase G - Beta readiness evidence

Assigned subagents: PlannerAgent, DocsAgent, TestingAgent, SecurityAgent

Risk level: Low for docs-only rollup

## Purpose

This rollup summarizes what evidence POLY has, what is missing, and what remains human-owned before any public beta decision.

It does not approve public beta, deploy production, enable deposits or withdrawals, change code, change tests, change wallet/ledger/trading/admin/bot behavior, or modify production settings.

## Evidence State Summary

| Area | Current status | Main evidence | Gap |
|---|---|---|---|
| Agent workflow | Partial | Agent operating docs, autonomous state and decision logs | Continue checkpoints after autonomous work. |
| Product/IA | Partial | MVP IA, homepage/sports specs, UX reviews | Needs implementation evidence and screenshots. |
| Public API no-leak | Partial/expanded | Public mocked no-leak and response-shape tests, coverage map | Tests are targeted; CI lane not promoted. |
| Public API contracts | Partial | Market/event/sports/chart decisions and status rollups | Market detail, reference/liquidity, quote/orderbook remain gated. |
| Public route smoke | Draft/not run | Public route page smoke evidence plan, template, command scope, and status doc | No committed smoke run evidence yet; no package/workflow lane approved. |
| UI replacement readiness | Partial/open review | PR #25 review docs, private-pool scope, UI rollup, human review queue rollup, and PR #154 | PR #25 is not auto-mergeable; future UI code replacements require review unless strict UI auto-merge rules pass. |
| Admin auth | Draft/missing | Admin auth matrix, route ownership docs, and implementation test scope | Implementation tests and behavior sign-off missing. |
| Wallet/funding | Missing/high-risk | Ledger/wallet rules and safety reviews | Human-approved funding architecture and evidence missing. |
| Ledger/trading/settlement | Missing/high-risk | Financial safety review and rules | Invariant tests and human sign-off missing. |
| Bot/liquidity | Draft/high-risk | Bot dry-run plan, implementation scope, credential review, operations outline | Live/dry-run controls and human sign-off missing; future bot tests are review-gated. |
| Deployment | Missing/high-risk | Agent rules and launch checklist | Production runbook, rollback, and human sign-off missing. |

## Safe Evidence To Collect Autonomously

Autonomous agents may continue collecting:

- docs-only scope, checklist, and status rollups
- mocked/local public no-leak and response-shape tests
- public route smoke plans and templates
- public route smoke evidence status updates
- UI readiness documents for display-only PRs
- human review queue rollups for non-auto-merge PRs
- beta evidence tracker updates
- human-decision tracking updates

These must avoid secrets, production data, real chain RPC, money movement, deployment, admin auth behavior changes, bot runtime changes, wallet/ledger/trading implementation, Prisma schema changes, and package/workflow changes unless left open for human review.

## Evidence Requiring Human Review

Human review is required for:

- public beta go/no-go
- production deployment
- real deposit or withdrawal enablement
- wallet custody and private-key handling
- ledger/balance invariant readiness
- matching, settlement, order, fill, trade, and position behavior
- admin auth implementation and tests
- bot live trading and liquidity controls
- package/workflow changes that alter required CI lanes
- PR #25 or replacement UI PRs touching wallet, admin funding, pool detail actions, or funding copy

## Highest-Value Remaining Safe Tasks

| Priority | Task | Type | Auto-merge default |
|---:|---|---|---|
| 1 | Public route smoke evidence status updates | Docs-only | Yes |
| 2 | UI replacement readiness updates after each scoped UI plan | Docs-only | Yes |
| 3 | Human review queue rollup updates for PR #25 and future non-auto-merge PRs | Docs-only | Yes |
| 4 | Private pool list follow-up evidence after PR #154 | Docs-only | Yes |
| 5 | Public API test lane package-script PR | Package/script | No |
| 6 | Admin/funding screenshot evidence packet after human-safe local screenshots | Docs/evidence | No if screenshots include sensitive/redacted data decisions |

## Launch-Blocking Gaps

The following remain blockers for public beta:

- no human-approved funding/custody model
- no real deposit architecture approval
- no real withdrawal process approval
- no ledger/balance invariant evidence package
- no admin auth implementation test evidence
- no production deployment/rollback runbook approval
- no public beta legal/product go/no-go
- no live bot control sign-off if bots are included in launch scope

## Suggested Evidence Collection Order

1. Keep updating autonomous state and decision logs after each batch.
2. Keep public route smoke status current until a safe manual evidence run is available.
3. Keep PR #25 in the human review queue until reviewed, split, or closed.
4. Treat PR #154 as the merged lint-clean replacement for the `/my-pools` display-only polish.
5. Keep package/workflow/test-lane work human-reviewed.
6. Continue docs-only high-risk area readiness packets.

## Non-Goals

This rollup does not:

- implement tests
- change UI
- change routes
- change package scripts or workflows
- deploy
- approve public beta
- alter wallet, deposit, withdrawal, ledger, matching, settlement, trading, admin auth, bot, Prisma, migration, secrets, or production behavior
