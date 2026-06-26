# World Cup Internal Beta Go/No-Go

Date: 2026-06-26

Decision:

```text
GO for controlled internal World Cup beta with warnings.
NO-GO for public beta.
NO-GO for real public deposits, real withdrawals, wallet custody, real-money external fund movement, and production live bots with real funds.
```

## Go Conditions Met

- World Cup discovery and event pages have grouped match markets.
- Order ticket and combo slip show cost, payout, and profit estimates.
- Combo quote and submit paths are guarded by internal trading beta gates.
- Combo risk model v1 blocks unsupported/correlated/unsafe combos before order creation or ledger lock.
- Single-leg cash-out estimate v1 exists and is read-only.
- Portfolio/open combo and settlement evidence exists.
- Admin settlement preview/settlement evidence exists for internal/test combo flow.
- Public no-leak route tests exist.
- Bot guardrails and dry-run/reference tests pass.
- Bot repo hygiene cleaned tracked `live-internal.env` in Poly-bots PR #3.
- Funding remains disabled unless separately enabled by controlled funding flags.

## Warnings

- Authenticated reference-liquidity dry-run still requires a valid local admin `poly_session` cookie in `POLY_SIM_SESSION_COOKIE`.
- Same-event correlated combo pricing is intentionally unsupported.
- Combo cash-out is intentionally unsupported.
- Cash-out execution is intentionally disabled.
- The checked-in Playwright runner previously hung in this shell; direct browser smoke passed.

## Stop Conditions

Stop the internal beta immediately if any of these happen:

- Public or anonymous trading becomes possible.
- Public funding becomes enabled.
- Real deposits, withdrawals, wallet custody, private keys, or real external fund movement are introduced.
- Production live bots begin placing real-fund orders.
- Route no-leak tests fail.
- Trading kill switch fails to block internal order submission.
- Settlement creates duplicate ledger entries.

## Go/No-Go Matrix

| Area | Decision |
| --- | --- |
| Controlled internal World Cup browsing | GO |
| Controlled internal test trading | GO with allowlist, beta flag, and kill switch discipline |
| Internal combo validation | GO |
| Single-leg cash-out estimate | GO as estimate-only |
| Admin settlement drill | GO for internal/test flow |
| Public beta | NO-GO |
| Real deposits | NO-GO |
| Real withdrawals | NO-GO |
| Wallet custody/private keys | NO-GO |
| Production live bots with real funds | NO-GO |
