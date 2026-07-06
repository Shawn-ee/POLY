# Cycle LY Account Profile Boolean Contract

Date: 2026-07-06

Scope:

- Visible Account profile state from `/api/account/profile`.
- Linked-account booleans used by Account state.

Out of scope:

- Account visual redesign.
- Deposit/withdraw.
- Broad account menu feature work.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid boolean linked-account profile applies | Pass | `docs/mobile/harness/cycle-LY-account-profile-boolean-contract/cycle-LY-account-profile-boolean-contract.json` |
| String `hasWalletLinked` rejects instead of coercing visible state | Pass | LY proof `stringWalletLinkedRejects=true` |
| Numeric `hasGoogleLinked` rejects instead of coercing visible state | Pass | LY proof `numericGoogleLinkedRejects=true` |

Implementation notes:

- `loadAccountProfile` now requires `hasWalletLinked` and `hasGoogleLinked` to be actual booleans.
- Malformed linked-account route fields reject through the existing Account bootstrap partial-error path instead of becoming truthy/falsy UI state.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/accountProfileService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_account_profile_boolean_contract.ts`
- Full validation/gate: see latest Cycle LY validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional field-specific Account profile error copy.
