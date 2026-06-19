# Controlled Internal Beta Service Runbook

Date: 2026-06-19

## Scope

This runbook describes owner-server service operation for Controlled Internal Funding Beta. It does not deploy production automatically.

## Install And Build

```bash
git fetch origin
git checkout dev
git pull origin dev
npm ci
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npm run build
```

## Start App

Use the owner-approved process manager. Examples:

```bash
npm run start
```

or a reviewed systemd/pm2 wrapper.

Do not start deposit monitor, bot services, or background loops until the app smoke checks pass.

## Health Checks

```bash
curl -sS https://<host>/api/health
```

Manual page checks:

- `/`
- `/login`
- `/sports`
- `/events`
- `/markets`
- `/portfolio`
- `/wallet`
- `/admin`

## Funding Gates Check

With funding kill switch on:

- anonymous `/api/deposits/address` should be unauthorized.
- anonymous `/api/withdrawals` should be unauthorized.
- non-allowlisted tester should be blocked.
- allowlisted tester should see kill-switch blocked behavior.

With kill switch off during controlled test window:

- allowlisted tester can get a public deposit address.
- response must not contain raw private key.
- response must not contain encrypted private key.
- response must not contain seed, mnemonic, or env values.

## Deposit Monitor

Before running:

1. Confirm `ALLOW_AUTO_DEPOSIT_CREDIT=true` is intentional.
2. Confirm `FUNDING_KILL_SWITCH=false`.
3. Confirm supported chain and token are correct.
4. Confirm only allowlisted testers are using deposit addresses.
5. Confirm rollback plan is ready.

Run only the reviewed monitor command:

```bash
npm run deposits:monitor
```

Stop immediately if duplicate credit, unexpected status, RPC issues, or secret leakage is suspected.

## Withdrawal Operations

Withdrawal v1 is manual payout only:

1. User submits withdrawal request.
2. App places funds on hold.
3. Admin reviews request.
4. Admin manually sends payout outside the app.
5. Admin records payout tx hash.
6. App marks request completed.

No automatic withdrawal broadcaster should run.

## Bot Services

Do not start live bot services during controlled internal funding beta.

If any bot dry-run service is used, keep it separated from funding operations and keep live flags disabled.

## Logs

Safe to inspect:

- app startup logs.
- health check logs.
- generic funding guard errors.
- deposit monitor summary logs without secrets.

Do not print or paste:

- env values.
- private keys.
- encrypted private keys.
- wallet encryption key.
- OAuth secrets.
- database URL.
