# Internal Funding Beta Go/No-Go

Date: 2026-06-19

## Decision

**Limited Internal Funding Beta Only**

POLY has strong local mocked/test evidence for controlled funding safety, but it is not yet ready to deploy as a completed internal funding beta without warnings.

## Why It Is Limited

The following safety layers are implemented or evidenced:

- internal funding allowlist.
- funding kill switch.
- auto-credit explicit flag.
- deposit wallet private-key no-leak tests.
- deposit monitor idempotency tests.
- withdrawal request hold tests.
- admin manual withdrawal review tests.
- no automatic withdrawal broadcast evidence.
- bot/funding runtime separation evidence.

The following are still open:

- PR #220 remains open for guarded funding UI review.
- no private server env has been validated.
- no controlled real-chain deposit drill has been run.
- no controlled withdrawal operator drill has been run.
- final deployment/runbook/smoke evidence is incomplete.

## Go Conditions For Owner-Controlled Internal Funding Beta

The owner can proceed only after all of these are true:

1. PR #220 is reviewed and either merged or replaced.
2. Required env vars are configured privately on the owner server.
3. `INTERNAL_FUNDING_BETA_ENABLED=true` only for the intended internal server.
4. `INTERNAL_FUNDING_ALLOWLIST_EMAILS` contains only approved internal testers.
5. `FUNDING_KILL_SWITCH=false` only when ready for controlled testing.
6. `ALLOW_AUTO_DEPOSIT_CREDIT=true` only when owner intentionally starts deposit auto-credit testing.
7. `DEPOSIT_WALLET_ENCRYPTION_KEY` is set privately and never printed.
8. supported chain/token/RPC env vars are set privately.
9. full validation passes on the deploy commit.
10. a small controlled deposit drill credits exactly once.
11. a controlled withdrawal request drill proves hold/release/complete.
12. admin manual payout flow is operator-tested.
13. no live bots are started.
14. no automatic withdrawal broadcaster exists or runs.

## No-Go Conditions

Do not deploy for internal funding testers if any of these are true:

- PR #220 remains unresolved and wallet/deposit UI is required for testers.
- allowlist is empty, too broad, or not reviewed.
- funding kill switch cannot be toggled quickly.
- deposit wallet encryption key is missing or invalid.
- Polygon RPC/token config is missing or wrong.
- tests fail.
- duplicate deposit credit protection is unclear.
- withdrawal hold/release/complete evidence is unclear.
- admin cannot review or complete withdrawals safely.
- bot live trading service is enabled.
- automatic withdrawal broadcast is requested.
- secrets appear in logs, docs, commits, or UI.

## Current Recommendation

Continue to Phase 10 internal route smoke evidence and Phase 11 server deployment readiness docs.

Do not call the project ready for server deployment until PR #220 is resolved and deployment smoke/runbook evidence is complete.
