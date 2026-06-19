# Autonomous Continuation Prompt

Use this prompt when resuming from the autonomous UI standardization session after the big UI milestone and post-merge state refresh.

```text
You are acting as LeadAgent for the POLY Autonomous Execution Program.

Start from latest origin/dev. Current known checkpoint at stop time: `c8f8064` or newer.

Read:

- docs/reviews/AUTONOMOUS_EXECUTION_STATE.md
- docs/reviews/AUTONOMOUS_DECISION_LOG.md
- docs/reviews/HUMAN_DECISION_REQUIRED.md
- docs/reviews/AUTONOMOUS_PROGRESS_REPORT.md
- docs/reviews/HUMAN_REVIEW_QUEUE_ROLLUP.md
- docs/reviews/PUBLIC_BETA_LAUNCH_BLOCKER_SUMMARY.md
- docs/reviews/PUBLIC_ROUTE_SMOKE_EVIDENCE_STATUS.md
- docs/reviews/PUBLIC_ROUTE_SMOKE_MANUAL_RUN_PREREQUISITES.md
- docs/reviews/PUBLIC_ROUTE_SMOKE_EVIDENCE_2026_06_18_NOT_RUN.md
- docs/reviews/PUBLIC_API_NO_LEAK_COVERAGE_MAP.md
- docs/reviews/PUBLIC_API_TEST_IMPLEMENTATION_QUEUE.md
- docs/reviews/PR25_UI_REVIEW_CHECKLIST.md
- docs/reviews/UI_STANDARDIZATION_PROGRESS.md
- docs/reviews/UI_PAGE_STATUS_MATRIX.md
- docs/reviews/EVENT_DETAIL_DISPLAY_SHELL_PLAN.md
- docs/reviews/MARKET_DETAIL_DISPLAY_SHELL_PLAN.md
- docs/reviews/WALLET_FUNDING_CLAIM_REVIEW.md
- docs/reviews/PORTFOLIO_DISPLAY_IMPLEMENTATION_SCOPE.md
- docs/reviews/ADMIN_DISPLAY_IMPLEMENTATION_SCOPE.md

Current open PRs requiring review:

- PR #25: broad draft UI/product-code PR. Do not auto-merge.
- PR #177: stale docs-only post-merge state hygiene PR from the older `8db1fd7` checkpoint. Do not merge as-is; maintainer should close or update.

Recently resolved PRs:

- PR #134: market detail current-gap test. Merged after full validation.
- PR #135: private pool list display polish. Closed as superseded.
- PR #154: lint-clean private pool list display replacement. Merged after full validation and focused lint.
- PR #158, #160, #163, #164, #166: first-pass display polish for homepage, sports, events, login, and markets.
- PR #168, #169, #170, #171, #173: review-gated scope docs for event detail, market detail, wallet, portfolio, and admin display work.
- PR #175: app-wide display standardization milestone. Merged after self-review and validation.
- PR #176: post-merge UI/autonomous state refresh. Merged docs-only.
- PR #179: cross-page UI state terminology map. Merged docs-only.
- PR #180: homepage wallet/admin surface decision. Merged docs-only.
- PR #181: market-detail screenshot/smoke checklist. Merged docs-only.
- PR #182: current-dev autonomous state refresh after UI follow-ups. Merged docs-only.
- PR #183: autonomous checkpoint refresh after PR #182. Merged docs-only.
- PR #184: checkpoint refresh after PR #183. Merged docs-only.
- PR #185: checkpoint refresh after PR #184. Merged docs-only.
- PR #186: checkpoint refresh after PR #185. Merged docs-only.
- PR #188: checkpoint refresh after PR #186. Merged docs-only.

Continue safe autonomous work only if a clearly safe task remains:

- docs-only planning/review/checklists
- low-risk mocked public/read-only/no-leak/response-shape tests
- local-only public route smoke evidence preparation that does not start a server or capture screenshots unless explicitly selected and safe
- small display-only UI PRs only if they avoid wallet/funding, order/trading, auth/admin, bot, deployment, package/workflow/script, Prisma, and financial logic; leave UI PRs open unless strict UI auto-merge rules are satisfied
- event-detail loading/error/empty copy only if it avoids `GroupedTradeTicket`, selected trade state, order callbacks, polling, and fetch behavior
- market-detail screenshot/smoke checklist before any market-detail code
- portfolio header/empty-state copy only if all balance, PnL, position, order, history, auth redirect, and API semantics stay untouched
- admin read-only display planning or docs only unless a human-reviewed scope allows code

Do not touch main, deploy, secrets, Prisma, workflows, package scripts, wallet, ledger, matching, settlement, trading behavior, admin auth behavior, bot live trading, or production config.

PR #25 must remain unmerged unless human-reviewed or split into smaller safe PRs. Prefer separate docs-only reviews or small display-only replacement PRs.

If no safe autonomous tasks remain, stop cleanly and report that human review/business decisions are required.
```
