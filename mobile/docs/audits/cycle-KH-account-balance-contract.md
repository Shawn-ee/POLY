# Cycle KH - Account Balance Contract

## Scope

Backend/data-contract proof for the visible Account balance surface.

This cycle does not redesign Account, Portfolio, deposit, or withdraw. It wires and proves the canonical account balance data used by visible Account state in server mode.

## Route/Data Dependencies

| Flow | Route | Required contract |
| --- | --- | --- |
| Account balance load | `GET /api/account/balance` | Canonical `account:read` auth returns `availableUSDC`, `lockedUSDC`, `totalUSDC`, and `updatedAt`. |
| Mobile balance mapping | `PolyApi.getAccountBalance()` | Mobile sends Bearer auth and receives the canonical account balance route body. |
| Mobile validation | `loadAccountBalance()` | Backend decimal strings normalize to numeric UI state; malformed fields throw clear errors. |
| Portfolio consistency | `GET /api/portfolio` | Portfolio wallet fields match the same user's account balance. |

## Evidence

- Harness proof: `docs/mobile/harness/cycle-KH-account-balance-contract/cycle-KH-account-balance-contract.json`
- Proof script: `scripts/prove_mobile_account_balance_contract.ts`
- Focused tests:
  - `mobile/src/__tests__/accountBalanceService.test.ts`
  - `mobile/src/__tests__/api.test.ts`

## Proof Results

| Case | Expected | Result |
| --- | --- | --- |
| Account balance route | `200` with canonical decimal-string available, locked, total balance | Pass |
| Mobile normalization | Numeric `availableUSDC`, `lockedUSDC`, `totalUSDC` for UI state | Pass |
| Portfolio wallet consistency | `/api/portfolio` wallet fields match account balance for same user | Pass |

## Gate Decision

Pass for focused backend/data-contract scope.

Remaining P1:

- Full server-authored account identity/session/menu metadata.
- Richer Account-specific sync and error state.
