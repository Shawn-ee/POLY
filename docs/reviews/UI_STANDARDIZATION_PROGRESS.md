# UI Standardization Progress

Task id: UI-000-PROGRESS

Assigned subagents: LeadAgent, FrontendAgent, DocsAgent, TestingAgent, SecurityAgent

Risk level: Low for docs-only progress tracking

Status: Active progress tracker

## Purpose

This tracker records UI standardization progress, merged PRs, open PRs, blocked decisions, validation evidence, and next UI tasks.

It does not change UI code, product logic, wallet/deposit/withdrawal behavior, ledger, matching, settlement, admin auth, bot behavior, deployment, Prisma, migrations, secrets, or production behavior.

## Current Dev Checkpoint

Current known `dev` checkpoint after the markets display pass: `4b9a9b8`.

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
| `/portfolio` | Portfolio mobile card spec | Needs review-gated display task | Do not change calculations. |
| `/wallet` | Account risk disclosure spec, safety docs | Human-reviewed by default | Display/copy only after funding-claim review. |
| `/login` | IA and risk copy docs, PR #164 | Improved with beta-safe copy and lint-safe error display | Later add route smoke/screenshot evidence. |
| `/create` | IA and page review | Delayed/post-MVP | Keep out of public MVP navigation. |
| `/my-pools` | PR #154 | Improved in focused PR | Further work must stay small and display-only. |
| `/pool/[id]` | IA | Hidden compatibility | No UI work planned. |
| `/admin` | Page review | Human-reviewed by default | Admin IA plan before code. |
| `/admin/deposits` | PR #25 review docs | Human-reviewed | Do not change funding behavior. |
| `/admin/withdrawals` | PR #25 review docs | Human-reviewed | Do not change withdrawal behavior. |
| `/admin/reference-markets` | Page review | Human-reviewed | Separate curation from bot controls in docs first. |
| `/admin/bots` | Bot docs | Human-reviewed | Keep dry-run/live boundaries visible. |
| `/admin/agents` | Page review | Internal | Copy clarity only if safe. |
| `/admin/system` | Page review | Human-reviewed | Readiness/severity plan first. |
| `/admin/markets/[marketId]/invariants` | Financial safety docs | Human-reviewed | Keep review-gated. |

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
2. UI-006: Portfolio empty/mobile-state display plan before code.
3. UI-007: Wallet funding-claim copy review before any wallet UI change.
4. UI-008: Admin IA display plan before admin UI changes.
5. UI-009: Market-detail display-state plan before code.
6. UI-010: Cross-page empty/loading/error terminology map.
7. UI-011: Homepage wallet/admin surface decision, docs-only before further homepage code.
8. UI-020: Login, homepage, sports, events, and markets mobile smoke evidence.
9. UI-021: Event detail loading/error/empty copy PR only if it avoids grouped trade behavior.
10. UI-022: Market detail screenshot/smoke checklist before any code.

## Blocked UI Decisions

- Whether to close PR #25 as superseded.
- Whether private pools are part of public MVP or internal-only.
- Whether wallet funding actions should be visible during beta.
- Whether admin finance pages should receive UI polish before funding architecture approval.
- Whether market detail target-contract cleanup happens before more market detail UI changes.
- Whether UI smoke tests get a package script or workflow lane.

## Auto-Merge Notes

Docs-only progress updates may auto-merge after diff checks.

Display-only UI PRs may auto-merge only if they satisfy the strict UI auto-merge policy in `docs/reviews/UI_STANDARDIZATION_MASTER_PLAN.md`.

Wallet, admin finance, market-detail trade areas, pool detail actions, bot, deployment, package/workflow, Prisma, and backend/API changes remain human-reviewed by default.

## Validation For This Tracker

This tracker is docs-only. Validation:

```bash
git diff --check
```
