# Controlled Internal Beta Rollback Plan

Date: 2026-06-19

## Fastest Funding Stop

Set:

- `FUNDING_KILL_SWITCH=true`
- `ALLOW_AUTO_DEPOSIT_CREDIT=false`

Restart or reload the app service. Then verify:

- deposit address access is blocked.
- withdrawal request creation is blocked.
- deposit monitor auto-credit is blocked.

## Full App Rollback

1. Put funding kill switch on.
2. Stop app service.
3. Checkout last known good commit.
4. Install dependencies if commit changed package lock state.
5. Run Prisma generate/validate.
6. Run tests if practical.
7. Build app.
8. Start app with funding disabled.
9. Verify `/api/health`.
10. Verify anonymous funding APIs remain blocked.

## Database Safety

Do not delete deposit, ledger, balance, withdrawal, or audit rows as a quick fix.

If correction is required:

- identify affected rows.
- keep tx hash/log index/idempotency key evidence.
- apply only reviewed ledger-safe adjustments.
- document correction.

## Deposit Incident

If duplicate credit is suspected:

1. Kill switch on.
2. Auto-credit off.
3. Stop deposit monitor.
4. Capture affected deposit IDs and ledger IDs.
5. Reconcile against chain transaction hash and log index.
6. Do not run monitor again until reviewed.

## Withdrawal Incident

If withdrawal flow is unsafe:

1. Do not manually send payout.
2. Reject request if safe.
3. Verify hold release.
4. Escalate if payout was already sent.

## Bot Incident

If a bot service is unexpectedly running:

1. Stop bot service.
2. Set bot kill switch.
3. Confirm no new orders are placed.
4. Review bot logs without printing credentials.

## Secret Incident

If a secret or key is exposed:

1. Stop funding.
2. Stop auto-credit.
3. Preserve local evidence without reposting secret values.
4. Rotate affected secrets.
5. Treat affected wallets as compromised until reviewed.
