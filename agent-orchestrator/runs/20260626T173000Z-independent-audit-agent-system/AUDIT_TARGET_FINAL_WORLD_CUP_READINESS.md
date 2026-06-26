# Audit Target: Final World Cup Internal Beta Readiness Claim

## Purpose

Prepare the first Gate C final-goal audit target for the Independent Audit Agent.

This file is not an audit result. It defines what the Audit Agent must inspect before accepting or rejecting the latest final readiness claim.

## Claim To Audit

- Claimed status: Controlled internal World Cup beta ready with warnings.
- Claimed scorecard: 95/100.
- Main app PR: #264.
- Bot repo PR: #3.
- Public beta: not ready.
- Production live bots: not approved.
- Authenticated reference-liquidity dry-run: blocked by missing `POLY_SIM_SESSION_COOKIE`.

## Required Audit Gate

Gate C: final-goal audit.

## Required Evidence To Inspect

- `agent-orchestrator/runs/20260626T170000Z-final-world-cup-internal-beta-readiness/REPORT.md`
- `agent-orchestrator/scorecards/WORLD_CUP_TRADABLE_SCORECARD.md`
- `docs/reviews/WORLD_CUP_INTERNAL_BETA_GO_NO_GO.md`
- `docs/reviews/WORLD_CUP_INTERNAL_BETA_ENV_FLAGS_AND_ROLLBACK.md`
- `docs/reviews/WORLD_CUP_INTERNAL_TESTER_INSTRUCTIONS.md`
- `docs/reviews/WORLD_CUP_FINAL_ROUTE_SECURITY_REVIEW.md`
- Main app PR #264 summary and diff.
- Bot repo PR #3 summary and diff.
- Validation commands and results referenced by the final report.
- Bot validation evidence referenced by the final report.
- Secret/env hygiene evidence.

## Required Checks

- Verify final readiness report exists.
- Verify scorecard matches evidence.
- Verify PR #264 and bot PR #3 changes are real and scoped.
- Verify full validation claims are supported by commands/log summaries.
- Verify bot env hygiene is actually clean.
- Verify no real secrets were committed.
- Verify no real deposits, withdrawals, wallet custody, private-key behavior, real-money ledger movement, or external fund movement were enabled.
- Verify no production live bots were enabled.
- Verify first safe deployment mode keeps funding, trading, and bots disabled by default.
- Verify authenticated reference-liquidity dry-run blocker is documented with exact reason and does not hide an enabled unsafe path.
- Verify remaining warnings are acceptable for controlled internal beta.

## Expected Output

The Independent Audit Agent must write:

```text
agent-orchestrator/runs/<timestamp>-independent-audit-final-world-cup-readiness/AUDIT_REPORT.md
```

The report must issue one status:

- `AUDIT_PASS`
- `AUDIT_PASS_WITH_WARNINGS`
- `AUDIT_FAIL`
- `AUDIT_BLOCKED`

If the audit does not pass, findings must be added to `agent-orchestrator/memory/AUDIT_FINDINGS.md`.
