# Cycle LL - Mobile Event Listed Market Filter Contract

Gate status: Pass

## Scope

- Ensure visible Home/Search/Live/Futures event pages are filtered by backend-visible markets before pagination.
- Prevent no-market events from consuming page slots or killing `nextCursor` after post-fetch filtering.
- Keep scope to `/api/events`; no visual redesign, orderbook work, chat, or live-stats product work.

## Evidence

- Harness proof: `docs/mobile/harness/cycle-LL-mobile-event-listed-market-filter-contract/cycle-LL-mobile-event-listed-market-filter-contract.json`
- Proof script: `scripts/prove_mobile_event_list_listed_market_filter_contract.ts`
- Backend tests:
  - `src/__tests__/public.events.no-leak.test.ts`

## Results

| Requirement | Result | Notes |
| --- | --- | --- |
| Default event pages require public listed markets | Pass | `Event` query includes `markets.some.visibility=PUBLIC` and `isListed=true`. |
| Futures aliases remain backend-owned | Pass | `future`, `futures`, and `outright` map to `future|outright`. |
| Futures pages require listed futures/outrights | Pass | Market type constraint is applied inside the pre-pagination event filter. |
| Route filters before pagination | Pass | The same listed-market filter is used in the event `where` clause, not only after fetch. |

## Decision

- Pass/fail: Pass.
- Unresolved P0 gaps: 0 for focused listed-market event pagination contract.
- Remaining P1/P2: existing provider metric/ranking breadth remains tracked outside this focused contract.
