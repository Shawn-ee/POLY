# Cycle LQ Live Feed Route Shape Contract

Date: 2026-07-06

Scope:

- Live tab server-mode feed loading from `/api/events?statusGroup=live&includeMobileMarkets=1`.
- Route page validation before visible Live cards are normalized and rendered.
- Malformed route payload rejection for missing market arrays and non-numeric outcome price/quote fields.

Out of scope:

- Visual redesign.
- Order book.
- Chat.
- Live stats as a sports-stat product.
- Provider breadth beyond the existing compact mobile event route.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Live tab uses backend route in server mode | Pass | Existing Cycle KU/KV route wiring plus LQ service proof |
| Route page exposes event, market, outcome, and cursor fields needed by mobile | Pass | `docs/mobile/harness/cycle-LQ-live-feed-route-shape-contract/cycle-LQ-live-feed-route-shape-contract.json` |
| Malformed event payload rejects before visible cards are applied | Pass | LQ proof `malformedEventWithoutMarketsRejects=true`; `mobile/src/__tests__/liveEventFeedService.test.ts` |
| Malformed outcome numeric fields reject before normalization fallback | Pass | LQ proof `malformedOutcomePriceRejects=true`; `mobile/src/__tests__/liveEventFeedService.test.ts` |
| No unresolved P0 backend/data-contract gap remains for this focused flow | Pass | Route map and gap tracker updated |

Implementation notes:

- `mobile/src/services/liveEventFeedService.ts` validates `events[]`, event identity/title/status/timing, compact `markets[]`, `outcomes[]`, tradability, price/quote numeric fields, and cursor/page metadata before calling `normalizeEventSummary`.
- The validator still allows legacy null/blank quote fields, but rejects non-finite numeric strings such as `bad-price`.
- Local/offline Live feed behavior is unchanged.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/liveEventFeedService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_live_feed_route_shape_contract.ts`
- Full validation/gate: see latest command run for Cycle LQ before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Live-tab-specific retry/error copy.
