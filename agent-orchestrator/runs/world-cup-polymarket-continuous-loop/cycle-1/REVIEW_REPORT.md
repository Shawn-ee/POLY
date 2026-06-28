# Cycle 1 Review Report

Timestamp: 2026-06-28T15:45:00-05:00

PR: `https://github.com/Shawn-ee/POLY/pull/267`

Branch: `agent/world-cup-polymarket-structure-refactor`

## Files Inspected

- `src/lib/sports/worldCupEventPageModel.ts`
- `src/components/sports/WorldCupEventTradingPage.tsx`
- `src/app/events/[slug]/page.tsx`
- `src/server/services/marketReadModel.ts`
- `src/server/services/closedBetaRuntimeStatus.ts`
- `src/server/services/polymarketMmSafeBasket.ts`
- `scripts/mm_polymarket_enable_safe_basket.ts`
- `scripts/runtime_closed_beta_status.ts`
- `tests/e2e/world-cup-ui-ticket-smoke.spec.ts`
- PR metadata and CI result for PR #267

## Reviewer Findings

### Finding 1: PR existence was not enough

Status: fixed by this continuous-loop cycle.

The prior stopping point was invalid because it ended after PR creation. Cycle 1 added loop machinery, acceptance criteria, reviewer/auditor reports, and validation evidence.

### Finding 2: New UI was applied to every sports event

Status: fixed.

The Polymarket-style model should target World Cup soccer events. The route now uses `WorldCupEventTradingPage` only when `event.category === "sports"`, `sportKey === "soccer"`, and `leagueKey === "world_cup"`. Other sports events keep the prior `SportsEventView`.

### Finding 3: Playwright smoke still targeted old UI

Status: fixed.

The smoke now verifies the new model-driven World Cup page: event header, tabs/families, source labels, trade ticket, amount input, and disabled explanation. The test passed with screenshot artifact.

### Finding 4: Tradeable ticket action was inert

Status: fixed.

When an outcome is tradeable, the ticket now links to `/markets/{marketId}` to open the existing internal order ticket. Disabled states remain disabled and explain why.

### Finding 5: Safe basket dry-run did not prove why zero markets were selected

Status: fixed.

The command now reports `candidateCount` and `blockers`. In the current local DB it reports:

- `no_world_cup_polymarket_markets_found`
- `selected_0_markets_less_than_target_3`

This satisfies the criterion to identify 3-5 eligible markets or clearly prove why not.

## Is This Real Implementation Or Scaffold?

Real implementation. The branch includes a pure normalized model, a UI rendering path, public API, admin runtime API/page, CLI status command, safe-basket MM planner, updated E2E smoke, and focused tests.

## Does The UI Actually Change?

Yes. Playwright evidence shows the World Cup event page now renders a Polymarket-style event header, tabs, market families, outcome rows with source labels, and a right-side trade ticket.

Screenshot artifact:

`test-results/world-cup-ui-ticket-smoke--ff170--and-gated-ticket-estimates-smoke/world-cup-ui-ticket-smoke.png`

## Are Line Selectors Functional?

Model support exists and is tested. The current seeded browser fixture did not expose multiple line values, so Playwright records a line-selector-limited annotation when applicable. This is acceptable before merge because model/unit coverage exists and the UI renders selectors when multiple lines exist.

## Are Price Sources Real?

Yes. Sources are derived from local orderbook quotes and reference summaries. Missing local/reference data is shown as `No live price`, `Not mapped`, or `Stale`, not fake data.

## Hardcoded Or Fake Data?

No hardcoded fake prices were found in the new page model. Existing local seed data may produce a real `50c` local-book display where local orderbook midpoint is actually `0.50`.

## Safe-Basket MM Usefulness

The planner is useful and safe. It dry-runs by default, refuses unsafe env, and reports why the local DB cannot select 3 markets. It does not create external orders.

## Can Owner Test In Browser?

Yes, locally and after server rehearsal. Browser smoke passed against local dev server.

## Closed Beta Safety

Safe for closed beta merge. Not a production launch. No real-money/deposit/withdrawal/wallet/private-key/external-fund path was enabled.

## Reviewer Verdict

`MERGE READY`
