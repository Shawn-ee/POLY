# Controlled Internal Beta Blockers

Date: 2026-06-19

## Blocking Public Beta Or Production Launch

- Public beta is not approved.
- Production launch is not approved.
- Public funding is not approved.
- Anonymous funding is not approved.
- Automatic withdrawal broadcast is not approved.
- Live bots are not approved.

## Warnings Before Internal Funding Enablement

These do not block deploying the app to the owner server with funding kill-switched, but they block enabling funding broadly:

- private server env has not been validated.
- controlled real-chain deposit drill has not been run.
- controlled withdrawal drill has not been run.
- full browser smoke timed out locally and should be rerun on server.
- full repo lint has pre-existing unrelated failures.
- env-backed allowlist may need schema-backed funding profiles before larger cohort.

## Resolved Blockers

- PR #220 guarded funding UI entry point was merged.
- Funding allowlist and kill switch were merged.
- Deposit wallet no-leak evidence was merged.
- Deposit auto-credit idempotency evidence was merged.
- Withdrawal hold evidence was merged.
- Admin manual withdrawal review evidence was merged.
- Bot/funding runtime safety evidence was merged.
- Server deployment readiness docs were merged.
