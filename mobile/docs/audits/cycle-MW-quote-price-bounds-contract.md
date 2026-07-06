# Cycle MW Quote Price Bounds Contract

Date: 2026-07-06

Scope:

- Server-mode quote refresh from `/api/markets/:id/quote`.
- Visible ticket/card odds sourced from quote route responses.
- Bulk quote failure state used by existing unavailable-market guards.

Out of scope:

- Visual redesign.
- Order book.
- Chat.
- Backend provider ingestion/schema changes.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid quote prices and large depth sizes accepted | Pass | `docs/mobile/harness/cycle-MW-quote-price-bounds-contract/cycle-MW-quote-price-bounds-contract.json` |
| Quote price `1` accepted | Pass | MW proof `quotePriceOneAccepted=true` |
| Above-one best ask rejects | Pass | MW proof `bestAskAboveOneRejects=true` |
| Above-one mid price rejects | Pass | MW proof `midPriceAboveOneRejects=true` |
| Above-one last price rejects | Pass | MW proof `lastPriceAboveOneRejects=true` |
| Malformed bulk quote marks market failed | Pass | MW proof `malformedBulkQuoteMarksMarketFailed=true` |

Implementation notes:

- Server-mode quote route `bestBid`, `bestAsk`, `midPrice`, and `lastPrice` are now validated as contract prices from `0` to `1`.
- Quote depth sizes remain non-negative values and can exceed `1`.
- Direct local `quoteToTicketQuote` conversion remains tolerant for local/legacy conversion tests; server-mode route loading is strict.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/quoteService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_quote_price_bounds_contract.ts`
- Full validation/gate: see latest Cycle MW validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional quote-specific retry/error copy.
