# Cycle LG - Event Detail Quote Failure Contract

Gate status: Pass

## Scope

- Stop Event Detail server-mode quote refresh from silently ignoring failed `/api/markets/:id/quote` calls.
- Keep successful quote hydration behavior unchanged.
- Mark failed quote markets unavailable so the existing ticket submit guard blocks stale guessed prices.
- Keep scope to backend/data correctness, not visual polish.

## Evidence

- Harness proof: `docs/mobile/harness/cycle-LG-event-detail-quote-failure-contract/cycle-LG-event-detail-quote-failure-contract.json`
- Proof script: `scripts/prove_mobile_event_detail_quote_failure_contract.ts`
- Mobile tests:
  - `mobile/src/__tests__/quoteService.test.ts`
  - `mobile/src/__tests__/orderService.test.ts`

## Results

| Requirement | Result | Notes |
| --- | --- | --- |
| Successful quote route responses still update outcomes | Pass | Proof updates ready market probability from route quote state. |
| Failed quote route calls are tracked per market id | Pass | `loadMarketQuoteStateById` returns `failedMarketIds`. |
| Failed quote markets are marked unavailable | Pass | Event Detail quote refresh applies `source=market-quote-route`, `status=unavailable`. |
| Submit is blocked for quote-failed markets | Pass | Existing order guard returns `Market quote route failed.` |

## Decision

- Pass/fail: Pass.
- Unresolved P0 gaps: 0 for focused Event Detail quote failure contract.
- Remaining P1/P2: richer retry copy if product wants a visible quote-refresh retry action.
