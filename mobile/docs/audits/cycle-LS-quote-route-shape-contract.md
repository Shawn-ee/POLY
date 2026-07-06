# Cycle LS Quote Route Shape Contract

Date: 2026-07-06

Scope:

- Server-mode quote refresh from `/api/markets/:id/quote`.
- Visible ticket/card odds sourced from quote route responses.
- Failed quote state feeding existing unavailable-market guards.

Out of scope:

- Visual redesign.
- Order book.
- Chat.
- Live stats as a sports-stat product.
- Provider ingestion/schema changes.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid quote route payload still applies odds | Pass | `docs/mobile/harness/cycle-LS-quote-route-shape-contract/cycle-LS-quote-route-shape-contract.json` |
| Malformed numeric quote fields reject before fallback odds | Pass | LS proof `malformedNumericRejects=true`; `mobile/src/__tests__/quoteService.test.ts` |
| Wrong-market quote payload rejects before visible apply | Pass | LS proof `wrongMarketRejects=true`; `mobile/src/__tests__/quoteService.test.ts` |
| Malformed bulk quote payload enters `failedMarketIds` | Pass | LS proof `malformedBulkQuoteMarksMarketFailed=true`; `mobile/src/__tests__/quoteService.test.ts` |
| Existing availability guard can block malformed quote markets | Pass | Malformed bulk quote path feeds the same failed-market state used by LG/LH quote failure contracts |

Implementation notes:

- `loadTicketQuotes` validates the route envelope before `quoteToTicketQuote` conversion.
- Required price fields must be finite, non-negative numbers or numeric strings, or `null`.
- `bestBidSize` and `bestAskSize` remain optional, but when present they must be finite and non-negative.
- Direct `quoteToTicketQuote` conversion remains tolerant for local/unit conversion; server-mode route loading is strict.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/quoteService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_quote_route_shape_contract.ts`
- Full validation/gate: see latest Cycle LS validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional quote-specific retry/error copy.
