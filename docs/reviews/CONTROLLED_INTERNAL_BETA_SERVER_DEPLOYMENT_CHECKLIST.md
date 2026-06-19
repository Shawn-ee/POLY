# Controlled Internal Beta Server Deployment Checklist

Date: 2026-06-19

## Purpose

This checklist prepares the owner to deploy POLY for Controlled Internal Funding Beta on the owner server. It does not deploy production and does not include secret values.

## Current Readiness

Status: **not deploy-ready yet**.

Reason:

- PR #220 remains open for the guarded funding UI entry point.
- private server env values have not been validated.
- controlled real-chain deposit and withdrawal drills have not been run.
- final readiness report is not complete.

## Pre-Deploy Requirements

1. Confirm target branch is `dev`.
2. Confirm target commit is reviewed.
3. Confirm PR #220 is resolved if testers need wallet/deposit UI access.
4. Confirm no unreviewed funding, ledger, admin, bot, workflow, package, Prisma, or deployment PR is being mixed into the deploy commit.
5. Confirm `.env` values are configured privately on the server and never printed.
6. Confirm owner-approved internal tester allowlist is small and exact.
7. Confirm funding starts disabled or kill-switched.
8. Confirm live bots remain disabled.
9. Confirm automatic withdrawal broadcast remains absent/disabled.
10. Confirm rollback plan is available before enabling funding.

## Server Build Checklist

Run from the main app repo on the server:

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

Do not run `prisma migrate deploy` unless the owner has reviewed migration state and database backup/rollback.

## Initial Runtime Flags

Start with:

- `INTERNAL_FUNDING_BETA_ENABLED=false`
- `FUNDING_KILL_SWITCH=true`
- `ALLOW_AUTO_DEPOSIT_CREDIT=false`
- `POLY_BOTS_ENABLED=false`
- `POLY_BOTS_LIVE_TRADING=false`
- `POLY_BOTS_GLOBAL_KILL_SWITCH=true`
- `LIVE_SYSTEM_LIQUIDITY_ENABLED=false`
- `SYSTEM_LIQUIDITY_DRY_RUN=true`

Then enable funding in stages only after smoke checks pass.

## Deployment Gate

Do not allow internal funding testers onto the server until:

- app starts.
- `/api/health` passes.
- anonymous funding APIs return 401 or 403.
- normal non-allowlisted user cannot use funding.
- allowlisted tester can sign in.
- allowlisted tester can get only their public deposit address.
- no private or encrypted private key appears in UI, API response, or logs.
- kill switch blocks deposit address access.
- kill switch blocks withdrawal request creation.
- kill switch blocks deposit monitor auto-credit.
- admin can access withdrawal review.
- normal user cannot access admin APIs.
- live bots are still disabled.

## Final Owner Action

The final deployment action is manual. Codex must not deploy production or start live services automatically.
