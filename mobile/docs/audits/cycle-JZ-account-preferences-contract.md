# Cycle JZ - Account Preferences Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Account/settings profile preference load and save in server mode.
- `/api/profile/preferences` canonical route.
- AccountScreen-visible preference fields: language, saved markets count, ticket amount, ticket side, and slippage.
- Mobile preference sync error handling for malformed backend responses.
- No production auth/profile/wallet menu redesign, deposits, withdrawals, orderbook, chat, or live stats product work.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Backend loads default profile preferences | Pass | Route proof at `docs/mobile/harness/cycle-JZ-account-preferences-contract/cycle-JZ-account-preferences-contract.json` verifies default `locale=en`, ticket amount `100`, side `BUY`, slippage `1%`, and empty saved events. |
| Backend saves profile preferences | Pass | Route proof saves `locale=zh`, ticket amount `250`, side `SELL`, slippage `2%`, and two saved events through canonical `account:write` auth. |
| Backend reloads persisted preferences | Pass | Route proof reloads the saved values through canonical `account:read` auth. |
| Backend rejects invalid preference payloads | Pass | Route proof verifies missing `ticketDefaultSlippage` returns `400` with a clear error. |
| Mobile maps visible Account preferences | Pass | `mobile/src/__tests__/profilePreferencesService.test.ts` covers local/server mapping for locale, ticket defaults, slippage, and saved event ids. |
| Mobile handles malformed server responses clearly | Pass | Focused mobile test verifies missing `preferences` rejects with `Profile preferences response was missing preferences.` |

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/profilePreferencesService.test.ts mobile/src/__tests__/api.test.ts` - pass.
- `npx jest --runInBand src/__tests__/profile.preferences.route.test.ts` - pass.
- `cd mobile; npm run typecheck` - pass.
- `npx tsc --noEmit` - pass.
- `npx tsx scripts/prove_mobile_account_preferences_contract.ts --output=docs/mobile/harness/cycle-JZ-account-preferences-contract/cycle-JZ-account-preferences-contract.json` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/check-mobile-audit-gate.ps1 -Cycle "Cycle JZ"` - pass.

## Remaining P1

- Full server-authored account/session/menu/wallet destination metadata remains future work.
- Richer mobile retry/conflict state if preference sync fails mid-session.
