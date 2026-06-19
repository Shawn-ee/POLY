# Human Decision Required

Last updated: 2026-06-18

This document tracks decisions the autonomous LeadAgent must not make alone.

## Production And Custody Decisions

- Enable real deposits.
- Enable real withdrawals.
- Decide custody model and production private-key handling.
- Approve real chain RPC/provider credentials.
- Approve payment/custody provider choices.

## Financial Engine Decisions

- Change ledger/balance invariants.
- Change `UserBalance`, `LedgerEntry`, or `LedgerTransaction` behavior.
- Change matching, settlement, order placement, order cancellation, fills, trades, or positions.
- Approve reconciliation strategy before public beta.

## Auth And Admin Decisions

- Change admin auth behavior.
- Change admin permission model.
- Approve admin production operating procedures.

## Bot And Liquidity Decisions

- Enable bot live trading.
- Change market-maker risk limits.
- Change liquidity runtime behavior.
- Approve bot account custody and credential handling.

## Deployment Decisions

- Deploy to production.
- Merge to `main`.
- Enable production autonomous execution.
- Change deployment secrets, Nginx/systemd production behavior, or public beta release gates.

## Product And Legal Decisions

- Public beta go/no-go.
- Real-money launch readiness.
- Jurisdiction/compliance decisions.
- Risk disclosure approval.

## Current Human-Review Items

- PR #25: broad UI/product-code draft touching wallet, admin deposit/withdrawal, private pool, and pool detail surfaces. Requires human review or splitting before merge.
- Public no-leak CI promotion: requires package/workflow decision before implementation. Readiness criteria are documented in `docs/reviews/PUBLIC_NO_LEAK_CI_PROMOTION_READINESS.md` and `docs/reviews/PUBLIC_API_TEST_LANE_IMPLEMENTATION_SCOPE.md`.
- Optional `test:public-api` package script: requires human review because it changes `package.json` and may later affect required validation lanes.
- Market detail cleanup: requires target contract approval before route implementation.
- Market detail current-gap tests: may be opened for review if mocked/local, but should not be auto-merged by default while the public contract is being stabilized.
- PR #25 replacement UI implementation: private pool, wallet, admin deposit, admin withdrawal, and pool detail replacement PRs require human review if they change actions, API calls, request payloads, confirmations, funding copy, or admin operation controls.
- PR #135: private pool list display polish requires human/specialist review before merge because it changes UI product code on an action-bearing page.
- Admin/funding UI screenshot evidence: screenshots or visual evidence must not use production data, secrets, private keys, raw custody details, or sensitive customer data; any redaction decision requires human review.
- Reference/liquidity public/admin split: requires implementation approval before route changes.
- Bot dry-run test implementation: requires BotAgent/SecurityAgent/human review before merge unless a later policy explicitly defines a narrow low-risk bot test auto-merge lane. Tests must not start live bots, read production credentials, connect to live exchanges/RPC, place orders, change liquidity behavior, or promote bot tests into CI without review.
