# Funding Beta Continuation Prompt

Timestamp: 2026-06-19
Current branch: `agent/beta-bot-funding-runtime-safety`
Completed phases:

- Phase 1: controlled internal funding beta architecture, merged through PR #215.
- Phase 2: funding schema and ledger readiness review, merged through PR #216.
- Phase 2B / 2C: env-backed internal funding allowlist and kill-switch guards merged through PR #217.
- Phase 3: focused test coverage for existing self-managed Polygon USDC deposit wallet generation merged through PR #218.
- Phase 3B: deposit wallet security evidence merged through PR #219.
- Phase 4: deposit address API/UI evidence opened as PR #220 and left open for human review because it exposes a guarded funding UI entry point.
- Phase 5: deposit monitor and auto-credit hardening evidence merged through PR #221.
- Phase 6: withdrawal request hold hardening evidence merged through PR #222.
- Phase 7: admin manual withdrawal review evidence merged through PR #223.
- Phase 8: bot/funding runtime safety evidence merged through PR #224.
- Phase 9: internal funding beta evidence and go/no-go docs added in the current PR.

## Current Status

The current branch adds internal funding beta evidence, go/no-go, runbook, rollback, and env checklist docs without changing runtime behavior.

Covered behavior:

- consolidated evidence from PRs #217 through #224.
- current funding-specific classification is Limited Internal Funding Beta Only.
- open blockers are PR #220, private server env validation, controlled deposit drill, controlled withdrawal drill, internal route smoke, and final readiness docs.
- no production deployment, public funding, automatic withdrawal broadcast, or live bots are approved.

## Next Step

Next step is **Phase 10: internal UX / route smoke evidence**.

Do not deploy production, start bot services, enable public funding, remove the allowlist, or enable automatic withdrawal broadcast.

Open items before final deployment readiness:

1. PR #220 remains open for human/specialist review because it exposes the guarded funding UI entry point.
2. Phase 10 internal route smoke evidence is still needed.
3. Phase 11 server deployment readiness docs are still needed.
4. Phase 12 final readiness report is still needed.
5. Controlled real-chain deposit and withdrawal drills are still manual/not run.

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
