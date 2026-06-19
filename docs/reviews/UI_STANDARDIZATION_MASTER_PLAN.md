# UI Standardization Master Plan

Task id: UI-000

Assigned subagents: LeadAgent, FrontendAgent, ReviewerAgent, SecurityAgent

Risk level: Medium by product scope, low for this docs-only plan

Status: Master plan, no implementation

## Purpose

This plan defines how POLY should standardize the user interface through small, reviewable PRs. It does not change UI code, API behavior, wallet funding, ledger logic, trading, admin auth, bot behavior, deployment, Prisma, migrations, secrets, or production behavior.

## UI North Star

POLY should feel like a simple, trustworthy, sports-first prediction market:

- Browse sports and events first.
- Understand each market as a clear Yes/No question.
- See price and probability without needing orderbook knowledge.
- Track account, portfolio, and wallet state without ambiguity.
- Keep admin, bot, funding, ledger, and deployment tools visibly internal.
- Treat public beta and funding as gated until humans approve launch decisions.

The UI should be quiet, direct, mobile-friendly, and confidence-building. It should not feel like an exchange control panel for normal users.

## Design Principles

- One primary action per page section.
- Sports/event discovery before advanced market filtering.
- Plain-language states before financial jargon.
- Compact cards on mobile, denser tables only where appropriate.
- Consistent labels for status, price, probability, positions, open orders, and beta funding.
- Shared primitives before page-specific styling: `PageContainer`, `Card`, `Button`, `Badge`, and state components.
- Internal/admin surfaces must look operational, not promotional.
- No UI should imply production deposits, withdrawals, live bot trading, or public beta readiness before human approval.

## Navigation Principles

Anonymous users:

- Primary: `Sports`
- Secondary: `Markets`
- Account: `Login`

Logged-in users:

- Primary: `Sports`
- Secondary: `Markets`
- Account home: `Portfolio`
- Account/funding state: `Wallet`

Admins:

- Normal logged-in navigation plus `Admin`.
- Admin, bot, agent, system, deposit, withdrawal, and invariant pages stay out of normal user navigation.

Private pools:

- Keep `/create`, `/my-pools`, and `/pool/[id]` outside the sports-first public MVP path unless a later human product decision includes private pools.

## Layout Principles

- Normal pages use a constrained content width with predictable vertical rhythm.
- Cards should represent items, summaries, or repeated rows, not whole page sections nested inside other cards.
- Use compact headers with title, short support copy, and one primary CTA.
- Keep filters secondary and avoid wide chip rows on mobile.
- Prefer event-first groupings for sports pages.
- Keep action controls near their context, but visually separate dangerous actions.
- Avoid showing admin/funding/bot concepts in public page empty states.

## Page Hierarchy

Primary user pages:

- `/`
- `/sports`
- `/sports/soccer`
- `/sports/soccer/world-cup`
- `/events/[slug]`
- `/markets/[id]`
- `/portfolio`
- `/login`

Secondary user pages:

- `/markets`
- `/events`
- `/wallet`

Internal or delayed pages:

- `/create`
- `/my-pools`
- `/pool/[id]`

Admin-only pages:

- `/admin`
- `/admin/deposits`
- `/admin/withdrawals`
- `/admin/reference-markets`
- `/admin/bots`
- `/admin/agents`
- `/admin/system`
- `/admin/markets/[marketId]/invariants`

## Mobile-First Rules

- Every public page must read as one column on mobile.
- Cards and buttons must not rely on horizontal scrolling.
- Long market titles should wrap without pushing buttons off-screen.
- Dense tables need card alternatives before public beta.
- Primary CTAs should remain visible and understandable without opening advanced panels.
- Empty/loading/error states must be legible at phone width.

## Empty, Loading, And Error State Rules

Every major page should define:

- Loading: short, non-technical, route-specific.
- Empty: explains what is missing and the next safe action.
- Error: says what failed and whether retrying is possible.
- Signed-out: public read pages remain browsable; account pages explain login.
- Beta unavailable: wallet/funding/trading limitations use honest beta copy.

State copy must not say "create this in admin" to normal users.

## Beta-Warning Rules

Use beta warnings when a page could imply production readiness:

- Wallet/funding.
- Portfolio/account balances.
- Trading/order review.
- Admin deposit/withdrawal pages.
- Bot/liquidity pages.
- Public beta launch/readiness pages.

Warnings should be contextual and short. They should not bury the page in legal text, but they must not overpromise deposits, withdrawals, liquidity, settlement timing, or bot behavior.

## Trading-Safety UI Boundaries

Display-only UI may clarify:

- Market question.
- Yes/No outcomes.
- Price/probability labels.
- Status: open, paused, resolved, canceled.
- Empty/no-liquidity state.
- Open-order and position labels if values already exist.

Autonomous UI work must not change:

- Order placement.
- Order cancellation.
- Matching.
- Settlement.
- Fills, trades, positions.
- Balance or locked-balance calculations.
- Order ticket or trade ticket behavior.

Any trade-ticket change is human-reviewed unless explicitly display-only and specialist-reviewed.

## Wallet And Account Display Boundaries

Allowed display-only work:

- Clarify available, locked, and total balance labels if already computed.
- Add beta-safe copy.
- Improve mobile account cards.
- Improve empty states.
- Explain disabled or gated funding.

Forbidden autonomous work:

- Enabling deposits or withdrawals.
- Changing wallet address generation or monitor behavior.
- Changing private-key handling.
- Changing withdrawal request, approval, rejection, or completion behavior.
- Changing ledger or balance mutation logic.

Wallet UI PRs are human-reviewed by default.

## Admin UI Boundaries

Allowed display-only work:

- Clarify internal/admin-only labels.
- Group read-only information separately from mutation controls.
- Add status badges and empty states.
- Improve table readability.
- Add warnings for high-risk operations.

Forbidden autonomous work:

- Admin auth behavior.
- Permission checks.
- Deposit/withdrawal mutation behavior.
- Market resolution semantics.
- Bot controls or live-trading behavior.
- System/deployment operations.

Admin UI PRs touching deposits, withdrawals, bots, system, or invariants are human-reviewed by default.

## Auto-Merge Boundaries

Docs-only PRs may auto-merge when:

- Files are limited to `docs/**/*.md`.
- `git diff --check` and staged diff checks pass.
- ReviewerAgent and SecurityAgent self-review pass.

Display-only UI PRs may auto-merge only when all are true:

- The PR is small, narrow, reversible, and one page/surface.
- Changed files are limited to safe display UI pages/components.
- No backend/API behavior changes.
- No order/trade/wallet/balance/auth/admin/bot/deployment behavior changes.
- No Prisma, package, workflow, script, dependency, or secret changes.
- Full validation and focused lint pass.
- ReviewerAgent, SecurityAgent, and FrontendAgent self-review pass.
- No merge conflicts.

Human review is required for:

- PR #25.
- Broad UI rewrites.
- Wallet/funding pages.
- Admin finance pages.
- Pool detail or trade-ticket changes.
- Package/workflow/script changes.
- Anything with ambiguous behavior impact.

## Phased UI Roadmap

Phase 0: UI inventory and standards.

- Maintain this master plan and progress tracker.
- Inventory current pages, components, duplicated layouts, inconsistent copy, confusing CTAs, and mobile risks.

Phase 1: Public homepage and market discovery display.

- Simplify `/`.
- Make `/markets` a secondary browser.
- Align `/events` with event-first discovery.
- Add consistent empty/loading/error states.

Phase 2: Sports-first event pages.

- Promote `/sports`, `/sports/soccer`, and `/sports/soccer/world-cup`.
- Improve event grouping and status labels.
- Keep funding/admin/bot copy out of public sports pages.

Phase 3: Market detail display polish.

- Clarify question, status, outcomes, price/probability, and no-liquidity states.
- Do not touch order placement, order cancellation, wallet, or matching.

Phase 4: Portfolio and account display clarity.

- Add mobile cards, empty states, and risk copy.
- Do not change balance, position, ledger, or order calculations.

Phase 5: Wallet beta-safe display.

- Clarify beta funding state and disabled/gated actions.
- Do not enable money movement or change wallet logic.

Phase 6: Admin UI organization.

- Improve internal IA and display clarity.
- Keep auth, permissions, mutations, and operations unchanged.

Phase 7: Private pools and my-pools polish.

- Use PR #154 as the accepted small replacement example.
- Split PR #25 surfaces; do not merge PR #25 directly.

Phase 8: Cross-page consistency.

- Standardize status labels, beta copy, buttons, cards, and state components.

Phase 9: Evidence and testing.

- Keep UI smoke plans, route evidence, and public no-leak tests current.
- Avoid production data and real credentials.

## Page-By-Page Target State

| Route | Target state | First safe task | Auto-merge default |
|---|---|---|---|
| `/` | Simple sports-first entry with beta-safe copy and one primary CTA. | Small homepage display simplification. | Maybe |
| `/markets` | Secondary all-market browser with clear filters and mobile cards. | Display inventory before code. | Maybe |
| `/markets/[id]` | Clear market detail with simple outcome/status hierarchy. | Docs/test gates before UI. | No by default |
| `/events` | Event browser aligned with sports-first route structure. | Display-only state cleanup. | Maybe |
| `/events/[slug]` | Main event detail and grouped market surface. | Event-page implementation plan first. | No by default |
| `/sports` | Primary sports discovery page. | Display-only polish after smoke checklist. | Maybe |
| `/sports/soccer` | Soccer discovery page. | Display-only empty/status copy. | Maybe |
| `/sports/soccer/world-cup` | World Cup MVP showcase. | Remove demo framing if present. | Maybe |
| `/portfolio` | Account home for positions, orders, activity, and beta state. | Mobile-card plan or display-only empty state. | No by default |
| `/wallet` | Beta-safe account/funding state. | Funding-claim copy review before UI. | No |
| `/login` | Simple trustworthy sign-in. | Copy polish only. | Maybe |
| `/create` | Delayed private-pool creation tool. | Hide/delay plan. | No by default |
| `/my-pools` | Optional private-pool management. | PR #154 merged; future work must stay focused. | Maybe only if strict |
| `/pool/[id]` | Hidden compatibility route. | No UI work unless surfaced accidentally. | Maybe docs-only |
| `/admin` | Internal market/content console. | Admin IA display plan. | No by default |
| `/admin/deposits` | Internal deposit/reconciliation console. | Docs/screenshot evidence only first. | No |
| `/admin/withdrawals` | Internal withdrawal operations console. | Docs/screenshot evidence only first. | No |
| `/admin/reference-markets` | Internal curation/reference console. | Split curation vs bot controls plan. | No |
| `/admin/bots` | Internal bot/risk monitor. | Dry-run/live display review. | No |
| `/admin/agents` | Internal agent monitor. | Copy clarity only. | No by default |
| `/admin/system` | Internal readiness/health console. | Severity/status display plan. | No |
| `/admin/markets/[marketId]/invariants` | Internal invariant/reconciliation view. | Keep review-gated. | No |

## Current Component Inventory

Shared UI primitives already exist:

- `src/components/ui/PageContainer.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/States.tsx`
- `src/components/ui/OutcomeButton.tsx`

Market/sports components already exist:

- `src/components/MarketCard.tsx`
- `src/components/EventCard.tsx`
- `src/components/sports/SportsEventCard.tsx`
- `src/components/sports/SportsEventsPage.tsx`
- `src/components/market/shared/MarketHeader.tsx`
- `src/components/market/shared/MarketStatusBadge.tsx`

Future UI standardization should prefer these primitives before adding new abstractions.

## Non-Goals

This plan does not:

- Implement UI changes.
- Merge PR #25.
- Change funding, ledger, trading, auth, bot, deployment, Prisma, migrations, package scripts, workflows, or secrets.
- Approve public beta.

## Validation For This Plan

This plan is docs-only. Validation:

```bash
git diff --check
```
