# Funding Beta Continuation Prompt

Timestamp: 2026-06-19
Current branch: `agent/beta-deposit-address-api-ui`
Completed phases:

- Phase 1: controlled internal funding beta architecture, merged through PR #215.
- Phase 2: funding schema and ledger readiness review, merged through PR #216.
- Phase 2B / 2C: env-backed internal funding allowlist and kill-switch guards merged through PR #217.
- Phase 3: focused test coverage for existing self-managed Polygon USDC deposit wallet generation merged through PR #218.
- Phase 3B: deposit wallet security evidence merged through PR #219.
- Phase 4: deposit address API/UI evidence added in the current PR, resolving PR #220.
- Phase 5: deposit monitor and auto-credit hardening evidence merged through PR #221.
- Phase 6: withdrawal request hold hardening evidence merged through PR #222.
- Phase 7: admin manual withdrawal review evidence merged through PR #223.
- Phase 8: bot/funding runtime safety evidence merged through PR #224.
- Phase 9: internal funding beta evidence and go/no-go docs merged through PR #225.
- Phase 10: internal beta route smoke evidence merged through PR #226.
- Phase 11: server deployment readiness docs merged through PR #227.
- Phase 12: final controlled internal beta readiness report added in the current PR.

## Current Status

The current branch adds the final controlled internal beta readiness report.

Covered behavior:

- current classification is Ready with Warnings.
- owner can deploy current `dev` to the owner server for controlled internal beta setup.
- funding must start disabled or kill-switched.
- private server smoke is still required before enabling funding.
- no production deployment was performed by Codex.

## Next Step

Next step is **owner server deployment and private smoke testing**.

Do not deploy production, start bot services, enable public funding, remove the allowlist, or enable automatic withdrawal broadcast.

Open items before final deployment readiness:

1. Owner server deployment and private env validation have not been performed.
2. Controlled real-chain deposit and withdrawal drills are still manual/not run.
3. Full browser smoke timed out and should be rerun on server.
4. Env-backed allowlist may need schema-backed funding profile before a larger cohort.
5. Full repo lint still has pre-existing unrelated failures.

## Validation To Re-Run

```powershell
git diff --check
git diff --cached --check
```

For code/test changes in later phases, also run:

```powershell
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

## Warnings

- Do not touch main.
- Do not deploy production.
- Do not print secrets.
- Do not commit `.env` files.
- Do not commit private keys.
- Do not expose raw or encrypted private keys in API responses.
- Do not enable public deposits.
- Do not enable public withdrawals.
- Do not enable automatic withdrawal broadcast.
- Do not enable live bots.
- Do not create checkpoint churn.
- Do not auto-merge high-risk funding behavior without human review.
