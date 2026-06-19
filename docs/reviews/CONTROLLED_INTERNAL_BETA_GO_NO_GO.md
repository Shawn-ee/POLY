# Controlled Internal Beta Go/No-Go

Date: 2026-06-19

## Decision

**Ready with Warnings**

The owner can deploy current `dev` to the owner-controlled server for Controlled Internal Funding Beta setup.

Funding must start disabled or kill-switched. Do not open funding to testers until server smoke checks pass.

## Go For Server Deployment

Go:

- deploy current `dev`.
- configure private env values.
- run build/validation on server.
- run post-deploy smoke.
- keep funding kill switch on initially.
- keep auto-credit off initially.
- keep live bots disabled.

## Conditional Go For Controlled Funding Drill

Go only after:

- server health passes.
- anonymous funding/admin APIs are blocked.
- allowlist blocks non-allowlisted users.
- kill switch blocks allowlisted users.
- allowlisted user can get public deposit address after kill switch off.
- no private wallet material appears in API/UI/logs.
- owner intentionally enables auto-credit.

## No-Go

No-go if:

- env values are missing or uncertain.
- private key material appears anywhere outside server-side encrypted storage.
- funding kill switch does not block funding paths.
- allowlist does not block public/non-allowlisted users.
- duplicate deposit credit protection is uncertain.
- withdrawal hold/release/complete is not working.
- admin manual payout review is not working.
- bot live trading is enabled.
- automatic withdrawal broadcast is requested.
- tests or build fail on the deploy commit.
