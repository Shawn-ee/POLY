# Cycle KG - Route Sell/Cashout Safety

## Scope

Backend/data-contract proof for mobile cashout/sell safety through the actual order route.

This cycle does not redesign Portfolio or the cashout sheet. It verifies the backend route contract that the visible mobile close-position flow depends on:

- no position cannot cash out/sell
- insufficient available shares cannot cash out/sell
- valid full-position sell-all can proceed
- failed route attempts do not create fake Portfolio orders

## Route/Data Dependencies

| Flow | Route | Required contract |
| --- | --- | --- |
| No-position cashout/sell | `POST /api/orders` | Rejects `SELL LIMIT` when no `Position` exists for the selected market/outcome. |
| Oversell cashout/sell | `POST /api/orders` | Rejects `SELL LIMIT` when requested size exceeds `shares - reservedShares`. |
| Portfolio after rejection | `GET /api/portfolio` | Shows no fake open order and preserves existing position shares. |
| Valid full-position close | `POST /api/orders` | Accepts a `SELL LIMIT` where size equals owned shares. |
| Portfolio after valid close | `GET /api/portfolio` | Shows the open SELL order and reserves owned shares in backend state. |

## Evidence

- Harness proof: `docs/mobile/harness/cycle-KG-route-sell-safety/cycle-KG-route-sell-safety.json`
- Proof script: `scripts/prove_mobile_route_sell_safety.ts`
- Mobile focused test: `mobile/src/__tests__/positionCloseService.test.ts`
- Backend focused test: `src/server/services/__tests__/phase7_kalshi_model.test.ts`

## Proof Results

| Case | Expected | Result |
| --- | --- | --- |
| No-position SELL | `409 Insufficient shares`; no positions; no open orders | Pass |
| Oversell | `409 Insufficient available shares`; owned shares preserved; no open orders | Pass |
| Valid sell-all | `200`; creates SELL order for all owned shares; reserves shares | Pass |

## Gate Decision

Pass for focused backend/data-contract scope.

Remaining P1:

- Provider-backed close/cashout replay when exact live provider markets are available.
