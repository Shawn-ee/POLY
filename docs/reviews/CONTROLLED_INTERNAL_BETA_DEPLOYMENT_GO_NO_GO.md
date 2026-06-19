# Controlled Internal Beta Deployment Go/No-Go

Date: 2026-06-19

## Classification

**Ready to deploy with funding disabled.**

**Not ready to enable funding until server smoke passes.**

**Not ready for public beta.**

**Not ready for production real-money launch.**

## Go For Server Deployment

The owner may deploy current `dev` to the owner-controlled server at `https://holiwyn.online` with initial env:

```text
INTERNAL_FUNDING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
```

Live bots must remain disabled.

## No-Go For Funding Enablement Until Smoke Passes

Do not enable Stage 1 funding until all are true:

- app builds on server.
- service starts on port 3001.
- public URL works.
- `/api/health` works.
- anonymous funding APIs are blocked.
- admin APIs are blocked for normal users.
- Google login works or failure is clearly understood.
- owner has set exact allowlist privately.
- no private-key material appears in UI, API response, or logs.

## No-Go For Public Beta

Public beta remains blocked because:

- funding is allowlisted internal-only.
- withdrawal payout is manual.
- real-chain deposit/withdrawal drills have not been recorded on the owner server.
- production launch decision is not approved.

## No-Go For Production Real-Money Launch

Production real-money launch remains blocked because:

- no public funding approval.
- no anonymous funding approval.
- no automatic withdrawal broadcast approval.
- no live bot approval.
- no large-cohort custody/ops review.
- no final public compliance/legal/business decision.

## Next Action

Deploy current `dev` to the owner server in Stage 0:

```text
funding disabled / kill-switched
```

Then run the post-deploy smoke checklist in `docs/reviews/CONTROLLED_INTERNAL_BETA_SERVER_DEPLOYMENT_COMMANDS.md`.
