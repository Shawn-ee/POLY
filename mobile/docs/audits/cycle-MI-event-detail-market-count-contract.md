# Cycle MI Event Detail Market Count Contract

Date: 2026-07-06

Scope:

- Event Detail route payloads used by the game page.
- Event-level `marketCount` and `activeMarketCount` metadata before frontend Event Detail state applies.

Out of scope:

- Event Detail visual polish.
- Market rendering, line groups, or ticket behavior.
- Provider market breadth.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid non-negative integer market counts accepted | Pass | `docs/mobile/harness/cycle-MI-event-detail-market-count-contract/cycle-MI-event-detail-market-count-contract.json` |
| String market count rejects before visible apply | Pass | MI proof `stringMarketCountRejects=true` |
| Negative active market count rejects before visible apply | Pass | MI proof `negativeActiveCountRejects=true` |
| Fractional market count rejects before visible apply | Pass | MI proof `fractionalMarketCountRejects=true` |
| Active market count above total rejects before visible apply | Pass | MI proof `activeAboveTotalRejects=true` |

Implementation notes:

- Event Detail route validation now requires `marketCount` and `activeMarketCount` to be finite non-negative integers.
- `activeMarketCount` must not exceed `marketCount`.
- Malformed count payloads now reject before route-backed Event Detail state can render impossible market metadata.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/eventDetailRouteShapeService.test.ts mobile/src/__tests__/eventDetailHydrationService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_event_detail_market_count_contract.ts`
- Full validation/gate: see latest Cycle MI validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Event Detail count-specific error copy.
