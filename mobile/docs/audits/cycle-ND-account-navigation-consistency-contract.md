# Cycle ND Account Navigation Consistency Contract

Date: 2026-07-06

Scope:

- Server-mode Account navigation route.
- `/api/account/navigation` item `enabled`, `status`, `kind`, and `destination` consistency before visible Account menu state applies.

Out of scope:

- Account visual redesign.
- New account menu destinations.
- Deposits/withdrawals.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid placeholder row accepted | Pass | `docs/mobile/harness/cycle-ND-account-navigation-consistency-contract/cycle-ND-account-navigation-consistency-contract.json` |
| Valid available destination row accepted | Pass | ND proof `validAvailableDestinationAccepted=true` |
| Enabled unavailable row rejects | Pass | ND proof `enabledUnavailableRejects=true` |
| Available row without destination rejects | Pass | ND proof `availableWithoutDestinationRejects=true` |
| Enabled placeholder rejects | Pass | ND proof `enabledPlaceholderRejects=true` |

Implementation notes:

- Available account navigation items must be enabled and include a destination.
- Placeholder items must remain disabled, unavailable, and destinationless.
- Contradictory backend metadata rejects before visible Account menu state applies.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/accountNavigationService.test.ts mobile/src/__tests__/accountBootstrapService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_account_navigation_consistency_contract.ts`
- Full validation/gate: see latest Cycle ND validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional item-specific Account navigation error copy.
