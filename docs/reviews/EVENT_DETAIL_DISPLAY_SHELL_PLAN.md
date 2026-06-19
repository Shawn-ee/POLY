# Event Detail Display Shell Plan

Task id: UI-018

Assigned subagents: LeadAgent, FrontendAgent, SecurityAgent, LedgerWalletReviewerAgent

Risk level: Medium because `/events/[slug]` is adjacent to grouped trade selection and order placement.

Status: Planning-only. No UI code, API behavior, wallet, ledger, matching, settlement, auth, bot, deployment, Prisma, migration, or production behavior is changed by this document.

## Purpose

`/events/[slug]` should become a clear event-first page where users can understand the event, related Yes/No markets, status, timing, and available prices before considering any trading interaction.

Because the current page imports `GroupedTradeTicket` and supports grouped row trade selection, autonomous UI work must separate safe display-shell polish from trade/order behavior.

## Current Surface

The route currently handles:

- Event metadata loading from `/api/events/[slug]`.
- Grouped market loading from `/api/events/[slug]/grouped-markets`.
- Standard event market loading from `/api/events/[slug]/markets`.
- Grouped event rows with Yes/No trade buttons.
- `GroupedTradeTicket` selection and order placement callback paths.
- Sports event presentation with market filters.
- Missing/error/loading states.

## Target Display Shell

The target shell should make the page understandable in this order:

1. Event identity: title, sport/league/category, status, and start/resolution timing.
2. Beta-safe context: prices and liquidity are discovery information; trading/funding safeguards remain separate.
3. Market group summary: number of related markets and whether grouped outcomes are complete.
4. Primary market list: clear Yes/No or outcome cards with price/probability labels when already available.
5. Advanced details: orderbook, liquidity, freshness, and bot/reference data are visually secondary.
6. Trade area: clearly separated and review-gated.

## Safe Autonomous UI Scope

Future autonomous PRs may touch only display shell code if all changes are small, reversible, and fully validated:

- Page header hierarchy and copy.
- Read-only event metadata layout.
- Read-only market list/card spacing.
- Read-only badges for status, sport, league, grouped state, and beta state.
- Loading state copy and skeleton placement.
- Empty state for no related markets.
- Error state copy that routes users back to sports or markets.
- Mobile stacking for read-only sections.

## Forbidden Autonomous UI Scope

Future autonomous PRs must not change:

- `GroupedTradeTicket` behavior.
- `selectedTrade` behavior.
- `onSelectTrade`, `onCloseTrade`, or `onOrderPlaced` behavior.
- Buy Yes / Buy No button semantics.
- Order placement, cancellation, matching, fills, trades, positions, settlement, or wallet behavior.
- API fetch endpoints, request parameters, polling interval, or response parsing.
- Auth/session behavior.
- Admin or bot operational behavior.
- Prisma schema or migrations.

## Suggested Split PRs

| Task | Scope | Files likely affected | Auto-merge default |
|---|---|---|---|
| UI-018A | Event detail loading/error/empty copy only | `src/app/events/[slug]/page.tsx` | Maybe, if no trade/order code changes |
| UI-018B | Event metadata header display only | `src/app/events/[slug]/page.tsx` | Maybe, if no API or trade behavior changes |
| UI-018C | Read-only market card/list spacing | `src/app/events/[slug]/page.tsx` | Maybe, if no selection behavior changes |
| UI-018D | Grouped trade area visual separation | `src/app/events/[slug]/page.tsx` | Human review by default |
| UI-018E | Mobile screenshot/smoke evidence | `docs/reviews/` | Docs-only yes |

## Acceptance Criteria For Future Code PRs

A future display-only event-detail PR is acceptable only when:

- The diff is limited to read-only presentation, labels, copy, spacing, or empty/loading/error states.
- No fetch URLs, request parameters, polling, state transitions, selected trade behavior, or order callbacks change.
- Full validation passes.
- Focused lint for `src/app/events/[slug]/page.tsx` passes.
- PR body clearly states whether grouped trade UI was touched.
- SecurityAgent and LedgerWalletReviewerAgent self-review both pass.

## Validation Commands For Future Code PRs

```bash
git diff --check
git diff --cached --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npm run lint -- "src/app/events/[slug]/page.tsx"
```

## Non-Goals

This plan does not:

- Implement event detail UI changes.
- Change trading behavior.
- Change order placement or cancellation.
- Change wallet, ledger, balance, deposit, withdrawal, matching, settlement, positions, auth, admin, bot, deployment, Prisma, migration, package, workflow, script, or secret behavior.
- Approve public beta or real-money launch.
