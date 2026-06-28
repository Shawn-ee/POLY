# World Cup Polymarket Structure Refactor

Updated: 2026-06-28

Branch: `agent/world-cup-polymarket-structure-refactor`

Objective: make the Holiwyn World Cup event page structurally close to a Polymarket-style sports event trading page for closed internal beta with test/internal balances only.

## Safety Boundary

This refactor does not enable real money, deposits, withdrawals, wallet custody, private-key workers, external-fund bots, automatic import, or automatic promotion.

Required runtime assumptions remain:

- `REAL_MONEY_MODE=false`
- `INTERNAL_FUNDING_BETA_ENABLED=false`
- `FUNDING_KILL_SWITCH=true`
- `ALLOW_AUTO_DEPOSIT_CREDIT=false`
- `LOCAL_BOT_TRADING_ONLY=true`
- `POLYMARKET_AUTO_IMPORT_ENABLED=false`
- `POLYMARKET_AUTO_PROMOTE_ENABLED=false`

## Target Architecture

The event page should render:

```text
event
-> event header
-> optional combo section
-> category tabs
-> market families
-> line selectors
-> outcomes with real prices/source labels
-> right-side trade ticket
-> admin/runtime/debug visibility
```

## Current Implementation Direction

- Pure normalized model: `src/lib/sports/worldCupEventPageModel.ts`.
- Model-driven UI: `src/components/sports/WorldCupEventTradingPage.tsx`.
- Public normalized API: `GET /api/events/[slug]/world-cup-model`.
- Admin runtime API/page: `GET /api/admin/runtime` and `/admin/runtime`.
- Runtime CLI: `npm run runtime:closed-beta:status`.
- Safe MM basket CLI: `npm run mm:polymarket:enable-safe-basket -- --maxMarkets=5` with `--confirm` required to write dry-run configs.
- Existing market serialization now preserves missing prices as `null` instead of manufacturing `0.5`.

## Price Source Rules

1. Fresh local/internal orderbook quote exists: show bid/ask and source `Local book`.
2. Else fresh reference price exists: show reference price and source `Reference`; disable trading with explanation.
3. Else mapped but stale: show `Stale price`; disable trading.
4. Else unmapped: show `Not mapped`; disable trading.
5. Else: show `No live price`; disable trading.

Never show fake `50%`. Never show unexplained `-- / --`.

## Tradeability Rules

Tradeability requires:

- internal beta trading enabled
- real-money mode false
- kill switch false
- event and market open
- outcome active/tradable
- local/internal orderbook liquidity exists for market order execution, or limit-only internal orderbook placement is explicitly supported
- no funding, withdrawal, wallet custody, or external order requirement

## Bot Liquidity Strategy

The target local beta basket is 3-5 active mapped World Cup markets:

- Match Winner / Moneyline
- Total Goals main line
- Both Teams to Score
- Team to Advance if available
- Spread main line if available

Any automatic config creation must be manual/admin-gated or CLI-confirmed. Dry-run must be the default.

Implemented command:

```sh
npm run mm:polymarket:enable-safe-basket -- --maxMarkets=5
npm run mm:polymarket:enable-safe-basket -- --maxMarkets=5 --confirm
```

The command refuses `REAL_MONEY_MODE=true` and requires `LOCAL_BOT_TRADING_ONLY=true`. Confirm mode creates enabled dry-run `BotQuoteConfig` rows only; it does not create live internal orders or external orders.

## Admin Runtime Status

Implemented:

- `/admin/runtime`
- `GET /api/admin/runtime`
- `npm run runtime:closed-beta:status`

Runtime status includes:

- reference sync heartbeat
- reference snapshot totals/fresh/stale counts
- MM config and intent counts
- open internal orders
- World Cup mapped/unmapped counts
- hidden stale event count
- public draft leak count
- risk alerts
- safety flags without secret values
- owner testing readiness

## Test Plan

Focused tests:

```sh
npx jest --runInBand --detectOpenHandles src/__tests__/world-cup-event-page-model.test.ts src/__tests__/world-cup-market-structure.test.ts src/__tests__/polymarket-mm-safe-basket.test.ts src/__tests__/admin-runtime-safety.test.ts
npx tsc --noEmit --pretty false --incremental false
npm run build
```

## Deployment Plan

Use `agent-orchestrator/docs/WORLD_CUP_POLYMARKET_STRUCTURE_SERVER_DEPLOYMENT.md` for the server handoff. The server must remain closed-beta only and must keep real-money/funding/wallet workers disabled.

## Rollback Plan

1. Stop/pause MM:

```sh
npm run mm:polymarket:pause-all
npm run polymarket-mm:stop
```

2. Stop optional loops on server.
3. Revert to the previous known-good commit.
4. Re-run build validation.
5. Restart web only.

No destructive data changes are introduced by this refactor.

## Remaining Gaps

- The event-page trade ticket still opens/frames the internal order flow rather than fully submitting from the event page.
- Safe basket confirm creates dry-run configs only; live-local order placement still requires separate guarded `mm:polymarket:live-local-once`.
- Visual polish and Playwright screenshot verification remain next-step work.
- The Next.js multiple-lockfile workspace-root warning still exists.
