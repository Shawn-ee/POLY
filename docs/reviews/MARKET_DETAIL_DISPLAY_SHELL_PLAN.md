# Market Detail Display Shell Plan

Task id: UI-019

Assigned subagents: LeadAgent, FrontendAgent, SecurityAgent, LedgerWalletReviewerAgent, BotAgent

Risk level: High by topic because `/markets/[id]` routes into orderbook, order ticket, positions, pool betting, bot/reference, and market-making surfaces.

Status: Planning-only. No market detail code, API behavior, order behavior, wallet behavior, ledger, matching, settlement, auth, admin, bot runtime, deployment, Prisma, migration, package, workflow, script, secret, or production behavior is changed by this document.

## Purpose

`/markets/[id]` should help a user understand a single market before any action:

- What the market asks.
- What the outcomes mean.
- Whether the market is live, resolved, canceled, coming soon, or limited.
- What Yes/No prices or probabilities mean when already available.
- Why liquidity, orderbook depth, and reference data may be incomplete during beta.

The page currently routes through `MarketView` into either `OrderbookMarketView` or `PoolMarketView`, so autonomous work must avoid changing trading, betting, balances, positions, order placement, cancellation, bot/reference operations, or pool actions.

## Current Surface

Current route and component boundaries:

- `src/app/markets/[id]/page.tsx` reads the market with Prisma and passes it to `MarketView`.
- `src/components/market/MarketView.tsx` selects orderbook or pool view by mechanism.
- `src/components/market/orderbook/OrderbookMarketView.tsx` owns orderbook display, order submission, cancellation, positions, reference plan, and bot/reference diagnostics.
- `src/components/market/orderbook/OrderTicket.tsx` owns order form behavior.
- `src/components/market/pool/PoolMarketView.tsx` delegates to `PoolMarketDetail`.
- `src/components/PoolMarketDetail.tsx` owns private pool join, bet, resolve, and cancel actions.

## Target Display Shell

The target market detail shell should prioritize:

1. Market title, description, event link, and status.
2. Outcome clarity: Yes/No or named outcomes, with probability/price labels when already available.
3. Beta-safe explanation: prices and liquidity can be incomplete; funding/trading safeguards are separate.
4. Market state: live, resolved, canceled, coming soon, reference-only, no liquidity, or unavailable.
5. Simple read-only market facts before any action area.
6. Advanced sections: orderbook, trades, bot/reference, positions, and pool actions should be visually separated and review-gated.

## Safe Autonomous Scope

Future autonomous PRs may be considered only for read-only display shell work:

- Header copy and layout around existing market metadata.
- Status badge placement and wording.
- Read-only outcome display labels.
- Loading, not-found, no-liquidity, and coming-soon copy.
- Read-only separation labels such as `Market summary`, `Prices`, `Advanced orderbook`, or `Beta status`.
- Mobile spacing for read-only sections.
- Docs-only or smoke evidence updates.

Even these changes must run full validation and focused lint.

## Forbidden Autonomous Scope

Future autonomous PRs must not change:

- `OrderTicket` behavior.
- Order placement or cancellation.
- Open-order, trade, fill, or position calculations.
- Wallet balance display or calculation logic.
- Pool join, bet, resolve, or cancel behavior.
- API fetch endpoints, request payloads, polling behavior, or response parsing.
- Reference/liquidity/bot runtime behavior.
- Market-making settings, dry-run/live behavior, or risk limits.
- Prisma schema, migrations, package scripts, workflows, executable scripts, deployment config, or secrets.

## Suggested Split PRs

| Task | Scope | Files likely affected | Auto-merge default |
|---|---|---|---|
| UI-019A | Docs-only market-detail screenshot/smoke checklist | `docs/reviews/` | Yes if docs-only |
| UI-019B | Not-found/loading/coming-soon display copy | `src/app/markets/[id]/page.tsx`, read-only display component if needed | Maybe, strict review |
| UI-019C | Read-only market header spacing and beta copy | `src/components/market/shared/MarketHeader.tsx` or market page shell | Maybe, strict review |
| UI-019D | Orderbook section visual separation only | `src/components/market/orderbook/OrderbookMarketView.tsx` | Human review by default |
| UI-019E | Pool market detail display polish | `src/components/PoolMarketDetail.tsx` | Human review by default |
| UI-019F | Any trade/order/pool action form change | orderbook or pool action files | Not auto-mergeable |

## Acceptance Criteria For Future Code PRs

A future market-detail display PR is acceptable only when:

- It is small, reversible, and limited to read-only layout/copy/state presentation.
- It has reviewed `docs/reviews/MARKET_DETAIL_SCREENSHOT_SMOKE_CHECKLIST.md` before any screenshot or smoke evidence is captured.
- No order, trade, pool, wallet, position, bot, reference, API, or Prisma behavior changes.
- The PR body identifies whether orderbook or pool action-bearing components were touched.
- Full validation passes.
- Focused lint for every changed UI file passes.
- ReviewerAgent, SecurityAgent, FrontendAgent, LedgerWalletReviewerAgent, and BotAgent reviews pass when relevant.

## Validation Commands For Future Code PRs

```bash
git diff --check
git diff --cached --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npm run lint -- <changed-ui-files>
```

## Non-Goals

This plan does not:

- Implement market detail UI changes.
- Change public or private market access.
- Change order placement, cancellation, matching, fills, trades, positions, balances, wallet, deposits, withdrawals, settlement, admin auth, bot runtime, liquidity, deployment, Prisma, migrations, packages, workflows, scripts, secrets, or production behavior.
- Approve real-money trading, public beta, or production launch.
