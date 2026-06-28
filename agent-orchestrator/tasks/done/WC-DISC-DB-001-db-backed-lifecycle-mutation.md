# WC-DISC-DB-001 DB-Backed Lifecycle Mutation

Status: done

Objective: Implement safe DB-backed lifecycle mutation from validated imported draft to enabled internal beta market.

Completed evidence:

- Service: `src/server/services/polymarket/lifecyclePromotion.ts`
- Command integration: `scripts/polymarket_promote_validated.ts`
- Tests: `src/__tests__/polymarket.lifecycle-promotion.test.ts`
- Harness: `agent-orchestrator/harnesses/world_cup_market_promotion_check.sh`
- Report: `agent-orchestrator/runs/20260628T014000-WC-DISC-DB-001-db-backed-lifecycle-mutation/REPORT.md`

Validation:

- `npx jest --runInBand --detectOpenHandles src/__tests__/polymarket.lifecycle-promotion.test.ts src/__tests__/polymarket.promotion-guardrails.test.ts src/__tests__/public.market-list.no-leak.test.ts`
- `bash agent-orchestrator/harnesses/world_cup_market_promotion_check.sh`
- `npx tsc --noEmit --pretty false --incremental false`

Result: pass.
