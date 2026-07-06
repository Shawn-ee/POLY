# Cycle LI - Account Bootstrap Contract

Gate status: Pass

## Scope

- Treat `/api/account/balance`, `/api/account/profile`, and `/api/account/navigation` as separate required reads for full Account bootstrap.
- Show visible Account data error when any account bootstrap route fails.
- Preserve successful partial data instead of discarding usable account state.
- Keep scope to backend/data correctness, not account visual redesign.

## Evidence

- Harness proof: `docs/mobile/harness/cycle-LI-account-bootstrap-contract/cycle-LI-account-bootstrap-contract.json`
- Proof script: `scripts/prove_mobile_account_bootstrap_contract.ts`
- Mobile tests:
  - `mobile/src/__tests__/accountBootstrapService.test.ts`
  - `mobile/src/__tests__/accountBalanceService.test.ts`
  - `mobile/src/__tests__/accountProfileService.test.ts`
  - `mobile/src/__tests__/accountNavigationService.test.ts`

## Results

| Requirement | Result | Notes |
| --- | --- | --- |
| All Account bootstrap routes succeed -> visible synced state | Pass | Proof `allSucceeded.status=synced`. |
| Any Account bootstrap route fails -> visible error state | Pass | Proof partial route failures return `status=error`. |
| Successful partial data remains usable | Pass | Balance/profile/navigation successes are preserved independently. |
| Failed Account routes do not invent data | Pass | Failed routes leave their data fields undefined. |
| Account UI exposes account data status separately from preferences | Pass | `account-data-sync` row reports server account data status. |

## Decision

- Pass/fail: Pass.
- Unresolved P0 gaps: 0 for focused Account bootstrap contract.
- Remaining P1/P2: richer per-route retry copy if product wants separate balance/profile/menu retry controls.
