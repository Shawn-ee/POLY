# Cycle 1 Validation Report

Timestamp: 2026-06-28T15:47:00-05:00

## Commands Run

```sh
bash -n agent-orchestrator/scripts/world_cup_polymarket_loop.sh
git diff --check
npx jest --runInBand --detectOpenHandles src/__tests__/world-cup-event-page-model.test.ts src/__tests__/world-cup-market-structure.test.ts src/__tests__/polymarket-mm-safe-basket.test.ts src/__tests__/admin-runtime-safety.test.ts
npx tsc --noEmit --pretty false --incremental false
npm run build
npm run runtime:closed-beta:status
npm run mm:polymarket:enable-safe-basket -- --maxMarkets=5
npx playwright test tests/e2e/world-cup-ui-ticket-smoke.spec.ts --project=smoke --reporter=line
```

## Results

- `bash -n`: PASS
- `git diff --check`: PASS
- focused Jest: PASS, 15 tests
- TypeScript: PASS
- build: PASS
- runtime status CLI: PASS
- safe-basket dry-run: PASS, with explicit blockers due local DB having zero candidates
- Playwright World Cup smoke: PASS

## Runtime CLI Evidence

Local DB status:

- reference snapshots: 5 total, 0 fresh, 5 stale
- MM configs: 2 enabled/dry-run
- open internal orders: 2
- World Cup events: 5
- public draft leaks: 0
- unsafe flags: none

## Safe Basket Evidence

```json
{
  "dryRun": true,
  "maxMarkets": 5,
  "candidateCount": 0,
  "selected": [],
  "skipped": [],
  "blockers": [
    "no_world_cup_polymarket_markets_found",
    "selected_0_markets_less_than_target_3"
  ]
}
```

## Browser / Screenshot Evidence

Playwright passed:

```sh
npx playwright test tests/e2e/world-cup-ui-ticket-smoke.spec.ts --project=smoke --reporter=line
```

Screenshot artifact:

```text
test-results/world-cup-ui-ticket-smoke--ff170--and-gated-ticket-estimates-smoke/world-cup-ui-ticket-smoke.png
```

## Safety

No deployment was performed. No production services were started. No real money, deposits, withdrawals, wallet/private-key worker, external-fund bot, auto import, or auto promotion was enabled.

## Validation Verdict

PASS
