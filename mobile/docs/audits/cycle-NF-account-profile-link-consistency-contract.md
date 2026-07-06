# Cycle NF Account Profile Link Consistency Contract

Date: 2026-07-06

Scope:

- Server-mode Account profile route.
- `/api/account/profile` linked wallet/Google metadata before visible Account profile state applies.

Out of scope:

- Account visual redesign.
- Authentication/linking flows.
- Deposits/withdrawals.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Linked profile accepted with identity fields | Pass | `docs/mobile/harness/cycle-NF-account-profile-link-consistency-contract/cycle-NF-account-profile-link-consistency-contract.json` |
| Unlinked profile accepted without optional identity fields | Pass | NF proof `unlinkedProfileAccepted=true` |
| Linked wallet without address rejects | Pass | NF proof `walletLinkedWithoutAddressRejects=true` |
| Linked Google without email rejects | Pass | NF proof `googleLinkedWithoutEmailRejects=true` |
| Malformed booleans still reject | Pass | NF proof `malformedBooleanStillRejects=true` |

Implementation notes:

- `hasWalletLinked=true` requires a non-empty `walletAddress`.
- `hasGoogleLinked=true` requires a non-empty `email`.
- Unlinked account states may omit those optional identity fields.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/accountProfileService.test.ts mobile/src/__tests__/accountBootstrapService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_account_profile_link_consistency_contract.ts`
- Full validation/gate: see latest Cycle NF validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Account profile-specific linked-state error copy.
