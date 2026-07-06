# Cycle KM - Account Navigation Contract

## Scope

- Wire visible Account menu rows to backend-owned metadata in server mode.
- Disable unsupported internal MVP destinations instead of leaving generic tappable placeholder rows.
- Do not implement leaderboard, rewards, API management, documentation, help, terms, deposits, withdrawals, or any unrelated product destination.

## Route/Data Contract

| Flow | Route | Required shape | Result |
| --- | --- | --- | --- |
| Account menu metadata | `GET /api/account/navigation` | `source`, `generatedAt`, `items[].id`, `label`, `icon`, `kind`, `enabled`, `status`, `destination`, `reason` | Pass |
| Unsupported MVP destinations | `items[]` payload | `kind=placeholder`, `enabled=false`, `status=unavailable`, reason text | Pass |

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-KM-account-navigation-contract/cycle-KM-account-navigation-contract.json`
- Proof script: `scripts/prove_mobile_account_navigation_contract.ts`
- Focused tests:
  - `mobile/src/__tests__/accountNavigationService.test.ts`
  - `mobile/src/__tests__/api.test.ts`

## Gate

- P0: 0 for focused backend/data-contract scope.
- P1: real destinations/actions when those products are intentionally in scope; richer Account sync/error copy.
- P2: none opened.

## Notes

- No schema migration was required.
- Standalone/mock mode keeps disabled local fallback rows. Server mode replaces them with the canonical route payload when available.
