# Internal Funding Beta Rollback Plan

Date: 2026-06-19

## Immediate Rollback

If anything unsafe happens, first disable funding behavior:

1. Set `FUNDING_KILL_SWITCH=true`.
2. Set `ALLOW_AUTO_DEPOSIT_CREDIT=false`.
3. Restart or reload the app service.
4. Confirm allowlisted deposit address access is blocked by kill switch.
5. Confirm withdrawal request creation is blocked by kill switch.
6. Confirm deposit monitor cannot auto-credit.

Do not delete database records as an emergency response.

## Bot Rollback

Keep or set:

- `POLY_BOTS_ENABLED=false`
- `POLY_BOTS_LIVE_TRADING=false`
- `POLY_BOTS_GLOBAL_KILL_SWITCH=true`
- `LIVE_SYSTEM_LIQUIDITY_ENABLED=false`
- `SYSTEM_LIQUIDITY_DRY_RUN=true`

Stop any bot services if they are running. Live bots are not part of controlled internal funding beta.

## Code Rollback

If the app commit must be rolled back:

1. Identify last known good `dev` commit.
2. Stop app service.
3. Checkout or deploy the previous reviewed commit.
4. Run Prisma generate/validate if code changed.
5. Start app service with funding kill switch on.
6. Verify public pages load.
7. Verify funding routes are blocked.

Do not roll back by deleting ledger rows.

## Data Reconciliation

If duplicate or incorrect deposit credit is suspected:

1. Turn kill switch on.
2. Disable auto-credit.
3. Export affected deposit IDs, tx hashes, log indexes, user IDs, and ledger entry IDs for review.
4. Do not print private keys or env values.
5. Reconcile ledger entries with tx/log-index idempotency keys.
6. Apply any correction only through a reviewed ledger-safe adjustment path.

## Withdrawal Incident

If a withdrawal request is wrong or suspicious:

1. Do not send manual payout.
2. Reject the request if safe and reviewed.
3. Verify held funds release.
4. If payout was already manually sent, record the tx hash and escalate for owner review.

## Secret Incident

If any private key, encrypted private key, seed, mnemonic, token, or env value is exposed:

1. Stop.
2. Disable funding.
3. Disable auto-credit.
4. Preserve logs for review without reposting secrets.
5. Rotate affected secrets/keys.
6. Treat affected deposit wallets as compromised until reviewed.
