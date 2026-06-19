# Controlled Internal Beta Final Readiness Report

Date: 2026-06-19

## Classification

**Ready with Warnings**

POLY is ready for the owner to deploy the current `dev` branch to an owner-controlled server for Controlled Internal Funding Beta setup and private smoke testing.

This does not mean public beta, production launch, unrestricted real-money access, anonymous funding, public funding, live bots, or automatic withdrawal broadcast.

## Current Dev Commit

`7ff4320 Merge pull request #220 from Shawn-ee/agent/beta-deposit-address-api-ui`

## What Is Ready

- Controlled internal funding architecture is documented.
- Funding allowlist exists.
- Funding kill switch exists.
- Auto-credit has an explicit enable flag.
- Deposit wallet generation has focused tests.
- Deposit wallet API no-leak tests exist.
- Wallet UI exposes the guarded internal beta deposit modal.
- Deposit monitor and auto-credit idempotency evidence exists.
- Withdrawal request hold/release/complete tests exist.
- Admin manual withdrawal review route tests exist.
- Bot/funding runtime separation is documented.
- Server deployment checklist exists.
- Required env checklist exists.
- Service runbook exists.
- Rollback plan exists.
- Post-deploy smoke checklist exists.
- Local route smoke evidence exists.
- Build passed during PR #220 review.
- GitHub CI Validate passed on merged funding PRs #217 through #227 and #220.

## What Is Allowed For Owner Server Deployment

Allowed:

- deploy current `dev` to the owner-controlled internal server.
- configure private server env values.
- keep funding kill switch on at first boot.
- verify public routes and auth.
- verify anonymous funding/admin API blocking.
- verify allowlist behavior.
- verify kill switch behavior.
- run a controlled allowlisted deposit-address smoke.
- run a small owner-controlled funding drill only after smoke passes.

Not allowed:

- public beta.
- public funding.
- anonymous funding.
- automatic withdrawal broadcast.
- live bots.
- production launch.
- removing allowlist.
- bypassing kill switch.
- printing secrets or env values.

## Validation Evidence

Recent local validation from PR #220 specialist review:

- `git diff --check`: passed.
- `git diff --cached --check`: passed.
- `npx jest --runInBand src/__tests__/funding-beta.routes.test.ts`: passed, 13 tests.
- `npx prisma generate --schema=prisma/schema.prisma`: passed.
- `npx prisma validate --schema=prisma/schema.prisma`: passed.
- `npx tsc --noEmit --pretty false --incremental false`: passed.
- `npm run test:ci`: passed, 39 tests.
- focused lint on changed wallet/test files: no errors, existing warnings only.
- `npm run build`: passed.
- GitHub CI Validate: passed.

Known validation warning:

- full `npm run lint` still fails on pre-existing repo-wide lint errors outside the final funding UI PR scope.

## Required Server Smoke Before Enabling Funding

1. Start server with:
   - `INTERNAL_FUNDING_BETA_ENABLED=false`
   - `FUNDING_KILL_SWITCH=true`
   - `ALLOW_AUTO_DEPOSIT_CREDIT=false`
2. Run `/api/health`.
3. Check public routes.
4. Confirm anonymous funding APIs return 401 or 403.
5. Enable internal funding beta while keeping kill switch on.
6. Confirm non-allowlisted user is blocked.
7. Confirm allowlisted user is blocked by kill switch.
8. Turn kill switch off only for controlled test window.
9. Confirm allowlisted user receives only public deposit address metadata.
10. Confirm no raw or encrypted private key appears in UI, API response, or logs.
11. Enable auto-credit only when the owner intentionally starts the deposit drill.

## Remaining Warnings

- Private server env values have not been configured or validated by Codex.
- No controlled real-chain deposit drill has been run in this session.
- No controlled withdrawal operator drill has been run in this session.
- Full browser smoke timed out locally before fallback HTTP smoke succeeded.
- Full repo lint has unrelated pre-existing failures.
- Env-backed allowlist may need schema-backed funding profiles before a larger internal cohort.
- Admin/manual payout operations still require careful owner/operator discipline.

## Human Decisions Required

- Exact internal tester allowlist.
- Exact supported chain/token/RPC env values.
- Exact deposit confirmation count and minimum deposit.
- Whether env-backed allowlist is acceptable for the first cohort.
- When to turn off kill switch for controlled test windows.
- When to enable `ALLOW_AUTO_DEPOSIT_CREDIT`.
- Manual payout process and treasury operational controls.
- Whether and when to run any bot dry-run service. Live bots remain not approved.

## Final Recommendation

Proceed to owner server deployment for Controlled Internal Funding Beta setup with funding initially kill-switched.

After server smoke passes, the owner may run a tiny controlled deposit and withdrawal drill with allowlisted internal users only.
