# UI Standardization Progress

Task id: UI-000-PROGRESS

Assigned subagents: LeadAgent, FrontendAgent, DocsAgent, TestingAgent, SecurityAgent

Risk level: Low for docs-only progress tracking

Status: Active progress tracker

## Purpose

This tracker records UI standardization progress, merged PRs, open PRs, blocked decisions, validation evidence, and next UI tasks.

It does not change UI code, product logic, wallet/deposit/withdrawal behavior, ledger, matching, settlement, admin auth, bot behavior, deployment, Prisma, migrations, secrets, or production behavior.

## Current Dev Checkpoint

Current known `dev` checkpoint after the autonomous checkpoint refresh: `021c905`.

## Big UI Overhaul Milestone

Branch: `agent/big-ui-overhaul`

Target PR: `dev`

Status: Merged as PR #175.

Merge status: Merged after autonomous self-review because the diff remained display-only, avoided forbidden files/logic, passed focused validation/build, and documented pre-existing unrelated full-lint issues.

Post-merge state:

- PR #176 merged a docs-only state refresh after PR #175.
- PR #183 merged a docs-only autonomous checkpoint refresh after PR #182.
- PR #184 merged a docs-only checkpoint refresh after PR #183.
- PR #185 merged a docs-only checkpoint refresh after PR #184.
- PR #186 merged a docs-only checkpoint refresh after PR #185.
- PR #188 merged a docs-only checkpoint refresh after PR #186.
- PR #190 merged a docs-only checkpoint refresh after PR #188.
- PR #191 merged the anonymous public route smoke checklist.
- PR #193 merged a docs-only checkpoint refresh after PR #191.
- PR #194 merged a docs-only open PR review queue refresh after PR #193.
- PR #196 merged a docs-only checkpoint refresh after PR #194.
- Remaining autonomous UI work should prefer smoke evidence preparation, docs-only checklists, or very small display-only follow-ups that avoid forbidden areas.

Scope confirmed:

- Shared UI presentation primitives for page headers, beta notices, section headers, and stat cards.
- Public discovery framing for homepage, sports, events, and markets.
- Reusable market/event card presentation consistency.
- Event detail and market detail read-only shell clarity only.
- Portfolio and wallet display framing only.
- Private pool list/create display framing only.
- Admin landing display framing only.
- Documentation tracker refresh.

Forbidden areas not changed:

- Wallet funding, deposit, withdrawal, ledger, matching, settlement, order placement, order cancellation, fills, trades, positions, admin auth, bot runtime, production deployment, Prisma schema, migrations, secrets, payment/custody behavior, package scripts, and workflows.

## Pages Reviewed

| Page | Reviewed evidence | Current status | Next action |
|---|---|---|---|
| `/` | `HOMEPAGE_SIMPLIFICATION_SPEC.md`, page UX review, PR #158 | Improved with first display PR | Later decide whether homepage wallet/admin concepts should move out of the main surface. |
| `/markets` | Page UX review, public API test docs, PR #166 | Improved with market-board display polish | Later add route smoke/screenshot evidence. |
| `/markets/[id]` | Market-detail contract docs, current-gap tests, market detail display shell plan | Planned; code remains review-gated | Do not touch trade/order behavior. |
| `/events` | Page UX review, PR #163 | Improved with shared container/state components | Later add route smoke/screenshot evidence. |
| `/events/[slug]` | Page UX review, event detail display shell plan | Planned; code remains review-gated | Avoid grouped trade behavior changes. |
| `/sports` | Sports readiness checklist, PR #160 | Improved with sports-first copy | Later add route smoke/screenshot evidence. |
| `/sports/soccer` | Sports readiness checklist, PR #160 | Improved with soccer event-first copy | Later add route smoke/screenshot evidence. |
| `/sports/soccer/world-cup` | Sports readiness checklist, PR #160 | Improved with demo framing removed | Later add route smoke/screenshot evidence. |
| `/portfolio` | Portfolio mobile card spec, portfolio implementation scope | Planned; code remains review-gated | Do not change calculations. |
| `/wallet` | Account risk disclosure spec, wallet beta-state spec, funding-claim review | Human-reviewed by default | Display/copy only after explicit human-reviewed scope. |
| `/login` | IA and risk copy docs, PR #164 | Improved with beta-safe copy and lint-safe error display | Later add route smoke/screenshot evidence. |
| `/create` | IA and page review | Delayed/post-MVP | Keep out of public MVP navigation. |
| `/my-pools` | PR #154 | Improved in focused PR | Further work must stay small and display-only. |
| `/pool/[id]` | IA | Hidden compatibility | No UI work planned. |
| `/admin` | Page review, admin IA plan, admin display implementation scope | Planned; code remains review-gated | Read-only admin display PRs only after explicit scope. |
| `/admin/deposits` | PR #25 review docs | Human-reviewed | Do not change funding behavior. |
| `/admin/withdrawals` | PR #25 review docs | Human-reviewed | Do not change withdrawal behavior. |
| `/admin/reference-markets` | Page review | Human-reviewed | Separate curation from bot controls in docs first. |
| `/admin/bots` | Bot docs | Human-reviewed | Keep dry-run/live boundaries visible. |
| `/admin/agents` | Page review, admin display implementation scope | Internal/review-gated | Copy clarity only if safe and read-only. |
| `/admin/system` | Page review, admin display implementation scope | Human-reviewed | Read-only status grouping only after explicit scope. |
| `/admin/markets/[marketId]/invariants` | Financial safety docs | Human-reviewed | Keep review-gated. |

## Big Milestone Page Status Updates

| Page/surface | Big milestone treatment | Remaining review need |
|---|---|---|
| `/` | Standardized around shared page header, beta notice, event section header, and cleaner market-board framing. | Human review for whether wallet/admin links should stay on homepage. |
| `/markets` | Standardized market-board header and beta discovery notice. | Smoke/screenshot evidence. |
| `/events` | Standardized event-discovery header and beta context. | Smoke/screenshot evidence. |
| `/sports/*` | Standardized sports page header, beta context, and section headers. | Smoke/screenshot evidence. |
| `/events/[slug]` | Added shared event shell framing and corrected display-only price suffix. | Human review because grouped trade controls are nearby. |
| `/markets/[id]` | Standardized shared market header only. | Human review before any orderbook/pool display work. |
| `/login` | Standardized sign-in shell and beta account context. | Smoke/screenshot evidence. |
| `/portfolio` | Standardized account header and stat cards without changing calculations. | Human review for account-value terminology. |
| `/wallet` | Standardized wallet shell, balance cards, funding-disabled copy, and linked-wallet framing without changing wallet behavior. | Human review before any funding action visibility changes. |
| `/my-pools` | Standardized private-pool list shell/cards/empty states without changing actions. | Human review before pool behavior changes. |
| `/create` | Standardized private-pool creation framing without changing validation or submission. | Product decision on whether this route stays visible for MVP. |
| `/admin` | Added internal-operations framing and warning copy without changing admin behavior. | Human review for all admin mutation surfaces. |

Validation summary for PR #175:

- `git diff --check`: passed.
- Prisma generate/validate: passed.
- TypeScript: passed.
- `npm run test:ci`: passed.
- Focused lint for changed UI files: no errors.
- `npm run build`: passed.
- Full `npm run lint -- --max-warnings=0`: failed on pre-existing unrelated repo-wide lint issues outside the UI milestone scope.

## Pages Changed

| Page | PR | Summary | Validation | Status |
|---|---|---|---|---|
| `/my-pools` | #154 | Focused private pool list display polish with lint-safe initial load. | Full validation and focused lint passed. | Merged |
| `/` | #158 | Sports-first beta copy, primary/secondary CTAs, featured-event support copy, and safer empty state. | Full validation and focused lint passed. | Merged |
| `/sports`, `/sports/soccer`, `/sports/soccer/world-cup` | #160 | Sports-first discovery copy, World Cup non-demo framing, `All markets` secondary link, and beta-safe empty state. | Full validation and focused lint passed. | Merged |
| `/events` | #163 | Shared `PageContainer`, shared loading/empty states, event-first copy, and beta-safe empty state. | Full validation and focused lint passed. | Merged |
| `/login` | #164 | Beta-safe sign-in copy, shared page container, clearer error display, and lint-safe derived error string. | Full validation and focused lint passed. | Merged |
| `/markets` | #166 | Sports-first market-board copy, grouped filters, beta-safe note, improved empty state, and clearer no-price fallback card. | Full validation and focused lint passed. | Merged |
| `/events/[slug]` | Pending after UI-018 | Docs-only display shell plan separates safe read-only polish from grouped trade/order behavior. | Docs-only diff checks. | Planned |
| `/markets/[id]` | Pending after UI-019 | Docs-only display shell plan separates market comprehension from orderbook, order ticket, pool action, position, and bot/reference behavior. | Docs-only diff checks. | Planned |
| `/wallet` | Pending after UI-007 | Docs-only funding-claim review defines copy and behavior boundaries before any wallet display work. | Docs-only diff checks. | Planned |
| `/portfolio` | Pending after UI-009 | Docs-only implementation scope separates safe display polish from balance, PnL, position, order, and history semantics. | Docs-only diff checks. | Planned |
| `/admin` and internal admin routes | Pending after UI-025 | Docs-only admin display implementation scope separates read-only polish from auth, finance, market resolution, bot, system, and agent operations. | Docs-only diff checks. | Planned |

## PRs Merged

| PR | Type | Files | Decision |
|---|---|---|---|
| #154 | Display-only UI | `src/app/my-pools/page.tsx` | Merged as focused replacement for PR #135. |
| #157 | Docs-only | `docs/reviews/UI_STANDARDIZATION_MASTER_PLAN.md`, `docs/reviews/UI_STANDARDIZATION_PROGRESS.md` | Merged as UI standardization foundation. |
| #158 | Display-only UI | `src/app/page.tsx` | Merged as small homepage display simplification. |
| #160 | Display-only UI | `src/app/sports/page.tsx`, `src/app/sports/soccer/page.tsx`, `src/app/sports/soccer/world-cup/page.tsx`, `src/components/sports/SportsEventsPage.tsx` | Merged as sports-first copy polish. |
| #162 | Docs-only | UI style guide, page matrix, terminology guide, state guide, and mobile tracker | Merged as Phase 0 style foundation. |
| #163 | Display-only UI | `src/app/events/page.tsx` | Merged as events list state/display polish. |
| #164 | Display-only UI | `src/app/login/page.tsx` | Merged as beta login display polish. |
| #166 | Display-only UI | `src/app/markets/page.tsx` | Merged as markets discovery display polish. |
| #168 | Docs-only | `docs/reviews/EVENT_DETAIL_DISPLAY_SHELL_PLAN.md`, UI trackers | Merged as event-detail display shell scope. |
| #169 | Docs-only | `docs/reviews/MARKET_DETAIL_DISPLAY_SHELL_PLAN.md`, UI trackers | Merged as market-detail display shell scope. |
| #170 | Docs-only | `docs/reviews/WALLET_FUNDING_CLAIM_REVIEW.md`, UI trackers | Merged as wallet funding-claim boundary review. |
| #171 | Docs-only | `docs/reviews/PORTFOLIO_DISPLAY_IMPLEMENTATION_SCOPE.md`, UI trackers | Merged as portfolio display implementation scope. |
| #173 | Docs-only | `docs/reviews/ADMIN_DISPLAY_IMPLEMENTATION_SCOPE.md`, UI trackers | Merged as admin display implementation scope. |
| #175 | Display-only UI | Shared UI primitives and app-wide display shell files | Merged after self-review and validation. |
| #176 | Docs-only | Autonomous and UI state docs | Merged as post-merge state refresh. |

## PRs Left Open

| PR | Reason |
|---|---|
| #25 | Broad draft UI/product-code PR touching wallet, admin deposit/withdrawal, private-pool, and pool-detail surfaces. Must not auto-merge. |

## UI Risks

- PR #25 remains broad and stale; use it only as design/reference input.
- Wallet and admin funding pages can imply production money movement if copy is careless.
- Portfolio/account pages can mislead users if balance, locked funds, or PnL are not backed by approved logic.
- Market detail pages can accidentally touch order/trade behavior.
- Admin pages can blur read-only information with mutating controls.
- Dense filters and tables may fail mobile-first expectations.

## Test Coverage Relevant To UI

Current safe evidence:

- Public no-leak and response-shape tests for taxonomy, events, sports, market lists, event markets, market charts, and market-detail current gaps.
- `npm run test:ci` baseline passes in recent validation runs.
- Focused lint for `/my-pools` passed in PR #154.
- Focused lint for `/` passed in PR #158.
- Focused lint for sports pages and `SportsEventsPage` passed in PR #160.
- Focused lint for `/events` passed in PR #163.
- Focused lint for `/login` passed in PR #164.
- Focused lint for `/markets` passed in PR #166.

Needed evidence:

- Public route smoke evidence for `/`, `/sports`, `/markets`, `/events`, and `/login`.
- Mobile screenshots or browser checks before larger UI waves.
- UI state checklist for empty/loading/error patterns.
- Human-reviewed package/workflow decision before adding a required UI smoke CI lane.

## Next UI Tasks

1. UI-012: Public route smoke evidence for homepage, sports, markets, events, and login.
   - UI-012A: Anonymous route-smoke checklist completed in `docs/reviews/PUBLIC_ROUTE_SMOKE_ANONYMOUS_CHECKLIST.md`; no server, browser, screenshots, fixtures, or runtime code.
2. UI-010: Cross-page empty/loading/error terminology map. Completed in `docs/reviews/UI_STATE_TERMINOLOGY_MAP.md`.
3. UI-011: Homepage wallet/admin surface decision. Completed in `docs/reviews/HOMEPAGE_WALLET_ADMIN_SURFACE_DECISION.md`.
4. UI-020: Login, homepage, sports, events, and markets mobile smoke evidence.
5. UI-021: Event detail loading/error/empty copy PR only if it avoids grouped trade behavior.
6. UI-022: Market detail screenshot/smoke checklist before any code. Completed in `docs/reviews/MARKET_DETAIL_SCREENSHOT_SMOKE_CHECKLIST.md`.
7. UI-023: Wallet display scope packet if a human confirms funding-copy boundaries.
8. UI-024: Portfolio header/empty-state copy PR only if calculations remain untouched.
9. UI-026: Admin read-only landing/status display PR only with human-reviewed scope.
10. UI-027: Private pool/detail hidden-route decision before more pool UI.

## Blocked UI Decisions

- Whether to close PR #25 as superseded.
- Whether private pools are part of public MVP or internal-only.
- Whether wallet funding actions should be visible during beta.
- Whether admin finance pages should receive UI polish before funding architecture approval.
- Whether market detail target-contract cleanup happens before more market detail UI changes.
- Whether UI smoke tests get a package script or workflow lane.

## Checkpoint After PRs #168-#171

Tasks completed in this checkpoint:

- UI-018: Event detail display shell plan.
- UI-019: Market detail display shell plan.
- UI-007: Wallet funding-claim review.
- UI-009: Portfolio display implementation scope.

PRs opened and merged: #168, #169, #170, #171.

PRs left open: #25 remains draft/human-only.

Validation:

- `git diff --check` passed for each docs-only PR.
- `git diff --cached --check` passed before each docs-only commit.

Skipped high-risk implementation:

- Event detail grouped trade behavior.
- Market detail orderbook, order ticket, pool actions, positions, and bot/reference behavior.
- Wallet deposits, withdrawals, linked-wallet behavior, and balance semantics.
- Portfolio balances, PnL, positions, order semantics, and history calculations.

## Checkpoint After PR #176

Tasks completed in this checkpoint:

- UI-010: Cross-page empty/loading/error terminology map.

Files added or updated:

- `docs/reviews/UI_STATE_TERMINOLOGY_MAP.md`
- `docs/reviews/UI_STANDARDIZATION_PROGRESS.md`
- `docs/reviews/UI_PAGE_STATUS_MATRIX.md`
- `docs/reviews/README.md`

Validation:

- `git diff --check` passed.

Skipped high-risk implementation:

- Public route smoke execution, server startup, browser automation, and screenshots.
- Event detail grouped trade behavior.
- Market detail orderbook, order ticket, pool actions, positions, reference, and bot behavior.
- Portfolio, wallet, funding, balance, PnL, deposit, and withdrawal behavior.
- Admin auth, finance operations, bot controls, deployment, package scripts, workflows, Prisma, and migrations.

## Checkpoint After UI-010

Tasks completed in this checkpoint:

- UI-011: Homepage wallet/admin surface decision.

Files added or updated:

- `docs/reviews/HOMEPAGE_WALLET_ADMIN_SURFACE_DECISION.md`
- `docs/reviews/UI_STANDARDIZATION_PROGRESS.md`
- `docs/reviews/UI_PAGE_STATUS_MATRIX.md`
- `docs/reviews/README.md`
- `docs/reviews/AUTONOMOUS_EXECUTION_STATE.md`
- `docs/reviews/AUTONOMOUS_PROGRESS_REPORT.md`
- `docs/reviews/AUTONOMOUS_DECISION_LOG.md`

Validation:

- `git diff --check` passed.

Skipped high-risk implementation:

- Homepage source-code changes.
- Wallet balance, funding, deposit, withdrawal, faucet, and linked-wallet behavior.
- Admin visibility, admin auth, admin operation controls, and internal route access.
- Order, trade, position, ledger, matching, settlement, bot, deployment, package scripts, workflows, Prisma, and migrations.

## Checkpoint After UI-011

Tasks completed in this checkpoint:

- UI-019A/UI-022: Market detail screenshot and smoke checklist before any market-detail code.

Files added or updated:

- `docs/reviews/MARKET_DETAIL_SCREENSHOT_SMOKE_CHECKLIST.md`
- `docs/reviews/MARKET_DETAIL_DISPLAY_SHELL_PLAN.md`
- `docs/reviews/UI_STANDARDIZATION_PROGRESS.md`
- `docs/reviews/UI_PAGE_STATUS_MATRIX.md`
- `docs/reviews/README.md`
- `docs/reviews/AUTONOMOUS_EXECUTION_STATE.md`
- `docs/reviews/AUTONOMOUS_PROGRESS_REPORT.md`
- `docs/reviews/AUTONOMOUS_DECISION_LOG.md`

Validation:

- `git diff --check` passed.

Skipped high-risk implementation:

- Server startup, browser automation, screenshots, and fixture creation.
- Market-detail source-code changes.
- Order ticket, orderbook, open orders, trades, fills, positions, balances, pool actions, reference data, and bot behavior.
- Wallet, deposit, withdrawal, ledger, matching, settlement, admin auth, deployment, package scripts, workflows, Prisma, and migrations.

## Checkpoint After PR #191

Tasks completed in this checkpoint:

- UI-012A: Anonymous public route smoke checklist.

Files added or updated:

- `docs/reviews/PUBLIC_ROUTE_SMOKE_ANONYMOUS_CHECKLIST.md`

Validation:

- `git diff --check` passed.

Skipped high-risk implementation:

- Server startup, browser automation, screenshots, fixtures, and route smoke execution.
- Package scripts, workflows, Playwright config, runtime code, UI code, API behavior, auth, wallet, funding, trading, admin, bot, Prisma, migrations, deployment, secrets, and production data.

## Auto-Merge Notes

Docs-only progress updates may auto-merge after diff checks.

Display-only UI PRs may auto-merge only if they satisfy the strict UI auto-merge policy in `docs/reviews/UI_STANDARDIZATION_MASTER_PLAN.md`.

Wallet, admin finance, market-detail trade areas, pool detail actions, bot, deployment, package/workflow, Prisma, and backend/API changes remain human-reviewed by default.

## Validation For This Tracker

This tracker is docs-only. Validation:

```bash
git diff --check
```
