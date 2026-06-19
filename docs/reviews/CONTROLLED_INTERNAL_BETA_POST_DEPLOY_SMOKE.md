# Controlled Internal Beta Post-Deploy Smoke

Date: 2026-06-19

## Scope

Run this after the owner deploys to the server. Do not use public users, production promotion, or live bots.

## Public Route Smoke

Verify:

- `/`
- `/login`
- `/sports`
- `/sports/soccer`
- `/sports/soccer/world-cup`
- `/events`
- `/markets`
- `/portfolio`
- `/wallet`

Expected:

- pages load.
- no visible secret values.
- no private-key material.
- no public funding claim.
- beta/internal funding copy is clear.

## Anonymous API Smoke

Expected unauthorized or forbidden:

- `/api/deposits/address`
- `/api/deposits`
- `/api/withdrawals`
- `/api/admin/deposits`
- `/api/admin/withdrawals`

## Allowlist Smoke

With a non-allowlisted account:

- funding address access is blocked.
- withdrawal request is blocked.

With an allowlisted account and kill switch on:

- funding behavior is blocked by kill switch.

With an allowlisted account and kill switch off:

- deposit address response returns only public address, chain, token, status, and warnings.
- response does not include raw private key.
- response does not include encrypted private key.
- response does not include seed, mnemonic, or env values.

## Deposit Drill

Use a tiny supported-token test deposit:

1. send supported token to assigned deposit address.
2. wait confirmations.
3. run/wait monitor.
4. confirm deposit status credited.
5. confirm ledger credit.
6. run monitor again.
7. confirm no duplicate credit.

## Withdrawal Drill

1. submit small withdrawal request.
2. confirm hold.
3. reject one request and verify release.
4. create another request.
5. admin manually sends payout outside app.
6. admin records payout tx hash.
7. confirm completion.
8. confirm no automatic app broadcast.

## Bot Smoke

Verify live bots are not running:

- live bot flags disabled.
- bot kill switch on.
- no bot services started for funding beta.

## Pass Criteria

Pass only if:

- all anonymous funding/admin APIs are blocked.
- allowlist works.
- kill switch works.
- private-key material is not exposed.
- deposit credits once.
- withdrawal hold/release/complete works.
- admin manual review works.
- live bots are disabled.
