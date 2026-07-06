# Mobile Data Contract Gaps

Purpose: track fields, route mismatches, schema mismatches, ignored backend fields, temporary mock/static data, and future migration concerns discovered during mobile parity cycles.

## Cycle JZ - Account Preferences Contract

Closed or narrowed:

- `/api/profile/preferences` route proof covers default load, save, persisted reload, and invalid payload rejection through canonical `account:read`/`account:write` auth.
- The route contract now has proof for every AccountScreen-visible preference field: locale, ticket default amount, ticket default side, ticket slippage, and saved market count.
- Mobile preference sync service now rejects malformed server responses with a clear error instead of crashing when `preferences` is missing.

Fields Holiwyn still needs but backend does not fully provide:

- Full server-authored account/session menu state, login state, wallet destination metadata, notification settings, and help/API destination metadata.
- Richer mobile retry/conflict state if Account preference sync fails mid-session.

Schema mismatch:

- No schema migration was made. Existing `UserProfilePreference.preferences` JSONB storage supports the JZ contract.

Temporary mock/static data:

- JZ proof creates a disposable backend user, API key, and profile preference row. It does not add frontend-only Account rows.

## Cycle JY - Trade Ticket Filled Lifecycle

Closed or narrowed:

- `/api/orders` route proof now covers a filled Trade Ticket lifecycle: maker liquidity is created through the route, taker ticket submit fills against it, and the response returns `status=FILLED`, `remaining=0`, one fill, and buyer position shares.
- `/api/portfolio` proof verifies the filled buyer position preserves `selection.contractSide=no`, provider market id, and provider token.
- `/api/portfolio/history` proof verifies the buyer recent trade preserves `selection.contractSide=no`, provider token, and buyer limit side.
- The proof uses complete-set minting for maker inventory so the public orderbook collateral invariant remains intact.

Fields Holiwyn still needs but backend does not fully provide:

- Broader route-backed filled lifecycle breadth for spread/team-total families and partial-fill states.
- Richer mobile-visible filled/partial status copy after server submit.
- First-class immutable fill/trade selection snapshots remain future hardening.

Schema mismatch:

- No schema migration was made. Existing `ApiOrderRequest.requestBody.selection`, `Order`, `Fill`, `Trade`, `Position`, `UserBalance`, `Market`, `Outcome`, and collateral fields support the JY contract.

Temporary mock/static data:

- JY proof creates disposable backend users, provider-backed market, complete-set inventory, maker/taker orders, fill, position, trade, and API key rows. It does not add frontend-only ticket/order rows.

## Cycle JX - Trade Ticket Submit Contract

Closed or narrowed:

- Mobile server-mode ticket submit now rejects backend responses that do not confirm a real order id, instead of inventing a local server id fallback.
- `/api/orders` route proof submits a seeded provider-backed No-side ticket through canonical `orders:write` auth with selected market/outcome/provider/limit metadata.
- `/api/portfolio` proof verifies the submitted backend order appears in open orders with `selection.contractSide=no`, provider market id, provider token, and limit side.
- Idempotent replay proof verifies the same `Idempotency-Key` and payload return the same backend order id.

Fields Holiwyn still needs but backend does not fully provide:

- Route-backed filled lifecycle for this same simple ticket path when counterparty liquidity exists.
- Better mobile-visible server submit error states for trading gate, unavailable provider, and insufficient collateral errors.
- First-class immutable order/fill/trade selection snapshots remain future hardening.

Schema mismatch:

- No schema migration was made. Existing `ApiOrderRequest.requestBody.selection`, `Order`, `UserBalance`, `Market`, `Outcome`, and provider quote snapshot fields support the JX contract.

Temporary mock/static data:

- JX proof creates disposable backend account, provider-backed market, accepting quote snapshots, order request, and API key rows. It does not add frontend-only ticket/order rows.

## Cycle JW - Portfolio Open-Order Cancel Flow

Closed or narrowed:

- Mobile server-mode cancel now requires the backend to confirm the same order id with `status=CANCELED` before treating cancel as successful.
- `/api/orders/:id` route proof cancels a seeded open BUY order through canonical `orders:write` auth, verifies locked USDC is released, and verifies a repeated cancel returns a clear rejection.
- `/api/portfolio` post-cancel proof verifies the canceled order no longer appears in `openOrders`.
- `/api/portfolio/history` proof verifies the canceled activity preserves `selection.contractSide=no`, provider token, and limit metadata.

Fields Holiwyn still needs but backend does not fully provide:

- Better mobile-visible transient state/error copy for races where an order fills or is canceled before the user taps Cancel.
- First-class immutable selection snapshots remain future hardening for order/trade/fill lifecycle durability.

Schema mismatch:

- No schema migration was made. Existing `Order`, `UserBalance`, `ApiOrderRequest`, `Market`, `Outcome`, and `ApiCredential` fields support the JW contract.

Temporary mock/static data:

- JW proof creates disposable backend account, market, open order, request snapshot, and API key rows. It does not add frontend-only open-order rows.

## Cycle JV - Portfolio History Contract-Side Snapshot

Closed or narrowed:

- Mobile Portfolio history/activity types already accept `selection.contractSide`; focused tests now prove recent-trade and canceled-order activity preserve `contractSide=no`.
- `/api/portfolio/history` route proof reads a seeded No-side canceled order and No-side recent trade through canonical `account:read` API-key auth and verifies contract side, provider token, and limit metadata.
- The visible Portfolio History/Orders activity path can distinguish No contracts from Yes contracts in server mode when the backend request snapshot contains the selected side.

Fields Holiwyn still needs but backend does not fully provide:

- First-class immutable `Order.selection` and `Trade.selection` or fill snapshot columns. Current route still bridges through matching `ApiOrderRequest.requestBody.selection`.
- Broader resolved-history economics proof is still separate from this focused canceled-order/recent-trade contract-side cycle.

Schema mismatch:

- No schema migration was made. Existing `ApiOrderRequest.requestBody.selection`, `Order`, `Trade`, `Market`, and `Outcome` fields support the JV contract.

Temporary mock/static data:

- JV proof creates disposable backend account, market, canceled order, filled order, trade, and API key rows. It does not add frontend-only Portfolio history rows.

## Cycle JU - Portfolio Contract-Side Snapshot

Closed or narrowed:

- Mobile Portfolio snapshot types now include `selection.contractSide` for positions and open orders.
- Mobile Portfolio snapshot mapping preserves backend `contractSide=no` so visible Portfolio rows can distinguish No contracts from Yes contracts.
- `/api/portfolio` route proof reads a seeded No-side position and No-side open order through canonical `account:read` API-key auth and verifies contract side, provider token, and limit metadata.

Fields Holiwyn still needs but backend does not fully provide:

- First-class immutable `Position.selection` and `Order.selection` columns. Current route still derives from matching `ApiOrderRequest.requestBody.selection` or current market/outcome fallback.
- Broader Portfolio route proof for resolved history and canceled orders remains separate from this focused positions/open-orders snapshot cycle.

Schema mismatch:

- No schema migration was made. Existing `ApiOrderRequest.requestBody.selection`, `Order`, `Position`, `Market`, and `Outcome` fields support the JU contract.

Temporary mock/static data:

- JU proof creates disposable backend account, market, position, open order, and API key rows. It does not add frontend-only Portfolio rows.

## Cycle JT - Search Status Filter Backend Wiring

Closed or narrowed:

- Search tab server market-data mode now sends `statusGroup=live` when the visible Live filter is selected.
- Search tab server market-data mode now sends `statusGroup=upcoming` when the visible Upcoming filter is selected.
- `/api/events` maps `statusGroup=live` to live event rows and `statusGroup=upcoming` to non-live event rows while preserving search, pagination, and compact mobile markets.

Fields Holiwyn still needs but backend does not fully provide:

- Server-side saved filter integration. Saved state is still local/profile-driven and applied to loaded backend Search rows.
- Dedicated Search ranking/facet metadata such as category counts, volume/liquidity ranking, and saved-state-aware discovery.

Schema mismatch:

- No schema migration was made. Existing `Event.status` supports the MVP live/non-live Search filter contract.

Temporary mock/static data:

- JT proof creates disposable backend live/upcoming event rows with listed public markets. It does not add frontend-only search rows.

## Cycle JS - Search Event Route and Pagination

Closed or narrowed:

- Search tab server market-data mode now uses `/api/events` with `search`, `limit`, `cursor`, and `includeMobileMarkets=1` instead of filtering only the already-loaded Home page.
- `/api/events?search=` now matches event title/description, home/away team names, market title/description, and outcome name/label.
- Search route pagination returns `nextCursor` plus `page.limit/page.nextCursor/page.hasMore`, and mobile appends de-duplicated backend Search pages.
- Search route failures are visible as a Search unavailable state in server mode instead of silently replacing results with frontend fixtures.

Fields Holiwyn still needs but backend does not fully provide:

- Server-side saved filter integration. Current Saved filter still applies to loaded backend Search rows.
- Dedicated Search ranking/facet metadata such as category counts, volume/liquidity ranking, and saved-state-aware discovery.

Schema mismatch:

- No schema migration was made. Existing `Event`, `Market`, and `Outcome` fields support MVP Search query matching.

Temporary mock/static data:

- JS proof creates disposable backend event rows with the unique search token in market/outcome text. It does not add frontend-only search rows.

## Cycle JR - Home Event List and Pagination

Closed or narrowed:

- `/api/events` now accepts `limit` and `cursor` and returns `nextCursor` plus `page.limit/page.nextCursor/page.hasMore`.
- The route uses stable ordering by `updatedAt`, `createdAt`, and `id`, and validates invalid event cursors with a public 400 error.
- Mobile `PolyApi.listWorldCupEvents()` can send `limit`, `cursor`, and `search` while preserving the existing structured World Cup filters and compact mobile markets.
- In server market-data mode, Home "Load more" now requests the next backend page and appends de-duplicated events instead of only revealing an already-loaded local list.

Fields Holiwyn still needs but backend does not fully provide:

- Server-side Home filter pagination for `live` and `today` views. Current Home filters still apply to loaded pages.
- Search tab backend pagination is not part of JR and remains a separate visible-flow cycle.

Schema mismatch:

- No schema migration was made. Existing `Event.id`, `updatedAt`, and `createdAt` support cursor pagination.

Temporary mock/static data:

- JR proof creates disposable backend event rows with public listed markets. It does not add frontend-only event rows.

## Cycle JQ - Backend-Driven Event Rules and Sell Safety

Closed or narrowed:

- Backend event summary and live-detail rule derivation now avoid classifying a market as `to_advance` just because a team/event name contains the word `Advance`.
- Mobile fallback rule derivation uses the same explicit advance-market key detection, while still preserving backend-provided `marketProfile`, `resultMode`, `gameRules`, and `supportedMarketTypes` first.
- Route proof now covers two event profiles:
  - regulation 90-minute profile with draw plus spread/totals availability.
  - knockout/full-match profile with a separate no-draw `to_advance` market and separate regulation-time draw market.
- Focused backend sell safety remains green for no-position rejection, oversell rejection, and valid sell after owned shares exist.
- Mobile cashout service tests remain green for full-position cashout sizing, no-share blocking, oversell blocking, and valid sell within shares.

Fields Holiwyn still needs but backend does not fully provide:

- Production replay across currently mapped real World Cup provider events, not just disposable contract-proof events.
- HTTP `POST /api/orders` sell rejection proof under production-like auth/trading flags. Current proof covers the canonical backend service and mobile service guard.
- Broader line-family availability breadth for real provider-backed spreads, totals, and team totals.

Schema mismatch:

- No schema migration was made. Existing `Event`, `Market`, and `Outcome` fields are sufficient for the JQ rule contract.

Temporary mock/static data:

- The JQ proof creates disposable backend rows shaped like real event/market/outcome data. It does not add frontend-only market rows.

## Cycle FA - Route-Backed Retail Status States

Closed or narrowed:

- `/api/mobile/events/:slug/live-detail` now maps provider-backed compact market `availability` from provider lifecycle when quote/depth/chart status is stale or unavailable.
- The simple retail UI no longer needs Book/orderbook to reveal stale/unavailable provider status. EventDetail and TradeTicket both consume `market.availability`.
- Android proof confirms Spread stale and Totals unavailable status with `EXPO_PUBLIC_SHOW_ORDERBOOK` unset.

Fields Holiwyn still needs but backend does not fully provide:

- Production active Polymarket event mapping with real stale/unavailable provider states.
- Server-side order rejection/guardrails for unavailable provider markets beyond the current mobile disabled submit state.

Schema mismatch:

- No schema migration was made. Existing provider snapshot and market identity fields support the FA route contract.

Temporary mock/static data:

- FA uses disposable provider-shaped rows created by `scripts/prove_mobile_ej_a_provider_status_breadth.ts`; this is contract proof data, not arbitrary UI-only data.

## Cycle FB - Provider Unavailable Order Guard

Closed or narrowed:

- Server fake-token order submission now rejects provider-backed markets with no accepting provider quote snapshot.
- The backend no longer relies only on mobile disabled-submit behavior for unavailable provider markets.
- Failed unavailable attempts are stored in `ApiOrderRequest`, preserving auditability.

Fields Holiwyn still needs but backend does not fully provide:

- Production active-event quote snapshot freshness/breadth so valid provider-backed markets do not become unavailable because refresh coverage is missing.
- A mobile-visible server error proof is only needed if a future UI path can submit an unavailable market.

Schema mismatch:

- No schema migration was made. The guard uses existing `Market` provider identity fields and `ReferenceQuoteSnapshot.acceptingOrders`.

Temporary mock/static data:

- FB uses focused service tests and disposable provider-status route proof data. It does not introduce UI-only mock order data.

## Cycle ET - Period-Safe Retail Line Matching

Closed or narrowed:

- Mobile no longer accepts a backend line market solely because family and line match. The selected ticket period must also match the backend market period when both are present.
- Focused tests cover wrong-period Totals and Team Total backend markets falling back to deterministic contract-shaped fixtures.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed retail ticket proof with spread/totals/team-total route rows whose `marketType`, `line`, and `period` exactly match the selected ticket.
- Explicit unavailable/stale route status when exact family/line/period provider data is missing.

Schema mismatch:

- No schema migration was made; the existing `Market.period`/`line`/`marketType` fields are sufficient for this matching rule.

Temporary mock/static data:

- ET still uses deterministic fixtures for Android proof when backend health is unavailable. The resolver now prevents those fixtures from being incorrectly replaced by wrong-period backend markets.

## Cycle ES - Local MVP Line-Family Ticket Breadth

Closed or narrowed:

- `docs/mobile/harness/cycle-ES-local-mvp-line-family-breadth/cycle-ES-local-mvp-line-family-breadth-proof.json` proves Totals and Team Total simple-ticket handoff with default orderbook hidden.
- Team Total rows now have contract-shaped synthetic market/outcome data and `TicketSelection` fields so the simple retail ticket can open before provider-backed route data is available.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed route data for spread/totals/team-total markets where Polymarket exposes them.
- Explicit route-backed unavailable/stale status for line-family markets that Polymarket does not expose, instead of relying on deterministic local fixture pricing.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- ES uses deterministic contract-shaped Team Total fixture data for local UI proof. It must not be claimed as provider parity until backend route data or explicit unavailable status exists.

## Cycle ER - Local MVP Retail Status Flow

Closed or narrowed:

- `docs/mobile/harness/cycle-ER-local-mvp-status-flow/cycle-ER-local-mvp-status-flow-proof.json` proves chart route state, ticket handoff provider status, selected line source, and hidden orderbook controls in the default retail flow.

Fields Holiwyn still needs but backend does not fully provide:

- Real route-backed loading/stale/unavailable status breadth for provider-backed spread, totals, and team-total retail tickets.
- A unified route contract that lets the simple ticket decide whether a selected market is ready, refresh-due, unavailable, or suspended without opening Book.

Schema mismatch:

- No schema migration was made.

Temporary mock/static data:

- ER uses existing deterministic contract-shaped local event/line/status data only for Android UI proof.

## Cycle EQ - Local MVP Sell Flow

Closed or narrowed:

- `docs/mobile/harness/cycle-EQ-local-mvp-sell-flow/cycle-EQ-local-mvp-trade-flow-proof.json` proves the selected Sell journey with `orderbookDebug=unset`.
- Trade-ticket identity metadata now follows the active contract side. After switching to Sell/No, the ticket exposes `ticket-contract-side-no` and Portfolio exposes `portfolio-contract-side-no`.
- The deterministic line fixture preserves backend-shaped Sell fields through ticket/order/Portfolio: market family/type, line, period, side, contract side, display label, and fake-token lifecycle state.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed simple-ticket Buy/Sell breadth for spreads, totals, and team totals without exposing Book as the primary user action.
- Production route-backed Sell order/portfolio/history proof with the same `side=sell` and `contractSide=no` selection envelope.
- Loading/stale/unavailable route state fields that can render in event detail/ticket without sending users to Book.

Schema mismatch:

- No schema migration was made. EQ keeps using the existing selection snapshot envelope and mobile fake-token local state.

Temporary mock/static data:

- EQ uses deterministic contract-shaped line fixture data only for local UI proof. It must be replaced by provider-backed routes before provider/data parity is claimed.

## Cycle EP - Local MVP Trade Flow Steering

Closed or narrowed:

- Default Android user flow no longer depends on visible orderbook controls. `docs/mobile/harness/cycle-EP-local-mvp-trade-flow/cycle-EP-local-mvp-trade-flow-proof.json` proves the selected Buy journey with `orderbookDebug=unset`.
- The deterministic line fixture used for the UI proof preserves backend-shaped selection fields through ticket/order/Portfolio: market family/type, line, period, side, contract side, display label, and fake-token lifecycle state.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-backed simple-ticket breadth for spreads, totals, and team totals without exposing Book as the primary user action.
- Sell-side simple-ticket route proof for the same selection envelope.
- Loading/stale/unavailable route state fields that can render in event detail/ticket without sending users to Book.

Schema mismatch:

- No schema migration was made. EP keeps using the existing selection snapshot envelope and mobile fake-token local state.

Temporary mock/static data:

- EP uses deterministic contract-shaped line fixture data only for local UI proof. It must be replaced by provider-backed routes before provider/data parity is claimed.

## Cycle EO-A - Route-Backed Lifecycle Breadth

Closed or narrowed:

- `docs/mobile/harness/cycle-EO-A-route-breadth/proof.json` proves a second provider-depth lifecycle path beyond the prior ask/Buy selected path: a totals `total_goals` market, `2H`, line `3.5`, selected from `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book`.
- The selected limit is born from the Book route provider bid row (`limitSide=bid`) and is submitted as `side=SELL`, preserving `marketId`, `outcomeId`, market group/type/family, line, period, side/contract side, provider source, external slug/market/condition ids, provider token ids, `limitPrice`, `limitSide`, and `limitShares` through order response, `/api/portfolio`, and `/api/portfolio/history`.
- Focused portfolio and history route tests now cover bid-side Sell totals snapshots in addition to the existing ask-side snapshot drift tests.
- `OPTIC_ODDS_API_KEY` remains optional/non-blocking; the proof uses Polymarket-first quote/depth rows and does not require line-provider enrichment.

Fields Holiwyn still needs but backend does not fully provide:

- Order creation still uses the canonical service backing `POST /api/orders` to avoid local trading-beta route flags; portfolio and history reads use route handlers.
- A production real-live Polymarket replay and S23 official recapture remain open.
- First-class immutable selection snapshots on `Order`, `Fill`, `Trade`, and/or `Position` remain future hardening for repeated same-market/outcome selections at different Book levels.

Schema mismatch:

- No schema migration was made. The selected provider and bid limit identity continues to ride the existing order request JSON selection snapshot.

Temporary mock/static data:

- No frontend mock/static data was added. The proof creates disposable backend rows with Polymarket/Gamma/CLOB-shaped provider data and fails unless live-detail and Book report provider-backed depth readiness.

## Cycle EN Integrated - Route-Backed Provider-Depth Limit Lifecycle

Closed or narrowed:

- Android-visible proof now consumes server market data and route-backed provider-depth Book rows while preserving selected market/outcome/provider/limit identity through ticket, open order, opened activity, and canceled activity.
- Backend EN-A proof separately proves the same contract family through order creation, portfolio, and history mappers.

Still open:

- Android submit/cancel proof remains mock trading mode; production HTTP `POST /api/orders` route proof is still future work.
- Fresh S23 official production order/Portfolio/history recapture remains P1.
- Multi-family/bid-side route-backed lifecycle coverage and immutable first-class backend selection snapshots remain P1/backend hardening.

## Cycle EN-A - Route-Backed Provider-Depth Limit Lifecycle

Closed or narrowed:

- `docs/mobile/harness/cycle-EN-A-route-limit-lifecycle/proof.json` now proves the backend P1 route gap as far as current schema allows: a Book-staged limit selection is born from `/api/mobile/events/:slug/live-detail` provider orderbook depth, then preserves selected `marketId`, `outcomeId`, market group/type, line, period, side, contract side, provider source, external slug/market/condition ids, provider token ids, `limitPrice`, `limitSide`, and `limitShares` through order response, `/api/portfolio`, and `/api/portfolio/history`.
- The proof uses existing Polymarket-first provider rows (`ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot`) and keeps `OPTIC_ODDS_API_KEY` optional/non-blocking.
- Focused portfolio and history route tests now assert the limit trio survives alongside provider token identity after current market/outcome metadata drift.

Fields Holiwyn still needs but backend does not fully provide:

- The proof runs order creation through the canonical service backing `POST /api/orders`, not the HTTP route handler, because local route execution also depends on internal trading-beta environment flags. Portfolio and history reads do use route handlers.
- A production real-live Polymarket event replay remains open; EN-A uses disposable backend rows with Polymarket/Gamma/CLOB-shaped provider data.
- First-class immutable selection snapshots on `Order`, `Fill`, `Trade`, and/or `Position` remain future hardening. Filled positions and recent trades still use the existing guarded `ApiOrderRequest.requestBody.selection` bridge.

Schema mismatch:

- No schema migration was made. The selected provider and limit identity continues to ride the existing order request JSON selection snapshot.

Route mismatch:

- The selected live-detail -> order -> portfolio/history contract is materially narrowed. The exact remaining route gap is HTTP `POST /api/orders` proof under local trading-beta route flags plus a real production-mapped provider event replay.

Temporary mock/static data:

- No frontend mock/static data was added. The proof creates disposable backend rows and fails unless live-detail reports provider orderbook depth as ready.

Future migration concern:

- Same user, same market, same outcome, different historical Book levels still need immutable lifecycle-row snapshots before production can rely on exact historical reconstruction after remaps or repeated selections.

## Cycle EM Integrated - Book-Staged Limit Lifecycle Proof Pairing

Closed or narrowed:

- The integrated Android proof now shows the selected Book-staged limit identity through ticket amount entry, fake-token submit, latest order, open order, latest activity, and canceled activity.
- The Agent A service proof separately shows the same field family survives backend selection sanitization and mobile portfolio/history mappers.

Still open:

- Route-backed provider-depth lifecycle remains P1 because the integrated tablet proof used deterministic fake-token app data after backend health was unavailable from the tablet launch context.
- Fresh S23 official ticket/order recapture remains P1.
- Immutable first-class selection snapshots on order/trade/fill/position remain future hardening for same market/outcome multi-selection history.

## Cycle EM-A - Book-Staged Limit Lifecycle Service Contract

Closed or narrowed:

- `selection.limitPrice`, `selection.limitSide`, and `selection.limitShares` now survive the backend/mobile service contract from ticket order creation through backend selection sanitization and mobile portfolio/history mappers.
- `sanitizeTicketSelectionSnapshot()` preserves finite numeric limit price/share fields and normalizes `limitSide` to `bid` or `ask`, so canonical order request JSON can carry the tapped Book ladder level.
- Mobile portfolio snapshot and history/activity mappers now keep the limit trio on positions, open orders, canceled order activity, and recent trade activity instead of dropping them after the route response.
- `docs/mobile/harness/cycle-EM-A-limit-lifecycle/proof.json` records a local service-contract proof for order result, backend selection metadata, portfolio position/open order, recent trade, and canceled order mapping.

Fields Holiwyn still needs but backend does not fully provide:

- Android-visible integration proof remains Lead/Agent B scope; EM-A proves backend/mobile service contracts, not tablet screenshots or live route execution.
- First-class immutable selection snapshots on `Order`, `Trade`, `Fill`, and/or `Position` remain future hardening. EM-A continues to use existing `ApiOrderRequest.requestBody.selection` plus guarded market/outcome fallback.

Schema mismatch:

- No schema migration was made. The staged limit fields ride the existing selection snapshot JSON contract.

Route mismatch:

- No new route shape was required. Existing `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` selection envelopes can carry the fields once sanitizers/types/mappers preserve them.

Temporary mock/static data:

- No frontend mock/static data was added. The proof script uses service-level backend-shaped payloads and writes a local JSON artifact only.

Future migration concern:

- If the same user can have multiple historical orders for the same market/outcome with different Book levels, immutable per-order/fill/trade selection snapshots should store `limitPrice`, `limitSide`, and `limitShares` instead of relying on latest matching request JSON.

## Cycle EL Integrated - Route-Backed Book/Ticket Limit Handoff

Closed or narrowed:

- The selected Book ladder -> ticket price handoff is now proven against route-backed provider depth on the Samsung tablet.
- `TicketSelection` now includes optional `limitPrice`, `limitSide`, and `limitShares`, so a tapped Book row can preserve limit identity through the ticket and future order snapshot paths.
- The app no longer overwrites a staged Book ticket with a fresh quote/midpoint before display; the ticket price line keeps the tapped ask/bid price.
- `docs/mobile/harness/cycle-EL-integrated-live-depth/cycle-EL-B-visible-live-depth-proof.json` proves Buy ask at 55c and Sell bid at 50c for the selected provider-backed moneyline market.

Fields Holiwyn still needs but backend does not fully provide:

- Android-visible order/portfolio/history proof should pair with EM-A, which now covers the backend/mobile service-contract survival of `selection.limitPrice`, `selection.limitSide`, and `selection.limitShares`.
- The integrated proof uses one disposable provider-backed event. Production breadth still needs real mapped Polymarket events for spreads, totals, team totals, halves, corners, and props where available.

Schema mismatch:

- No database schema change was required. The staged limit fields are mobile selection metadata and can ride the existing order selection snapshot contract.

Route mismatch:

- No route-shape mismatch was found for live-detail or Book. Remaining route work is order/portfolio/history persistence proof for the new staged limit fields.

Temporary mock/static data:

- No arbitrary frontend-only fixture is accepted for the integrated pass. The visible proof used the EL-A disposable backend event with provider-shaped Gamma/CLOB refresh data and route-backed orderbook depth.

Future migration concern:

- Keep staged limit fields distinct from outcome probability and midpoint quote. Future quote refreshes must not silently replace an explicit user-selected Book level unless the user changes market/outcome/side or clears the staged level.

## Cycle EL-A - Provider Line-Family Breadth Route Proof

Closed or narrowed:

- `/api/mobile/events/:slug/provider-refresh` now returns backend-owned `lineFamilyCoverage`, grouping compact markets by family/period/line and preserving per-market quote, orderbook depth, and chart history lifecycle status.
- `docs/mobile/harness/cycle-EL-A-provider-breadth/cycle-EL-A-provider-breadth.json` proves route-backed provider breadth across three Polymarket-mapped compact families: moneyline, spread, and totals.
- The EL-A proof refreshes through existing Polymarket Gamma quote, CLOB orderbook depth, and CLOB prices-history paths, then verifies live-detail keeps each market ready with source/status preserved.
- `allowContractProofFallback=false` is asserted through `refresh.contractProofFallback=null` and `providerLifecycle.fallbackApplied=false`.
- Missing `OPTIC_ODDS_API_KEY` remains non-blocking. The proof records optional line-provider state while Polymarket quote/depth/chart readiness stays ready.

Fields Holiwyn still needs but backend does not fully provide:

- Production breadth still depends on currently available real Polymarket mappings for live World Cup events; EL-A proves the backend route contract with disposable Polymarket-shaped provider responses.
- Visible Android pairing and screenshots remain outside Agent A ownership for this cycle.

Schema mismatch:

- No schema change was required. Existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` rows carry the line-family proof.

Route mismatch:

- The single selected-transition gap is narrowed: provider-refresh now reports family-level and per-market provider readiness for all compact mapped markets, not only the selected line.
- Remaining route risk is production data availability and scheduler coverage, not response shape.

Temporary mock/static data:

- No frontend mock/static data was added. The proof installs scoped Polymarket Gamma/CLOB-shaped responses only while executing the backend provider-refresh route helper.

Future migration concern:

- Keep unavailable/not-ready markets out of provider-ready breadth counts. Future production proofs should repeat EL-A against live mapped Polymarket events and continue preserving market id, selector key, family, period, line, and token ids through live-detail, Book, ticket, orders, portfolio, and history.

## Cycle EK Integrated - Visible Provider Transition Proof

Closed or narrowed:

- The selected EK provider transition is now proven end-to-end on the Samsung tablet: stale/refresh-due live-detail state, visible refresh/loading state, provider refresh execution, route-backed ready live-detail state, Book/orderbook ready state, and ticket handoff for the selected market/line/outcome.
- `/api/mobile/events/:slug/live-detail` now derives mobile-visible live status from provider lifecycle for live events instead of allowing old top-level event metadata to stay visually ready while the provider contract is stale or unavailable.
- Selected compact market availability can move from stale to ready after a provider refresh when the provider lifecycle is ready, so live-detail and Book do not contradict each other for the selected route-backed market.
- `/api/orderbook/:marketId/book` can report ready availability from fresh provider quote and provider depth snapshots, and mobile `getOrderbook()` sends a timestamp query value to avoid stale device-side Book responses during refresh proof.
- `docs/mobile/harness/cycle-EK-integrated-provider-transition/cycle-EK-B-visible-status-transition-proof.json` and `docs/mobile/harness/cycle-EK-integrated-provider-transition/cycle-EK-B-visible-status-transition-refresh-route.json` record the visible proof and refresh summary.

Fields Holiwyn still needs but backend does not fully provide:

- Production provider scheduling is still separate from the proof helper. The integrated proof executes the real route refresh body against the disposable EK event, but it does not prove background refresh cadence for all live events.
- Real provider-backed breadth across every World Cup line family remains P1. The pass is scoped to one selected provider transition path, not all spreads, totals, team totals, halves, corners, and props.
- Fresh S23 Polymarket recapture remains useful for the next visible parity round, especially around the exact refresh/loading wording and Book/ticket transition behavior.

Schema mismatch:

- No schema migration was required. Existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` rows support the proven state transitions.

Route mismatch:

- The main selected-path mismatch is closed: live-detail, Book availability, and mobile ticket handoff now share provider-ready/stale status more consistently after refresh.
- Remaining mismatch is coverage and scheduling, not the route shape for the selected EK transition.

Temporary mock/static data:

- No arbitrary frontend-only local structures were added. The proof helper installs scoped Polymarket Gamma/CLOB-shaped provider responses for the disposable event and asserts `fallbackApplied=false`.
- The tablet proof requires route-backed labels after refresh and does not accept fixture/default-ready labels for the selected path.

Future migration concern:

- Keep provider lifecycle as the source of truth for live-event freshness. Future UI cycles should avoid marking a line ready unless selected market identity, provider quote/depth/chart status, orderbook identity, ticket state, and portfolio/order identity can all preserve the same market/outcome/line ids.

## Cycle EK-A - Provider Transition Route Proof

Closed or narrowed:

- PM-GAP-084 backend transition breadth is now proven for `/api/mobile/events/:slug/live-detail` plus `/api/mobile/events/:slug/provider-refresh`: one disposable route-backed matrix carries ready, selected stale/refresh-due, unavailable/not-ready, and a no-fallback route refresh transition to ready.
- `docs/mobile/harness/cycle-EK-A-provider-transition/cycle-EK-A-provider-transition.json` records before/after live-detail route fields, provider-refresh `providerLifecycle`, `refresh.provider`, `refresh.providerDepth`, `refresh.providerHistory`, `refresh.mappingReadiness`, cache invalidation, and selected identity preservation.
- `allowContractProofFallback=false` is asserted through `refresh.contractProofFallback=null` and `providerLifecycle.fallbackApplied=false`.
- Missing `OPTIC_ODDS_API_KEY` remains non-blocking. The proof uses Polymarket Gamma/CLOB-shaped provider responses for mapped disposable markets and keeps OpticOdds as optional enrichment.

Fields Holiwyn still needs but backend does not fully provide:

- Android-visible pairing for stale/loading/ready/unavailable states remains outside Agent A ownership.
- Production line-family breadth still depends on real provider mappings and currently available Polymarket markets beyond disposable proof rows.

Schema mismatch:

- No schema change was required. Existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` rows represent the transition.

Route mismatch:

- No new route-shape mismatch was found. Live-detail and provider-refresh now provide the route fields needed to distinguish ready, refresh-due, stale, unavailable/not-ready, refresh-started/completed, fallback-disabled, and selected identity preservation.

Temporary mock/static data:

- No frontend mock/static data was added. The proof creates disposable backend rows and installs a scoped deterministic provider fetch stub only while executing provider-refresh.
- The proof fails if route output contains `mock-ready`, `fixture-ready`, `frontend-fixture`, `default-ready`, fallback depth, or first-row fallback markers.

Future migration concern:

- Keep route refresh transitions tied to selected market identity and keep unavailable/not-ready rows out of ready counts so mobile cannot silently replace missing provider data with first-row/default market evidence.

## Cycle EJ-A - Provider Status Breadth Route Proof

Closed or narrowed:

- PM-GAP-084 backend breadth is now proven for `/api/mobile/events/:slug/live-detail`: one disposable route response carries ready, refresh-due plus stale, and unavailable/not-ready provider lifecycle shapes across compact markets.
- `docs/mobile/harness/cycle-EJ-A-provider-status-breadth.json` records route-backed `markets[].providerLifecycle.quote/orderbookDepth/chartHistory`, `providerOrderbookDepth`, `chartHistoryStatus`, `selection`, `orderbookIdentity`, aggregate `contract.providerLifecycle`, and batched ready/stale/refresh-due counts.
- Missing `OPTIC_ODDS_API_KEY` remains non-blocking. The proof uses Polymarket-first quote rows plus CLOB-shaped orderbook depth and chart history rows already consumed by live-detail.

Fields Holiwyn still needs but backend does not fully provide:

- This is backend route proof only; Android visible rendering and broader production mapped-market coverage remain outside Agent A scope.
- Production line-family breadth still depends on real provider mappings and recurring refresh coverage for active events.

Schema mismatch:

- No schema change was required. Existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` rows represent the three status shapes.

Route mismatch:

- No new route-shape mismatch was found for the proven status breadth. Remaining risk is data coverage, not the live-detail response contract.

Temporary mock/static data:

- No frontend mock/static data was added. The proof creates disposable backend rows and fails if route output contains `mock-ready`, `fixture-ready`, `frontend-fixture`, or `default-ready` markers.

Future migration concern:

- Keep unavailable/not-ready separate from stale and refresh-due so mobile cannot treat missing provider rows or old CLOB rows as ready evidence.

## Cycle EI-A - Route-Backed Provider Status Proof

Closed or narrowed:

- PM-GAP-084 backend route proof is now explicit: `/api/mobile/events/:slug/live-detail` returns the tablet status fields from backend route data, including `event.liveDataStatus`, top-level and `contract.providerLifecycle`, selected `markets[].providerLifecycle.quote/orderbookDepth/chartHistory`, `chartHistoryStatus`, `orderbookDepthSource/orderbookDepthStatus`, `providerOrderbookDepth.status`, `selection`, and `orderbookIdentity`.
- `docs/mobile/harness/cycle-EI-integrated-route-backed-status/cycle-EI-A-route-backed-status.json` records a disposable provider-backed route response with live data status, chart status, orderbook/availability status, selected market identity, source, reason, `nextRefreshAt`, `lastFetchedAt`, and a no fixture/mock-ready marker assertion.
- `docs/mobile/harness/cycle-EI-integrated-route-backed-status/cycle-EI-B-route-backed-status-proof.json` proves the Samsung tablet consumes that route-backed contract and does not use deterministic fixture/default-ready status UI for the selected path.
- Missing `OPTIC_ODDS_API_KEY` remains non-blocking for this route proof because the status fields come from Polymarket/CLOB-shaped provider quote, orderbook depth, and chart snapshot rows already consumed by live-detail.

Fields Holiwyn still needs but backend does not fully provide:

- Visible tablet rendering is now proven for the selected EI route-backed ready/Book/ticket path.
- Production line-family readiness still depends on mapped provider markets and recurring refresh coverage; EI-A proves the route shape and a provider-backed selected market, not universal production data coverage.
- Broader route-backed stale/unavailable transition proof remains a follow-up; EH visible-state evidence remains regression support but not a substitute for production-wide status coverage.

Schema mismatch:

- No schema change was required. EI-A uses existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` rows.

Route mismatch:

- No remaining PM-GAP-084 backend route-shape mismatch was found. Remaining risk is provider coverage/deployment, not missing lifecycle/status fields on live-detail.

Temporary mock/static data:

- No frontend mock/static data was added. The proof uses disposable backend rows and fails if the live-detail payload contains `mock-ready`, `fixture-ready`, or `frontend-fixture` markers.
- No deterministic fixture UI was accepted by the tablet proof. The selected visible route rejects fixture/mock/default markers and proves `EXPO_PUBLIC_ORDER_MODE=server`.

Future migration concern:

- Keep tablet status rendering bound to `providerLifecycle` and selected market identity from live-detail, and keep missing optional line-provider enrichment separate from Polymarket quote/depth/chart readiness.

## Cycle EH-A - Provider Status Surface Contract

Closed or narrowed:

- PM-GAP-084 backend side is narrowed: `/api/mobile/events/:slug/live-detail` now exposes `providerLifecycle` at the top level, under `event`, in `contract`, and per compact `markets[]` row.
- `providerLifecycle` gives mobile one route-backed surface for `status`, `ready`, `stale`, `refreshDue`, `refreshing`, `refreshStarted`, `unavailable`, `empty`, `notReady`, `source`, `reason`, `nextRefreshAt`, `lastFetchedAt`, `fallback`, `fallbackApplied`, and `fallbackReason`.
- `markets[].providerLifecycle.quote/orderbookDepth/chartHistory` preserve source-specific status and freshness, so mobile can render ready, refresh-due, stale, and unavailable without deriving state from scattered quote/depth/chart fields.
- `POST /api/mobile/events/:slug/provider-refresh` now reports aggregate `providerLifecycle.status`, `refreshStartedAt`, `refreshCompletedAt`, refresh-start/completed flags, `lastFetchedAt`, fallback flags, and optional `lineProvider` state.
- Missing `OPTIC_ODDS_API_KEY` is surfaced as optional/unconfigured line-provider enrichment when fixture metadata exists; it does not block the Polymarket Gamma/CLOB quote, depth, or chart lifecycle.
- `docs/mobile/harness/cycle-EH-A-provider-status-surface.json` proves stale/refresh-due -> ready for the provider-backed market and proves an intentionally empty compact market remains explicitly `unavailable`, `empty`, and `notReady`.

Fields Holiwyn still needs but backend does not fully provide:

- Production line-family provider coverage still depends on real provider mappings and scheduled refresh coverage; EH-A proves the status surface shape, not universal provider availability.
- A mobile visible proof still needs to consume `providerLifecycle` once Agent B wires rendering; this lane intentionally did not edit visible mobile UI.

Schema mismatch:

- No schema change was required. The status surface is derived from existing provider quote, provider orderbook depth, and chart snapshot timestamps.

Route mismatch:

- Live-detail and provider-refresh now share the same lifecycle vocabulary. Remaining mismatch is data coverage for every compact market, not route shape.

Temporary mock/static data:

- No frontend mock/static data was added. The EH-A proof script creates disposable backend rows and labels contract fallback explicitly when used for local proof quotes.

Future migration concern:

- Keep `refresh_due` separate from `stale`, and keep `unavailable/empty/notReady` explicit so mobile does not present fallback or missing provider data as ready.

## Cycle EG-A - Provider Refresh Lifecycle Contract

Closed or narrowed:

- `POST /api/mobile/events/:slug/provider-refresh` now exposes a top-level `providerLifecycle` envelope with quote, orderbook depth, and chart history `source/status/latestAt/stalenessSeconds/nextRefreshAt/shouldRefresh` fields, plus aggregate `ready`, `refreshDue`, and `stale` booleans.
- Provider refresh now summarizes post-refresh depth snapshots separately as `refresh.postRefreshDepth.lifecycle` and chart snapshots as `refresh.postRefreshHistory.lifecycle`, so a refreshed route can distinguish `ready`, `refresh_due`, `stale`, and `unavailable` instead of only reporting row counts.
- `/api/mobile/events/:slug/live-detail` compact markets now include chart lifecycle fields on `chartHistoryStatus`: `stalenessSeconds`, `staleAfterSeconds`, `refreshTtlSeconds`, `nextRefreshAt`, `shouldRefresh`, and `isStale`. The live-detail contract adds batched chart ready/stale/refresh-due counts and the earliest chart `nextRefreshAt`.
- `docs/mobile/harness/cycle-EG-A-provider-refresh-lifecycle.json` proves a disposable provider-backed event starts stale/refresh-due for depth and chart history, refreshes through the Polymarket-first provider path, and returns to ready with `nextRefreshAt` populated. Missing Optic Odds credentials are reported as skipped and do not block the proof.

Fields Holiwyn still needs but backend does not fully provide:

- Real production line-family markets still need mapped Polymarket provider identities and recurring refresh coverage before every live game can rely on this path without disposable proof state.
- Gamma quote refresh can still skip for proof-only slugs; EG-A allows an explicit contract-proof fallback for quote rows while CLOB-shaped depth/history refresh remains source/status-labelled. Production no-fallback proofs should use real mapped Polymarket slugs.

Schema mismatch:

- No schema change was required. Existing `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` timestamps are enough to calculate lifecycle status.

Route mismatch:

- The repeated deferred mismatch is narrowed: provider refresh, live-detail, orderbook depth, and chart history now speak the same source/status/next-refresh language. Remaining mismatch is provider coverage and scheduler deployment, not response shape.

Temporary mock/static data:

- No frontend mock data was added. The EG-A proof script uses a disposable local event and labels deterministic CLOB-shaped fixture usage explicitly in the proof JSON.

Future migration concern:

- Keep `refresh_due` distinct from `stale`: mobile can trigger or schedule refresh at the TTL boundary without presenting the market as stale until the stale threshold is crossed.
- Keep Optic Odds line-provider status non-blocking for Polymarket parity unless product requirements make line-provider enrichment mandatory for a specific market family.

## Cycle EC-A - Provider Orderbook Identity Parity

Closed or narrowed:

- `/api/mobile/events/:slug/live-detail` compact markets now expose `orderbookIdentity`, tying the displayed compact market to the provider/orderbook route identity: `marketId`, `marketGroupId`, compact `selectorKey`, family, period, line, outcome ids, provider token ids, provider source/status, depth source/status, freshness timestamps, refresh flags, ready boolean, and reason.
- Live-detail `selection.selectorKey` now uses the same compact key shape as `/api/orderbook/:marketId/book`: `marketGroupKey:period:line-or-default`. This keeps selector identity comparable while `marketId` remains the unique route target.
- `/api/orderbook/:marketId/book` now exposes public provider `tokenId` on `marketIdentity.outcomes[]` alongside local `id/outcomeId`, label, side, and display metadata, allowing a direct live-detail-to-Book outcome/token proof.
- `docs/mobile/harness/cycle-EC-A-provider-orderbook-identity.json` proves a provider-backed compact match-winner market selected from live-detail matches the Book route on market id, selector key, market group, family/period/line, outcome ids, token ids, provider source, ready depth source/status, and freshness.

Fields Holiwyn still needs but backend does not fully provide:

- Production Spread/Totals/Team Total line-family markets still need real provider mapping and recurring provider refresh coverage before line orderbook parity can be claimed outside disposable proof rows.
- The EC-A proof includes a compact Totals line market and records it as `depthSource=empty`, `depthProviderStatus=unavailable`; this documents the line-market provider gap instead of treating fallback depth as provider-backed.
- Visible mobile proof still needs to consume the new `orderbookIdentity`/Book token identity fields on device.

Schema mismatch:

- No schema change was required. Existing `Market`, `Outcome.referenceTokenId`, `ReferenceQuoteSnapshot`, and `ReferenceOrderbookDepthSnapshot` fields cover this contract.

Route mismatch:

- The live-detail and Book selector identity mismatch is narrowed by using the same compact selector key and explicit `marketId` on both surfaces.
- Remaining mismatch is provider coverage for real line markets, not the backend shape for proving a selected provider-backed market.

Temporary mock/static data:

- No frontend mock data was added. The EC proof script writes disposable backend rows to the same provider snapshot tables consumed by production refresh services and clears local open orders so provider depth is the route source.

Future migration concern:

- Treat Book `marketIdentity.outcomes[].tokenId` as public provider contract identity. It should remain separate from auth/session tokens and credentials, and no-leak tests should continue blocking private user/order/account fields.
- Keep `selection.selectorKey` and `orderbookIdentity.selectorKey` stable across live-detail and Book so tickets, orders, portfolio, and history can carry the same compact market identity.

## Cycle EA-A - Live Detail Per-Market Chart Contract

Closed or narrowed:

- `/api/mobile/events/:slug/live-detail` no longer treats chart history as only a primary-market event-level field.
- Each compact live market now has `chartHistory[]` and `chartHistoryStatus`, so selected market/line chart behavior can be driven by backend `marketId` instead of frontend inference.
- The contract now reports batched chart history counts and requested compact market ids for Audit Gate evidence.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket/CLOB chart history for all live line-family markets requires provider token mapping for those markets.
- The current contract exposes 1D-style rows in live-detail; richer range-specific chart calls can still use `/api/markets/:id/chart?range=...`.
- The mobile app still needs visible Android proof that chart selection uses the selected market's `chartHistoryStatus` rather than static placeholder data.

Schema mismatch:

- No schema change was required. Existing `MarketOutcomeSnapshot.marketId`, `outcomeId`, `ts`, and `price` cover the contract.

Route mismatch:

- The live-detail route now carries per-market chart readiness. Remaining mismatch is provider coverage and visible UI consumption, not route shape.

Temporary mock/static data:

- No frontend mock data was added. Unit proof uses deterministic service inputs only.

Future migration concern:

- Keep event-level `chartHistory` primary-market scoped for backwards compatibility, and use `markets[].chartHistoryStatus` for selected market chart UI.
- Do not mark chart parity complete for line markets until real mapped provider history or an explicitly documented unavailable state is visible on Android.

## Cycle DU-A - Provider Ready Line Orderbook Depth Proof

Closed or narrowed:

- PM-GAP-075 backend/provider half now proves provider-backed ready depth on a line-family Book route response, not only a moneyline.
- The DU-A proof seeds a disposable compact World Cup first-half spread market and records the real `/api/orderbook/:marketId/book?maxLevels=24` response with `depthSource=provider-orderbook-depth`, `availability.status=ready`, and `providerOrderbookDepth.status=ready`.
- The same response carries selector-ready identity for visible mobile carry-through: `selectorKey=spreads:first-half:1.5`, `marketFamily=spread`, `marketType=spread`, `marketGroupKey=spreads`, `period=first-half`, `line=1.5`, `unit=goals`, and route outcome ids/sides.
- `levels[]` now includes additive `value` beside existing `total`, so mobile proof can assert Price/Shares/Value without renaming the legacy notional field.

Fields Holiwyn still needs but backend does not fully provide:

- A visible mobile run still needs to consume provider-backed ready depth from this route in the same UI session as selector/ticket interactions.
- Production-mapped World Cup Spread/Totals markets still need recurring provider refresh coverage when real provider line markets are available.
- A persisted/display contract for a Decimalize/equivalent Book setting remains outside this backend proof.

Schema mismatch:

- No schema change was required. Existing `Market.period`, `Market.line`, active `Outcome`, and `ReferenceOrderbookDepthSnapshot` rows cover the proof.

Route mismatch:

- The standalone Book route now provides the backend fields needed for provider-ready line ladder proof. Remaining mismatch is visible UI adoption/proof, not backend route shape.

Temporary mock/static data:

- No frontend mock data was added. The DU-A script uses disposable backend rows in the same provider ladder table consumed by production refresh code, and clears local proof-market open orders so `provider-orderbook-depth` is the route source.

Future migration concern:

- Keep `levels[].value` and `levels[].total` equivalent unless a future contract explicitly separates display notional from settlement value.
- Keep provider-ready line identity route-backed so selector, ladder, ticket, order, portfolio, and history can carry the same `marketId`/`outcomeId` values.

## Cycle DT-A - Provider Ready Orderbook Depth Proof

Closed or narrowed:

- PM-GAP-075 backend proof now covers `marketIdentity` and provider-backed ready ladder depth on the same Book route response.
- The focused route test proves multiple `levels[]` rows with numeric `price`, `shares`, and `total` values while `depthSource=provider-orderbook-depth` and `providerOrderbookDepth.status=ready`.
- Added a backend proof harness that seeds disposable `ReferenceOrderbookDepthSnapshot` rows for a compact World Cup-style market and records the actual `/api/orderbook/:marketId/book?maxLevels=24` response.

Fields Holiwyn still needs but backend does not fully provide:

- Production-mapped World Cup line-family markets still need recurring provider depth refresh coverage for non-disposable live events.
- Event-level sibling selector payload remains optional future support if mobile needs all Book selector options without one route call per market.

Schema mismatch:

- No schema change was required. Existing `Market`, `Outcome`, and `ReferenceOrderbookDepthSnapshot` fields cover the proof.

Route mismatch:

- The Book route can return the needed ready provider state. Remaining mismatch is proof/environment coverage for production-like provider mappings, not the route payload shape.

Temporary mock/static data:

- No frontend mock data was added. The DT script uses disposable backend rows with the same provider ladder table shape consumed by production refresh code.

Future migration concern:

- Keep provider identity and depth evidence out of mobile fallback fixtures. The route should remain the source of truth for `marketIdentity`, public provider `tokenId`, availability, and Price/Shares/Value ladder rows.

## Cycle DS-A - Orderbook Selector Identity Contract

Closed or narrowed:

- `/api/orderbook/:marketId/book` now returns backend-derived `marketIdentity` metadata next to the existing availability, bid/ask, and `levels[]` ladder fields.
- The identity block is selector-ready for Book parity: `selectorKey`, `marketFamily`, `marketType`, `marketGroupKey`, `marketGroupId`, `marketGroupTitle`, `displayOrder`, `period`, `line`, `unit`, `displayUnits`, and compact active outcomes.
- Focused backend tests prove the contract for Moneyline, Spread, and Totals selectable market families while preserving the public no-leak route guard.

Fields Holiwyn still needs but backend does not fully provide:

- Broader real provider identity coverage for live Spread/Totals markets when production provider mappings are available.
- Active tradable provider-backed event coverage for full filled-order lifecycle on line markets.
- First-class event-level Book selector route may still be useful if mobile wants all sibling market identities without first calling live-detail.

Schema mismatch:

- No schema change was required. The contract uses existing `Market` and active `Outcome` columns.

Route mismatch:

- The standalone Book route now exposes the same compact identity primitives that mobile previously had to infer from live-detail market rows.

Temporary mock/static data:

- None added. Unit proof uses mocked route inputs only; no frontend-only data or Prisma fixture was introduced.

Future migration concern:

- After Cycle EC-A, keep public provider `tokenId` available on Book `marketIdentity.outcomes[]` for cross-route identity proof, while keeping credential fields, owner fields, condition IDs, and private trading state out of the public route.

## Cycle DS-B/Integrated - Orderbook UI Contract Gaps

Feature:

- PM-GAP-075 visible Book/orderbook selector and ladder parity.

Fields Holiwyn still needs but backend does not fully provide:

- Event-level Book selector payload may be needed if mobile should open a full Polymarket-like selector sheet without making one orderbook route call per sibling market.
- A persisted/display contract for a `Decimalize book` equivalent setting is not defined.
- Stronger route/proof metadata for bid/ask side labels would make red/green ladder audit less dependent on screenshots.

Route mismatch:

- `/api/orderbook/:marketId/book` now exposes `marketIdentity`, but the integrated mobile smoke still proves mostly fallback/unavailable depth. Provider-backed ready depth must be proven on the same UI surface before PM-GAP-075 can pass.

Temporary mock/static data:

- DS integrated UI proof used existing contract-shaped mobile orderbook data and fallback depth rows where route-backed ready depth was not available in the smoke state.

Future migration concern:

- Keep `marketIdentity.selectorKey`, `marketType`, `period`, `line`, `unit`, `outcomes[]`, and depth `side` stable so the Book selector can carry identity into ticket, order, portfolio, and history.

## Cycle DR-A - Scheduled Provider Refresh Run Reporting

Closed or narrowed:

- Scheduled refresh now returns a backend-consumable run report with `runId`, `startedAt`, `completedAt`, `durationMs`, run `status`, and attempted/successful/failed/dry-run event counts.
- Per-event scheduled refresh results now expose `status=completed|failed|dry_run`; failed attempts include sanitized error name/message while preserving the cache invalidation contract for due markets.
- The proof harness asserts run reporting in addition to stale/refresh-due -> ready provider quote/depth/chart state.

Fields Holiwyn still needs but backend does not fully provide:

- Durable run history if operations needs audit visibility beyond JSON proof artifacts.
- Production scheduler/worker registration with cadence, retry policy, and alert routing.
- Broader production provider identity coverage for line-family markets when real provider markets or optional enrichment are available.

Schema mismatch:

- No schema change was required. Run reporting is returned by the scheduler service and not persisted.

Route mismatch:

- None for the backend contract. This remains a backend-only scheduler service; no mobile UI route consumes the new fields directly.

Temporary mock/static data:

- No frontend-only mock data was added. The proof uses disposable local event `mobile-provider-refresh-proof-live` with real Polymarket market/outcome identity and contract-proof fallback disabled.

Future migration concern:

- If scheduler run status becomes production-critical, persist run envelopes and per-event outcomes in a dedicated run-history table instead of relying only on logs or harness artifacts.

## Cycle DQ-A - Scheduled Provider Refresh Lifecycle

Closed or narrowed:

- Scheduled refresh orchestration is now proven at the backend service level for a mapped Polymarket provider event.
- The live-detail contract is proven to move from stale/refresh-due to ready after the scheduler refreshes provider quotes, CLOB depth, and chart history.
- Polymarket-first parity no longer depends on an OpticOdds credential for this path; optional line enrichment can be skipped while Gamma/CLOB refresh succeeds.

Fields Holiwyn still needs but backend does not fully provide:

- A production scheduler/worker registration with cadence, retry, and alerting configuration.
- Durable run history if operations needs audit visibility beyond JSON proof artifacts.
- Broader production provider identity coverage for line-family markets when real provider markets or optional enrichment are available.

Schema mismatch:

- No schema change was required. Existing provider identity fields and `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` tables cover the proof.

Route mismatch:

- None for the backend contract. `/api/mobile/events/:slug/live-detail` reports the before/after readiness fields used by the proof.
- Android tablet smoke did not complete provider assertions because the current visual hierarchy missed `event-detail-group-prop`; no route contract mismatch was found from that failed smoke.

Temporary mock/static data:

- The proof uses disposable local event `mobile-provider-refresh-proof-live` with real Polymarket market/outcome identity. It ages existing quote snapshots to force refresh-due state, then refreshes through real provider services without contract-proof fallback.

Future migration concern:

- Keep scheduled provider refresh separate from visual parity. The scheduler should remain a backend lifecycle service with fallback disabled for Polymarket parity proof, and deployment should add worker-level observability before production reliance.

## Cycle DF - Provider Mapping Operator UI

Closed or narrowed:

- Operator/admin UI now exists for the Cycle DE review-first bulk apply route.
- Operator input can be pasted as JSON or line-based market/slug pairs and normalized before route submission.
- Readiness and failed-review reasons are visible without reading raw proof artifacts.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider exact slugs/token IDs for spreads, totals, team totals, halves, corners, props, and correct score.
- A reliable production source/importer for line-market provider identities.
- Durable audit persistence for who reviewed/applied each exact slug set.

Schema mismatch:

- No schema change was required for the UI.
- If operator review becomes production-critical, add a review-attempt table rather than relying only on route responses.

Route mismatch:

- None for the selected workflow: the UI uses the existing protected readiness and review/apply route.
- Direct `mappings[]` apply remains available to tooling, but this UI intentionally uses `reviews[]`.

Temporary mock/static data:

- The UI includes sample Colombia/Ghana slugs as editable placeholder text only. It does not count sample input as mapped data.

Future migration concern:

- Keep real line-market source work separate from UI convenience. The UI makes reviewed slugs operable, but it does not solve provider discovery for missing line families.

## Cycle DE - Bulk Review Apply Workflow

Closed or narrowed:

- Bulk review and bulk apply are now joined behind a protected all-pass workflow.
- A failed review blocks the whole apply attempt and leaves provider mapping readiness unchanged.
- All-valid reviews can first dry-run attach validation, then apply the exact same reviewed mappings when `confirmApply=true`.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider exact slugs/token IDs for spreads, totals, team totals, halves, corners, props, and correct score.
- Operator/admin UI for collecting slugs from the Polymarket reference app and submitting review/apply payloads.
- Production importer/source strategy for trusted provider event slugs and line-market slugs.

Schema mismatch:

- No schema change was required. Existing provider identity fields remain sufficient for reviewed mappings.
- Long term, an audit table for operator review attempts could preserve who reviewed/applied which provider slugs.

Route mismatch:

- `/provider-mapping` can now perform review-first apply with `reviews[]`, but the app/admin surface still has no UI around it.
- Direct `mappings[]` apply remains available for tooling; production operator workflows should avoid bypassing review criteria.

Temporary mock/static data:

- The proof creates a local proof event and totals guard market. The applied 3 match-winner mappings use real Polymarket slugs, condition IDs, and CLOB token IDs; the guard market remains unmapped.

Future migration concern:

- Keep the all-or-nothing block behavior. Partial bulk apply would make live-detail, ticket, order, portfolio, and history identity harder to reason about.

## Cycle DC - Bulk Manual Slug Review Contract

Closed or narrowed:

- Exact-slug review is no longer limited to one market per request.
- Bulk preview returns attach-ready mappings only for candidates that pass family, relevance, token, and outcome-shape checks.
- Wrong-family line mappings are rejected in bulk proof with explicit `provider_family_mismatch` and `insufficient_market_relevance`.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider exact slugs/token IDs for spreads, totals, team totals, halves, corners, props, and correct score.
- Operator/admin UI for collecting slugs from the Polymarket reference app and submitting bulk review payloads.
- Bulk apply workflow that requires all P0 reviews to pass before applying production mappings.

Schema mismatch:

- No schema change was required. Existing provider identity fields remain sufficient for reviewed mappings.

Route mismatch:

- `/provider-candidates` can now bulk-preview slugs, but there is still no first-class admin UI to invoke it.
- `/provider-mapping` can apply mappings, but no combined review-and-apply orchestration route exists yet.

Temporary mock/static data:

- The proof creates a local totals guard market and preview reviews real match-winner slugs against it. It does not mark the totals market provider-backed.

Future migration concern:

- Keep preview and apply separate unless a future operator flow includes an explicit all-pass confirmation. Partial bulk review success must not silently map only the passing subset in production.

## Cycle DB - Provider Line Source Probe

Closed or narrowed:

- Line-market provider source ambiguity is narrowed: exact event payload, 23 exact slug guesses, and 96 broad line-query candidates produced 0 attach-ready line targets.
- The proof records rejection reasons per backend-shaped line target instead of only saying line data is missing.
- The existing relevance/family gate is proven to keep broad search from mapping match-winner or unrelated candidates into line markets.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider exact slugs/token IDs for spreads, totals, team totals, halves, corners, props, and correct score.
- A source discovery/import path beyond current Gamma exact event/search surfaces.
- Operator-reviewed slug capture from the Polymarket app if provider APIs do not expose line markets directly.

Schema mismatch:

- No schema change was required. Existing fields can store line provider mappings if a real candidate is found.

Route mismatch:

- `/api/mobile/events/:slug/provider-candidates` can validate provider candidates, but there is no operator workflow for pasting/reviewing exact line slugs in bulk.

Temporary mock/static data:

- The proof uses in-memory line targets only as contract-shaped diagnostics; it does not write DB rows and does not count them as provider-backed data.

Future migration concern:

- Do not keep spending cycles on broad Gamma line searches unless a new provider query surface is identified. Current evidence says the next useful step is a different source or real slugs collected from the reference app.

## Cycle DA - Provider Discovery Expansion

Closed or narrowed:

- Provider discovery now has a deterministic exact-slug fallback for match-winner markets when a trusted provider event slug exists.
- Discovery response now exposes `manualSlugFallbacks` and `manualSlugFallbackCandidateCount` so the search path is auditable.
- The proof moved the Colombia vs Ghana local proof event from 3 unmapped compact markets to 3 provider-refreshable markets, 6 token-backed outcomes, 6 quote snapshots, and 246 CLOB depth rows.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider identities for spreads, totals, team totals, halves, corners, props, and correct score.
- Production importer/operator review flow to persist trusted provider event slugs and any discovered exact line-market slugs.
- Ticket/order/portfolio/history proof for provider-backed line markets after line IDs exist.

Schema mismatch:

- No schema change was required. Existing `Event.externalSlug`, `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, and `Outcome.referenceTokenId` store the provider mapping.

Route mismatch:

- `/api/mobile/events/:slug/provider-candidates` can expose fallback candidates, but there is no operator UI yet to review and apply mappings from the app/admin surface.

Temporary mock/static data:

- The proof upserts local compact event rows, then populates them with real Polymarket market identity and CLOB token IDs before refresh. It is not frontend-only display data.

Future migration concern:

- Keep fallback derivation exact and narrow. Do not generalize broad search results into automatic mapping for line markets unless they pass exact family, token, and relevance checks.

## Cycle CZ - Line Slug Family Gate

Closed or narrowed:

- Exact slug preview now records expected provider family and candidate provider family.
- Wrong-family exact slugs are rejected with `provider_family_mismatch` before any attach proposal can be used.
- Line-family relevance now has a guarded path for generic Over/Under labels: family must match and important match tokens must overlap.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider exact slugs for spreads, totals, team totals, halves, corners, props, and correct score.
- Production/operator review UI for exact slug preview and confirmed attach.
- Device proof for ticket/order/portfolio/history after a real provider-backed line market exists.

Schema mismatch:

- No schema change was required. Existing market identity fields can store the result after a preview passes.

Route mismatch:

- The POST preview route can validate exact slugs, but no operator UI currently exposes this workflow.

Temporary mock/static data:

- The CZ proof uses synthetic provider candidates to prove the gate. It does not write or attach provider IDs.

Future migration concern:

- Keep `provider_family_mismatch` in every exact-slug and candidate-discovery attach path so manually supplied winner slugs cannot be used to satisfy totals/spreads/team-total markets.

## Cycle CY - Provider Line Market Availability Diagnostic

Closed or narrowed:

- Provider discovery now exposes explicit provider candidate family counts, including zero counts for line families.
- The exact Colombia vs. Ghana provider event is proven to expose only 3 match-winner candidates and 0 spread/total/team-total/halves/corners/correct-score candidates.
- Broad line-search diagnostics are proven unsafe for automatic attach: 60 candidates were checked, 0 were attach-ready, and 48 were rejected for insufficient relevance.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-owned line market identities for spreads, totals, team totals, halves, corners, props, and correct score.
- A provider source or reviewed exact-slug input that can supply `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, and `Outcome.referenceTokenId` for each line-market outcome.
- Provider-backed ticket/order/portfolio/history proof for selected line markets after real provider IDs exist.

Schema mismatch:

- No schema change was required. Existing `Market.marketType`, `Market.line`, `Market.period`, `Market.participantName`, and `Outcome.referenceTokenId` can represent line markets.
- If provider line markets come from a non-Polymarket source, `referenceSource` and provider metadata may need a first-class provider namespace.

Route mismatch:

- `/api/mobile/events/:slug/provider-candidates` can summarize provider families, but there is no production operator workflow yet for importing or reviewing line-specific provider slugs.

Temporary mock/static data:

- The CY proof uses in-memory Holiwyn-shaped line targets for diagnostics only. It does not create local markets and does not count any mock data as provider-backed.

Future migration concern:

- Do not use broad Gamma search results as line-market mappings. The proof shows broad search returns unrelated high-volume markets, so exact event/provider identity or a stronger provider endpoint is required.

## Cycle CX - Provider Event Slug Hint Discovery

Closed or narrowed:

- Provider candidate discovery can now use exact provider event slug hints from Holiwyn `Event` data instead of requiring every proof or operator call to pass `providerEventSlug`.
- `/provider-candidates` now reports `providerEventSlugs` and `providerEventSlugSource`, making the search path auditable.
- The real provider proof passed with `providerEventSlugSource=event`, 3 attach-ready compact markets, no-fallback quote refresh, and provider CLOB depth refresh.

Fields Holiwyn still needs but backend does not fully provide:

- Durable provider event slug metadata for every imported World Cup fixture, not only the local Colombia vs. Ghana proof row.
- Provider market slugs/token IDs for spreads, totals, team totals, halves, corners, and props when those markets exist.
- A production importer/review workflow that populates `Event.externalSlug` or equivalent metadata before provider candidate discovery runs.

Schema mismatch:

- No schema change was required. Existing `Event.externalSlug`, `Event.externalEventId`, `Event.source`, and `Event.metadata` are sufficient for exact event hints.
- If multiple providers are added later, event-level provider metadata should become first-class enough to distinguish provider name, event slug, provider event id, and source URL.

Route mismatch:

- `/api/mobile/events/:slug/provider-candidates` can derive exact event hints, but there is no separate operator UI/API yet to inspect or repair missing event-level provider slug metadata.

Temporary mock/static data:

- The proof setup still upserts a local event row, but the discovery/attach/refresh path uses real Gamma event markets, real CLOB token IDs, and no contract-proof fallback.

Future migration concern:

- Keep exact event hints separate from broad tag search. Broad FIFA/World Cup tag discovery remains useful for discovery, but it must not be treated as attach-ready without the relevance gate.

## Cycle CV - Provider Candidate Relevance Gate

Closed or narrowed:

- Provider candidate discovery now exposes a relevance report before a candidate can be attached.
- Unrelated but token-complete provider candidates are rejected with `insufficient_market_relevance`.
- Real provider search is reachable in the proof environment and no longer fails with only `fetch failed`.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider slugs/token IDs for the compact World Cup soccer event and its line markets.
- Better provider search strategy for future fixture names, because Gamma search may return unrelated high-liquidity markets.
- Optional operator-reviewed exact slug import flow for verified soccer markets.

Schema mismatch:

- No schema change was required. This cycle protects the existing attach contract before it writes `Market.referenceSource`, `Market.externalSlug`, `Market.conditionId`, or `Outcome.referenceTokenId`.

Route mismatch:

- `/provider-candidates` can now prove “provider reachable but no safe attach candidate” instead of conflating provider fetch failure with no mapping.

Temporary mock/static data:

- None. The proof uses real provider search responses and does not mutate mappings.

Future migration concern:

- Do not auto-attach provider candidates unless `attachReadiness.attachReady=true` and the relevance report matches the selected market/outcomes.

## Cycle CU - Provider CLOB Depth Fetcher

Closed or narrowed:

- Added a real Polymarket CLOB orderbook fetcher for mapped compact markets with active `Outcome.referenceTokenId` values.
- `POST /api/mobile/events/:slug/provider-refresh` now reports `providerDepth` alongside quote refresh output.
- `/api/orderbook/:marketId/book` is proven to move from `depthSource=provider-quote-snapshot` before refresh to `depthSource=provider-orderbook-depth` after real CLOB refresh.
- Samsung tablet proof shows the refreshed provider depth path on the Holiwyn Book surface.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider identity mapping for every compact World Cup soccer market.
- Production retention/cleanup policy for old provider ladder rows.
- Provider retry/error taxonomy if the CLOB endpoint is slow, partial, or unavailable.

Schema mismatch:

- No schema change was required. Cycle CU uses the `ReferenceOrderbookDepthSnapshot` table added in Cycle CT.

Route mismatch:

- The provider refresh route now includes the depth fetcher for mapped markets. The local World Cup compact event remains partially unmapped, so full live-game provider depth coverage is still open.

Temporary mock/static data:

- None in mobile UI. The disposable proof event uses provider-contract-shaped local rows and real CLOB data.

Future migration concern:

- Once real soccer market mappings exist, the same fetcher should run for those markets and the disposable proof event should remain only a harness fixture.

## Cycle CT - Provider Orderbook Depth Snapshot Contract

Closed or narrowed:

- Added durable `ReferenceOrderbookDepthSnapshot` model for provider CLOB/orderbook ladder rows.
- Added writer service `upsertReferenceOrderbookDepthSnapshots()` with market/outcome/source/side/price identity.
- `/api/orderbook/:marketId/book` can now return `depthSource=provider-orderbook-depth` and real ladder levels before falling back to top-quote estimates.
- `/api/mobile/events/:slug/live-detail` now exposes batched provider ladder counts and per-market `providerOrderbookDepth` metadata.

Still missing:

- Real provider CLOB/depth fetcher that populates `ReferenceOrderbookDepthSnapshot` from Polymarket or the production sports provider.
- Real World Cup compact soccer provider mappings for every live market.
- Cleanup/retention policy for old provider ladder rows after a real fetcher is added.

Future migration concern:

- The local proof database has migration-history drift, so Cycle CT proof applied the table SQL directly. The committed migration remains the source of truth for clean environments.

## Cycle CS - Provider Quote Top-Of-Book Depth Bridge

Fields now provided or wired:

- `/api/orderbook/:marketId/book` now distinguishes `depthSource=local-orderbook`, `provider-quote-snapshot`, or `empty`.
- Provider quote depth metadata is explicit: `providerQuoteDepth.source`, `levelCount`, `sizeSource`, `isEstimatedSize`, and `reason`.
- When local order rows are absent but refreshed provider quote snapshots include best bid/ask plus liquidity/volume, the route returns provider-derived top bid/ask levels instead of `no-depth`.
- Mobile adapter preserves server-hydrated depth as `orderbook-route` so the Book overlay can show route-backed depth without waiting for a secondary request.

Fields Holiwyn still needs but backend does not fully provide:

- Full provider orderbook depth ladders, if product parity requires more than top bid/ask.
- Real World Cup compact soccer provider mappings for every live market.
- Android device proof for this cycle after wireless debugging is reconnected.

Schema mismatch:

- No schema change was required. The bridge uses existing `ReferenceQuoteSnapshot` price and liquidity fields.

Route mismatch:

- Route proof and Samsung tablet proof passed for the disposable provider proof event after the tablet reconnected.

Temporary mock/static data:

- None in the mobile UI. The disposable proof event is provider-contract-shaped and seeded from a real Gamma market.

Future migration concern:

- Do not market this as full provider depth. It is top-of-book provider quote depth with estimated size; a future provider-specific depth route/schema is still needed for full Polymarket orderbook parity.

## Cycle CR - Provider-Owned Refresh And Cache Invalidation

Fields now provided or wired:

- Protected `POST /api/mobile/events/:slug/provider-refresh` executes a real provider refresh for provider-mapped compact markets and returns refresh counts plus explicit cache invalidation metadata.
- The refresh response exposes `cacheInvalidation.source`, `generatedAt`, `eventSlug`, `marketCount`, `invalidated[]`, and `errors[]`.
- The disposable proof event demonstrates the full stale/refresh-due to ready transition through `ReferenceQuoteSnapshot` rows, with `allowContractProofFallback=false`.
- Tablet proof confirms the refreshed provider quote data is visible in Holiwyn event detail and selected Book flow.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider identity mapping for every compact World Cup soccer market.
- Provider-owned orderbook depth ladders or a documented bridge from provider quote snapshots into route-backed `levels[]`.
- Provider error taxonomy beyond the current provider error string/counts.

Schema mismatch:

- No schema change was required. Cycle CR uses existing `Market.referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, `Outcome.referenceTokenId`, `Outcome.referenceOutcomeLabel`, and `ReferenceQuoteSnapshot` rows.

Route mismatch:

- The real refresh and invalidation route is now present and proven on a disposable mapped provider event.
- The production World Cup live event remains partially unmapped, so the same no-fallback route cannot yet refresh all soccer compact markets.

Temporary mock/static data:

- The proof setup uses disposable fixture rows, but they are provider-contract-shaped and seeded from a real Gamma market response. They are not arbitrary display-only UI strings.

Future migration concern:

- Next structural work should either import/map real World Cup soccer markets or add the full provider CLOB/depth route needed for complete orderbook parity. Visual UI work should remain blocked until one of those provider data debts is closed.

## Cycle CQ - Manual Provider Slug Preview Contract

Fields now provided or wired:

- Protected `POST /api/mobile/events/:slug/provider-candidates` accepts a compact `marketId` and explicit Polymarket slugs for exact candidate preview.
- Manual preview output reuses the same candidate and attach-proposal shape as broad discovery.
- Route proof preserves provider fetch errors as data, preventing fake provider identity from being attached.

Fields Holiwyn still needs but backend does not fully provide:

- Successful Gamma slug preview in the current proof environment.
- Real Polymarket market slugs for compact World Cup live markets.
- Confirmed provider identity apply and no-fallback refresh proof after real IDs are attached.

Schema mismatch:

- No schema change was needed. Manual preview is read-only and prepares data for existing `Market`/`Outcome` provider identity fields.

Route mismatch:

- Manual preview route exists, but provider fetch still returned `fetch failed`; no attach-ready candidates were found in this cycle.

Temporary mock/static data:

- None. The proof did not fabricate provider candidate payloads or write provider IDs.

Future migration concern:

- The next cycle should address the provider fetch failure directly or run the preview path where Gamma is reachable, then attach real IDs with the protected mapping route.

## Cycle CP - Provider Candidate Discovery Contract

Fields now provided or wired:

- Protected `/api/mobile/events/:slug/provider-candidates` returns compact market search queries, provider candidate rows, ranking metadata, attach readiness, and attach proposals when candidates are complete.
- Candidate rows are shaped for the existing provider identity attach contract: `externalSlug`, `externalMarketId`, `conditionId`, outcome token IDs, and outcome labels.
- Query-contract proof shows all 14 compact markets now have backend-derived provider search terms.

Fields Holiwyn still needs but backend does not fully provide:

- Successful provider fetch in the current local proof environment.
- Real attach-ready candidates for compact World Cup live markets.
- Confirmed apply using real provider IDs and subsequent no-fallback provider refresh proof.

Schema mismatch:

- No schema change was needed. Discovery is read-only and prepares data for existing `Market`/`Outcome` provider identity columns.

Route mismatch:

- Candidate route exists, but provider fetch proof returned `fetch failed` for all 14 targets. No real provider identities were discovered in this cycle.

Temporary mock/static data:

- None. `fetchProvider=false` only proves query generation and does not fabricate provider candidates.

Future migration concern:

- The next structural cycle should either make provider fetch succeed from the local proof environment or add a manual real-slug preview/import path that uses actual Polymarket market slugs and the existing attach route.

## Cycle CO - Provider Identity Attach Contract

Fields now provided or wired:

- Protected `POST /api/mobile/events/:slug/provider-mapping` can validate and dry-run provider identity attach requests for compact live markets.
- The attach contract accepts provider-owned market fields and outcome token labels in the same shape required by the readiness and refresh services.
- Dry-run proof shows one complete compact market mapping would move projected readiness from 0 to 1 refreshable compact market without mutating the database.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket/provider candidate discovery for compact World Cup live markets.
- Real provider-owned IDs for every compact market/outcome.
- A confirmed apply proof using real provider IDs, followed by no-fallback provider refresh proof.

Schema mismatch:

- No schema change was needed; `Market` and `Outcome` already hold the required provider identity fields.

Route mismatch:

- The attach route exists, but current local data still has no real provider IDs to apply. No-fallback refresh remains blocked until real mappings are attached.

Temporary mock/static data:

- The proof uses future-shaped dry-run IDs only. It does not write fake IDs to `Market` or `Outcome`.

Future migration concern:

- The next structural cycle should discover real provider candidates or import actual provider identities, then call the same POST route with confirmed mappings and prove readiness increases using real IDs.

## Cycle CN - Provider Mapping Readiness Contract

Fields now provided or wired:

- Protected `/api/mobile/events/:slug/provider-mapping` reports compact market/provider identity readiness.
- Provider refresh responses now include `mappingReadiness`, so a no-fallback refresh can explain why it did not call the external provider.
- Route proof confirms the current compact World Cup event has 14 compact markets, 0 provider-refreshable markets, 14 unsupported-source markets, and 14 markets with missing outcome token mappings.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider-owned market identities for compact World Cup live markets: `referenceSource=polymarket` or a production provider source, `externalSlug`, `externalMarketId`, and `conditionId`.
- Real provider-owned outcome identities for every compact outcome: `referenceTokenId` and `referenceOutcomeLabel`.
- An import/mapping workflow that connects FIFA schedule live markets to actual provider markets, or a production sports provider adapter that owns those fields.

Schema mismatch:

- Current `Market` and `Outcome` columns can hold provider mapping, but the seeded compact live event is still `fifa_schedule` sourced and therefore cannot be refreshed from Polymarket Gamma without mapping.

Route mismatch:

- `/api/mobile/events/:slug/provider-refresh` can execute refresh, but no-fallback refresh is correctly blocked for the current compact event because provider mapping readiness is false.

Temporary mock/static data:

- No new dummy UI data was added. The no-fallback proof deliberately did not use `allowContractProofFallback`.

Future migration concern:

- The next PM-GAP-067 cycle should import or attach provider identities to compact World Cup live markets, then rerun `/provider-refresh` without `allowContractProofFallback` and prove stale/refresh-due moves to ready through real provider-owned rows.

## Cycle CM - Provider Refresh Execution Contract

Fields now provided or wired:

- Protected `/api/mobile/events/:slug/provider-refresh` executes compact live provider refresh/invalidation.
- `refreshPolymarketReferenceSnapshots()` can refresh an explicit market-id batch and reports actual snapshot write counts.
- Route proof demonstrates stale/refresh-due live-detail state after snapshot expiration and ready state after explicit refresh proof.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket or production sports-provider mapping for compact World Cup match markets.
- Provider-owned market/outcome IDs for first-half, second-half, spreads, totals, team totals, and other line markets.
- Real provider error classification beyond unsupported local mappings and Gamma fetch failures.

Schema mismatch:

- `ReferenceQuoteSnapshot` is sufficient for top quote refresh execution, but compact World Cup markets currently use `referenceSource=fifa_schedule`; they are not Polymarket-imported markets.

Route mismatch:

- The refresh route exists and is protected, but real refresh cannot update local compact markets until those markets are mapped to real provider slugs/tokens.

Temporary mock/static data:

- Explicit local contract-proof fallback is allowed only through the protected refresh route with `allowContractProofFallback=true`. It writes the same `ReferenceQuoteSnapshot` table shape and is documented as proof fallback, not production provider parity.

Future migration concern:

- The next structural provider cycle should import/map real provider market IDs for compact World Cup live markets or add a production sports odds provider adapter before removing the fallback proof lane.

## Cycle CL - Provider Refresh Policy Contract

Fields now provided or wired:

- `/api/orderbook/:marketId/book` now exposes `providerQuoteSnapshot.refreshTtlSeconds`, `nextRefreshAt`, `shouldRefresh`, and `refreshKey`.
- `/api/mobile/events/:slug/live-detail` now exposes compact aggregate provider snapshot counts: ready, stale, refresh-due, and earliest next refresh.
- Tests and route proof confirm the selected second-half market/book carries the same policy fields while preserving provider-ready status and route-backed depth.

Fields Holiwyn still needs but backend does not fully provide:

- Real external provider refresh execution for current World Cup live markets.
- Provider-owned cache invalidation/update sequence, provider response sequence/id, and provider error classification.
- Provider-owned multi-level depth if top quote snapshots are not enough for Polymarket parity.

Schema mismatch:

- Existing `ReferenceQuoteSnapshot` supports top quote freshness and policy fields derived from `fetchedAt`. Full provider depth ladders may still need a dedicated provider orderbook-depth snapshot table.

Route mismatch:

- Public live-detail/orderbook routes can now report refresh due state, but there is no provider/admin refresh route or worker that updates snapshots on demand.

Temporary mock/static data:

- Cycle CL reuses deterministic local proof rows in the real `ReferenceQuoteSnapshot` table. The rows remain future-backend-shaped and can be replaced by an external provider feed without changing the mobile response shape.

Future migration concern:

- Keep `refreshKey` stable enough for mobile cache invalidation, but avoid exposing sensitive provider token, condition, or credential fields in public routes.

## Cycle CK - Live Provider Quote Snapshot Ready Proof

Fields now provided or wired:

- `mobile:live-provider-quote-snapshot-seed` writes 31 provider-shaped `ReferenceQuoteSnapshot` rows across 14 compact World Cup live markets.
- `/api/mobile/events/:slug/live-detail` now proves `contract.batchedProviderQuoteSnapshotSource=reference-quote-snapshot` and `batchedProviderQuoteSnapshotMarketCount=14` when provider rows exist.
- `/api/orderbook/:marketId/book` now proves selected second-half `providerQuoteSnapshot.status=ready`, `snapshotCount=3`, and `acceptingOrders=true`.

Fields Holiwyn still needs but backend does not fully provide:

- Real external provider ingestion for current World Cup live markets.
- Provider refresh/invalidation sequence, provider response timestamps, and stale/error classification from the actual feed.
- Provider-owned multi-level depth if top quote snapshots are not enough for Polymarket parity.

Schema mismatch:

- Current `ReferenceQuoteSnapshot` supports top quote readiness. Full provider depth ladders may need a dedicated provider orderbook-depth snapshot table.

Route mismatch:

- Ready-state provider proof is now available through existing public routes, but there is no public/admin event-level provider refresh route dedicated to mobile live-detail QA.

Temporary mock/static data:

- Cycle CK uses deterministic local proof rows in the real `ReferenceQuoteSnapshot` table. The rows are future-backend-shaped and keyed by `marketId`, `outcomeId`, and `source`.

Future migration concern:

- Real provider ingestion should write the same fields so the mobile routes can replace proof rows without UI or API contract changes.

## Cycle CJ - Provider Quote Snapshot Contract

Fields now provided or wired:

- `buildPublicOrderbookSnapshot()` returns `providerQuoteSnapshot` using existing `ReferenceQuoteSnapshot` rows.
- `/api/orderbook/:marketId/book` exposes safe provider snapshot status and keeps no-leak tests around the public payload.
- `/api/mobile/events/:slug/live-detail` exposes `markets[].providerQuoteSnapshot`, `contract.batchedProviderQuoteSnapshotSource`, and `contract.batchedProviderQuoteSnapshotMarketCount`.

Fields Holiwyn still needs but backend does not fully provide:

- Actual provider ingestion for World Cup live events so `ReferenceQuoteSnapshot` rows exist for every visible market/outcome.
- Provider cache invalidation/update sequence and snapshot identifiers if the provider feed supports them.
- Provider depth ladders beyond top quote snapshots if Polymarket parity requires full market-depth data separate from local orders.

Schema mismatch:

- `ReferenceQuoteSnapshot` is enough for top quote/freshness metadata. If future provider depth includes multiple bid/ask levels per outcome, a dedicated provider orderbook snapshot table may still be needed.

Route mismatch:

- Selected orderbook and compact live-detail routes now expose provider snapshot status, but no ingestion/admin refresh route is part of this mobile cycle.

Temporary mock/static data:

- No new frontend dummy data was added. Local proof has no provider snapshot rows, so the route truthfully returns `status: unavailable`.

Future migration concern:

- Keep provider snapshot status separate from local orderbook depth status so Holiwyn can show "depth exists but provider feed is stale/unavailable" without confusing the trading surface.

## Cycle CI - Depth Batching Policy Contract

Fields now provided or wired:

- `/api/mobile/events/:slug/live-detail` now returns compact route policy metadata: `contract.generatedAt`, `contract.maxMarkets`, `contract.batchedOrderbookDepthRequestedMarketCount`, `contract.batchedOrderbookDepthRequestedMarketIds`, `contract.batchedOrderbookDepthMaxLevels`, and `contract.batchedOrderbookDepthCacheTtlSeconds`.
- The focused backend test proves the route requests 14 compact markets, records the requested market IDs in order, caps depth at 24 levels, and exposes a 3-second TTL.
- Samsung tablet proof confirms the visible second-half route-backed depth row and selected Book flow still work with the expanded contract.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-owned cache/invalidation metadata such as provider snapshot ID, provider update sequence, cache hit/miss, and stale reason per depth batch.
- Provider-owned liquidity for every visible World Cup live market and line.
- Backend-owned provider live stats only if Holiwyn keeps a stats tab for predicting-related context.

Schema mismatch:

- Current proof depth still comes from open `Order` rows. Production provider parity may need a quote/orderbook snapshot table keyed by `marketId`, `outcomeId`, provider timestamp/sequence, side, price, size, and snapshot freshness.

Route mismatch:

- The compact live-detail route now documents batching policy metadata, but there is still no dedicated provider-scale batch depth route with cache invalidation controls.

Temporary mock/static data:

- No new frontend mock shape was added. Existing local proof orders remain backend-shaped with stable `marketId`, `outcomeId`, side, price, shares, and total.

Future migration concern:

- Keep the new policy fields stable when provider depth replaces local proof orders so the mobile app can reason about route freshness, limits, and selected market identity without changing UI contracts.

## Cycle CH - Batched Live Market Depth Contract

Fields now provided or wired:

- `/api/mobile/events/:slug/live-detail` now returns batched route-backed depth for every compact visible market that has open orderbook rows.
- The contract includes `contract.batchedOrderbookDepthSource` and `contract.batchedOrderbookDepthMarketCount`.
- Each compact market can now carry `liquidity`, `orderbookDepth[]`, and outcome-level `bestBid`, `bestAsk`, `bestBidSize`, and `bestAskSize`.
- EventDetail exposes visible `event-detail-market-depth-* market-depth-batched Route depth` chips before the selected Book overlay opens.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-owned liquidity ingestion for every visible World Cup live market, including all selectable lines and discovered market groups.
- Production batching/prefetch policy for high-market-count live events.
- Provider freshness/status tied to each depth snapshot, not only the current market timestamp availability fields.

Schema mismatch:

- Existing open `Order` rows are enough for proof depth. Production provider liquidity may need a quote/orderbook snapshot table to avoid recalculating all visible books from local orders on every compact route request.

Route mismatch:

- Compact live-detail now batches current route-backed depth, but there is no dedicated provider-scale batch depth route with pagination, max market count, cache policy, or invalidation metadata.

Temporary mock/static data:

- Cycle CH uses deterministic local proof orders in real backend tables. The fixture shape is future-backend-shaped: `marketId`, `outcomeId`, side, price, shares, total, and liquidity.

Future migration concern:

- If provider data becomes the source of truth, keep the compact market depth shape stable so EventDetail rows, ticket selection, orderbook, portfolio, and history can preserve selected market/outcome identity without a mobile rewrite.

## Cycle CG - Second-Half Orderbook Depth Proof

Fields now provided or wired:

- Samsung tablet proof confirms second-half row availability and selected second-half orderbook route depth.
- The proof uses the backend second-half market `ed121b08-88bd-4735-9793-64a0022e9696` with `marketType=match_winner_1x2`, `period=second-half`, stable `outcomeId` values, and route-backed bid/ask depth.
- The new second-half smoke path proves the selected market identity does not fall back to the primary full-game winner or first-half winner.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-ingested half-period pricing, liquidity, freshness, and settlement data.
- Provider-owned live stats and all-line market liquidity across every visible live soccer market group.

Schema mismatch:

- Same as Cycle CF: current seed harness avoids relying on the declared `Outcome(marketId, code)` conflict target until database migration hygiene is confirmed.

Route mismatch:

- `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book` can now serve both first-half and second-half selected proof paths.
- There is still no provider feed route/schema that continuously refreshes half-period markets.

Temporary mock/static data:

- Second-half orderbook depth is deterministic local proof data in real backend tables. It is future-backend-shaped and uses `marketId`, `outcomeId`, side, price, shares, and period identity.

Future migration concern:

- Provider ingestion should write the same `period=second-half` and `marketType=match_winner_1x2` shape so mobile can replace proof markets without changing UI logic.

## Cycle CF - Halves Orderbook Depth Contract

Fields now provided or wired:

- Compact live-detail route now reserves backend first-half and second-half winner markets when present.
- Seeded Halves markets use stable backend fields: `marketId`, `marketType`, `marketGroupKey`, `period`, `outcomeId`, `side`, `status`, and `availability`.
- EventDetail preserves first-half market identity into Book and ticket interactions instead of falling back to the primary full-game winner market.
- Samsung tablet proof confirms first-half row availability and selected first-half orderbook route depth.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-ingested half-period market discovery, pricing, liquidity, and freshness.
- Settlement data contract for half-period markets.

Schema mismatch:

- The Prisma schema declares `@@unique([marketId, code])` on `Outcome`, but the current database rejected `ON CONFLICT` for that target. The seed harness uses find-then-update; migration hygiene should be checked before production.

Route mismatch:

- `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book` can now serve the first-half proof path.
- There is still no provider feed route/schema that continuously refreshes half-period markets.

Temporary mock/static data:

- The first-half market and orderbook depth are deterministic local proof rows in real backend tables, not frontend-only mock strings. Second-half route depth is proven in Cycle CG.

Future migration concern:

- Provider ingestion should write the same `period` and `marketType` shape so mobile can replace proof markets without changing UI logic.

## Cycle CE - Compact Market Availability Contract

Fields now provided or wired:

- `/api/mobile/events/:slug/live-detail` now returns `markets[].availability` for each compact market with source, status, raw `marketStatus`, timestamp, staleness seconds, stale threshold, booleans, and reason.
- Mobile `Market` types and adapter preserve the availability object instead of collapsing it into display text.
- EventDetail exposes visible line-row proof labels such as `event-detail-market-availability-team-total-goals`, `market-availability-stale`, and `market-status-LIVE`.
- Samsung tablet proof confirms the Team Totals row shows pre-open stale availability and the opened orderbook shows the same stale selected-market state with route depth.

Fields Holiwyn still needs but backend does not fully provide:

- Provider heartbeat/ingestion that refreshes `Market.sourceUpdatedAt` and provider status for every line market.
- Provider-owned delayed/suspended/unavailable states beyond deriving from local `Market.status`.
- Per-outcome availability if a provider suspends a specific outcome while leaving the market visible.

Schema mismatch:

- The current schema can derive a first market availability contract from `Market.status`, `Market.sourceUpdatedAt`, and `Market.updatedAt`; production may need a dedicated provider status/history table.

Route mismatch:

- Compact live-detail and selected orderbook routes now both carry compatible availability shapes.
- Broader route work is still needed for all-line batching/prefetch and provider-refresh lifecycle.

Temporary mock/static data:

- This cycle does not introduce arbitrary local availability strings. Fallback fixtures may omit the field; server proof uses backend-shaped timestamps.

Future migration concern:

- When provider ingestion lands, keep the same `availability` response shape so ticket/order/portfolio/history can preserve selected market freshness without mobile rewrites.

## Cycle CD - Selected Orderbook Availability Contract

Fields now provided or wired:

- `/api/orderbook/:marketId/book` now returns selected-market `availability` with source, normalized status, raw `marketStatus`, last update timestamp, staleness seconds, stale threshold, booleans, and reason.
- Mobile depth service stores selected-market availability on the event state.
- EventDetail orderbook overlay displays `event-detail-order-book-availability` with labels like `orderbook-availability-stale` and `orderbook-market-status-LIVE`.
- Samsung tablet proof confirms selected Team Totals shows route-backed ready depth plus stale selected-market availability.

Fields Holiwyn still needs but backend does not fully provide:

- Provider heartbeat/ingestion that refreshes `Market.sourceUpdatedAt` for each line market.
- Provider-owned availability flags for delayed, suspended, or unavailable states rather than deriving only from `Market.status`.
- Per-outcome/token availability if a provider can suspend one outcome while the market remains listed.

Schema mismatch:

- `Market.sourceUpdatedAt` is sufficient for a first selected-market availability contract, but production may need a dedicated provider status table or quote snapshot status per market/outcome.

Route mismatch:

- `/api/orderbook/:marketId/book` now carries selected-market availability.
- `/api/mobile/events/:slug/live-detail` still carries event-level freshness, not per-visible-market availability for every row.

Temporary mock/static data:

- The proof uses real route data and existing market timestamps; stale status is not a frontend-only string.

Future migration concern:

- Provider ingestion must update `sourceUpdatedAt` and/or provider status fields before live line markets can pass fresh provider parity.

## Cycle BC - Live Provider Freshness Contract

Fields now provided or wired:

- `/api/mobile/events/:slug/live-detail` now returns `event.liveDataStatus` with `source`, `status`, `lastUpdated`, `stalenessSeconds`, `staleAfterSeconds`, `isStale`, `isSuspended`, `isDelayed`, and `reason`.
- The compact route also exposes `contract.liveDataStatus` for audit and harness checks.
- Mobile adapter and EventDetail preserve and display the status with `event-detail-live-data-inline live-data-status-* live-data-source-*`.
- Samsung tablet proof confirms the server-backed live game page displays the route-derived freshness state while the selected Team Totals order book still opens route-backed ready depth.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider heartbeat or ingestion source for live soccer matches.
- Per-market/per-line freshness and suspended/delayed status, especially for adjustable Spread, Totals, Team Totals, and Halves lines.
- Provider-owned live stats and market availability transitions.

Schema mismatch:

- The current cycle uses `MarketOutcomeSnapshot` timestamps and optional `Event.metadata.mobileLiveDetail.liveDataStatus` overrides. A future production schema should decide whether freshness belongs on `Event`, `Market`, provider snapshot tables, or all three.

Route mismatch:

- The event-level compact route is sufficient for first visible freshness proof.
- A future line-market route should expose per-selected-market freshness beside orderbook depth.

Temporary mock/static data:

- Freshness proof uses seeded `MarketOutcomeSnapshot` rows, not frontend-only local strings.

Future migration concern:

- Replace deterministic snapshot seeding with provider ingestion before marking PM-GAP-067 backend parity complete.

## Cycle BB - Selected Team Totals Ready Depth

Fields now provided or wired:

- Backend `team_total_goals` markets now normalize to mobile `team-total` markets.
- Team Totals group now exposes a backend-selected Book control when the compact live-detail route provides the market.
- Samsung tablet proof confirms Team Totals market `408ffb79-3492-4fd0-b31b-87a26f8b9dd5` reaches `orderbook-status-ready` through the public orderbook route.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-owned live liquidity for all Team Totals lines and both teams, not only deterministic proof rows for one home-team line.
- Provider freshness, delayed, suspended, unavailable, and stale fields per line market.
- Selected Halves orderbook contract/proof if Polymarket exposes half-specific books for the chosen reference.

Schema mismatch:

- Backend type `team_total_goals` required an adapter alias to mobile `team-total`. The app now handles it, but backend/mobile canonical market-type documentation should be tightened.

Route mismatch:

- `/api/orderbook/:marketId/book` is sufficient for selected Team Totals depth.
- Compact route still carries representative markets rather than every line for every team.

Temporary mock/static data:

- Team Totals proof depth is seeded into real backend `Order` rows with stable `marketId` and `outcomeId`; it is not arbitrary local UI data.

Future migration concern:

- Replace local seeding with provider/liquidity ingestion before marking PM-GAP-067 backend parity complete.

## Cycle BA - Compact Line Group Coverage And Totals Ready Depth

Fields now provided or wired:

- `/api/mobile/events/:slug/live-detail` now reserves representative compact markets for primary winner, Spread 1.5, Totals 2.5, and Team Total 1.5.
- Mobile Totals lookup now accepts backend `total_goals` market type.
- Samsung tablet proof confirms selected Totals market `a552efe6-3147-4573-be95-8fe15c068c08` reaches `orderbook-status-ready` through the public orderbook route.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-owned live liquidity for all Totals, Team Totals, Spreads, Halves, and other discovered market groups.
- Market availability/freshness fields for stale, delayed, suspended, or no-liquidity states.
- Pagination or follow-up market-group route if the compact route cap is not enough for full Polymarket market depth.

Schema mismatch:

- Existing `Market.marketType` values are backend-specific (`total_goals`) while mobile uses a normalized UI contract (`totals`). The adapter/resolver now bridges this, but future contracts should document canonical market type aliases.

Route mismatch:

- The compact route now includes representative rendered line groups; full market-group browsing still needs either a larger payload strategy or focused route by group.

Temporary mock/static data:

- Totals ready depth is seeded into real backend `Order` rows with stable market/outcome IDs. It is acceptable proof data, not arbitrary frontend-only strings.

Future migration concern:

- Add provider ingestion or market-maker liquidity services so selected line books no longer depend on local seed scripts.

## Cycle AZ - Selected Line Market Seeded Ready Depth

Fields now provided or wired:

- The line-depth seed harness can target a specific backend market by `marketId` or by backend-shaped `marketType` plus `line`.
- The selected Spread market `ac527022-07f3-4abb-90f0-b291466e8459` now has deterministic route-readable BUY/SELL `Order` rows.
- Samsung tablet proof confirms the selected Spread order book returns `orderbook-source-orderbook-route`, `orderbook-status-ready`, `orderbook-empty-none`, and concrete bid/ask depth rows.

Fields Holiwyn still needs but backend does not fully provide:

- Real external/provider liquidity for all line markets, not only deterministic proof rows.
- Provider freshness, staleness, delayed, suspended, and unavailable reasons per market and outcome.
- A strategy for prefetching or batching depth for many visible line markets if one-route-per-market becomes too slow.

Schema mismatch:

- Existing open `Order` rows can model proof liquidity, but Holiwyn still lacks a provider-owned liquidity/orderbook snapshot model for production live sports pricing.

Route mismatch:

- `/api/orderbook/:marketId/book` is sufficient for selected-market depth proof.
- The compact live-detail route still embeds only primary-market depth; non-primary line markets are hydrated on demand.

Temporary mock/static data:

- The seeded Spread liquidity is future-backend-shaped proof data written into real backend tables, not arbitrary display-only frontend mock strings.

Future migration concern:

- Promote line-market liquidity from deterministic local seeding to provider ingestion or durable market-maker/liquidity services before marking PM-GAP-067 backend parity complete.

## Cycle AY - Selected Line Market Depth Identity

Fields now provided or wired:

- Mobile event state now records `orderbookDepthMarketId`, so route-backed depth status belongs to a specific market id.
- `loadMarketDepthState()` can request depth for an explicit selected market id.
- EventDetail order-book overlays include `event-detail-order-book-market-<marketId>` plus route source/status/empty-state labels.
- Samsung tablet proof confirms the Spread market id `ac527022-07f3-4abb-90f0-b291466e8459` returns route-backed `empty/no-depth` instead of incorrectly inheriting primary-market depth.

Fields Holiwyn still needs but backend does not fully provide:

- Seeded or provider-backed liquidity for spread, totals, team totals, halves, and other line markets.
- Market freshness/staleness/suspended metadata per selected line market.
- A richer mobile depth summary route if fetching every market book one at a time becomes too slow.

Schema mismatch:

- Existing open `Order` rows can back depth, but there is no first-class provider/liquidity model for line-market depth availability.

Route mismatch:

- `/api/orderbook/:marketId/book` is sufficient for on-demand selected market depth.
- The compact live-detail route still embeds depth only for the primary market; other markets rely on on-demand route calls.

Temporary mock/static data:

- Local fallback line markets still exist for some older fixture flows, but server live proof now uses backend market ids from the compact route for the selected spread book.

Future migration concern:

- Add a line-market liquidity seeding/provider cycle so non-primary line markets can prove `ready` depth, not only `empty` depth.

## Cycle AX - Compact Live Detail Route And Route-Backed Depth Proof

Fields now provided or wired:

- `/api/mobile/events/:slug/live-detail` provides a compact mobile live-detail payload with backend-style market/outcome ids, market group fields, line/period fields, primary orderbook depth, chart history, live stats, and contract metadata.
- `PolyApi.getEvent()` uses the compact route first and preserves legacy route fallback.
- Samsung tablet proof confirms `orderbook-source-orderbook-route`, `orderbook-status-ready`, depth rows, and ticket carry-through from a route-backed backend event.

Fields Holiwyn still needs but backend does not fully provide:

- Real external live-football provider ingestion for live stats and chart snapshots.
- Provider/source metadata for stale, delayed, suspended, or unavailable markets.
- Event-wide or on-demand depth hydration for every market group and line market, not only the primary market embedded in the compact route.

Schema mismatch:

- `MarketOutcomeSnapshot` still lacks provider source id, live/delayed flag, aggregation bucket, and availability reason.
- Live stats are still stored/serialized as optional event metadata instead of normalized provider-owned rows.

Route mismatch:

- The compact route now exists and is proven on device, but it is read-only and optimized for the first game-page view.
- Deep orderbook views can still use `/api/orderbook/:marketId/book`; future UI should fetch additional market depth on demand when the selected market changes.

Temporary mock/static data:

- Local fallback fixtures remain, but this cycle's proven game page path uses the compact backend route and seeded backend orderbook depth.

Future migration concern:

- When moving from Expo Go to dev build/APK, replace smoke-only launch flags with production-safe route restoration and explicit event-detail navigation.
- Promote live stats and provider availability states into durable backend models before production real-money trading.

## Cycle AU - Live Chart Route States

Fields now provided or wired:

- Mobile now preserves chart route lifecycle state: `loading`, `ready`, `empty`, and `error`.
- EventDetail chart audit labels include route source, status, range, and empty-state reason.
- `MarketChart.emptyState`, `range`, and `lastUpdated` are consumed by the selected event model instead of being discarded.

Fields Holiwyn still needs but backend does not fully provide:

- Real live World Cup provider snapshots so the chart reaches `ready` with server data during device proof.
- Richer delayed/suspended/market-paused reasons beyond `emptyState: "no-history"`.
- Full depth ladder state and availability reasons.

Schema mismatch:

- `MarketOutcomeSnapshot` still has no provider source id, live/delayed flag, aggregation bucket, or availability reason.

Route mismatch:

- The basic chart lifecycle route contract exists and is now consumed.
- The backend still cannot be proven live on device while local API/Docker are unavailable.

Temporary mock/static data:

- Fallback chart data remains visible, but it is now explicitly labeled as fallback/empty/error instead of being mistaken for route-backed parity.

Future migration concern:

- Add richer backend status values if provider ingestion distinguishes delayed, suspended, stale, or closed live markets.

## Cycle AT - Live Chart Snapshot Seeding Harness

Fields now provided or wired:

- A deterministic local/proof harness can generate `MarketOutcomeSnapshot` rows for every active outcome in a selected live World Cup market.
- The generated rows use canonical backend fields: `marketId`, `outcomeId`, `ts`, and decimal `price`.
- The harness writes a summary with selected event/market identity, generated time range, deleted snapshot count, created snapshot count, and preview probabilities.

Fields Holiwyn still needs but backend does not fully provide:

- Real external football provider ingestion that continuously writes live probability snapshots.
- Server-hydrated tablet proof showing `chart-source-market-chart-route` in EventDetail XML.
- Chart loading/empty/delayed/suspended/error states.

Schema mismatch:

- `MarketOutcomeSnapshot` still has no provider source id, live/delayed flag, aggregation bucket, or availability reason. Cycle AT does not change schema.

Route mismatch:

- No route mismatch for basic chart history: `/api/events/:slug` and `/api/markets/:marketId/chart` both read `MarketOutcomeSnapshot`.
- Backend/Docker was unavailable during this cycle, so the seed script could not be applied and verified through live HTTP routes.

Temporary mock/static data:

- Cycle AT reduces reliance on ad hoc local chart fixtures by adding a route-compatible database seeding harness.

Future migration concern:

- Replace the deterministic proof harness with real provider ingestion or a scheduled/import worker before production.

## Cycle AS - Event Detail Chart Route Hydration

Fields now provided or wired:

- EventDetail server mode now calls `PolyApi.getMarketChart()` for the selected event primary market.
- Mobile converts `MarketChart.history[]` into `event.chartHistory[]` with stable `outcomeId`, `timestamp`, and `probability`.
- `event.chartHistorySource` distinguishes route-hydrated chart data from embedded/fallback chart data for XML/device audit.

Fields Holiwyn still needs but backend does not fully provide:

- Real live World Cup provider ingestion that writes enough `MarketOutcomeSnapshot` rows to make the game chart move like Polymarket.
- Chart loading, empty, delayed, suspended, and route-error states that are visible to the user.
- Range selection UI and tooltip metadata backed by the chart route.

Schema mismatch:

- `MarketOutcomeSnapshot` still has no provider source id, live/delayed flag, aggregation bucket, or availability reason.

Route mismatch:

- The route exists and the game page consumes it, but Cycle AS could not prove live server hydration on device because backend health was unavailable during proof.

Temporary mock/static data:

- Embedded and local fixture chart data remains fallback only and matches the proposed backend point shape.

Future migration concern:

- PM-GAP-067 should continue with provider-shaped live snapshot seeding/ingestion or a dedicated no-history/loading state pass before returning to visual micro-polish.

## Cycle AR - Range-Aware Market Chart Contract

Fields now provided or wired:

- `/api/markets/:marketId/chart` now provides a mobile-ready range contract: `range`, `ranges`, `generatedAt`, `lastUpdated`, and `emptyState`.
- Chart response now includes flat `history[]` points with `outcomeId`, `timestamp`, `price`, and integer `probability`.
- Mobile API types include `MarketChartRange`, `MarketChartHistoryPoint`, and `MarketChart`.
- `PolyApi.getMarketChart(marketId, range)` is available for server-mode chart hydration.

Fields Holiwyn still needs but backend does not fully provide:

- Provider ingestion for live World Cup markets that continuously writes `MarketOutcomeSnapshot` rows.
- EventDetail UI integration that calls `getMarketChart()` for the selected market/range and handles loading/empty/error/suspended states.
- Chart tooltip metadata such as nearest point by touch position and range-specific aggregation buckets.

Schema mismatch:

- `MarketOutcomeSnapshot` stores price and timestamp, but no provider source id, delayed/live flag, range bucket, or availability reason.

Route mismatch:

- The dedicated chart route now exists and has a mobile-ready payload.
- Full Polymarket parity may still need an event-level chart route for multi-market/hero chart context if selected market and displayed chart diverge.

Temporary mock/static data:

- Local and embedded chart arrays remain fallback until the visible EventDetail chart consumes the dedicated route.

Future migration concern:

- The next PM-GAP-067 cycle should either hydrate EventDetail from `getMarketChart()` or seed/import real live snapshots so device proof can use server data instead of mock fallback.

## Cycle AQ - Live Chart History And Depth Identity Contract

Fields now provided or wired:

- `/api/events/:slug` can now emit `event.chartHistory[]` from `MarketOutcomeSnapshot` rows instead of relying only on `Event.metadata.chartHistory`.
- Snapshot-derived chart points use stable `outcomeId`, ISO `timestamp`, and integer `probability`.
- Mobile preserves `orderbookDepth[].outcomeId` through `normalizeMarket()` and the local event model.

Fields Holiwyn still needs but backend does not fully provide:

- Provider ingestion that writes real live football probability snapshots into `MarketOutcomeSnapshot`.
- Range-aware chart metadata such as available ranges, selected range, last-updated, loading, empty, delayed, and suspended states.
- Full orderbook ladder route with multiple price levels per outcome, timestamps, spread, and liquidity state.
- Match-flow/live-stats provider rows beyond the existing metadata fallback.

Schema mismatch:

- `MarketOutcomeSnapshot` is sufficient for basic chart series, but it has no range labels, provider source id, delayed/live flag, or chart availability metadata.
- Embedded `orderbookDepth` is compact top-of-book data, not a full historical depth snapshot model.

Route mismatch:

- `/api/events/:slug` now covers embedded live-detail chart history when snapshots exist.
- Future richer routes are still needed: `/api/markets/:marketId/history?range=...` and `/api/markets/:marketId/book`.

Temporary mock/static data:

- Metadata and local fixture chart histories are still allowed as fallback only when they match the backend `outcomeId`/`timestamp`/`probability` shape.

Future migration concern:

- When provider ingestion lands, ensure chart snapshots, orderbook depth, selected ticket outcome, portfolio identity, and history all use the same canonical `marketId`/`outcomeId` values.
- PM-GAP-067 remains in progress but narrower: snapshot-backed chart history and depth identity are wired; provider ingestion, full depth, and dedicated history routes remain active work.

## Cycle AP - Live Line Order Identity

Fields now provided or wired:

- Server ticket orders now carry a canonical `selection` payload with `marketId`, `outcomeId`, `marketGroupId`, `marketType`, `line`, `period`, `side`, `displayLabel`, and `contractSide`.
- `/api/orders` preserves sanitized `selection` and `contractSide` in `ApiOrderRequest.requestBody`.
- `/api/portfolio` returns `selection` for open orders and positions.
- `/api/portfolio/history` returns `selection` for canceled orders and recent trades.
- Mobile Portfolio snapshot/history mapping preserves all selection identity fields.

Fields Holiwyn still needs but backend does not fully provide:

- First-class `Order.selection` and `Trade.selection` schema fields, if we decide request-body reconstruction is not durable enough for production.
- A direct relation from filled trades back to the submitted order/request, so history can show exact submitted line metadata instead of inferring from market/outcome.
- Server-hydrated live-device proof against a real live line market remains desirable after PM-GAP-067 provider/depth work.

Schema mismatch:

- `ApiOrderRequest.requestBody` is the source of exact submitted selection for open/canceled orders.
- `Position` and `Trade` do not own selection fields; Cycle AP derives identity from `Market` and `Outcome`.

Route mismatch:

- No new route is needed for this increment.
- `/api/portfolio` and `/api/portfolio/history` are now the mobile-facing identity routes for portfolio surfaces.

Temporary mock/static data:

- Mock-mode ticket orders now use the same `TicketSelection` identity shape as server orders.

Future migration concern:

- If live line markets later support multiple provider ids per line/outcome, add provider-specific ids to the selection contract before production trading.

## Cycle AO - Live Event Detail Backend Contract

Fields now provided or wired:

- `/api/events/:slug` market objects now expose `marketGroupId` as the mobile alias for `marketGroupKey`.
- Market payloads now carry existing schema fields needed by live line markets: `marketType`, `period`, `line`, `marketGroupTitle`, and `propCategory`.
- Outcome payloads now carry `side`, `bestBidSize`, and `bestAskSize`, in addition to existing `price`, `bestBid`, and `bestAsk`.
- Market payloads now include top-level `orderbookDepth` derived from live open/partial orders, with `outcomeId`, `side`, `price`, `shares`, and `total`.
- Event summary payloads now expose optional `liveStats` and `chartHistory` arrays from provider-shaped event metadata.
- The mobile API types and World Cup adapter now preserve these fields into the Holiwyn event-detail model.

Fields Holiwyn still needs but backend does not fully provide:

- Real provider ingestion for `liveStats` and `chartHistory`; Cycle AO only defines and passes through the contract when metadata exists.
- Full historical chart route by market/outcome/range, including last-updated metadata.
- Full orderbook ladder route with multiple levels, timestamps, spread, suspended/no-liquidity state, and market-wide liquidity metadata.
- End-to-end order/portfolio/history identity proof for live line markets is now structurally covered by Cycle AP, but server-hydrated live-device proof should be repeated after live provider/depth data is wired.

Schema mismatch:

- Existing `Event.metadata` can carry `liveStats`/`chartHistory`, but this is not yet a first-class provider/cache model.
- Existing `MarketOutcomeSnapshot` can support future chart history, but `/api/events/:slug` does not query it in this cycle.
- Existing orders support orderbook depth, but mobile still receives only compact top levels embedded in event detail.

Route mismatch:

- `/api/events/:slug` is now the primary live-detail contract for event/market/outcome identity and compact depth.
- Future richer routes are still recommended: `/api/markets/:marketId/history`, `/api/markets/:marketId/book`, and `/api/events/:slug/live-stats`.

Temporary mock/static data:

- The Australia vs Egypt fixture remains valid fallback because it matches the same backend-shaped fields.
- Do not add more ad hoc live UI data outside this contract shape.

Future migration concern:

- PM-GAP-067 should remain open but narrowed: the unknown contract is reduced, while provider ingestion and richer routes remain active structural work.
- The next structural cycle should address PM-GAP-068 or the remaining PM-GAP-067 provider/history/depth sub-gaps before opening another feature area.

## Cycle AN - Live Event Detail Structural Parity

Fields Holiwyn needs but backend does not provide yet:

- Live event detail payload with `marketGroupId`, `marketId`, `outcomeId`, `marketType`, `period`, `line`, `side`, `probability`, `bestBid`, `bestAsk`, and `liquidity`.
- Line-market groups for live spreads, totals, team totals, halves, next-goal markets, and moneyline/live winner.
- Timestamped `chartHistory` by outcome/market, including range and last-updated metadata.
- `orderbookDepth` by market with bid/ask levels, shares, total, spread, and liquidity.
- `liveStats` by event with stable stat ids, home/away values, clock, score, timeline, and provider timestamp.
- Portfolio/order/activity fields that preserve live selected market, line, side, period, and outcome identity after submission.

Fields backend provides but mobile ignores:

- Not re-audited in this cycle. The cycle used fallback data because live-detail backend support is not yet confirmed.

Schema mismatch:

- Mobile can now model live market detail with contract-shaped fixture fields, but the backend schema has not been verified to support market groups, line values, live score/state, chart history, orderbook snapshots, or live stats as first-class records.
- Existing ticket/order identity supports selected event/market/outcome in mock mode, but line market identity still needs backend-backed preservation through orders, positions, open orders, and history.

Route mismatch:

- Current mobile event detail falls back to `worldCupEvents`.
- Future route options:
  - enrich `/api/events/:slug`
  - add `/api/mobile/events/:slug/live-detail`
  - add `/api/markets/:marketId/book`
  - add `/api/markets/:marketId/history`
  - add `/api/events/:slug/live-stats`

Temporary mock/static data:

- Australia vs Egypt live fixture in `mobile/src/mocks/worldCup.ts` includes backend-shaped fields: `marketGroupId`, `marketType`, `period`, `line`, `side`, `liquidity`, `orderbookDepth`, `chartHistory`, and `liveStats`.
- The fixture is allowed only as frontend parity scaffolding and must be replaced by backend routes before backend parity can be claimed.

Future migration concern:

- Do not add more live UI-only local rows until the route/schema direction is implemented or explicitly stubbed.
- The next cycle should address PM-GAP-067 or PM-GAP-068 before opening another new feature area.

## Cycle T - Whole-App Navigation And Page Map

Fields Holiwyn needs but backend does not provide yet:

- Sports/category rail metadata matching the Polymarket-style top rail: category id, label, icon/emoji/image, ordering, active state, and destination route.
- Page-map/navigation metadata for World Cup sub-tabs such as Games and Futures.
- Dedicated live sports feed metadata, including category counts and live/final grouping.
- Account/settings route metadata for profile, login, preferences, notifications, and wallet controls.

Fields backend provides but mobile ignores:

- Unknown for navigation because this cycle did not inspect live backend payloads.
- Existing mobile adapter consumes only the event/market/portfolio/profile fields declared in `mobile/src/types.ts`.

Schema mismatch:

- Mobile currently treats primary navigation as local UI state rather than backend-provided route configuration.
- Polymarket exposes top-level sports/category rail behavior that is not represented in the Holiwyn backend contract.

Route mismatch:

- Mobile uses `/api/events` with query params for Home/Search/Live-style discovery.
- A future backend route may need dedicated discovery endpoints such as `/api/mobile/navigation`, `/api/mobile/sports`, `/api/mobile/live`, or `/api/events?status=live`.

Temporary mock/static data:

- `worldCupEvents` and `worldCupFutures` remain local fallback data for discovery/navigation proof.
- Header promo, notifications feedback, and account shell are local-only prototype states.

Future migration concern:

- If the backend later owns app navigation categories, the mobile `SportNav`, `WorldCupSegmented`, and `BottomTabs` contracts should be split into static app shell navigation and backend-driven sports/category discovery.

## Cycle U - Event Page Top Shell/Action Controls

Fields Holiwyn needs but backend does not provide yet:

- Canonical `primaryMarketId` for each event detail payload.
- Order-book/depth fields per market/outcome: bid levels, ask levels, sizes, spread, last updated timestamp, and suspended/no-liquidity state.
- Canonical share URL/deep link per event/market.
- Localized share copy fields for English and Chinese.

Fields backend provides but mobile ignores:

- Unknown for this cycle; the proof used the existing event adapter and did not inspect a fresh live backend payload.

Schema mismatch:

- Mobile can render an Order Book overlay from event/outcome fields, but the backend contract does not yet define a Polymarket-style order-book/depth object.
- Share behavior currently derives from local event title/slug rather than a backend-owned canonical route.

Route mismatch:

- Event details use `/api/events/:slug`; a future depth route likely needs `/api/markets/:id/book` or equivalent included `market.depth` data.
- Share/deep-link generation may need `/api/mobile/share/event/:slug` or app config route metadata if server-generated links are required.

Temporary mock/static data:

- Order Book rows fall back to local market/outcome values.
- Share sheet uses local app copy and does not invoke a native or backend-generated share link in this focused pass.

Future migration concern:

- The mobile UI now expects top-shell Order Book behavior. If backend depth is unavailable in server mode, the app may show stale or synthetic depth unless the backend adds real market-depth support.

## Cycle V - Futures Market Rows

Fields Holiwyn needs but backend does not provide yet:

- Outcome-level futures volume, separate from market-level volume.
- Complete World Cup futures outcome catalog and ranking/order.
- Binary YES price and NO price per outcome.
- Explicit trade contract side: `YES` / `NO` separate from order action `BUY` / `SELL`.
- Outcome visual metadata such as flag/icon/image.

Fields backend provides but mobile ignores:

- Unknown for this cycle; proof used local fallback futures data.

Schema mismatch:

- Mobile can show `Buy No`, but the current ticket/order shape treats this as a sell/no-side approximation. Polymarket futures rows behave like binary YES/NO controls per outcome.
- Mobile derives outcome volume locally rather than consuming backend outcome-level volume.

Route mismatch:

- Futures discovery is folded into `/api/events`; future mobile routes may need dedicated `/api/mobile/world-cup/futures` or richer filters for sports/futures ranking.
- Binary NO pricing may need quote routes to return both yes and no sides per outcome.

Temporary mock/static data:

- `futureOutcomeVolume()` computes deterministic display volume from probability and rank.
- `futureOutcomeFlags` maps known fallback outcome ids to local flag markers.

Future migration concern:

- Once backend provides real futures outcome volume and yes/no prices, the local display helpers should be replaced by adapter-mapped fields to avoid fake liquidity signals.

## Cycle AK - Futures Catalog Expansion

Fields Holiwyn needs but backend does not provide yet:

- Complete World Cup Winner futures outcome catalog, not only top outcomes.
- Backend-owned outcome ordering and collapsed count, for example first three visible plus `18 more`.
- Outcome-level yes price, no price, implied odds, volume, and liquidity/depth.
- Outcome visual metadata such as country code, flag/icon, or image key.
- Market availability state for expanded outcomes: active, suspended, hidden, or settled.

Fields backend provides but mobile ignores:

- Unknown for this cycle; proof used local fallback futures data.

Schema mismatch:

- Mobile now has a 21-outcome fallback catalog, but the server contract is still event-list oriented and does not guarantee a full futures catalog shape.
- Expansion state is client-local. Backend does not yet provide display grouping, rank, or pagination hints.

Route mismatch:

- Current discovery uses `/api/events` style hydration.
- A future route may need `/api/mobile/world-cup/futures` or `/api/markets/:id/outcomes` with ranking, prices, and expansion metadata.

Temporary mock/static data:

- `worldCupFutures` contains static World Cup Winner outcomes for France through Australia.
- `futureOutcomeVolume()` still derives display volume locally.
- `futureOutcomeFlags` stores local flag metadata.

Future migration concern:

- When backend futures catalog data arrives, preserve the UI's collapse/expand behavior while replacing local outcomes, volumes, flags, and prices with adapter-mapped server fields.

## Cycle W - Futures Chart Range

Fields Holiwyn needs but backend does not provide yet:

- Market history series by market id and range.
- Per-outcome timestamped probability/price points.
- Range metadata for `1H`, `1D`, `1W`, `1M`, and `MAX`.
- Chart unavailable/loading/empty state metadata.
- Optional chart display settings/defaults.

Fields backend provides but mobile ignores:

- Unknown for this cycle; no backend history payload was inspected.

Schema mismatch:

- Mobile currently represents chart ranges as local UI state only.
- Polymarket reference implies live historical series per range; Holiwyn does not yet have a server contract for those points.

Route mismatch:

- A future route such as `/api/markets/:id/history?range=1D` or `/api/mobile/markets/:id/chart?range=1D` is needed.

Temporary mock/static data:

- Chart lines are deterministic local visual bands.
- Volume uses the futures card display helper instead of range-specific historical volume.

Future migration concern:

- Once real history is available, local chart geometry should be replaced by adapter-driven series rendering and tested with empty/no-history and suspended-market states.

## Cycle X - Match Market Tabs And Cards

Fields Holiwyn needs but backend does not provide yet:

- Explicit event market tab metadata, including tab id, label, order, enabled/empty state, and market group ids.
- Card-level market group type, for example `team_to_advance`, `moneyline_reg_time`, `exact_score`, and `halves`.
- Card-level volume distinct from event-level volume.
- Outcome button display price in cents and, where applicable, separate yes/no sides.
- Market-depth rows with price, shares, and total for each card/outcome.
- Card-level historical graph series for `Order Book`/`Graph` detail views.
- Exact-score outcome catalog and ordering.
- Half-market grouping and display ordering.
- Match-level `Live stats` payload.

Fields backend provides but mobile ignores:

- Unknown for this cycle; the focused proof used local/fallback event data.

Schema mismatch:

- Mobile currently derives Team to Advance from the primary event outcomes rather than a backend-declared market card.
- Mobile renders exact score and halves from local/fallback structures rather than a general market-group schema.
- Inline Order Book and Graph are UI states without a backend depth/history payload.

Route mismatch:

- `/api/events/:slug` is the likely home for grouped market discovery, but it needs richer nested market/card metadata.
- Future depth/history may need dedicated routes such as `/api/markets/:id/book` and `/api/markets/:id/history?range=1D`, or nested depth/history snapshots in the event detail response.

Temporary mock/static data:

- Team to Advance card volume is static display copy.
- Inline order-book rows and inline graph content are deterministic local values.
- Exact-score rows are local examples.

Future migration concern:

- Once backend market groups exist, EventDetail should render tab/card sections from server-provided group metadata instead of hardcoded local sections.

## Cycle Y - Line Adjustment

Fields Holiwyn needs but backend does not provide yet:

- Line market group id and market type, for example `spread` and `totals`.
- Period id/label/order, for example regulation time, first half, and second half.
- Line option list per market group and period.
- Stable market id per line/period/outcome combination.
- Outcome labels and quote prices/probabilities per selected line.
- Line-market depth/book rows.
- Line-market history/chart rows.
- Order/position/history fields that preserve line, period, market type, and selected outcome.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; proof used local/fallback event data.

Schema mismatch:

- Mobile currently derives spread/totals line prices locally rather than consuming quote rows.
- Ticket line identity is carried as display metadata instead of a backend-owned line market id.

Route mismatch:

- `/api/events/:slug` should include grouped line markets, but a future quote/depth route may also be needed, for example `/api/markets/:id/quote` or `/api/markets/:id/book`.

Temporary mock/static data:

- Spread and totals line options are local arrays.
- Line probabilities and odds are deterministic local calculations.

Future migration concern:

- Once backend line markets exist, ticket/order payloads should submit the backend line-market id instead of relying on display label parsing.

## Cycle Z - Trade Ticket

Fields Holiwyn needs but backend does not provide yet:

- Live quote preview for selected market/outcome/side/amount.
- Fee estimate, slippage impact, estimated shares, average price, and payout/proceeds returned from backend.
- Stable ticket selection payload for line markets, including market type, line, period, and backend market id.
- Auth/restriction state for view-only/download/login gates.
- Submit response fields that support immediate portfolio/open-order/activity updates.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; proof used fake-token mode.

Schema mismatch:

- Mobile computes ticket estimates locally from probability rather than backend quote data.
- Fake-token mode uses local order state rather than server order status/fill state.

Route mismatch:

- A future quote route is needed, for example `/api/mobile/quote` or `/api/markets/:id/quote`, before production-style ticket estimates can be trusted.
- Auth/restriction state should be exposed through profile/session config rather than hardcoded UI state.

Temporary mock/static data:

- 10,000 USDT fake balance.
- Client-side shares/payout/profit math.
- Fake-token mock order submission.

Future migration concern:

- When real-money trading is enabled, ticket submit should depend on server quote/order contracts and not on client-only probability math.

## Cycle AA - Portfolio

Fields Holiwyn needs but backend does not provide consistently yet:

- Canonical selected market identity for every portfolio item, including line market id, line value, period, market type, and outcome id.
- Open-order cancel response that includes canceled activity metadata and remaining/fill economics.
- Position re-trade/close quote fields matching ticket quote requirements.
- Activity rows with execution price, filled shares, implied odds, timestamp, side, and selected line metadata.
- Auth/restriction state to decide whether Portfolio should show fake-token mode, sign-in gate, or production wallet state.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; proof used fake-token mode and local fixtures.

Schema mismatch:

- Fake-token Portfolio stores selected line metadata locally; production backend needs a canonical schema for the same identity.
- Canceled orders can be represented as activity locally, but server history must expose canceled order activity consistently.

Route mismatch:

- Portfolio uses `/api/portfolio` and history routes when server mode is active, but fake-token proof remains local.
- Cancel uses `DELETE /api/orders/:id` in server mode; same-cycle server proof is deferred.

Temporary mock/static data:

- Fake balance and local positions/orders/activity.
- Disposable open-order fixture for cancel proof.

Future migration concern:

- Production Portfolio should be server-authoritative after every order/cancel/close, with local optimistic UI reconciled from backend snapshots.

## Cycle AB - Search/Explore

Fields Holiwyn needs but backend does not provide consistently yet:

- Search/Explore row rank and category/facet metadata.
- Canonical sport/category labels such as `Sports · Soccer`.
- Row-level volume, today volume, liquidity, comment/chat count, and end-time display strings.
- Result probability/outcome summary chosen by backend rank.
- Facet counts for status, category, saved, live, and other discovered Polymarket-style filters.
- Cursor/pagination metadata for long discovery lists.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; mobile currently consumes existing event/market/outcome data and local fallback rows.

Schema mismatch:

- Holiwyn currently computes Search row metrics locally from event/market shape.
- Saved state is local/profile-preference driven, not integrated into a ranked server Search endpoint.
- Polymarket global Search categories exceed Holiwyn's current World Cup-only product scope.

Route mismatch:

- Existing `/api/events` can hydrate event lists, but a production Search/Explore experience should likely use a dedicated route such as `/api/mobile/search` or `/api/discovery`.
- Search filters and sort are client-side over loaded events in this cycle.

Temporary mock/static data:

- Local row volume/today/liquidity/chat metrics.
- Local category chips limited to All, Sports, World Cup, and Live.
- Local status/sort filter panel.

Future migration concern:

- Backend should become authoritative for ranked discovery, search aliases, localized matching, facets, and pagination before production-scale World Cup market catalogs are used.

## Cycle AC - Account/settings

Fields Holiwyn needs but backend does not provide consistently yet:

- Auth/session state for signed-out, signed-in, restricted, and fake-token modes.
- Account/settings menu availability and destination metadata.
- Profile identity fields for display name, account id, tier, notification state, and language.
- Safe wallet capability flags for deposit, withdraw, and future EBPay availability.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; the proof used local mock account state.

Schema mismatch:

- Account sign-in is currently a local AsyncStorage mock flag.
- Language/ticket defaults can sync through profile preferences, but the account/settings shell is not yet server-authoritative.

Route mismatch:

- Production auth/session routes are not wired.
- Wallet capability/config route is missing by design until the wallet milestone.

Temporary mock/static data:

- Local mock sign-in and sign-out.
- Static More/settings menu rows.
- 10,000 USDT fake-token balance display.

Future migration concern:

- Real-money wallet, EBPay, deposit, and withdrawal controls must remain disabled until a dedicated auth/wallet/compliance milestone defines backend contracts.

## Cycle AD - Chart Behavior

Fields Holiwyn needs but backend does not provide consistently yet:

- Timestamped market/outcome chart series by selected market id, outcome id, and range.
- Current point metadata: timestamp, probability, price, volume, and whether the point is live/delayed.
- Target/reference line metadata when the chart needs a beat/threshold/reference value.
- Range/filter metadata matching Polymarket-style chart controls.
- Empty/loading/suspended/no-history chart states.
- Optional nearest-point payload for press/tooltip behavior.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; mobile used local event probability and local chart point math.

Schema mismatch:

- Mobile currently derives chart points from current event/outcome probability instead of consuming backend series rows.
- Tooltip state is local UI state, not a backend-provided nearest historical point.
- The event detail payload does not identify chart-specific range availability or empty/no-history state.

Route mismatch:

- Existing `/api/events/:slug` can hydrate event context but is not enough for historical chart parity.
- A future route is needed, for example `/api/markets/:id/history?range=1D&outcomeId=<id>` or `/api/mobile/events/:slug/chart`.

Temporary mock/static data:

- `selectedChartPoint` cycles through local `latest`, `mid`, and `target` states.
- Tooltip values are deterministic calculations from current probability.
- Chart target/reference line is a local visual baseline.

Future migration concern:

- Once backend history exists, EventDetail should render the chart from server series and use a loading/empty/suspended chart state rather than synthetic local points.

## Cycle AE - Market Page

Fields Holiwyn needs but backend does not provide consistently yet:

- Live stats availability for each event.
- Home/away stat rows: possession, shots, shots on target, corners, expected goals, fouls/cards, and other sport-specific fields.
- Match-flow timeline events with clock, team, type, and display text.
- Live stats loading, empty, delayed, suspended, and pregame-preview states.
- Market tab metadata that can declare Game Lines, Exact Score, Halves, Player Props, and unavailable tabs by event.
- Grouped market ordering and per-card volume/depth summaries.

Fields backend provides but mobile ignores:

- Unknown for this focused cycle; proof used local event data and local stats rows.

Schema mismatch:

- Mobile currently renders Live Stats from static local rows rather than backend data.
- Player Props visibility is local/product-driven, while the current reference event exposed only Game Lines, Exact Score, and Halves.
- Event detail grouping is still partly hardcoded in the UI.

Route mismatch:

- Existing `/api/events/:slug` can hydrate market context but does not provide live stats.
- A route such as `/api/events/:slug/live-stats` or `/api/mobile/events/:slug/stats` is needed.

Temporary mock/static data:

- Possession, shots, shots on target, corners, expected goals, and match-flow rows are local deterministic values.
- Market/Live stats tab state is local UI state.

Future migration concern:

- Once live stats are backend-backed, the Live Stats panel should reflect real event status and should show a clear empty/pregame state when stats are unavailable.

## Cycle AF - Reference Device Preflight Harness

Fields Holiwyn needs but backend does not provide consistently yet:

- None. This cycle is device/harness infrastructure.

Fields backend provides but mobile ignores:

- None.

Schema mismatch:

- None.

Route mismatch:

- None.

Temporary mock/static data:

- Known S23 wireless debugging endpoints are listed as reconnect attempts in the harness.

Future migration concern:

- None for backend. Future device farms or CI can replace the local ADB endpoint list with managed device metadata.

## Cycle AG - Trade Ticket

Fields Holiwyn needs but backend does not provide consistently yet:

- Ticket-ready market display title separate from full market title.
- Opposite outcome/team label for a Polymarket-like selected-outcome switch.
- Explicit binary side semantics: Buy Yes, Buy No, Sell Yes, Sell No, and whether each creates/closes shares.
- Executable quote price distinct from display probability.
- Payout, max payout, fee, slippage, min/max order size, and eligibility values from the server.
- Trading eligibility state: fake-token allowed, production blocked, location blocked, login required, or server unavailable.

Fields backend provides but mobile ignores:

- Unknown in this focused cycle; ticket proof used local event/outcome data and fallback depth where server mode was not active.

Schema mismatch:

- Mobile currently treats `side` as `buy` or `sell` and outcome label as the contract identity; Polymarket-style binary markets need explicit selected side and binary outcome ownership.
- Ticket payout is computed from current probability instead of an executable server quote.
- Advanced depth is attached to the outcome when present; a ticket-specific quote snapshot would be cleaner.

Route mismatch:

- Existing event detail can hydrate market/outcome context, but a route such as `/api/mobile/ticket-quote` or `/api/markets/:id/ticket-quote` should return ticket-specific price, depth, payout, fee, and eligibility metadata.

Temporary mock/static data:

- Fake-token balance remains local or portfolio-derived.
- Payout, shares, average price, and fee use local calculations in mock mode.
- Trading eligibility gates are documented from Polymarket reference but not implemented for fake-token trading.

Future migration concern:

- Before production trading, ticket submit must be server-authoritative for price, side semantics, balance/allowance, eligibility, idempotency, order status, and portfolio/activity effects.

## Cycle AH - Binary Side Ticket

Fields Holiwyn needs but backend does not provide consistently yet:

- Explicit `contractSide` for every binary order, position, open order, canceled order, and activity/history row.
- Optional separate YES/NO contract ids or token ids for each displayed outcome.
- Executable YES and NO prices, not only display probability.

Fields backend provides but mobile ignores:

- Unknown in this focused cycle; server mode order response is still treated generically.

Schema mismatch:

- Transaction action (`BUY`/`SELL`) and binary contract side (`YES`/`NO`) must be modeled as separate fields.
- Current mobile can pass `contractSide` to `/api/orders`, but backend/schema support must be verified in a future server contract cycle.

Route mismatch:

- `/api/orders` should accept and persist `contractSide`.
- `/api/portfolio` and `/api/portfolio/history` should return `contractSide` for positions, open orders, fills, canceled orders, and recent trades.

Temporary mock/static data:

- Holiwyn computes No price locally as `100 - probability`.
- Fake-token Portfolio stores `contractSide` locally after mock submission.

Future migration concern:

- Once backend-backed YES/NO contracts exist, close/sell/retrade flows must preserve whether the user owns YES shares or NO shares, and should not infer contract ownership from transaction side alone.

## Cycle AI - Trade Ticket Surface

Fields Holiwyn needs but backend does not provide consistently yet:

- `tradingEligibility` for ticket submit readiness: allowed, location blocked, login required, wallet required, server unavailable, or view-only.
- User-facing block reason and next action for production gates.
- Server-authoritative quote fields for the swipe-ready state: executable price, payout/proceeds, fee, min/max, and slippage impact.
- Ticket surface metadata that distinguishes display probability from executable quote and selected contract side.

Fields backend provides but mobile ignores:

- Unknown in this focused cycle; proofs used local/fallback ticket state.

Schema mismatch:

- Holiwyn fake-token mode has no production eligibility state, while logged-in Polymarket can block the ticket with a location-verification sheet.
- The swipe-ready UI currently becomes available from local amount validation rather than a server quote/eligibility response.

Route mismatch:

- Add a future route such as `/api/mobile/ticket-quote` or `/api/markets/:id/ticket-quote` with eligibility and quote data.
- Existing event detail routes hydrate display context but do not answer whether a user can submit a trade.

Temporary mock/static data:

- Fake-token balance, quote math, and submit readiness are local.
- Location/login/trading gates are documented from Polymarket but not implemented in fake-token mode.

Future migration concern:

- Before real-money trading, swipe confirmation must be armed only after a fresh server quote and eligibility check, and the server response must drive disabled/error states.

## Cycle AJ - Game Page Compact Scrolled Header

Fields Holiwyn needs but backend does not provide consistently yet:

- Stable short team codes and localized short names for compact headers.
- Current team probabilities for the selected primary market.
- Event start state formatted for pregame/live/finished compact headers.
- Market group ordering and sticky-section metadata for Game Lines vs Player Props.

Fields backend provides but mobile ignores:

- Unknown in this focused cycle; proof used local/fallback event data.

Schema mismatch:

- Compact header values are derived from the current primary market rather than a server-designated hero market.
- Game-line ordering and line values remain partly local.

Route mismatch:

- Existing event detail can hydrate enough display context, but a future mobile event-detail route should return hero market, compact header, chart, stats, and grouped market sections explicitly.

Temporary mock/static data:

- Compact header uses local team codes from team names.
- Market line groups and live stats use local deterministic values in mock fallback.

Future migration concern:

- When backend market data becomes authoritative, compact header probabilities and market rows must update together so scrolling never shows stale team odds.

## Cycle AL - Game Page Sticky Market Tabs

Fields Holiwyn needs but backend does not provide consistently yet:

- Ordered market-tab metadata for `Game Lines`, `Player Props`, and any event-specific tabs.
- Explicit availability state for Player Props: available, empty, loading, not offered, or blocked.
- Group ordering metadata so sticky tabs and scrolled rows stay synchronized with backend market sections.

Fields backend provides but mobile ignores:

- Unknown in this focused cycle; proof used local/fallback event data.

Schema mismatch:

- Holiwyn currently owns the market tab list in the component; backend should eventually own which tabs appear for each match.
- Player Props rows are local fallback data and are not tied to backend player/market ids.

Route mismatch:

- Existing event detail can hydrate enough display context, but a future mobile event-detail route should include tab availability, grouped section anchors, and empty states.

Temporary mock/static data:

- Sticky tabs use local tab definitions.
- Player Props rows use local static rows.

Future migration concern:

- When backend market tabs become authoritative, scroll anchors, sticky tab selection, ticket carry-through, and empty states must all use the same backend group identifiers.

## Cycle AM - Player Props Unavailable State

Fields Holiwyn needs but backend does not provide consistently yet:

- `playerPropsAvailability`: available, empty, loading, not offered, or blocked.
- Player prop market rows with stable player id, market id, stat family, line value, odds/probability, and ticket-ready outcome ids.
- Empty-state copy/state from backend or a product-owned mobile contract.

Fields backend provides but mobile ignores:

- Unknown in this focused cycle; proof uses local unavailable state.

Schema mismatch:

- The previous mobile UI fabricated player names and prices locally. That has been removed.
- Future Player Props must come from backend-owned market/player data, not static mobile rows.

Route mismatch:

- Existing event detail does not provide a reliable Player Props availability contract.

Temporary mock/static data:

- Player Props always shows a local unavailable state for this scope.

Future migration concern:

- When Player Props are built, ticket opening, line selection, portfolio identity, and order payloads must preserve player/stat/line identifiers from backend data.

## Cycle AV - Live Orderbook Depth Contract

Fields Holiwyn needs but backend does not provide consistently yet:

- Route-backed live orderbook depth for every selectable soccer market/line/outcome.
- Provider freshness/staleness fields such as delayed, suspended, stale, or last provider update.
- Depth aggregation metadata for multiple price levels, including side, price, shares, and total per level.
- Guaranteed selected market/line/outcome identity that can flow from orderbook to ticket, order, portfolio, and history.

Fields backend provides but mobile ignores:

- Legacy `bids[]` and `asks[]` remain available for compatibility. Mobile now prefers `levels[]` when present.

Schema mismatch:

- The current route derives `levels[]` from the existing public snapshot rather than a first-class mobile depth model.
- Real live-football depth still depends on seeded/provider-backed orderbook data being present.

Route mismatch:

- `/api/orderbook/:marketId/book` now has a mobile-ready contract, but the live event detail proof could not show route-backed data because backend health was unavailable.
- No dedicated route yet summarizes depth availability across all grouped markets on an event detail response.

Temporary mock/static data:

- Fallback `market.orderbookDepth[]` remains in mobile fixtures and is now explicitly labeled as fallback.
- New fixture shape mirrors the intended backend `levels[]` rows: `outcomeId`, `side`, `price`, `shares`, `total`.

Future migration concern:

- Do not mark orderbook/depth parity complete until a server-hydrated device proof shows `orderbook-source-orderbook-route` and `orderbook-status-ready` for a real or seeded live soccer market.

## Cycle AW - Route-Backed Live Depth Seed Harness

Fields Holiwyn needs but backend does not provide consistently yet:

- A compact mobile live event detail payload that can hydrate the selected event, chart status, orderbook depth status, grouped markets, and ticket-ready identities without returning every market in a heavy desktop/API shape.
- A fast chart route or mobile chart summary route that returns seeded `MarketOutcomeSnapshot` history within the device smoke timeout.
- A route-backed mapping between the live list item the user taps and the seeded backend market id used for depth.

Fields backend provides but mobile ignores:

- Seeded orderbook `levels[]` are available from `/api/orderbook/:marketId/book`, but the tablet proof is still running the fallback/mock event surface.

Schema mismatch:

- Deterministic proof users and open orders are adequate for harness proof but are not a production liquidity/provider model.

Route mismatch:

- The public orderbook route is fast for the seeded market when the dev server is responsive.
- The event-detail route returned a very large 37-market payload, and the chart route timed out in this cycle's direct probe. This prevents reliable server-mode tablet proof even though backend depth now exists.

Temporary mock/static data:

- Tablet orderbook UI still displays the Mexico vs. Ecuador fixture ladder and labels it as fallback.
- Seeded depth rows are backend-shaped and can replace the fixture once mobile event hydration selects the seeded market.

Future migration concern:

- The next PM-GAP-067 cycle should add a mobile-optimized live detail/depth/chart endpoint or proof harness so the tablet can capture `orderbook-source-orderbook-route orderbook-status-ready` without waiting on a full event payload.

## Cycle CW - Provider Sports Event Discovery Expansion

Fields Holiwyn needs but backend does not provide consistently yet:

- Exact provider event slug or provider market slug hints for every World Cup match and line market.
- Provider-backed spreads, totals, team totals, halves, corners, and prop/correct-score mappings beyond the basic match winner/draw/winner markets.
- A scheduler/ingestion owner that refreshes exact provider mappings without relying on local proof scripts.

Fields backend provides but mobile ignores:

- `providerOrderbookDepth` freshness metadata is present in the mobile live-detail route. The current UI proves route-backed status but does not yet expose all refresh timing/source metadata visually.

Schema mismatch:

- Polymarket live match winner is modeled as three separate binary Yes/No markets. Holiwyn can display these compactly, but future ticket/portfolio/history must keep binary market identity explicit instead of treating it as one 1x2 market.

Route mismatch:

- Exact event slug discovery is available through provider candidates, but there is no user-facing/admin flow yet to review and apply all discovered mappings.
- Broad tag discovery must not be used as proof for a live match when an exact event slug is known.

Temporary mock/static data:

- Cycle CW creates/updates a local proof event shaped like the real Colombia vs. Ghana provider event. Its market identities and CLOB depth are real provider-backed; live score/stat display remains proof metadata.

Future migration concern:

- Keep the relevance gate strict: exact live match markets must beat high-volume but irrelevant World Cup futures. Do not count provider mapping complete for line markets until each selected line/outcome preserves provider identity through ticket, order, portfolio, and history.

## Cycle DG - Provider Fixture Metadata Contract

Fields Holiwyn needs but backend does not provide consistently yet:

- Automatic importer persistence for real provider fixture metadata on every World Cup event.
- A real OpticOdds or equivalent provider ingestion route keyed by `opticOddsFixtureId` / `opticOddsGameId`.
- Provider line-market payloads for spreads, totals, team totals, halves, corners, correct score, and other discovered families.
- A durable schema column or normalized provider-fixture table if `Event.metadata.providerFixture` becomes too important to remain metadata-only.

Fields backend provides but mobile ignores:

- `providerFixture` is currently exposed through provider mapping readiness for admin/operator and harness use. The mobile user UI does not yet render these fields directly.

Schema mismatch:

- The extracted provider fixture object is stored in `Event.metadata`, which is acceptable for this contract cycle but may need first-class schema support before production ingestion.

Route mismatch:

- `/api/mobile/events/:slug/provider-mapping` can report the fixture contract, but no route yet fetches line-market odds/depth from the intended `optic_odds` source.

Temporary mock/static data:

- None added. The proof artifact is generated from the real Gamma event and written in future-backend-shaped form.

Future migration concern:

- Do not count line-market provider parity complete until the real provider route/schema exists and selected line/outcome IDs preserve identity through ticket, order, portfolio, and history.

## Cycle DH - OpticOdds Line Ingestion Contract

Fields Holiwyn needs but backend does not provide consistently yet:

- Optional OpticOdds external enrichment requires `OPTIC_ODDS_API_KEY` and an approved sportsbook basket, but Polymarket parity should use Gamma/CLOB first.
- Reviewed per-line provider identity for current local markets so same-family lines cannot accidentally consume the same provider odds row.
- Durable mapping for OpticOdds `market_id`, `points`, `selection_line`, `team_id`, sportsbook source, and period.
- Provider-owned depth/orderbook data for line markets if product parity requires ladder/depth beyond top quote snapshots.

Fields backend provides but mobile ignores:

- The provider refresh service can now report `lineProvider` status, but the mobile UI does not yet surface OpticOdds-specific provider state separately from existing route-backed quote/depth labels.

Schema mismatch:

- `ReferenceQuoteSnapshot` can store `source=optic_odds` rows today.
- A first-class provider line mapping table may still be needed before production because `marketType + line + outcome side` is not enough to disambiguate every soccer line market.

Route mismatch:

- `/api/mobile/events/:slug/provider-refresh` now has the line-provider execution lane, but with no local API key it reports a skipped state.
- No protected UI exists yet for entering/reviewing OpticOdds line mapping metadata.

Temporary mock/static data:

- The proof harness uses official-response-shaped contract fixture data to test normalization only. It does not mark the current event ready for live provider apply.

Future migration concern:

- Do not write live OpticOdds rows for a current event until the provider response can be matched to a specific market/line/outcome without ambiguity. This protects the Polymarket parity gate from false line-market passes.

## Cycle DI - Reviewed Line Provider Identity Gate

Fields Holiwyn needs but backend does not provide consistently yet:

- Operator-reviewed `lineProviderIdentity` for each compact line market and outcome before live provider apply.
- Real OpticOdds provider market IDs, provider odd IDs, period, points, selection labels, sportsbook, and source timestamp for every reviewed spread/total/team-total/halves/corners market.
- A protected route or admin UI that persists reviewed line identities after dry-run validation.

Fields backend provides but mobile ignores:

- Reviewed line-provider readiness is currently backend/operator metadata. The mobile user UI does not expose this separately from existing live detail source/readiness labels.

Schema mismatch:

- Cycle DI stores reviewed line identity under `Market.referenceMetadata` and `Outcome.referenceMetadata`; this is adequate for the contract gate but may need a normalized provider line mapping table before production.

Route mismatch:

- `/api/mobile/events/:slug/provider-refresh` can consume reviewed identity indirectly through the row builder, but no route exists yet to collect and confirm the reviews.
- Optional OpticOdds refresh still skips when `OPTIC_ODDS_API_KEY` is absent; this is not a Polymarket parity blocker.

Temporary mock/static data:

- The proof harness uses backend-shaped reviewed identity fixtures and official-response-shaped OpticOdds fixture data. It does not create arbitrary display-only odds and does not mutate the database.

Future migration concern:

- Do not mark line-market provider parity complete until confirmed reviewed identities plus real credentials produce route-readable `ReferenceQuoteSnapshot` rows and preserve selected market/line/outcome through ticket, order, portfolio, and history.

## Cycle DJ - Line Provider Refresh Execution

Fields Holiwyn needs but backend does not provide consistently yet:

- Polymarket Gamma/CLOB should remain the default provider path for markets that exist on Polymarket.
- OpticOdds can enrich line markets that do not exist on Polymarket, but missing `OPTIC_ODDS_API_KEY` must be reported as optional/unconfigured rather than a Polymarket parity blocker.
- Provider-owned depth/orderbook ladder data for non-Polymarket line enrichments if product parity later requires more than top quote snapshots.
- Ticket/order/portfolio/history proof that selected line identity survives after provider refresh.

Fields backend provides but mobile ignores:

- Provider mapping readiness now includes `lineProviderIdentityReadiness`; current user mobile UI only consumes live-detail quote/depth readiness, not the operator readiness object.

Schema mismatch:

- Reviewed line identity still lives in JSON metadata. This is sufficient for proof and route execution, but a normalized provider line mapping table may be safer before production.

Route mismatch:

- The protected mapping route can apply reviewed line identities, and protected refresh can update line quote snapshots. There is not yet a dedicated operator UI section for entering line identity reviews.

Temporary mock/static data:

- Cycle DJ's proof injects an official-shaped OpticOdds response because local credentials are unavailable. It is backend-contract-shaped, uses reviewed provider odd IDs, and disables local contract-proof fallback.

Future migration concern:

- The next provider milestone should be Polymarket-first: discover a real Polymarket event through Gamma, map markets/outcomes/tokens, fetch CLOB price/depth, expose it through Holiwyn routes, and prove Android. OpticOdds network proof is optional external enrichment, not the parity gate.

## Cycle DK - Polymarket-First Provider Path

Fields Holiwyn needs but backend does not provide consistently yet:

- Polymarket-backed chart/history series for the selected market/outcome/range. Cycle DK proves Gamma/CLOB quote and depth, but the tablet chart still reports `chart-source-fallback`.
- Provider-backed line-family markets for spreads, totals, team totals, halves, corners, props, and correct score when those markets actually exist on Polymarket.
- End-to-end lifecycle proof that selected Polymarket `marketId`, `outcomeId`, token id, line, and side flow through ticket, order, portfolio, and history.

Fields backend provides but mobile ignores:

- Provider discovery relevance diagnostics such as `binaryQuestionSubjectRelevant` are proof/operator fields; the user mobile app only needs source/readiness/depth labels.

Schema mismatch:

- Existing market/outcome provider identity fields are sufficient for Gamma/CLOB match-winner mappings.
- Line-market enrichments may still need normalized provider mapping records if future non-Polymarket provider data is used.

Route mismatch:

- `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book` expose the Polymarket-backed route proof, but chart history remains on the separate fallback path.
- The protected provider refresh path is still manually invoked by proof/admin tooling; production scheduling is not yet wired.

Temporary mock/static data:

- No arbitrary display-only provider odds were added in Cycle DK.
- Unavailable line families remain rejected/unavailable with backend reasons instead of being faked as Polymarket-backed markets.

Future migration concern:

- Keep Polymarket Gamma/CLOB as P0 for parity. OpticOdds or any other external provider should only enrich gaps that Polymarket public data cannot cover and must never weaken the Polymarket relevance gate.

## Cycle DL - Polymarket CLOB Chart History

Fields Holiwyn needs but backend does not provide consistently yet:

- A durable source/provenance column on `MarketOutcomeSnapshot`. Cycle DL infers `polymarket-clob-prices-history` from market identity plus route context.
- A scheduler or refresh queue for CLOB price-history ingestion across active World Cup markets.
- Downsampling policy for large chart ranges so mobile can request dense history without slow payloads.

Fields backend provides but mobile ignores:

- The chart route exposes `series` for compatibility, but mobile EventDetail consumes `history[]`, `source`, `range`, `lastUpdated`, and `emptyState`.

Schema mismatch:

- `MarketOutcomeSnapshot` can store price history but cannot distinguish CLOB history from deterministic proof snapshots at row level.
- Provider event state and Holiwyn proof event state can diverge. In Cycle DL the provider event is closed/resolved, while the local page remains a live-detail proof route with stale provider status.

Route mismatch:

- `/api/mobile/events/:slug/provider-refresh` now returns `providerHistory`, but no operator UI shows history ingestion status yet.
- `/api/mobile/events/:slug/live-detail` embeds chart snapshots, while the mobile app also calls `/api/markets/:id/chart`; both need to remain source-consistent.

Temporary mock/static data:

- No local fake chart points are used for the Cycle DL provider proof. The proof writes real CLOB price-history points from Polymarket token IDs.

Future migration concern:

- Before production, add snapshot provenance and retention/downsampling so chart rows can be audited, refreshed, and expired independently from local test fixtures.

## Cycle DM - Provider Token Lifecycle

Fields Holiwyn needs but backend does not provide consistently yet:

- First-class durable selection identity columns on `Order`, `Trade`, and possibly `Position` remain absent. Cycle DM preserves the data through `ApiOrderRequest.requestBody.selection` and market/outcome fallback metadata.
- Full lifecycle with actual filled order/history for the closed Colombia/Ghana provider event remains unproven on Android; current proof covers ticket and open-order/portfolio/history mapping contracts.

Fields backend provides but mobile ignores:

- Mobile does not display provider IDs to users. It uses provider fields for ticket/order/portfolio identity and exposes them only through accessibility markers for harness proof.

Schema mismatch:

- Provider market identity is normalized on `Market`/`Outcome`, while selected ticket identity is request-body JSON. This is sufficient for current fake-token/server-mode proof but should be normalized before production-grade audit/reporting.

Route mismatch:

- `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` now share provider selection fields. Dedicated order-history/fill routes should adopt the same selection contract when mobile consumes them directly.

Temporary mock/static data:

- No arbitrary display-only provider data was added. The proof uses the real local Polymarket-mapped Colombia/Ghana market and token IDs.

Future migration concern:

- When real-money trading is in scope, store provider selection identity on immutable order/trade records, not only via the original API request body.

## Super Round DN - Provider Chart Cache + Visible Orderbook

Fields Holiwyn needs but backend does not provide consistently yet:

- Scheduled/background provider refresh status is still not a durable mobile-facing contract.
- Filled provider-backed order/history rows with immutable provider selection fields remain unproven.

Fields backend provides but mobile ignores:

- Mobile does not expose raw cache invalidation paths to users. They are documented/proven for backend lifecycle correctness only.

Schema mismatch:

- Orderbook ladder UI can consume shared market-level depth or outcome-specific depth. Production provider depth should normalize exact outcome/token ownership whenever available.

Route mismatch:

- Provider refresh now invalidates chart and orderbook paths for the same market set. A future scheduler should expose the same freshness state to `/api/mobile/events/:slug/live-detail`.

Temporary mock/static data:

- Visible ladder fallback is deterministic and contract-shaped from existing quote/probability fields. It is labeled `quote-fallback-ladder` and must not be treated as provider-backed route depth.

Future migration concern:

- When line-family markets become provider-backed, ladder depth must carry provider token/outcome IDs through line selectors, ticket, orders, portfolio, and history.

## Cycle DO - Provider Filled Lifecycle

Fields Holiwyn needs but backend does not provide consistently yet:

- Filled provider lifecycle is now proven for a dev-only provider-shaped market. The same proof still needs to be repeated on a currently active real Polymarket-backed market when one is available and tradable in fake-token mode.

Fields backend provides but mobile ignores:

- Mobile does not display provider IDs in Portfolio activity; it consumes them in `selection` for identity-preserving retrade/close flows and harness proof.

Schema mismatch:

- `ApiOrderRequest.requestBody.selection` preserves the original ticket selection, while positions and recent trades rebuild provider selection from `Market`/`Outcome`. This is acceptable for the current fake-token lifecycle proof but should be normalized on immutable order/trade records before production.

Route mismatch:

- Cycle DO uses the canonical service path directly for deterministic proof setup and the mobile Portfolio route for device proof. A future active-market cycle should submit via the external `/api/orders` HTTP route and then verify `/api/portfolio` plus `/api/portfolio/history`.

Temporary mock/static data:

- The proof market is dev-only but backend-shaped: `referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, and outcome token fields match the real provider contract shape.

Future migration concern:

- Real-money launch should store immutable provider selection snapshots on orders/trades so later provider metadata changes cannot alter historical activity identity.

## Super Round DT Integrated - Orderbook Interaction And Ready Depth

Fields Holiwyn needs but backend does not provide consistently yet:

- A compact sibling Book selector contract that returns all related markets for the current event/family/period/line, not only the currently selected market's identity.
- A server-backed visible UI payload that can prove provider-backed ready depth in the same tablet run as Book interactions.
- Decimalize/equivalent display preference state for the Book surface.

Fields backend provides but mobile ignores:

- The backend Book route now exposes `marketIdentity` and `providerOrderbookDepth` fields. Mobile interaction proof currently uses fixture-shaped data for selector/ticket proof and therefore does not prove these fields in the same visible UI session.

Schema mismatch:

- Provider depth is normalized in `ReferenceOrderbookDepthSnapshot`, while visible selector state is still client-owned inside EventDetail. This is acceptable for DT interaction proof but needs a backend-owned selector/options payload before parity pass.

Route mismatch:

- `/api/orderbook/:marketId/book` proves selected-market depth. Polymarket's Book selector behaves like a market-family browser, so Holiwyn may need an event-level selector route or live-detail extension to avoid local-only sibling discovery.

Temporary mock/static data:

- DT-B fixtures are deterministic and backend-shaped, but they are still UI proof fixtures. They must not be treated as provider-ready route proof.

Future migration concern:

- Book selection identity must stay stable through selector -> ladder -> ticket -> order -> portfolio -> history, including provider token/outcome IDs when provider depth is active.

## Cycle DV - Same-Market Provider-Ready Book UI

Fields Holiwyn needs but backend does not provide consistently yet:

- A first-class event-level Book selector/options contract is still missing. DV proves one selected provider-backed Spread market; full Polymarket selector parity will need sibling market groups, periods, lines, and outcomes from the backend rather than local sibling discovery.
- A provider-specific non-ready/stale/unavailable proof route is not yet part of the DV harness. Earlier fallback evidence is distinct, but future route hardening should expose easy test controls for ready vs stale vs unavailable states.

Fields backend provides but mobile ignores:

- Mobile does not display raw provider market ids, condition ids, or token ids to users. DV consumes them as selection identity and exposes them only in accessibility markers for audit proof.

Schema mismatch:

- `ReferenceOrderbookDepthSnapshot` owns provider ladder rows while the Book selector state is still primarily client-owned in EventDetail. DV proves the selected-market path, but a backend-owned selector/options payload would reduce local coupling.

Route mismatch:

- `/api/orderbook/:marketId/book` returns one selected market's depth and identity. Polymarket's Book page behaves like a market-family browser, so a future route may need to return sibling choices for Moneyline/Spreads/Totals/periods around the selected market.

Temporary mock/static data:

- DV did not use arbitrary frontend-only mock data for the provider-ready path. The proof seeds contract-shaped provider depth rows and uses the live-detail/orderbook routes to hydrate the tablet UI.

Future migration concern:

- Repeat selector -> ladder -> ticket -> order -> portfolio -> history proof for a real active provider-backed market when available, and store immutable order/trade selection snapshots before production trading.

## Cycle DW-A - Provider Orderbook State Matrix

Closed or narrowed:

- The remaining DV P1 harness gap is now covered by a focused backend matrix proof for `/api/orderbook/:marketId/book?maxLevels=24`.
- `docs/mobile/harness/cycle-DW-A-provider-orderbook-state-matrix.json` records the same provider-shaped selected market moving through unavailable/empty, stale, and ready provider ladder states.
- Ready depth is not inferred from fallback rows: the proof clears local open orders and `ReferenceQuoteSnapshot` rows for the disposable market before asserting that only fresh `ReferenceOrderbookDepthSnapshot` rows produce `depthSource=provider-orderbook-depth` with `providerOrderbookDepth.status=ready`.
- The route response fields proven in the artifact include `depthSource`, `availability.status`, `providerOrderbookDepth.status/reason`, `emptyState`, selected `marketIdentity`, `selectorKey`, `period`, `line`, and outcome ids on both identity and ladder levels.

Fields Holiwyn still needs but backend does not fully provide:

- A first-class event-level Book selector/options contract remains future work; DW-A only proves selected-market state transitions.
- Production recurring provider refresh should eventually prove the same state matrix on non-disposable, provider-mapped live markets.

Schema mismatch:

- No schema change was required. Existing `Market`, `Outcome`, `ReferenceOrderbookDepthSnapshot`, and `ReferenceQuoteSnapshot` rows can represent ready, stale, unavailable, and no-depth states.

Route mismatch:

- No new route shape was needed. `/api/orderbook/:marketId/book` already exposes the distinguishing fields; DW-A adds proof and route/service tests to guard the matrix.

Temporary mock/static data:

- No frontend mock data was added. The harness uses a disposable backend market and the same provider ladder table consumed by the refresh services.

Future migration concern:

- Keep readiness decisions keyed to `providerOrderbookDepth.status=ready` rather than `levels[]` alone, because stale provider ladder rows may still produce levels while correctly reporting non-ready freshness.

## Cycle DX-A - Selected Line Order, Portfolio, And History Lifecycle

Closed or narrowed:

- `docs/mobile/harness/cycle-DX-A-line-order-portfolio-history.json` proves a selected World Cup Spread line market keeps the same market/outcome/family/line/period/side/display/provider identity through order request, order response, portfolio open order, canceled activity, filled portfolio position, and recent trade activity.
- Canonical order responses now echo the sanitized `selection` object and top-level `contractSide`, so the immediate order response is part of the same lifecycle proof instead of relying only on later portfolio reads.
- `buildTicketSelectionMetadata` now infers `contractSide` from YES/NO outcome sides when no original order request is joined, allowing filled position and recent trade rows to preserve binary line identity from market/outcome records.

Fields Holiwyn still needs but backend does not fully provide:

- A first-class immutable selection snapshot on `Order`, `Trade`, and/or `Position` remains future hardening; DX-A uses existing `ApiOrderRequest.requestBody.selection` for open/canceled orders and market/outcome rows for positions/recent trades.

Schema mismatch:

- No schema change was made. The lifecycle proof intentionally stays within the existing `ApiOrderRequest`, `Order`, `Trade`, `Position`, `Market`, and `Outcome` model boundaries.

Route mismatch:

- No new mobile route was required. Existing `/api/portfolio` and `/api/portfolio/history` responses now have proof coverage for selected line lifecycle identity.

Temporary mock/static data:

- No frontend mock/static data was added. The proof uses a disposable backend World Cup Spread market and real canonical order/portfolio/history service paths.

Future migration concern:

- If production trading needs historical reconstruction after market/outcome edits, persist immutable selection metadata directly on order/fill/trade lifecycle rows rather than deriving filled activity from current market/outcome rows.

## Cycle ED-A - Book Provider Identity Through Order, Portfolio, And History

Closed or narrowed:

- `docs/mobile/harness/cycle-ED-A-book-order-portfolio-history.json` proves a selected provider-backed Book Spread outcome keeps the same `marketId`, `outcomeId`, `marketType`, `marketGroupId`, `line`, `period`, `side`, `displayLabel`, `contractSide`, provider source, external slug, external market id, condition id, and provider token id through order request, order response, portfolio open order, canceled activity, filled portfolio position, and recent trade activity.
- Canonical order request sanitization now preserves Book-style aliases (`providerSource`, `tokenId`) and normalizes them alongside current mobile aliases (`referenceSource`, `referenceTokenId`).
- Portfolio and history selection metadata now echoes both source/token naming styles from original request metadata or from market/outcome fallback rows, so Book identity no longer stops at ticket/order creation.

Fields Holiwyn still needs but backend does not fully provide:

- A first-class immutable selection snapshot on `Order`, `Trade`, and/or `Position` remains future hardening. ED-A still uses `ApiOrderRequest.requestBody.selection` for open/canceled orders and current `Market`/`Outcome` rows for filled positions and recent trades.

Schema mismatch:

- No schema migration was made. The proof intentionally stays within `ApiOrderRequest`, `Order`, `Trade`, `Position`, `Market`, `Outcome`, and `ReferenceOrderbookDepthSnapshot`.

Route mismatch:

- No new mobile route was required. The Book HTTP route supplies the selected token identity, while existing `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` now have focused proof coverage for provider alias echo.

Temporary mock/static data:

- No frontend mock/static data was added. The proof uses a disposable backend provider-backed Spread market and local provider ladder rows.

Future migration concern:

- If production order/history reconstruction must survive provider remaps or market/outcome edits, persist immutable normalized selection metadata directly on order/fill/trade lifecycle rows rather than relying on request JSON plus current market/outcome fallback metadata.

## Cycle EE-A - Book Lifecycle Selection Snapshots

Closed or narrowed:

- `docs/mobile/harness/cycle-EE-A-lifecycle-snapshots.json` proves a selected provider-backed Book Spread outcome keeps the same normalized snapshot through order request, order response, portfolio open order, canceled activity, filled portfolio position, and recent trade activity.
- Canonical order submission and portfolio metadata now share `sanitizeTicketSelectionSnapshot()`, avoiding drift between order response snapshots and Portfolio/history selection serialization.
- `/api/portfolio` filled positions and `/api/portfolio/history` recent trades now prefer the latest matching same-user/same-market/same-outcome `ApiOrderRequest.requestBody.selection`, guarded by matching `marketId` and `outcomeId`, before falling back to current `Market`/`Outcome` metadata.
- Focused tests now assert a selected Spread/line/period/provider token does not fall back to a moneyline/current-market label in filled position or recent trade branches.

Fields Holiwyn still needs but backend does not fully provide:

- A first-class immutable selection snapshot on `Order`, `Fill`, `Trade`, and/or `Position` remains future hardening. EE-A deliberately avoids schema migration and uses guarded request snapshots for the cycle-sized backend improvement.
- If the same user accumulates multiple selections for the exact same market/outcome over time, filled position/recent trade serialization can only pick the latest matching request snapshot until durable trade/position selection columns are approved.

Schema mismatch:

- No schema migration was made. Existing `ApiOrderRequest`, `Order`, `Trade`, `Position`, `Market`, and `Outcome` records carry enough information for the selected Book lifecycle proof, but not for permanent historical reconstruction after arbitrary provider remaps.

Route mismatch:

- No new mobile route was required. `/api/portfolio` and `/api/portfolio/history` now use the same backend selection helper as canonical order responses.

Temporary mock/static data:

- No frontend mock/static data was added. The proof uses a disposable backend provider-backed Spread market and local provider ladder rows.

Future migration concern:

- If production order/history reconstruction must survive provider remaps or market/outcome edits, persist immutable normalized selection metadata directly on order/fill/trade lifecycle rows rather than relying on request JSON plus current market/outcome fallback metadata.

## Cycle EF-A - Snapshot Durability After Metadata Drift

Closed or narrowed:

- `docs/mobile/harness/cycle-EF-A-snapshot-durability.json` records the EF durability harness status: focused tests passed, while the database-backed route/data proof script was blocked locally by missing `DATABASE_URL`.
- Focused backend tests now cover the same drift guard for `/api/portfolio` open orders and filled positions plus `/api/portfolio/history` canceled orders and recent trades.
- The durability proof uses the existing matching same-user/same-market/same-outcome `ApiOrderRequest.requestBody.selection` bridge, so the selected Book identity wins over mutable current `Market`/`Outcome` metadata when a snapshot exists.

Fields Holiwyn still needs but backend does not fully provide:

- First-class immutable `Order`, `Fill`, `Trade`, and/or `Position` selection snapshot columns remain future production hardening.
- Same user, same market, same outcome, different historical selections are still limited by the latest matching request snapshot bridge until schema work is approved.

Schema mismatch:

- No schema migration was made for EF-A. This cycle intentionally makes the durability proof explicit within the existing `ApiOrderRequest`, `Order`, `Trade`, `Position`, `Market`, and `Outcome` model boundaries.

Route mismatch:

- No new route was required. Existing Portfolio and history routes already carry the mobile-facing `selection` contract.

Temporary mock/static data:

- No frontend mock/static data was added. The proof creates disposable backend market/order/trade state only.

Future migration concern:

- Persist immutable normalized selection metadata directly on order/fill/trade lifecycle rows before production trading depends on arbitrary provider remaps or same-market/outcome multi-selection historical reconstruction.

## Cycle EU - Route-Backed Retail Ticket Flow

Closed or narrowed:

- Spread rows now consume matching backend route markets rather than silently opening deterministic line fixtures.
- Backend `full-game` period and mobile retail `Reg. Time` period are explicitly equivalent for full-match soccer line markets.
- Tablet proof shows route-backed spread/totals provider source/token identity survives through ticket and local Portfolio cards.

Fields Holiwyn still needs but backend does not fully provide:

- Provider-backed team-total route rows for the same Local MVP retail path.
- A production route that guarantees real Polymarket spread/totals/team-total line-family breadth for active World Cup events without disposable proof fixtures.

Schema mismatch:

- No schema migration was required. Existing `Market.period`, `Market.line`, `Market.marketType`, and outcome provider token fields cover the EU selected route proof.

Route mismatch:

- `/api/mobile/events/:slug/live-detail` is enough for selected spread/totals retail tickets when the compact market exists.
- A future selector/options route may still be needed for complete Polymarket-style line/period breadth beyond compact markets.

Temporary mock/static data:

- No arbitrary frontend data was added. Team-total remains deterministic contract-shaped fallback already tracked from ES/ET.
- EU order placement intentionally uses mobile mock/fake-token mode while route-backed market data comes from server mode.

Future migration concern:

- When fake-token server orders are promoted for Local MVP, persist the route-backed ticket selection snapshot through order, portfolio, and history instead of relying only on client local state.

## Cycle EV - Route-Backed Server Order Flow

Closed or narrowed:

- Server fake-token order mode is now proven for the selected route-backed spread retail path.
- The mobile ticket sends the selected route-backed spread market/outcome/provider identity through `/api/orders`.
- `/api/portfolio` returns a server-synced open order carrying the selected spread line, period, provider source, and provider token identity.
- Missing `OPTIC_ODDS_API_KEY` is not a blocker for this Local MVP path.

Fields Holiwyn still needs but backend does not fully provide:

- Route-backed totals/team-total server-order breadth for the same Local MVP retail path.
- Production active-event provider mappings that guarantee real Polymarket spread/totals/team-total availability without disposable proof fixtures.
- Longer activity/history lifecycle for route-backed retail server orders after fill/cancel.

Schema mismatch:

- No schema migration was required for EV. Existing order request JSON and portfolio selection serialization carry the selected spread identity.

Route mismatch:

- `/api/mobile/events/:slug/live-detail`, `/api/orders`, and `/api/portfolio` are enough for the selected open-order Local MVP journey.
- `/api/portfolio/history` was not part of EV and remains required for a later history/activity milestone.

Temporary mock/static data:

- No arbitrary frontend data was added.
- The disposable backend event is proof data shaped like the intended route contract, not UI-only local state.

Future migration concern:

- Before production-like trading, persist immutable normalized selection snapshots on order/fill/trade lifecycle rows instead of relying only on request JSON plus current market/outcome metadata.

## Cycle EW - Route-Backed Server Cancel And Activity Flow

Closed or narrowed:

- Server cancel is now proven from the Android Portfolio UI for the selected route-backed spread order.
- `/api/portfolio/history` canceled-order data maps into Android-visible Portfolio activity with selected spread line, period, provider source, and token identity.
- The Local MVP user journey now covers open order and canceled activity, not only order submission.

Fields Holiwyn still needs but backend does not fully provide:

- Filled trade/recent trade lifecycle for route-backed retail tickets.
- Totals/team-total cancel/history breadth.
- Production active-event provider mappings that avoid disposable proof fixtures.

Schema mismatch:

- No schema migration was required for EW. Existing order request JSON and portfolio/history selection serialization carry the selected spread identity.

Route mismatch:

- `/api/orders/:id`, `/api/portfolio`, and `/api/portfolio/history` are enough for the selected cancel/activity path.

Temporary mock/static data:

- No arbitrary frontend data was added.
- The disposable backend event is proof data shaped like the intended route contract, not UI-only local state.

Future migration concern:

- Filled trade history should use immutable normalized selection snapshots before production-like trading depends on route-backed line lifecycle reconstruction.

## Cycle EX - Route-Backed Server Filled Trade And Activity Flow

Closed or narrowed:

- Server filled trade lifecycle is now proven from Android for the selected route-backed spread ticket.
- `/api/portfolio` returns a position carrying selected spread line, period, provider source, and token identity.
- `/api/portfolio/history` recent trade data maps into Android-visible Portfolio activity with selected spread/provider identity.
- The Local MVP user journey now covers order submission, open order, cancel activity, filled position, and recent trade activity for the selected spread path.

Fields Holiwyn still needs but backend does not fully provide:

- Totals/team-total filled lifecycle breadth.
- Production active-event provider mappings and real liquidity source.
- Fresh S23 retail lifecycle recapture when Polymarket gates allow it.

Schema mismatch:

- No schema migration was required for EX. Existing order request JSON and portfolio/history selection serialization carry the selected spread identity.

Route mismatch:

- `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` are enough for the selected filled trade/activity path.

Temporary mock/static data:

- No arbitrary frontend data was added.
- The counterparty seed is disposable backend proof liquidity shaped like real orderbook liquidity.

Future migration concern:

- Production trading should persist immutable normalized selection snapshots directly on fill/trade lifecycle rows and replace disposable liquidity with real market-maker or user liquidity.

## Cycle EY - Route-Backed Server Filled Totals Trade And Activity Flow

Closed or narrowed:

- Server filled trade lifecycle is now proven from Android for a selected route-backed Totals ticket, not only Spread.
- `/api/portfolio` returns a position carrying selected totals line `2.5`, period, provider source, and token identity.
- `/api/portfolio/history` recent trade data maps into Android-visible Portfolio activity with selected totals/provider identity.
- The Local MVP user journey now covers server-filled route-backed Spread and Totals tickets with orderbook hidden by default.

Fields Holiwyn still needs but backend does not fully provide:

- Team-total route-backed filled lifecycle breadth. The current disposable provider breadth event does not create a `team_total_goals`/team-total market.
- Production active-event provider mappings and real liquidity source.
- Fresh S23 retail lifecycle recapture when Polymarket gates allow it.

Schema mismatch:

- No schema migration was required for EY. Existing order request JSON and portfolio/history selection serialization carry the selected totals identity.

Route mismatch:

- `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` are enough for the selected Totals filled trade/activity path.
- A future route/provider fixture update must expose team-total markets with stable `marketGroupKey`, `marketType`, `period`, `line`, and outcome token ids before team-total can pass the same gate.

Temporary mock/static data:

- No arbitrary frontend data was added.
- The counterparty seed is disposable backend proof liquidity shaped like real orderbook liquidity.

Future migration concern:

- Production trading should persist immutable normalized selection snapshots directly on fill/trade lifecycle rows and replace disposable liquidity with real market-maker or user liquidity.

## Cycle EZ - Route-Backed Server Filled Team Total Trade And Activity Flow

Closed or narrowed:

- The disposable provider breadth event now includes Team Total contract-shaped data: `marketType=team_total_goals`, `marketGroupKey=team-totals`, `marketFamily=team_total`, line `1.5`, period `full-game`, provider market id, condition id, and outcome token ids.
- Server filled trade lifecycle is now proven from Android for a selected route-backed Team Total ticket.
- `/api/portfolio` returns a position carrying selected team-total line `1.5`, period, provider source, and token identity.
- `/api/portfolio/history` recent trade data maps into Android-visible Portfolio activity with selected team-total/provider identity.
- The Local MVP user journey now covers server-filled route-backed Spread, Totals, and Team Total tickets with orderbook hidden by default.

Fields Holiwyn still needs but backend does not fully provide:

- Production active-event provider mappings and real liquidity source.
- Fresh S23 retail lifecycle recapture when Polymarket gates allow it.

Schema mismatch:

- No schema migration was required for EZ. Existing `Market`, `Outcome`, provider snapshot tables, order request JSON, and portfolio/history selection serialization carry the selected team-total identity.

Route mismatch:

- `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` are enough for the selected Team Total filled trade/activity path.

Temporary mock/static data:

- No arbitrary frontend data was added.
- The new Team Total market is disposable backend proof data shaped like the intended provider/live-detail contract.
- The counterparty seed is disposable backend proof liquidity shaped like real orderbook liquidity.

Future migration concern:

- Production trading should persist immutable normalized selection snapshots directly on fill/trade lifecycle rows and replace disposable liquidity with real market-maker or user liquidity.

## Cycle EB-A - Live Detail Selected-Market Selector Contract

Closed or narrowed:

- The live-detail route now exposes a backend-shaped `markets[].selection` object for every compact live market.
- The `selection` object includes stable selector and identity fields: `selectorKey`, `marketId`, `marketGroupKey`, `marketGroupId`, `marketGroupTitle`, `marketType`, `marketFamily`, `displayLabel`, `period`, `line`, `lineValue`, `unit`, selected-chart metadata, and outcome identity.
- Selected chart state no longer requires the UI to infer which market owns the chart. `selection.chart.targetMarketId` is the same compact `marketId`, and `selection.chart.status/source/pointCount/outcomeCount/range/emptyState` mirrors the market's chart status.
- The route proof script now records selector-contract coverage through `selectorContractMarketCount` and per-market selector keys.

Fields Holiwyn still needs but backend does not fully provide:

- Real Polymarket/CLOB history for line-family markets still depends on provider-mapped token IDs for those line markets.
- The current route returns the compact market set, not a complete event-wide selector tree for every sibling line/period offered by Polymarket.

Schema mismatch:

- No schema change was required. Existing `Market`, `Outcome`, and `MarketOutcomeSnapshot` fields cover the EB-A selector/chart contract.

Route mismatch:

- `/api/mobile/events/:slug/live-detail` is now sufficient for compact selected-market switching on the game page. A future dedicated selector/options route may still be useful if Polymarket parity requires more sibling markets than the compact payload should carry.

Temporary mock/static data:

- No frontend mock/static data was added by EB-A. If Agent B needs temporary fixtures before provider data is fully available, they should match `markets[].selection` exactly.

Future migration concern:

- Agent B needs Android proof that visible chart, line selector, orderbook, and ticket handoff consume `markets[].selection` rather than local display-only structures.

## Cycle FC - Route-Backed Event Discovery Cards

Closed or narrowed:

- Home/Search discovery can consume compact server market data directly from `/api/events?includeMobileMarkets=1`.
- Mobile discovery no longer applies a default `World Cup` text search that hides valid team-titled events already identified by `sportKey=soccer` and `leagueKey=world_cup`.
- Search result stats now expose explicit `Volume:` and `Liquidity:` labels, matching Home card expectations.

Fields Holiwyn still needs but backend does not fully provide:

- Production active Polymarket World Cup event breadth remains P1; FC uses a disposable provider-shaped event to prove the contract.
- Compact discovery markets do not replace full live-detail chart/live stats/status data.

Schema mismatch:

- No schema migration was required. Existing `Event`, `Market`, `Outcome`, and provider snapshot/read-model fields cover the compact discovery contract.

Route mismatch:

- `/api/events?includeMobileMarkets=1` is sufficient for discovery cards. `/api/mobile/events/:slug/live-detail` remains the richer game-page route.

Temporary mock/static data:

- No arbitrary frontend-only market data was added. The disposable event was created in the backend and returned through the public event route.

Future migration concern:

- If production event discovery grows beyond compact cards, add pagination/status/source controls rather than overloading the first-screen payload with full event detail.

## Cycle FD - Route Discovery Opens Route-Backed Event Detail

Closed or narrowed:

- Route-backed discovery cards now open the same event detail instead of falling back to the older local Mexico/Ecuador fixture.
- The compact discovery event can be used immediately for responsive navigation, then replaced by `/api/mobile/events/:slug/live-detail` hydration when server market-data mode is active.
- Tablet proof confirms the opened detail page shows the same route-backed event, chart/probability surface, Game Lines, provider-backed outcomes, and hidden default orderbook UI.

Fields Holiwyn still needs but backend does not fully provide:

- Production active Polymarket World Cup event breadth remains P1.
- A full Home-opened route event still needs an integrated proof through Buy/Sell ticket, fake-token order, and Portfolio/history.

Schema mismatch:

- No schema migration was required. Existing event slug/id, compact market payload, live-detail market/outcome identity, and provider snapshot fields cover FD.

Route mismatch:

- `/api/events?includeMobileMarkets=1` is enough for first-screen discovery.
- `/api/mobile/events/:slug/live-detail` is still required for chart/probability and richer event detail.
- FD closes the route handoff gap between those two routes.

Temporary mock/static data:

- No arbitrary frontend-only market data was added.
- The proof event is disposable backend provider-shaped data created by the existing provider breadth harness.

Future migration concern:

- Keep discovery payload compact. Add richer event-detail behavior to the detail route or a dedicated retail-flow route instead of bloating `/api/events`.

## Cycle FE - Home Route Event Opens Simple Ticket

Closed or narrowed:

- Home-opened route-backed Event Detail now has Android proof through the next visible step: a selected Spread outcome opens the simple ticket.
- Ticket proof preserves backend-shaped selected identity: market type `spread`, line `1.5`, period `Reg. Time`, side `yes`, provider source `polymarket`, and provider token.
- Default orderbook UI remains hidden through Home -> Detail -> Ticket.

Fields Holiwyn still needs but backend does not fully provide:

- A full Home-opened path through fake-token submit and Portfolio/history is still open.
- Production active Polymarket World Cup event breadth remains P1.

Schema mismatch:

- No schema migration was required. Existing live-detail market/outcome identity and ticket selection metadata are enough for FE.

Route mismatch:

- `/api/events?includeMobileMarkets=1` plus `/api/mobile/events/:slug/live-detail` are enough for Home -> Detail -> Ticket-open.
- `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` are not exercised by FE and remain the next path segment.

Temporary mock/static data:

- No arbitrary frontend-only market data was added.
- The proof event is disposable backend provider-shaped data created by the existing provider breadth harness.

Future migration concern:

- When the next cycle submits the Home-opened ticket, order request selection snapshots must preserve the same Home-selected market/outcome/provider identity.

## Cycle FF - Home Route Ticket Submit And Portfolio History

Closed or narrowed:

- Home-opened route-backed Event Detail now has Android proof through fake-token order submission and Portfolio/history.
- Portfolio latest order, latest activity, and position preserve order-time selected identity: market type `spread`, line `1.5`, period `Reg. Time`, side `buy`, contract side `yes`, provider source `polymarket`, and provider token.
- Default orderbook UI remains hidden through Home -> Detail -> Ticket -> Portfolio.

Fields Holiwyn still needs but backend does not fully provide:

- Server order mode for this exact Home-opened path remains P1.
- Production active Polymarket World Cup event breadth remains P1.

Schema mismatch:

- No schema migration was required. Existing mobile local order/Portfolio snapshot fields carry the selected identity for fake-token proof.

Route mismatch:

- `/api/events?includeMobileMarkets=1` and `/api/mobile/events/:slug/live-detail` are enough for route-backed market data.
- `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` are not exercised by FF because the selected milestone is local fake-token order mode.

Temporary mock/static data:

- The order is intentionally local fake-token state for the MVP.
- The market data is not arbitrary frontend-only data; it comes from disposable backend provider-shaped proof data.

Future migration concern:

- The server-mode version of this Home-opened flow must send the same selected identity through `/api/orders` and then verify `/api/portfolio` plus `/api/portfolio/history`.

## Cycle FG - Home Route Server Order And Portfolio Open Order

Closed or narrowed:

- Home-opened route-backed Event Detail now has Android proof through server fake-token order submission and server Portfolio sync.
- The exact selected identity now flows through `/api/orders` and back through Portfolio: market type `spread`, line `1.5`, period `Reg. Time`, side `buy`, contract side `yes`, provider source `polymarket`, and provider token.
- Default orderbook UI remains hidden through Home -> Detail -> Ticket -> Server Portfolio.

Fields Holiwyn still needs but backend does not fully provide:

- Production active Polymarket World Cup event breadth remains P1.
- Filled/cancel lifecycle from the exact Home-opened path remains P1, although prior route-deep cycles prove those backend paths.

Schema mismatch:

- No schema migration was required. Existing order request, order, market/outcome, and Portfolio/history response fields carry the selected identity for the FG proof.

Route mismatch:

- `/api/events?includeMobileMarkets=1`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` are enough for the selected Home-started open-order flow.

Temporary mock/static data:

- No arbitrary frontend-only market data was added.
- The proof event is disposable backend provider-shaped data created by the existing provider breadth harness.
- The order is server fake-token mode, not local mock Portfolio state.

Future migration concern:

- Replace disposable provider-shaped proof events with production active Polymarket-backed World Cup events before treating provider breadth as complete.

## Cycle FU - Portfolio Value History Backend Route

Closed or narrowed:

- The backend now exposes `GET /api/portfolio/value-history?range=1D|1W|1M|All` with the same `PortfolioValueHistory` shape already typed in standalone mobile.
- The route supports mobile API-key auth with `account:read`, validates ranges, and emits source/status fields the Android proof harness can assert after mobile wiring.

Fields Holiwyn still needs but backend does not fully provide:

- Persisted account-value snapshots over time are not yet modeled. The route reconstructs historical position value from `MarketOutcomeSnapshot` and current position quantities.
- Historical wallet cash movement is not replayed per point; current wallet cash is used across the generated range.

Schema mismatch:

- No schema migration was added. Existing `UserBalance`, `Position`, and `MarketOutcomeSnapshot` models are enough for a first route-backed Portfolio chart contract.

Route mismatch:

- Mobile has a typed `PolyApi.getPortfolioValueHistory(range)` client, but the Portfolio UI still uses deterministic fallback data. A later mobile wiring cycle should fetch this route in server mode and prove the chart source changes to `portfolio-value-history-route` on Android.

Temporary mock/static data:

- No arbitrary frontend-only data was added in the backend. Missing historical prices fall back to position average cost per point.

Future migration concern:

- If Portfolio needs exact Polymarket-style account performance, add a persisted portfolio value snapshot or ledger replay service so cash, realized P/L, and position quantities are historically accurate per point.

## Cycle FI - Home Route Server Filled Position And Activity

Closed or narrowed:

- Home-opened route-backed Event Detail now has Android proof through server fake-token filled order, filled position, and server Portfolio/history recent activity.
- The exact selected identity now flows through `/api/orders`, matching backend liquidity, `/api/portfolio`, and `/api/portfolio/history`: market type `spread`, line `1.5`, period `Reg. Time`, side `buy`, contract side `yes`, provider source `polymarket`, and provider token.
- Default orderbook UI remains hidden through Home -> Detail -> Ticket -> Server Portfolio filled position/activity.

Fields Holiwyn still needs but backend does not fully provide:

- Production active Polymarket World Cup event breadth remains P1.
- Production liquidity/source breadth remains P1; FI uses deterministic backend-shaped maker liquidity for proof.

Schema mismatch:

- No schema migration was required. Existing order request, order, trade, position, market/outcome, and Portfolio/history response fields carry the selected identity for the FI proof.

Route mismatch:

- `/api/events?includeMobileMarkets=1`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` are enough for the selected Home-started filled lifecycle.

Temporary mock/static data:

- No arbitrary frontend-only market data was added.
- The proof event is disposable backend provider-shaped data created by the existing provider breadth harness.
- The fill uses server fake-token mode and deterministic backend-shaped counterparty liquidity, not local mock Portfolio state.

Future migration concern:

- Replace disposable provider-shaped proof events and seeded counterparty liquidity with production active Polymarket-backed World Cup events/liquidity before treating provider breadth as complete.

## Cycle FH - Home Route Server Cancel And Portfolio Activity

Closed or narrowed:

- Home-opened route-backed Event Detail now has Android proof through server fake-token order cancellation and server Portfolio/history canceled activity.
- The exact selected identity now flows through `/api/orders`, `/api/orders/:id`, `/api/portfolio`, and `/api/portfolio/history`: market type `spread`, line `1.5`, period `Reg. Time`, side `buy`, contract side `yes`, provider source `polymarket`, and provider token.
- Default orderbook UI remains hidden through Home -> Detail -> Ticket -> Server Portfolio -> Cancel -> Canceled activity.

Fields Holiwyn still needs but backend does not fully provide:

- Production active Polymarket World Cup event breadth remains P1.
- Filled lifecycle from the exact Home-opened path remains P1, although prior route-deep cycles prove filled backend paths.

Schema mismatch:

- No schema migration was required. Existing order request, order, market/outcome, and Portfolio/history response fields carry the selected identity for the FH proof.

Route mismatch:

- `/api/events?includeMobileMarkets=1`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/orders/:id`, `/api/portfolio`, and `/api/portfolio/history` are enough for the selected Home-started cancel lifecycle.

Temporary mock/static data:

- No arbitrary frontend-only market data was added.
- The proof event is disposable backend provider-shaped data created by the existing provider breadth harness.
- The order and cancel lifecycle use server fake-token mode, not local mock Portfolio state.

Future migration concern:

- Replace disposable provider-shaped proof events with production active Polymarket-backed World Cup events before treating provider breadth as complete.
