# World Cup Market Discovery and Import Spec

Updated: 2026-06-28

## Goal

Build a safe automated pipeline that discovers supported World Cup soccer markets from Polymarket or a configured reference source, creates internal draft `Event -> Market -> Outcome` records, maps external IDs and outcome token IDs, validates the mapping, verifies reference sync and two-tick pricing, runs market-maker dry-run, and promotes only safe markets for internal beta visibility and trading.

## Lifecycle

Markets must move through this lifecycle without skipping states:

`discovered -> draft -> mapped -> validated -> enabled -> quoting -> trading -> closed -> settled`

- `discovered`: external market was found and recorded as a candidate/report.
- `draft`: local records exist but are hidden, disabled, unlisted, and non-tradable.
- `mapped`: local records contain external market ID, slug, condition ID, outcome labels, and token IDs.
- `validated`: mapping validator, reference sync, two-tick pricing, no-leak checks, and MM dry-run pass.
- `enabled`: internal beta UI can list the market.
- `quoting`: reference MM may create internal liquidity under dry-run/live-local guards.
- `trading`: allowlisted internal beta/test-balance users can trade.
- `closed`: local or reference status blocks new trading/quoting.
- `settled`: result proposal/settlement readiness exists; unsafe automatic real-money settlement is forbidden.

## Current Baseline

Existing code has useful pieces but not the full pipeline:

- `PolymarketDiscoveryClient` can query Gamma markets and build import candidates.
- `scan_polymarket_sports.ts` and `scan_polymarket_reference_candidates.ts` are read-only scanners.
- `upsertPolymarketReferenceMarket` can create/reuse events, markets, outcomes, and mapping fields.
- `polymarketReferenceSnapshots.ts` syncs already approved/mapped markets.
- `referenceQuoteSnapshots.ts` derives planned two-tick-worse bid/ask previews.
- `referenceQuoteEngine.ts` and `referenceMarketMaker.ts` support quote calculation and dry-run/live-local planning.
- Admin pages expose imports, mappings, reference prices, market-maker, bot-risk, and ops status.

## Required New Architecture

1. Discovery Bot: `npm run polymarket:discover:once`
   - Fixture mode by default for deterministic tests.
   - Optional live Gamma smoke only behind `POLYMARKET_DISCOVERY_LIVE_SMOKE=true`.
   - Finds only World Cup soccer markets, excludes player props and unsupported markets.
   - Writes candidates to DB model or structured report without importing by default.

2. Draft Import Bot: `npm run polymarket:import:draft`
   - Reads discovery candidates.
   - Creates or reuses internal `Event`, `Market`, and `Outcome` rows.
   - Defaults to `visibility=PRIVATE` or `isListed=false`, `status=UPCOMING`, outcomes `isTradable=false`, `mmEnabled=false`, and `tradable=false`.
   - Avoids duplicates by `externalMarketId`, `conditionId`, `externalSlug`, event slug, and token IDs.

3. Mapping Validator: `npm run polymarket:mapping:validate`
   - Validates outcome labels/count, token IDs, condition ID, supported market type, kickoff/start time, duplicate/conflicting slugs, closed/resolved status, and TBD team state.
   - Produces confidence score, reason codes, missing fields, admin-review flag, and recommended lifecycle state.

4. Reference Sync Validation: `npm run reference:sync:once`
   - Syncs only mapped/validated candidates or approved mappings.
   - Stores `ReferenceQuoteSnapshot`.
   - Fixture fallback is required for CI and local deterministic harnesses.

5. Two-Tick Pricing Validation
   - Uses default `tickSize=0.01`, `edgeTicks=2`.
   - Blocks stale, missing, unsupported, closed, resolved, or unmapped markets.
   - Requires examples: `0.50 -> 0.48/0.52`, bid `0.64 -> 0.62`, ask `0.66 -> 0.68`.

6. Market Maker Dry-Run
   - Uses derived prices and writes `BotOrderIntent`.
   - Does not create live orders in dry-run.
   - Checks kill switches, stale reference, market status, beta flags, and risk limits.

7. Promotion Bot: `npm run polymarket:promote:validated`
   - Promotes only after mapping validation, confidence threshold, reference sync, pricing, no-leak, duplicate, stale, status, and MM dry-run checks pass.
   - Must not auto-promote player props, unsupported combos, stale/resolved/closed markets, TBD teams, missing-token markets, duplicates, or markets without reference prices.

8. Admin Review
   - Shows external title, local mapping, confidence, token IDs, condition ID, prices, stale status, validation errors, eligibility, and recommended action.
   - Review actions: approve, hold, reject, needs manual mapping, unsupported.

## Safety Defaults

- `POLYMARKET_DISCOVERY_FIXTURE_MODE=true`
- `POLYMARKET_REFERENCE_FIXTURE_MODE=true`
- `POLYMARKET_DISCOVERY_LIVE_SMOKE=false`
- `POLYMARKET_AUTO_IMPORT_ENABLED=false`
- `POLYMARKET_AUTO_PROMOTE_ENABLED=false`

No code path may enable production deposits, withdrawals, custody, private-key changes, real-money ledger movement, public non-whitelisted trading, production live bots with real external funds, or automatic payout signing.

## Data Model Plan

Existing `Market.referenceMetadata` can carry lifecycle metadata short term, but a durable system should add non-destructive models:

- `PolymarketDiscoveryCandidate`
- `PolymarketImportRun`
- `MarketLifecycleAudit`

Minimum fields for discovery candidates: `source`, `candidateId`, `externalSlug`, `externalMarketId`, `conditionId`, `title`, `eventTitle`, `marketType`, `status`, `confidence`, `reasonCodes`, `raw`, `firstSeenAt`, `lastSeenAt`, and local linkage after import.

## Harness Plan

Create deterministic harnesses:

- `world_cup_market_discovery_check.sh`
- `world_cup_market_import_check.sh`
- `world_cup_mapping_validation_check.sh`
- `world_cup_market_promotion_check.sh`
- `world_cup_discovery_to_trading_e2e_check.sh`

They should run fixture mode by default and allow live read-only smoke only when explicitly enabled.
