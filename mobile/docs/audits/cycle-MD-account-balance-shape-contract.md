# Cycle MD Account Balance Shape Contract

Date: 2026-07-06

Scope:

- Account balance route data from `/api/account/balance`.
- Visible Account balance and tab balance state before server-mode account data applies.

Out of scope:

- Deposit/withdraw flows.
- Portfolio visual redesign.
- Account settings visual polish.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid non-negative balance applies | Pass | `docs/mobile/harness/cycle-MD-account-balance-shape-contract/cycle-MD-account-balance-shape-contract.json` |
| Negative available balance rejects before visible apply | Pass | MD proof `negativeAvailableRejects=true` |
| Negative locked balance rejects before visible apply | Pass | MD proof `negativeLockedRejects=true` |
| Inconsistent total balance rejects before visible apply | Pass | MD proof `inconsistentTotalRejects=true` |
| Malformed updatedAt rejects before visible apply | Pass | MD proof `invalidUpdatedAtRejects=true` |

Implementation notes:

- `loadAccountBalance` still accepts canonical numeric strings or numbers.
- `availableUSDC`, `lockedUSDC`, and `totalUSDC` must be finite non-negative values.
- `totalUSDC` must match `availableUSDC + lockedUSDC` within cent-level tolerance.
- `updatedAt` must be a string, null, or omitted.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/accountBalanceService.test.ts mobile/src/__tests__/accountBootstrapService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_account_balance_shape_contract.ts`
- Full validation/gate: see latest Cycle MD validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional field-specific Account balance error copy.
