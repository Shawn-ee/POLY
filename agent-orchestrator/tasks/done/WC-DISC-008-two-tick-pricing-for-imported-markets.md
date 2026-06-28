# WC-DISC-008 Two-Tick Pricing For Imported Markets

Status: done

Objective: Ensure imported markets can use existing two-tick pricing engine and fail safely if stale/missing.

Completed evidence:

- Imported-draft pricing test: `src/__tests__/polymarket.imported-draft-two-tick.test.ts`
- Harness: `agent-orchestrator/harnesses/world_cup_market_promotion_check.sh`
- Report: `agent-orchestrator/runs/20260628T010500-WC-DISC-008-two-tick-pricing-for-imported-markets/REPORT.md`

Validation:

- `npx jest --runInBand --detectOpenHandles src/__tests__/polymarket.imported-draft-two-tick.test.ts src/__tests__/polymarket.imported-draft-reference-sync.test.ts src/__tests__/referenceQuoteEngine.test.ts`
- `bash agent-orchestrator/harnesses/world_cup_market_promotion_check.sh`
- `npx tsc --noEmit --pretty false --incremental false`

Result: pass.
