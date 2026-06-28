# WC-DISC-010 Market Maker Dry-Run For Imported Markets

Status: done

Objective: Ensure imported validated markets can run reference market maker dry-run before quoting.

Completed evidence:

- Imported candidate dry-run helper: `src/server/services/polymarket/promotionGuardrails.ts`
- Tests: `src/__tests__/polymarket.imported-market-mm-dry-run.test.ts`
- Harness: `agent-orchestrator/harnesses/world_cup_market_promotion_check.sh`
- Report: `agent-orchestrator/runs/20260628T011500-WC-DISC-010-mm-dry-run-for-imported-markets/REPORT.md`

Validation:

- `npx jest --runInBand --detectOpenHandles src/__tests__/polymarket.imported-market-mm-dry-run.test.ts src/__tests__/polymarket.promotion-guardrails.test.ts src/__tests__/referenceMarketMaker.test.ts`
- `bash agent-orchestrator/harnesses/world_cup_market_promotion_check.sh`
- `npx tsc --noEmit --pretty false --incremental false`

Result: pass.
