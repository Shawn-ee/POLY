# WC-DISC-009 Promotion Guardrails

Status: done

Objective: Implement promotion from draft/mapped/validated to enabled only after required checks pass.

Completed evidence:

- Guardrail evaluator: `src/server/services/polymarket/promotionGuardrails.ts`
- Command: `npm run polymarket:promote:validated`
- Tests: `src/__tests__/polymarket.promotion-guardrails.test.ts`
- Harness: `agent-orchestrator/harnesses/world_cup_market_promotion_check.sh`
- Report: `agent-orchestrator/runs/20260628T011000-WC-DISC-009-promotion-guardrails/REPORT.md`

Validation:

- `npx jest --runInBand --detectOpenHandles src/__tests__/polymarket.promotion-guardrails.test.ts src/__tests__/polymarket.imported-draft-two-tick.test.ts src/__tests__/polymarket.imported-draft-reference-sync.test.ts`
- `bash agent-orchestrator/harnesses/world_cup_market_promotion_check.sh`
- `npx tsc --noEmit --pretty false --incremental false`

Result: pass.
