# Cycle LD - Account Preferences Response Contract

Gate status: Pass

## Scope

- Validate server Account preferences responses before applying visible mobile state.
- Cover language, saved markets, saved count, and Trade Ticket defaults.
- Preserve the documented legacy fallback where missing slippage defaults to `1%`.
- Keep scope to backend/data correctness, not visual redesign.

## Evidence

- Harness proof: `docs/mobile/harness/cycle-LD-account-preferences-response-contract/cycle-LD-account-preferences-response-contract.json`
- Proof script: `scripts/prove_mobile_account_preferences_response_contract.ts`
- Mobile tests:
  - `mobile/src/__tests__/profilePreferencesService.test.ts`
  - `mobile/src/__tests__/api.test.ts`

## Results

| Requirement | Result | Notes |
| --- | --- | --- |
| Default route payload normalizes to mobile state | Pass | Proof loads `/api/profile/preferences` with canonical auth and applies the mobile normalizer. |
| Saved PUT echo normalizes to visible mobile state | Pass | Proof saves `zh`, `SELL`, `2%`, and two saved ids, then normalizes the route echo. |
| Persisted GET reload matches saved state | Pass | Proof reloads the route and compares persisted mobile state against the saved echo. |
| Invalid preference fields are rejected before apply | Pass | Proof and tests reject invalid locale, side, amount, and saved ids. |
| Legacy slippage compatibility remains | Pass | Older payloads missing `ticketDefaultSlippage` still normalize to `1%`. |

## Decision

- Pass/fail: Pass.
- Unresolved P0 gaps: 0 for focused Account preferences response contract.
- Remaining P1/P2: richer retry/conflict UI if preference save fails mid-session.
