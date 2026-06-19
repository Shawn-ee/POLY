# Public API Test Implementation Queue

Task id: DOC-023
Assigned subagents: TestingAgent, SecurityAgent, BackendAgent
Risk level: Low
Status: Docs-only implementation queue

## Purpose

This queue orders future public API test tasks after the recent no-leak and contract decision work.

It does not add tests, change package scripts, change CI, change routes, or alter production behavior.

## Current Test Evidence

Current targeted no-leak tests:

- `src/__tests__/public.taxonomy.no-leak.test.ts`
- `src/__tests__/public.events.no-leak.test.ts`
- `src/__tests__/public.sports.no-leak.test.ts`
- `src/__tests__/public.market-list.no-leak.test.ts`
- `src/__tests__/public.event-markets.no-leak.test.ts`
- `src/__tests__/public.market-chart.no-leak.test.ts`

Current expanded coverage includes no-leak, response-shape, and selected empty/error paths for taxonomy, event, sports, event-market, market-list, and market-chart route groups. These tests remain targeted evidence until a human-reviewed package-script or CI-lane PR is accepted.

## Completed Or Superseded Test Tasks

| Previous task | Current status | Evidence |
|---|---|---|
| Add allowlist response-shape tests for taxonomy reads. | Completed | `src/__tests__/public.taxonomy.no-leak.test.ts` |
| Add allowlist response-shape tests for sports event reads. | Completed | `src/__tests__/public.sports.no-leak.test.ts` |
| Add allowlist response-shape tests for event market reads. | Completed | `src/__tests__/public.event-markets.no-leak.test.ts` |
| Add empty-state chart route tests. | Completed | `src/__tests__/public.market-chart.no-leak.test.ts` |
| Add market list response-shape tests. | Completed | `src/__tests__/public.market-list.no-leak.test.ts` |
| Add market list grouped reference filtering test. | Completed | `src/__tests__/public.market-list.no-leak.test.ts` |
| Add event and event-market error/not-found tests. | Completed | `src/__tests__/public.events.no-leak.test.ts` and `src/__tests__/public.event-markets.no-leak.test.ts` |

## Recommended Next Test Tasks

| Priority | Task | Risk | Auto-merge candidate | Notes |
|---:|---|---:|---|---|
| 1 | Add market detail current-gap test. | Medium | No by default | Should document current extra-field gap before cleanup. Must use mocks and avoid route behavior changes. |
| 2 | Add market detail target-contract tests. | Medium | No by default | Pair with reviewed implementation cleanup or keep as skipped expectations if explicitly approved. |
| 3 | Add public route page smoke evidence status or manual evidence file. | Low | Yes if docs-only | Plan or record screenshots/smoke checks before UI implementation. |
| 4 | Add optional `test:public-api` package script PR. | Low/Medium | No | Human-reviewed because it changes `package.json`; use `docs/reviews/PUBLIC_API_TEST_LANE_IMPLEMENTATION_SCOPE.md`. |
| 5 | Add public liquidity summary tests. | High by topic | No | Wait for implementation and specialist review. |
| 6 | Add quote/orderbook/trade-tape allowlist tests. | Medium/High | No by default | Trading-adjacent; use scope doc first. |

## Safe Autonomous Test Boundary

The remaining low-risk public API test work is narrower than before. New test-only PRs should be selected only when they:

- Exercise existing public/read-only route handlers.
- Use mocks and local fixtures only.
- Do not require real DB, secrets, external services, production data, credentials, chain RPC, payment/custody, or wallet keys.
- Do not change route implementation, package scripts, workflows, Prisma, migrations, deployment, admin auth, wallet, ledger, trading, bot, or production behavior.
- Avoid market detail, quote, orderbook, trade-tape, reference, and liquidity routes unless the PR body explicitly states why the test is safe and whether it is non-auto-mergeable.

## Auto-Merge Eligible Test Pattern

A future test-only PR can be auto-merged only when:

- It changes only `src/__tests__/`, `tests/`, or safe test docs.
- It uses mocks and local fixtures.
- It covers public/read-only/no-leak or response-shape behavior.
- It does not require real DB, secrets, external services, production data, credentials, chain RPC, payment/custody, or wallet keys.
- Full validation passes.
- ReviewerAgent and SecurityAgent self-review pass.
- Specialist reviewers pass if needed.

## Not Auto-Mergeable By Default

Do not auto-merge tests involving:

- market detail behavior cleanup
- market detail current-gap or target-contract assertions unless a later policy explicitly allows it
- public/admin reference route split
- quote/orderbook/trade-tape semantics
- admin auth
- wallet/deposit/withdrawal
- ledger/balance/reconciliation
- matching/settlement/orders/fills/trades/positions
- bot live/dry-run runtime behavior
- deployment or production config

## Validation For Future Test PRs

Use:

```bash
git diff --check
npx jest --runInBand --detectOpenHandles <new-or-updated-test-file>
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
git diff --cached --check
```

## Non-Goals

This queue does not:

- Add tests.
- Change CI.
- Change package scripts.
- Change route behavior.
- Change product/runtime code.
- Change wallet, ledger, trading, admin auth, bots, deployment, Prisma, migrations, or production settings.

## Validation For This Queue

This queue is docs-only. Validation for this PR should be:

```bash
git diff --check
```
