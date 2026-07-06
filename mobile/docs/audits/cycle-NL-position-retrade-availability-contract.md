# Cycle NL Position Re-Trade Availability Contract

Date: 2026-07-06

Scope:

- Portfolio position Buy/Sell re-trade ticket target availability.
- `/api/portfolio` position `market.availability` state before opening Trade Ticket from Portfolio.

Out of scope:

- Portfolio visual redesign.
- Order book UI.
- Partial cashout.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Matched local market uses backend Portfolio availability | Pass | `docs/mobile/harness/cycle-NL-position-retrade-availability-contract/cycle-NL-position-retrade-availability-contract.json` |
| Backend unavailable status blocks matched re-trade target | Pass | NL proof `matchedLocalMarketBlocksOrders=true` |
| Backend-only fallback target keeps Portfolio availability | Pass | NL proof `fallbackMarketUsesPortfolioAvailability=true` |
| Backend unavailable status blocks fallback re-trade target | Pass | NL proof `fallbackMarketBlocksOrders=true` |

Implementation notes:

- Portfolio position re-trade targets now treat server-mode `position.marketAvailability` as authoritative.
- If a position matches a locally loaded market, backend Portfolio unavailable/suspended status overrides local market availability before Trade Ticket opens.
- Existing fallback backend-only targets continue to carry Portfolio availability into the Trade Ticket order guard.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/positionTradeTargetService.test.ts mobile/src/__tests__/orderService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_position_retrade_availability_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Portfolio row copy for backend-disabled re-trade markets.
