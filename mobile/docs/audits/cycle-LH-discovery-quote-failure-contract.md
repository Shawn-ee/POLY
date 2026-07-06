# Cycle LH - Discovery Quote Failure Contract

Gate status: Pass

## Scope

- Extend quote-failure handling from Event Detail refresh to Home, Live, Search, and Futures discovery hydration.
- Keep successful quote hydration behavior unchanged.
- Mark quote-failed discovery markets unavailable so card/ticket paths cannot submit stale guessed prices.
- Keep scope to backend/data correctness, not visual polish.

## Evidence

- Harness proof: `docs/mobile/harness/cycle-LH-discovery-quote-failure-contract/cycle-LH-discovery-quote-failure-contract.json`
- Proof script: `scripts/prove_mobile_discovery_quote_failure_contract.ts`
- Mobile tests:
  - `mobile/src/__tests__/quoteService.test.ts`
  - `mobile/src/__tests__/orderService.test.ts`

## Results

| Requirement | Result | Notes |
| --- | --- | --- |
| Home/Live/Search discovery uses quote failure state | Pass | Discovery event hydration now calls `loadMarketQuoteStateById`. |
| Futures discovery uses quote failure state | Pass | Futures market hydration now applies `applyMarketQuoteStateToMarkets`. |
| Successful quote responses still update markets | Pass | Proof keeps ready market quote update behavior. |
| Failed discovery quote routes mark markets unavailable | Pass | Proof marks failed event and future markets unavailable. |
| Quote-failed discovery markets are submit-blocked | Pass | Existing order guard blocks `Market quote route failed.` |

## Decision

- Pass/fail: Pass.
- Unresolved P0 gaps: 0 for focused discovery quote failure contract.
- Remaining P1/P2: richer retry copy/action if product wants visible quote refresh recovery on discovery cards.
