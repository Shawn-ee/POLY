# Cycle NX Cashout Finite Shares Contract

Date: 2026-07-06

Scope:

- Portfolio position cashout.
- Full-position SELL order size before `/api/orders` is called.

Out of scope:

- Portfolio visual redesign.
- Cashout layout.
- Partial cashout.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Finite positive shares can cash out | Pass | `docs/mobile/harness/cycle-NX-cashout-finite-shares-contract/cycle-NX-cashout-finite-shares-contract.json` |
| Zero shares are rejected before API call | Pass | NX proof `rejectsZeroShares=true` |
| `NaN` shares are rejected before API call | Pass | NX proof `rejectsNaNShares=true` |
| Infinite shares are rejected before API call | Pass | NX proof `rejectsInfiniteShares=true` |

Implementation notes:

- Server-mode cashout now requires finite positive position shares before deriving SELL order size.
- Invalid share values reject before `/api/orders` is called.
- Existing current-price, market/outcome identity, full-size confirmation, lifecycle, and status validation remains unchanged.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/positionCloseService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_cashout_finite_shares_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional cashout-specific invalid-position copy.
