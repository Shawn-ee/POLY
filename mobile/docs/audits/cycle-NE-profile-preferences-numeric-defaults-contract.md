# Cycle NE Profile Preferences Numeric Defaults Contract

Date: 2026-07-06

Scope:

- Server-mode profile preferences route.
- `/api/profile/preferences` ticket default amount and slippage before visible Account settings state applies.

Out of scope:

- Account visual redesign.
- New settings controls.
- Deposit/withdraw settings.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Positive numeric amount accepted | Pass | `docs/mobile/harness/cycle-NE-profile-preferences-numeric-defaults-contract/cycle-NE-profile-preferences-numeric-defaults-contract.json` |
| Bounded percent slippage accepted | Pass | NE proof `positiveAmountAndZeroSlippageAccepted=true`, `maxSlippageAccepted=true` |
| Save round trip preserves numeric defaults | Pass | NE proof `saveRoundTripPreservesNumericDefaults=true` |
| Nonnumeric or zero amount rejects | Pass | NE proof `nonnumericAmountRejects=true`, `zeroAmountRejects=true` |
| Malformed or out-of-range slippage rejects | Pass | NE proof `malformedSlippageRejects=true`, `aboveMaxSlippageRejects=true` |

Implementation notes:

- `ticketDefaultAmount` remains a string for the current UI, but must parse as a positive number.
- `ticketDefaultSlippage` remains a string, but must parse as a percentage from `0%` to `100%`.
- Missing slippage from older payloads still defaults to `1%`.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/profilePreferencesService.test.ts mobile/src/__tests__/api.test.ts`
- Proof: `npx tsx scripts/prove_mobile_profile_preferences_numeric_defaults_contract.ts`
- Full validation/gate: see latest Cycle NE validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Account settings-specific malformed preference copy.
