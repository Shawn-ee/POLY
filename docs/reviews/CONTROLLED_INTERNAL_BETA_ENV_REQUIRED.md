# Controlled Internal Beta Required Env

Date: 2026-06-19

This file lists env var names and expected intent only. Do not store values here.

## App And Auth

- `DATABASE_URL`: server database connection string.
- `NEXTAUTH_SECRET` or `SESSION_SECRET`: session signing secret.
- `NEXTAUTH_URL`: deployed app URL.
- `APP_URL`: deployed app URL if used separately.
- `APP_ENV`: `staging` or `production` depending on owner server lane.
- `ADMIN_EMAILS`: comma-separated admin emails.
- Google OAuth client env names used by the app.

## Controlled Funding Gates

- `INTERNAL_FUNDING_BETA_ENABLED`: must be true only for the controlled internal beta lane.
- `INTERNAL_FUNDING_ALLOWLIST_EMAILS`: comma-separated internal tester emails.
- `FUNDING_KILL_SWITCH`: emergency global funding stop.
- `ALLOW_AUTO_DEPOSIT_CREDIT`: explicit auto-credit enablement.

Safe initial values:

- `INTERNAL_FUNDING_BETA_ENABLED=false`
- `FUNDING_KILL_SWITCH=true`
- `ALLOW_AUTO_DEPOSIT_CREDIT=false`

## Deposit Wallet And Polygon USDC

- `DEPOSIT_WALLET_ENCRYPTION_KEY`: 64 hex characters, private, never printed.
- `POLYGON_RPC_URL`: private RPC URL.
- `POLYGON_USDC_ADDRESS`: supported USDC token address.
- `DEPOSIT_CONFIRMATIONS`: confirmation count before credit.
- `DEPOSIT_MIN_USD`: minimum supported deposit.
- `DEPOSIT_MONITOR_POLL_INTERVAL_MS`: monitor loop interval.

## Withdrawals

- `WITHDRAWAL_MIN_USDC`
- `WITHDRAWAL_USER_DAILY_LIMIT_USDC`
- `WITHDRAWAL_GLOBAL_DAILY_LIMIT_USDC`
- `WITHDRAWAL_MAX_PENDING_PER_USER`
- `TREASURY_WALLET_ADDRESS`

Do not configure any automatic withdrawal signing key for v1. Automatic withdrawal broadcast is not approved.

## Bot Safety

Keep live bots disabled:

- `POLY_BOTS_ENABLED=false`
- `POLY_BOTS_LIVE_TRADING=false`
- `POLY_BOTS_GLOBAL_KILL_SWITCH=true`
- `POLY_BOTS_MODE=dryRun`
- `LIVE_SYSTEM_LIQUIDITY_ENABLED=false`
- `SYSTEM_LIQUIDITY_DRY_RUN=true`

## Secret Handling

- Never commit env files.
- Never print env values in logs or chat.
- Never paste private keys or encryption keys into docs.
- Rotate secrets if exposure is suspected.
