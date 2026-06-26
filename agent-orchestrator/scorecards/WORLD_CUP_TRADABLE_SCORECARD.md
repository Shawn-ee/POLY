# World Cup Tradable Internal Beta Scorecard

Date: 2026-06-26

Status:

```text
95/100
Controlled internal beta ready with warnings.
Public beta is not ready.
Production live bots are not approved.
```

## Score Breakdown

| Area | Score | Evidence | Notes |
| --- | ---: | --- | --- |
| World Cup discovery and grouped event markets | 10/10 | `WORLD_CUP_V2_UI_ORDER_TICKET_SMOKE_EVIDENCE.md`, final readiness report | Seeded World Cup events render; matches group related markets under event pages. |
| Order ticket and combo slip | 9/10 | `WORLD_CUP_V2_UI_ORDER_TICKET_SMOKE_EVIDENCE.md`, `WORLD_CUP_V2_INTERNAL_TEST_TRADE_SMOKE_EVIDENCE.md` | Outcome selection, amount changes, cost/payout/profit estimates, and gated submit are tested. |
| Internal/test trading flow | 9/10 | `WORLD_CUP_V2_INTERNAL_TEST_TRADE_SMOKE_EVIDENCE.md` | Quote/submit path is guarded; internal combo orders lock test balance through existing ledger path. |
| Portfolio and settlement evidence | 9/10 | `20260626T145500Z-world-cup-internal-drill-readiness/REPORT.md` | Portfolio/open combo visibility and admin settlement/preview evidence exists. |
| Reference sync and two-tick pricing | 9/10 | `WORLD_CUP_V2_REFERENCE_SYNC_DRY_RUN_EVIDENCE.md`, `WORLD_CUP_V2_TWO_TICK_PRICING_EVIDENCE.md` | Tests prove missing/stale reference handling and two-tick pricing; authenticated dry-run remains manual-session blocked. |
| Market-making guardrails | 10/10 | `WORLD_CUP_V2_MARKET_MAKING_GUARDRAILS_EVIDENCE.md`, Poly-bots PR #2, Poly-bots PR #3 | Guardrails pass and tracked live env file is removed. Live production bots remain disabled. |
| Bot hygiene | 9/10 | Poly-bots PR #3 | `live-internal.env` removed from tracking, ignored, and replaced with safe example template. |
| Combo validation risk model | 9/10 | `20260626T153500Z-world-cup-combo-risk-cashout-v1/REPORT.md` | V1 blocks unsafe/correlated/missing quote/limit cases with reason codes. Same-event pricing remains unsupported. |
| Early cash-out estimate | 7/10 | `20260626T153500Z-world-cup-combo-risk-cashout-v1/REPORT.md` | Single-leg estimate-only model exists. Combo cash-out and execution remain unsupported. |
| Route security/no-leak | 9/10 | Final readiness validation | Public no-leak route tests and admin route blocks are covered. |
| Operations/runbook readiness | 9/10 | Final go/no-go, env flags, tester instructions, rollback docs | Controlled internal beta instructions exist; public beta and real funds remain blocked. |
| Safety posture | 10/10 | Final readiness report | No real deposits, withdrawals, wallet custody, private keys, real external fund movement, destructive migration, or production live bot enablement. |

## Final Classification

```text
Controlled Internal World Cup Beta: READY WITH WARNINGS.
Public Beta: NOT READY.
Real-money funding/withdrawals: BLOCKED.
Production live bots with real funds: NOT APPROVED.
```

## Remaining Warnings

1. Authenticated reference-liquidity dry-run requires a valid local admin session cookie and was blocked without one.
2. Checked-in Playwright runner previously hung in this shell; direct browser smoke passed and the test was stabilized.
3. Same-event correlated combo pricing remains unsupported.
4. Combo cash-out and cash-out execution remain unsupported.
5. Public beta, real deposits, real withdrawals, wallet custody, real-money ledger movement, and production live bots remain out of scope.
