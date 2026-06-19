# Internal Funding Beta Env Checklist

Date: 2026-06-19

This checklist lists env var names only. Do not write values into docs, PRs, logs, or chat.

## Funding Controls

- `INTERNAL_FUNDING_BETA_ENABLED`
- `INTERNAL_FUNDING_ALLOWLIST_EMAILS`
- `FUNDING_KILL_SWITCH`
- `ALLOW_AUTO_DEPOSIT_CREDIT`

Recommended initial server state:

- `INTERNAL_FUNDING_BETA_ENABLED=false`
- `FUNDING_KILL_SWITCH=true`
- `ALLOW_AUTO_DEPOSIT_CREDIT=false`

## Deposit Wallet And Chain

- `DEPOSIT_WALLET_ENCRYPTION_KEY`
- `POLYGON_RPC_URL`
- `POLYGON_USDC_ADDRESS`
- `DEPOSIT_CONFIRMATIONS`
- `DEPOSIT_MIN_USD`
- `DEPOSIT_MONITOR_POLL_INTERVAL_MS`

## Withdrawal Limits

- `WITHDRAWAL_MIN_USDC`
- `WITHDRAWAL_USER_DAILY_LIMIT_USDC`
- `WITHDRAWAL_GLOBAL_DAILY_LIMIT_USDC`
- `WITHDRAWAL_MAX_PENDING_PER_USER`
- `TREASURY_WALLET_ADDRESS`

Do not configure treasury private keys for automatic withdrawal broadcast. Automated withdrawal broadcast is not approved.

## App/Auth/Database

- `DATABASE_URL`
- `NEXTAUTH_SECRET` or `SESSION_SECRET`
- `NEXTAUTH_URL`
- `APP_URL`
- `ADMIN_EMAILS`
- Google OAuth client env names used by the app.

## Bot Safety

Keep live bot settings disabled for funding beta:

- `POLY_BOTS_ENABLED`
- `POLY_BOTS_LIVE_TRADING`
- `POLY_BOTS_GLOBAL_KILL_SWITCH`
- `POLY_BOTS_MODE`
- `LIVE_SYSTEM_LIQUIDITY_ENABLED`
- `SYSTEM_LIQUIDITY_DRY_RUN`

Recommended state:

- `POLY_BOTS_ENABLED=false`
- `POLY_BOTS_LIVE_TRADING=false`
- `POLY_BOTS_GLOBAL_KILL_SWITCH=true`
- `POLY_BOTS_MODE=dryRun`
- `LIVE_SYSTEM_LIQUIDITY_ENABLED=false`
- `SYSTEM_LIQUIDITY_DRY_RUN=true`

## Validation Commands

Run on the deploy commit:

```powershell
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

Run funding-specific targeted tests if available:

```powershell
npx jest --runInBand src/__tests__/funding-beta.guard.test.ts src/__tests__/funding-beta.routes.test.ts src/__tests__/funding-beta.deposit-monitor.test.ts src/__tests__/funding-beta.deposit-wallet-generation.test.ts src/server/services/__tests__/withdrawals.phase8.test.ts src/__tests__/admin.withdrawals.review.route.test.ts src/__tests__/admin.withdrawals.complete.route.test.ts
```
