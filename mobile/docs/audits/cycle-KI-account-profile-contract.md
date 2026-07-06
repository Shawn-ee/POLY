# Cycle KI - Account Profile Contract

## Scope

Backend/data-contract proof for visible Account profile identity.

This cycle does not redesign Account, add deposit/withdraw, or wire static menu actions. It replaces the server-mode hardcoded profile name dependency with a canonical backend account profile route.

## Route/Data Dependencies

| Flow | Route | Required contract |
| --- | --- | --- |
| Account profile load | `GET /api/account/profile` | Canonical `account:read` auth returns backend-owned user identity. |
| Mobile profile mapping | `PolyApi.getAccountProfile()` | Mobile sends Bearer auth and receives the canonical account profile route body. |
| Mobile validation | `loadAccountProfile()` | Required `id`, `username`, and `displayName` are present; malformed fields throw clear errors. |
| Visible Account profile card | App server-mode account sync | Successful profile load sets the visible Account profile name from backend `displayName` and marks Account signed in. |

## Evidence

- Harness proof: `docs/mobile/harness/cycle-KI-account-profile-contract/cycle-KI-account-profile-contract.json`
- Proof script: `scripts/prove_mobile_account_profile_contract.ts`
- Focused tests:
  - `mobile/src/__tests__/accountProfileService.test.ts`
  - `mobile/src/__tests__/api.test.ts`

## Proof Results

| Case | Expected | Result |
| --- | --- | --- |
| Account profile route | `200` with canonical user id, username, displayName, email, and image | Pass |
| Mobile normalization | Route identity maps into Account profile mobile state | Pass |
| Hardcoded-name replacement | App server-mode profile sync can provide backend `displayName` to Account screen | Pass |

## Gate Decision

Pass for focused backend/data-contract scope.

Remaining P1:

- Full server-authored Account menu destinations/actions.
- Richer Account-specific sync and error copy.
