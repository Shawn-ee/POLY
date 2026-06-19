# Controlled Internal Beta Server Deployment Commands

Date: 2026-06-19

## Purpose

These are the exact owner-run commands for deploying current `dev` to the owner-controlled server for Controlled Internal Funding Beta setup.

This document does not deploy production, does not include secret values, and does not approve public beta.

Known public URL:

- `https://holiwyn.online`

Known app port:

- `3001`

Initial deployment mode:

- funding disabled.
- funding kill switch on.
- auto-credit off.
- live bots disabled.

## A. Local Windows Verification

Run from the main app repo:

```powershell
cd C:\Users\hecto\Desktop\projects\PolyProj\poly
$env:PATH = 'C:\Program Files\GitHub CLI;' + $env:PATH
git status --short --branch
git fetch origin
git checkout dev
git pull origin dev
git log -1 --oneline
gh -R Shawn-ee/POLY pr list --base dev --state open --limit 20
```

Expected current deploy commit:

```text
0d7275a docs(beta): add final controlled internal beta readiness report (#228)
```

If the local branch is behind `origin/dev`, pull first. If local work is dirty, stop and resolve it before deploying.

No push is required unless the owner has local commits not already on GitHub. Do not push secrets or `.env` files.

## B. Server Deploy Commands

Run on the Ubuntu/Linux hosting environment.

Set these local shell variables for the session. Adjust `POLY_DIR` and `POLY_SERVICE` to match the actual server checkout and service name:

```bash
export POLY_DIR="$HOME/poly"
export POLY_SERVICE="poly"
export POLY_PORT="3001"
export POLY_URL="https://holiwyn.online"
```

Go to the project:

```bash
cd "$POLY_DIR"
```

Fetch and deploy current `dev`:

```bash
git status --short --branch
git fetch origin
git checkout dev
git pull origin dev
git log -1 --oneline
```

Install dependencies and validate:

```bash
npm ci
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npm run build
```

Migration note:

No new schema or migration was added by the final deployment-command docs. If the server database is already current for this repo, do not run a migration just because of this docs PR.

If the server has not yet applied existing repo migrations, run only after confirming there is a database backup and the owner accepts migration risk:

```bash
npx prisma migrate deploy --schema=prisma/schema.prisma
```

Start/restart the app on port 3001.

If using systemd:

```bash
sudo systemctl daemon-reload
sudo systemctl restart "$POLY_SERVICE"
sudo systemctl status "$POLY_SERVICE" --no-pager
journalctl -u "$POLY_SERVICE" -n 100 --no-pager
```

The service should set `PORT=3001` or run:

```bash
PORT=3001 npm run start
```

If using pm2:

```bash
pm2 restart "$POLY_SERVICE" --update-env
pm2 status "$POLY_SERVICE"
pm2 logs "$POLY_SERVICE" --lines 100
```

If starting manually for a temporary smoke only:

```bash
PORT=3001 npm run start
```

Check local service and public URL:

```bash
curl -i http://127.0.0.1:3001/api/health
curl -I https://holiwyn.online
curl -I https://holiwyn.online/login
curl -I https://holiwyn.online/wallet
```

## C. Required Env Variable Names

Set env values privately on the server. Do not paste values into docs, PRs, logs, or chat.

### App/Auth

- `NEXTAUTH_URL`
- `APP_URL`
- `DATABASE_URL`
- `NEXTAUTH_SECRET` or `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ADMIN_EMAILS`
- `APP_ENV`

For `https://holiwyn.online`, Google OAuth callback should be configured in Google Cloud as:

```text
https://holiwyn.online/api/auth/google/callback
```

### Controlled Funding Initial State

Use these values for first boot:

```text
INTERNAL_FUNDING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
```

Also configure:

- `INTERNAL_FUNDING_ALLOWLIST_EMAILS`

### Wallet/RPC/Token Env Names

The owner prompt may describe these generically as `WALLET_ENCRYPTION_KEY` and `EVM_RPC_URL`, but the current POLY app code expects these concrete env names:

- `DEPOSIT_WALLET_ENCRYPTION_KEY`
- `POLYGON_RPC_URL`
- `POLYGON_USDC_ADDRESS`
- `DEPOSIT_CONFIRMATIONS`
- `DEPOSIT_MIN_USD`
- `DEPOSIT_MONITOR_POLL_INTERVAL_MS`

Supported chain/token in current implementation:

- chain: Polygon
- token: USDC

### Withdrawal Limits

- `WITHDRAWAL_MIN_USDC`
- `WITHDRAWAL_USER_DAILY_LIMIT_USDC`
- `WITHDRAWAL_GLOBAL_DAILY_LIMIT_USDC`
- `WITHDRAWAL_MAX_PENDING_PER_USER`
- `TREASURY_WALLET_ADDRESS`

Do not configure or use automatic withdrawal signing for v1. Automated withdrawal broadcast is not approved.

### Bot Live Flags Disabled

Keep live bots disabled:

```text
POLY_BOTS_ENABLED=false
POLY_BOTS_LIVE_TRADING=false
POLY_BOTS_GLOBAL_KILL_SWITCH=true
POLY_BOTS_MODE=dryRun
LIVE_SYSTEM_LIQUIDITY_ENABLED=false
SYSTEM_LIQUIDITY_DRY_RUN=true
```

## D. Post-Deploy Smoke

Run these URL checks:

```bash
curl -I https://holiwyn.online/
curl -I https://holiwyn.online/login
curl -I https://holiwyn.online/sports
curl -I https://holiwyn.online/events
curl -I https://holiwyn.online/markets
curl -I https://holiwyn.online/portfolio
curl -I https://holiwyn.online/wallet
```

Check anonymous funding and admin APIs. Expected result is `401` or `403`:

```bash
curl -i https://holiwyn.online/api/deposits/address
curl -i https://holiwyn.online/api/deposits
curl -i https://holiwyn.online/api/withdrawals
curl -i https://holiwyn.online/api/admin/deposits
curl -i https://holiwyn.online/api/admin/withdrawals
```

Manual browser smoke:

1. Open `https://holiwyn.online/`.
2. Open `https://holiwyn.online/login`.
3. Open `https://holiwyn.online/sports`.
4. Open `https://holiwyn.online/events`.
5. Open `https://holiwyn.online/markets`.
6. Open `https://holiwyn.online/portfolio`.
7. Open `https://holiwyn.online/wallet`.
8. Confirm deposit UI is blocked or unavailable while funding is disabled/kill-switched.
9. Confirm withdrawal request is blocked while funding is disabled/kill-switched.
10. Confirm admin pages/API are blocked for a normal user.
11. Confirm admin access only with an approved admin account.

## E. Funding Staged Enablement Plan

### Stage 0: Deployed But Funding Disabled

Use this for initial deployment:

```text
INTERNAL_FUNDING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
```

Expected:

- public pages load.
- anonymous funding APIs are blocked.
- allowlisted deposit address access is not active.
- auto-credit is off.

### Stage 1: Allowlisted Internal Users, No Auto-Credit

After Stage 0 smoke passes:

```text
INTERNAL_FUNDING_BETA_ENABLED=true
FUNDING_KILL_SWITCH=false
ALLOW_AUTO_DEPOSIT_CREDIT=false
```

Expected:

- non-allowlisted users remain blocked.
- allowlisted users can view assigned public deposit address.
- deposit monitor auto-credit remains disabled.
- no automatic withdrawal broadcast exists.

### Stage 2: Allowlisted Internal Users, Auto-Credit For Tiny Test Deposit

Only when owner intentionally starts the first deposit drill:

```text
INTERNAL_FUNDING_BETA_ENABLED=true
FUNDING_KILL_SWITCH=false
ALLOW_AUTO_DEPOSIT_CREDIT=true
```

Run or start the reviewed monitor only after checking env and rollback:

```bash
npm run deposits:monitor
```

Expected:

- supported Polygon USDC deposit is detected after confirmations.
- ledger credit is applied once.
- repeated scan does not double-credit.
- no private key material appears in logs, UI, or API responses.

### Stage 3: Withdrawal Request Drill

Keep automated withdrawal broadcast disabled.

Flow:

1. allowlisted user submits withdrawal request.
2. request places funds on hold.
3. admin manually reviews request.
4. admin manually sends payout outside app from treasury/hot wallet.
5. admin records payout tx hash.
6. app marks withdrawal completed.

Do not add or run any automatic withdrawal broadcaster.

## F. Emergency Rollback

Fast funding stop:

```bash
# Set in the server env manager, not in git:
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
POLY_BOTS_ENABLED=false
POLY_BOTS_LIVE_TRADING=false
POLY_BOTS_GLOBAL_KILL_SWITCH=true
LIVE_SYSTEM_LIQUIDITY_ENABLED=false
SYSTEM_LIQUIDITY_DRY_RUN=true
```

Restart service:

```bash
sudo systemctl restart "$POLY_SERVICE"
sudo systemctl status "$POLY_SERVICE" --no-pager
```

If using pm2:

```bash
pm2 restart "$POLY_SERVICE" --update-env
pm2 status "$POLY_SERVICE"
```

Rollback code if needed:

```bash
cd "$POLY_DIR"
git fetch origin
git log --oneline --decorate -n 20
git checkout <last-known-good-commit>
npm ci
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npm run build
sudo systemctl restart "$POLY_SERVICE"
```

If the reverse proxy points to port 3001, verify it still routes to the app:

```bash
curl -i http://127.0.0.1:3001/api/health
curl -I https://holiwyn.online
```

Do not delete ledger, deposit, withdrawal, or balance rows as a rollback shortcut.
