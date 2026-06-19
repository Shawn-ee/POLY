# Internal Beta Test Evidence

Last updated: 2026-06-19

Scope: focused recovery pass after the overnight autonomous runner. This file distinguishes actually run checks from checks not run, blocked checks, and manually required checks.

## Environment

- Repo: `C:\Users\hecto\Desktop\projects\PolyProj\poly`
- Starting branch: `dev` at `ca0d2f5`
- Recovery branch: `agent/beta-recovery-smoke-evidence-go-no-go`
- Local app base URL used for smoke: `http://127.0.0.1:3001`
- Server command used: `npm run dev -- -p 3001`
- Server mode: local Next.js dev server
- Production deployment: not used
- Real credentials: not used
- Sign-in: not performed
- Screenshots: not captured

The existing listener on port 3000 timed out for `http://127.0.0.1:3000`, so this pass started a separate local dev server on port 3001 and stopped that server after the smoke evidence was collected.

## Actually Run

### Repo Inspection

Commands run:

```powershell
git status --short --branch
git log --oneline --decorate --graph --max-count=30
gh pr list --base dev --state open --limit 50
```

Results:

- `git status --short --branch`: clean `dev...origin/dev` before creating the recovery branch.
- Recent log showed `ca0d2f5 docs: refresh checkpoint after pr212 (#213)` at `HEAD`.
- `gh` was not available in this shell, so open PR state could not be queried live.

### Local Server Startup

Command run:

```powershell
npm run dev -- -p 3001
```

Result:

- Next.js 16.1.6 started locally.
- Local URL: `http://localhost:3001`
- Readiness confirmed by `Invoke-WebRequest http://127.0.0.1:3001` returning HTTP 200.
- Server log noted `.env` was loaded.
- Server log warned that Next.js inferred workspace root from multiple lockfiles.
- Server log warned about cross-origin request detection from `127.0.0.1` to `/_next/*`.
- The recovery pass stopped the process listening on port 3001 after smoke evidence was collected.

### Public Route Smoke

Initial Playwright attempt:

```powershell
node - <inline Playwright script using chromium.launch()>
```

Result:

- Failed before route testing because the bundled Playwright Chromium executable was not installed.
- No app routes were tested by this failed attempt.

Successful Playwright attempt:

```powershell
node - <inline Playwright script using chromium.launch({ channel: "chrome" })>
```

Route set:

- `/`
- `/sports`
- `/events`
- `/markets`
- `/login`

Viewport set:

- Desktop: `1440x900`
- Mobile: `390x844`

Checks performed per route and viewport:

- Page navigation status.
- H1/title capture.
- Horizontal overflow detection.
- Visible text sample review.
- Secret-pattern scan for obvious exposed secret names or private-key/token patterns.
- Console warning/error capture.
- Request failure capture.
- Risk-word presence for admin, wallet, deposit/withdraw, and bot terms.

Results:

| Route | Desktop | Mobile | Layout | Secret-pattern scan | Notes |
|---|---|---|---|---|---|
| `/` | HTTP 200 | HTTP 200 | No horizontal overflow | No matches | Shows beta/test-credit copy and wallet boundary text. Console recorded anonymous 401 for wallet balance. |
| `/sports` | HTTP 200 | HTTP 200 | No horizontal overflow | No matches | Sports page rendered event-first content. |
| `/events` | HTTP 200 | HTTP 200 | No horizontal overflow | No matches | Events list rendered. Includes local/dev demo and reference event content. |
| `/markets` | HTTP 200 | HTTP 200 | No horizontal overflow | No matches | Market filters and event/market content rendered. |
| `/login` | HTTP 200 | HTTP 200 | No horizontal overflow | No matches | Login entry rendered. Shows wallet sign-in/funding boundary copy. |

Observed warnings:

- Homepage emitted a browser console error for an anonymous `401 Unauthorized` response.
- Server logs also showed anonymous `401` responses for wallet balance, orders, positions, and user order stream endpoints during client-side behavior/prefetching.
- These 401s did not require sign-in, did not use real credentials, and did not mutate data. They should still be reviewed before broad internal use because public pages should avoid noisy auth-only requests where practical.

No observed during the requested smoke route set:

- No HTTP navigation failures.
- No horizontal overflow at desktop or mobile sizes.
- No visible admin controls on the requested pages.
- No visible bot controls.
- No visible secret-pattern matches.
- No production deployment or production URL use.
- No sign-in, wallet connection, funding action, trade action, admin action, or bot action.

## Not Run

- `npm run test:ci` was not run in this docs-only recovery pass.
- `npx tsc --noEmit --pretty false --incremental false` was not run in this docs-only recovery pass.
- `npx prisma generate --schema=prisma/schema.prisma` was not run in this docs-only recovery pass.
- `npx prisma validate --schema=prisma/schema.prisma` was not run in this docs-only recovery pass.
- Full Playwright suite was not run.
- Authenticated routes were not run.
- Admin routes were not run.
- Wallet, portfolio, private-pool, market-detail, event-detail, order-ticket, deposit, withdrawal, and bot routes were not run.
- Screenshots were not captured.

Reason: this recovery pass changed docs only. The user explicitly made full npm validation optional if no code changed, and forbidden areas remained out of scope.

## Blocked

- Live PR list via GitHub CLI was blocked because `gh` was not available in this shell.
- Default Playwright Chromium was blocked because the local browser binary was not installed. Installed Chrome was available and used successfully.
- Port 3000 was not used because a local node process was listening but `http://127.0.0.1:3000` timed out.

## Manually Required

- Human cleanup or reconciliation of stale PRs #177, #192, #198, #205, #206, #207, and #210.
- Human review of PR #25.
- Admin/auth readiness validation.
- Wallet/funding/custody readiness validation.
- Trading, ledger, matching, settlement, and reconciliation validation.
- Bot dry-run/live trading readiness validation.
- OAuth, production environment, deployment, and public beta go/no-go decisions.
- Full CI/test validation before any code change or release promotion.

## Evidence Boundary

This evidence supports only a limited local anonymous public-route smoke claim for the requested five routes. It does not approve:

- public beta
- production deployment
- real deposits or withdrawals
- wallet custody
- trading, matching, settlement, or ledger readiness
- admin auth readiness
- bot readiness
- package/workflow changes
- production operations
