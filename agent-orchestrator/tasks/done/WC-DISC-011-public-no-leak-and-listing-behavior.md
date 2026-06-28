# WC-DISC-011 Public No-Leak And Listing Behavior

Status: done

Objective: Ensure draft/disabled markets do not appear publicly, and enabled markets appear in World Cup listing without leaking internal mapping metadata.

Completed evidence:

- Public market serializer tightened: `src/server/services/marketReadModel.ts`
- Public event serializer tightened: `src/server/services/eventReadModel.ts`
- Event detail public filter fixed: `src/app/api/events/[slug]/route.ts`
- Tests: `src/__tests__/public.market-list.no-leak.test.ts`, `src/__tests__/public.event-markets.no-leak.test.ts`, `src/__tests__/public.events.no-leak.test.ts`
- Harness: `agent-orchestrator/harnesses/world_cup_market_promotion_check.sh`
- Report: `agent-orchestrator/runs/20260628T012000-WC-DISC-011-public-no-leak-and-listing-behavior/REPORT.md`

Validation:

- `npx jest --runInBand --detectOpenHandles src/__tests__/public.market-list.no-leak.test.ts src/__tests__/public.event-markets.no-leak.test.ts src/__tests__/public.events.no-leak.test.ts`
- `bash agent-orchestrator/harnesses/world_cup_market_promotion_check.sh`
- `npx tsc --noEmit --pretty false --incremental false`

Result: pass.
