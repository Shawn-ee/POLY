# Controlled Internal Beta Operator Runbook

Date: 2026-06-19

## Operator Rule

Start safe, then open one gate at a time.

## Boot Order

1. Deploy current `dev`.
2. Configure env privately.
3. Start with funding disabled or kill-switched.
4. Run health checks.
5. Run public route smoke.
6. Run anonymous funding/admin API block checks.
7. Verify admin access.
8. Verify live bot flags are disabled.
9. Add one allowlisted internal tester.
10. Test kill switch blocking.
11. Open kill switch for deposit address smoke only.
12. Enable auto-credit only for the controlled deposit drill.

## Funding Drill Order

1. Generate/view deposit address.
2. Confirm address is public address only.
3. Send tiny supported-token deposit.
4. Wait confirmations.
5. Run/wait deposit monitor.
6. Confirm ledger credit once.
7. Run monitor again.
8. Confirm no duplicate credit.

## Withdrawal Drill Order

1. Submit tiny withdrawal request.
2. Confirm hold.
3. Reject one request and verify release.
4. Submit second request.
5. Admin manually sends payout externally.
6. Admin records payout tx hash.
7. Confirm completed status.
8. Confirm no automatic app broadcast.

## Emergency Procedure

1. Set `FUNDING_KILL_SWITCH=true`.
2. Set `ALLOW_AUTO_DEPOSIT_CREDIT=false`.
3. Restart/reload app service.
4. Stop any deposit monitor.
5. Confirm funding routes are blocked.
6. Preserve logs without printing secrets.

## Never Do

- Do not remove allowlist.
- Do not enable anonymous funding.
- Do not enable public funding.
- Do not enable automatic withdrawal broadcast.
- Do not start live bots.
- Do not print secrets.
- Do not paste env values into docs or chat.
