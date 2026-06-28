# Polymarket Reference Market Maker Audit

Timestamp: 2026-06-28T00:00:00-05:00
Branch: `agent/polymarket-mm-phase0-audit`
Worktree: `C:\Users\hecto\projects\agent-workspaces\Poly-polymarket-mm`

## Phase 0 Branch State

- `origin/dev` is `6934aff` (`merge: sports UI and browser testing into dev`).
- `origin/main` is `4d91e52` (`merge: sports UI and browser testing release`).
- `origin/agent/sports-ui-event-pages` is an ancestor of both `origin/dev` and `origin/main`.
- Authenticated Playwright coverage exists in `tests/e2e/auth.setup.ts`, `tests/e2e/helpers/loginAsAdmin.ts`, `tests/e2e/admin-smoke.spec.ts`, and `tests/e2e/sports-authenticated-order.spec.ts`.
- Dev admin login exists at `src/app/api/dev/login-as-admin/route.ts` and is guarded by `src/lib/devLogin.ts` with `NODE_ENV !== "production"` and `ALLOW_DEV_LOGIN=true`.

## A. Poly Architecture

### Event / Market / Outcome

- `Event` groups sports and reference markets. It includes `category`, `sportKey`, `leagueKey`, teams, start time, source IDs, external slug, images, and metadata.
- `Market` is the tradable object. It supports `eventId`, `marketType`, grouping fields, orderbook/public visibility, external Polymarket IDs (`externalMarketId`, `conditionId`, `referenceSource`, `externalSlug`), `referenceMetadata`, and `ReferenceQuoteSnapshot[]`.
- `Outcome` is the tradable leg. Orders, fills, trades, positions, and reference snapshots all point at `outcomeId`. Polymarket token mapping fields already exist as `referenceTokenId`, `referenceOutcomeLabel`, and `referenceMetadata`.

### Order Placement / Orderbook / Matching

- Order placement routes are `src/app/api/orderbook/[marketId]/orders/place/route.ts`, `src/app/api/orderbook/place/route.ts`, and canonical API routes under `src/app/api/orders`.
- Matching authority is `src/server/services/matching.ts`.
- `placeOrderAndMatch` enforces public orderbook live markets, active outcomes, price bounds, no self-crossing, balance/share availability, maker locking, fill creation, position updates, ledger entries, and binary best-bid/best-ask invariant checks.
- Orderbook reads are served by `src/server/services/orderbook.ts`, `src/server/services/orderbookSnapshot.ts`, and route files under `src/app/api/orderbook`.

### Balance Locking / Ledger

- BUY orders lock USDC through `reservedNotional`, `UserBalance.availableUSDC`, `UserBalance.lockedUSDC`, and `LedgerEntry`.
- SELL orders reserve shares through `Position.reservedShares`.
- `src/server/services/ledger.ts` provides idempotent deposit, lock, unlock, fill, withdrawal request, completion, and reconciliation behavior.
- Ledger tests exist under `src/server/services/__tests__/ledger.phase3.test.ts`.

### Settlement

- `src/server/services/settlement.ts` settles orderbook markets and cancels open orders before resolution.
- Combo settlement is isolated in `src/server/services/comboSettlement.ts`.
- Sports metadata-only resolution is handled by `src/server/services/sportsMarketResolution.ts`; orderbook-exposed markets must use orderbook settlement.

### Bot User Support

- API credential models (`ApiCredential`, `ApiOrderRequest`, usage logs and buckets) support external bots using canonical HTTP APIs.
- Bot monitor/admin APIs exist under `src/app/api/admin/bots`.
- Reference liquidity initialization and readiness services exist in `src/server/services/referenceBotInitialization.ts`, `referenceBotReadiness.ts`, and `referenceLiquiditySeeding.ts`.

### Admin APIs

- Event/market admin APIs exist under `src/app/api/admin/events` and `src/app/api/admin/markets`.
- Reference-market APIs exist under `src/app/api/admin/reference-markets`, `src/app/api/admin/reference-markets/polymarket/import`, and `src/app/api/admin/reference-quote-snapshots`.
- Admin reference snapshot refresh exists at `src/app/api/admin/reference-markets/[id]/refresh-snapshot/route.ts`.

### Sports APIs

- Public sports APIs exist at `src/app/api/sports/route.ts`, `src/app/api/sports/soccer/events/route.ts`, and `src/app/api/sports/soccer/world-cup/events/route.ts`.
- Public events and grouped market APIs expose Event -> Market -> Outcome views without admin-only fields.

### Current Test Coverage

- Sports model and public no-leak tests: `src/__tests__/sports.event-market-model.test.ts`, `public.sports.no-leak.test.ts`, `public.events.no-leak.test.ts`, `public.event-markets.no-leak.test.ts`, `public.market-list.no-leak.test.ts`.
- Orderbook/matching/ledger coverage: `orderbook.place-cancel.events.test.ts`, `orderbook.events.bus.test.ts`, `phase7_kalshi_model.test.ts`, `ledger.phase3.test.ts`.
- Reference pricing coverage: `src/__tests__/reference.two-tick-pricing.test.ts`.
- Authenticated UI coverage: Playwright sports/admin specs under `tests/e2e`.

### Missing Pieces

- Required service folder name `src/server/services/polymarket/` does not yet exist; current code is split across `polymarketEventImport.ts`, `polymarketReferenceImport.ts`, `polymarketReferenceSnapshots.ts`, and `referenceQuoteSnapshots.ts`.
- No explicit persisted `ImportCandidate`, `MarketReferenceMapping`, `BotQuoteConfig`, or `BotOrderIntent` models exist yet. Equivalent state currently lives in `Market`, `Outcome`, `referenceMetadata`, and `ReferenceQuoteSnapshot`.
- Current quote engine is snapshot-specific and binary-first. A pure `referenceQuoteEngine` for `yes_no`, `match_winner_1x2`, `total_goals`, and `both_teams_to_score` still needs to be added.
- Dry-run market maker intent persistence still needs a first-class local model or explicit JSON/report output.

## B. Polymarket API Investigation

Use only public/documented endpoints and no protected scraping.

- Market/event discovery: Polymarket Gamma public API is already used with `https://gamma-api.polymarket.com/markets` and `https://gamma-api.polymarket.com/events`. Existing code filters with `search`, `active=true`, `closed=false`, `archived=false`, and slug lookups.
- World Cup / soccer filtering: current poly-bot discovery uses query terms such as `world cup`, `fifa`, `soccer`, `football`, and rejects unrelated Cricket/Rugby terms unless there is a soccer hint.
- Outcome/token mapping: Gamma market payload fields used by existing code are `outcomes`, `clobTokenIds`, `outcomePrices`, `conditionId`, market `id`, `slug`, `bestBid`, `bestAsk`, and `lastTradePrice`.
- CLOB orderbook/price reads: current poly-bot client uses public no-auth reads:
  - `GET https://clob.polymarket.com/book?token_id=...`
  - `GET https://clob.polymarket.com/price?token_id=...&side=BUY`
  - `GET https://clob.polymarket.com/price?token_id=...&side=SELL`
  - `GET https://clob.polymarket.com/midpoint?token_id=...`
- Public vs auth-required: public market data reads require no private key. Order placement/canceling on Polymarket would require auth and is out of scope; this system only reads Polymarket and places demo/local orders in Poly.
- Safe polling: existing code defaults to 5s reference polling for local snapshots and catches per-market fetch errors. Production-scale polling should back off, cap markets per cycle, and avoid retry storms.
- Closed/resolved handling: existing discovery rejects `closed` and `archived` markets, and snapshot sync records missing/invalid/stale states rather than crashing.
- Official/public references used:
  - Polymarket docs: `https://docs.polymarket.com/`
  - Polymarket CLOB API docs: `https://docs.polymarket.com/developers/CLOB/introduction`
  - Gamma API base used by existing code: `https://gamma-api.polymarket.com`

## C. Final Target Architecture

1. Polymarket Discovery Bot: searches public Gamma API for World Cup/soccer markets, writes reviewable candidates.
2. Polymarket Import/Mapping Service: imports approved candidates into Event -> Market -> Outcome, stores token mappings.
3. Polymarket Reference Price Sync Bot: syncs verified mappings to `ReferenceQuoteSnapshot`.
4. Quote Engine: pure, deterministic worse-than-reference quote calculator.
5. Reference Market Maker Bot: converts quote plans into real local bot orders after risk checks.
6. Risk/Stale Quote Bot: cancels/pauses local bot quotes when reference data is stale, volatile, disabled, or over risk.
7. Resolution Proposal Bot: proposes outcomes for admin review; does not silently resolve risky markets.
8. Ops Reporter Bot: writes status reports, stale counts, skipped reasons, and command evidence.
9. Admin/Ops Dashboard: discovery, mapping verification, price view, target quotes, bot status, kill switches.

## D. Data Flow

Polymarket Discovery -> Import Candidates -> Internal Event/Market/Outcome -> Mapping Verification -> Reference Price Sync -> Quote Engine -> Bot Order Intent -> Real Bot Orders -> Risk Monitor -> Admin/Ops Dashboard

## E. Cleanup Plan

- Keep: canonical order APIs, matching/settlement/ledger, Event -> Market -> Outcome sports model, reference snapshot services, admin reference-market APIs.
- Modify: move or wrap existing Polymarket services under `src/server/services/polymarket/`; add pure quote engine; add dry-run intent persistence/reporting; add verified/disabled mapping semantics.
- Merge: duplicate Gamma/CLOB parsing in Poly and poly-bot should converge on compatible types and fixtures.
- Safe deletion candidates: none yet in Poly. Deletion requires a dependency audit across package scripts, service files, docs, orchestrator files, tests, and imports.
- Required tests before deletion: package script reference scan, `rg` import scan, TypeScript, relevant Jest, bot dry-run scripts, and orderbook/ledger smoke tests when trading paths are affected.
