# UI Page Status Matrix

Task id: UI-014

Assigned subagents: LeadAgent, FrontendAgent, PlannerAgent, SecurityAgent

Risk level: Low for docs-only inventory

Status: Active page matrix

## Purpose

This matrix tracks the UI standardization state of every major route. It does not change routes, UI code, APIs, auth, wallet, ledger, trading, admin behavior, bots, deployment, Prisma, migrations, or production settings.

## Status Legend

- Done: current safe standardization pass is complete.
- Needs display polish: route can receive small display-only UI work.
- Needs state polish: loading, empty, error, or signed-out states need work.
- Needs mobile polish: layout may be hard to scan on mobile.
- Needs copy cleanup: terminology, beta copy, or CTA hierarchy needs work.
- Human-review only: autonomous work should stay docs-only or leave code PRs open.
- Blocked: requires business, funding, trading, auth, deployment, or product decision.

## Public And User Routes

| Route | Current status | Primary issue | Safe next action | Auto-merge default |
|---|---|---|---|---|
| `/` | Big milestone merged | Wallet/admin concepts still exist on page; needs smoke evidence. | Use `PUBLIC_ROUTE_SMOKE_ANONYMOUS_CHECKLIST.md` and `PUBLIC_ROUTE_SMOKE_MOBILE_VIEWPORT_CHECKLIST.md` for local anonymous smoke observations; use `HOMEPAGE_WALLET_ADMIN_SURFACE_DECISION.md` before any homepage account/admin cleanup. | Docs-only yes; code review-gated |
| `/sports` | Big milestone merged | Needs smoke/screenshot evidence. | Public route smoke evidence preparation; use `PUBLIC_ROUTE_SMOKE_MOBILE_VIEWPORT_CHECKLIST.md` and `UI_STATE_TERMINOLOGY_MAP.md` for state copy. | Docs-only yes |
| `/sports/soccer` | Big milestone merged | Needs smoke/screenshot evidence. | Public route smoke evidence preparation; use `PUBLIC_ROUTE_SMOKE_MOBILE_VIEWPORT_CHECKLIST.md` and `UI_STATE_TERMINOLOGY_MAP.md` for state copy. | Docs-only yes |
| `/sports/soccer/world-cup` | Big milestone merged | Needs smoke/screenshot evidence. | Public route smoke evidence preparation; use `PUBLIC_ROUTE_SMOKE_MOBILE_VIEWPORT_CHECKLIST.md` and `UI_STATE_TERMINOLOGY_MAP.md` for state copy. | Docs-only yes |
| `/events` | Big milestone merged | Needs smoke/screenshot evidence. | Public route smoke evidence preparation; use `PUBLIC_ROUTE_SMOKE_MOBILE_VIEWPORT_CHECKLIST.md` and `UI_STATE_TERMINOLOGY_MAP.md` for state copy. | Docs-only yes |
| `/events/[slug]` | State-copy polish merged | Event detail still includes grouped/trade behavior beyond loading/error/empty state copy. | Human review for grouped trade, fetch, polling, market-list, or order-adjacent changes; use `UI_STATE_TERMINOLOGY_MAP.md` for future copy. | No |
| `/markets` | Big milestone merged | Needs smoke/screenshot evidence. | Public route smoke evidence preparation; use `PUBLIC_ROUTE_SMOKE_MOBILE_VIEWPORT_CHECKLIST.md` and `UI_STATE_TERMINOLOGY_MAP.md` for state copy. | Docs-only yes |
| `/markets/[id]` | Big milestone touched shared header only | Market detail can touch trade/order, pool, position, bot, and wallet-adjacent behavior. | Use `MARKET_DETAIL_SCREENSHOT_SMOKE_CHECKLIST.md` before evidence or code; human review before deeper display work; use `UI_STATE_TERMINOLOGY_MAP.md` for state copy. | No |
| `/login` | Big milestone merged | Needs smoke/screenshot evidence. | Public route smoke evidence preparation; use `PUBLIC_ROUTE_SMOKE_MOBILE_VIEWPORT_CHECKLIST.md` and `UI_STATE_TERMINOLOGY_MAP.md` for state copy. | Docs-only yes |
| `/portfolio` | Big milestone touched display only | Account state and positions are calculation-adjacent. | Human review account terminology; use `UI_STATE_TERMINOLOGY_MAP.md`; calculations must remain untouched. | No |
| `/wallet` | Big milestone touched display only | Funding copy can imply production readiness. | Human review funding copy; use `UI_STATE_TERMINOLOGY_MAP.md`; no funding behavior changes. | No |
| `/create` | Big milestone touched display only | Private pools are delayed/post-MVP. | Product decision whether this route stays visible for MVP; use `UI_STATE_TERMINOLOGY_MAP.md` for state copy. | No |
| `/my-pools` | Big milestone touched display only | Optional private-pool surface. | Human review before pool behavior changes; use `UI_STATE_TERMINOLOGY_MAP.md` for state copy. | No |
| `/pool/[id]` | Done/hidden | Compatibility route only. | No UI work unless surfaced; use `UI_STATE_TERMINOLOGY_MAP.md` for state copy. | Maybe docs-only |

## Admin And Internal Routes

| Route | Current status | Primary issue | Safe next action | Auto-merge default |
|---|---|---|---|---|
| `/admin` | Big milestone touched display framing only | Dense market operations console with mutation paths. | Human review before any admin mutation/permission changes. | No |
| `/admin/deposits` | Human-review only | Funding/reconciliation high risk. | Docs/screenshot requirements only. | No |
| `/admin/withdrawals` | Human-review only | Withdrawal operations critical risk. | Docs/screenshot requirements only. | No |
| `/admin/reference-markets` | Human-review only | Reference and bot/liquidity concerns overlap. | Split curation vs bot controls plan. | No |
| `/admin/bots` | Human-review only | Dry-run/live state must be explicit. | Display review/runbook docs first. | No |
| `/admin/agents` | Planned/review-gated | Agent status should not imply production autonomy. | Read-only display copy only after UI-025. | No by default |
| `/admin/system` | Planned/review-gated | Readiness severity needs clearer hierarchy. | Read-only status grouping only after UI-025. | No |
| `/admin/markets/[marketId]/invariants` | Human-review only | Financial invariants are high risk. | Keep review-gated. | No |

## Completed UI PRs

| PR | Route/surface | Result |
|---|---|---|
| #154 | `/my-pools` | Private pool list display polish and lint-safe initial load. |
| #158 | `/` | Sports-first beta copy and homepage CTA simplification. |
| #160 | `/sports`, `/sports/soccer`, `/sports/soccer/world-cup` | Sports discovery copy polish and non-demo World Cup framing. |
| #163 | `/events` | Events list display/state polish. |
| #164 | `/login` | Beta-safe login display polish. |
| #166 | `/markets` | Markets discovery display polish and beta-safe empty/fallback states. |
| #175 | App-wide display shell | Shared display primitives and page-level standardization milestone. |
| #176 | UI state docs | Post-merge status refresh after PR #175. |
| #203 | `/events/[slug]` | Loading/error/empty state copy polish without grouped trade/order behavior changes. |
| #209 | UI state docs | Checkpoint refresh after PR #203. |

## Next Queue

1. Public route smoke evidence for `/`, `/sports`, `/events`, `/markets`, `/login`; `PUBLIC_ROUTE_SMOKE_ANONYMOUS_CHECKLIST.md` and `PUBLIC_ROUTE_SMOKE_MOBILE_VIEWPORT_CHECKLIST.md` are ready and should be used before the first local anonymous run.
2. Portfolio header/empty-state copy only if calculations remain untouched.
3. Admin read-only display implementation only with explicit scope and full validation.

Completed queue item:

- UI-010: Cross-page empty/loading/error terminology map in `docs/reviews/UI_STATE_TERMINOLOGY_MAP.md`.
- UI-011: Homepage wallet/admin surface decision in `docs/reviews/HOMEPAGE_WALLET_ADMIN_SURFACE_DECISION.md`.
- UI-019A/UI-022: Market detail screenshot/smoke checklist in `docs/reviews/MARKET_DETAIL_SCREENSHOT_SMOKE_CHECKLIST.md`.
- UI-012A: Anonymous route smoke checklist in `docs/reviews/PUBLIC_ROUTE_SMOKE_ANONYMOUS_CHECKLIST.md`.
- UI-020A: Mobile viewport route smoke checklist in `docs/reviews/PUBLIC_ROUTE_SMOKE_MOBILE_VIEWPORT_CHECKLIST.md`.
- UI-018A: Event detail loading/error/empty state copy polish merged as PR #203.

## Validation

This matrix is docs-only. Validation:

```bash
git diff --check
```
