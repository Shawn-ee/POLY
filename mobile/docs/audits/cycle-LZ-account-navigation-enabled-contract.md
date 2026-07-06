# Cycle LZ Account Navigation Enabled Contract

Date: 2026-07-06

Scope:

- Visible Account menu state from `/api/account/navigation`.
- `items[].enabled` response shape used to enable/disable menu actions.

Out of scope:

- Account visual redesign.
- Deposit/withdraw.
- Broad account menu feature work.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid boolean enabled state applies | Pass | `docs/mobile/harness/cycle-LZ-account-navigation-enabled-contract/cycle-LZ-account-navigation-enabled-contract.json` |
| String `enabled` rejects instead of coercing visible state | Pass | LZ proof `stringEnabledRejects=true` |
| Numeric `enabled` rejects instead of coercing visible state | Pass | LZ proof `numericEnabledRejects=true` |

Implementation notes:

- `loadAccountNavigation` now requires `items[].enabled` to be an actual boolean.
- Malformed enabled route fields reject through the existing Account bootstrap partial-error path instead of becoming truthy/falsy UI state.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/accountNavigationService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_account_navigation_enabled_contract.ts`
- Full validation/gate: see latest Cycle LZ validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional field-specific Account navigation error copy.
