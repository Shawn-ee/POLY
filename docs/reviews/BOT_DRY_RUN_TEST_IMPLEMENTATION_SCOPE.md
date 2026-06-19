# Bot Dry-Run Test Implementation Scope

Task id: TST-015 / DOC-052 refresh
Assigned subagents: TestingAgent, BotAgent, SecurityAgent
Risk level: High by topic
Status: Docs-only implementation scope

## Purpose

This document narrows future bot dry-run test implementation work. It builds on `docs/reviews/BOT_DRY_RUN_SAFETY_TEST_PLAN.md` and `docs/reviews/BOT_CREDENTIAL_HANDLING_REVIEW.md` without adding tests, running bots, changing credentials, or altering bot runtime behavior.

This scope does not start live bots, use real credentials, change bot code, change risk limits, modify liquidity behavior, deploy, or change production settings. The DOC-052 refresh keeps bot dry-run testing in the planning lane until a human explicitly approves any implementation touching bot runtime behavior.

## First Implementation Goal

The first bot test implementation should prove that dry-run mode can be tested without:

- Starting live trading.
- Reading real credentials.
- Calling production services.
- Placing orders.
- Moving funds.
- Changing market maker state.

The first implementation PR should be test-only, local-only, and mocked.

## Candidate First Test Areas

Preferred first candidates:

- Dry-run config parsing with fixture env values.
- Dry-run command construction without process execution.
- Risk-control decision functions if they are pure and do not import live clients.
- Bot status formatting with fixture data.
- Redaction checks for dry-run reports using placeholder credential-like strings.
- Disabled-mode defaults for local fixture configs.

Avoid as first candidates:

- Any test that starts a bot loop.
- Any test that connects to live APIs.
- Any test that imports production wallet credentials.
- Any test that places/cancels orders.
- Any test that writes market maker state.
- Any test that requires real RPC, CLOB, exchange, or database credentials.

## Required Assertions

Future bot dry-run tests should assert:

- Dry-run defaults remain enabled.
- Live mode cannot be inferred from missing config.
- Disabled mode remains the default when mode is absent, malformed, or unknown.
- Required live credentials are not read in dry-run tests.
- Order-placement functions are mocked or not imported.
- External network clients are mocked.
- Logs/status outputs do not expose secret-like values.
- Test failures do not print raw env values, API keys, private keys, mnemonics, signer material, or wallet secrets.

## Forbidden Future Test Behavior

Future bot tests must not:

- Start live bot trading.
- Start long-running supervisor loops.
- Connect to live exchanges, CLOBs, RPC endpoints, or production APIs.
- Read real `.env` or secret files.
- Print tokens, private keys, mnemonics, signer material, or API keys.
- Place, cancel, or match orders.
- Create fills or trades.
- Update positions.
- Move funds.
- Change liquidity runtime behavior.
- Change market-making risk limits.
- Deploy services.

## Safe Mocking Boundary

Future tests should mock:

- Environment/config loading.
- Exchange/CLOB/RPC clients.
- Order placement/cancel clients.
- Wallet/signer clients.
- Database access.
- Time and scheduler loops.
- Logging sinks if needed for no-secret assertions.
- Market/reference data inputs.
- Risk-limit and kill-switch state.

Test fixtures should use obvious placeholder values such as `test-api-key` and `test-wallet-address`, never real credentials.

## Implementation Lane Decision

Future bot dry-run test implementation should be split into at least two lanes:

1. **Docs/planning lane**: auto-merge eligible when changes are limited to `docs/**/*.md` and internal ReviewerAgent, SecurityAgent, and BotAgent self-review pass.
2. **Test-only implementation lane**: open for review and not auto-merged by default because bot behavior is high-risk by domain, even when tests are local and mocked.

The first test-only PR should be small enough to review in isolation. It should prefer a pure helper or fixture-only import path. If the only available test path imports live clients, runtime loops, credential loaders, deployment config, wallet/signing code, order placement, or liquidity execution, stop and write a new review packet instead of implementing tests.

## Required Pre-Implementation Checklist

Before a future bot dry-run test PR is opened, the implementing agent must confirm:

- The test target can run without `.env`, production secrets, live exchange credentials, chain RPC, or external APIs.
- The test target does not start a long-running process, supervisor, scheduler, or bot loop.
- The test target does not import wallet private-key handling, signing code, live order placement, or production credential loaders.
- All credential-like values in fixtures are placeholders and safe to print if a test fails.
- The PR changes only test files and optional docs, not bot runtime, package scripts, workflows, deployment config, Prisma, migrations, wallet, ledger, matching, settlement, orders, fills, trades, positions, deposits, withdrawals, admin auth, or production behavior.
- The PR body includes the exact targeted test command and full validation output.

If any checklist item cannot be confirmed, the work must remain docs-only and be recorded in `docs/reviews/HUMAN_DECISION_REQUIRED.md`.

## Auto-Merge Policy

Future bot test implementation is not auto-mergeable by default in the current agent policy because bot behavior is high-risk by domain.

Docs-only scopes like this document may be auto-merged after internal self-review because they do not change behavior.

## Required Validation For Future Test PR

Future implementation PRs should run:

```bash
git diff --check
npx jest --runInBand --detectOpenHandles <new-test-file>
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
git diff --cached --check
```

If a future bot package has its own test command, run it only when it is documented as local-only and does not require live credentials.

## Review Requirements

Future implementation PRs require:

- TestingAgent review for test isolation.
- BotAgent review for dry-run/live boundary correctness.
- SecurityAgent review for credential safety.
- LedgerWalletReviewerAgent review if any test touches orders, balances, positions, collateral, or funds.
- Human review before any bot live-mode, credential, exchange, RPC, or production operation test is merged.
- Human review before any package/workflow change that promotes bot tests into CI.

## Acceptance Criteria For Future First Test PR

A future first implementation PR should:

- Change only test files.
- Use local fixtures and mocks.
- Prove dry-run safety without starting bots.
- Avoid real credentials and external services.
- Avoid product/runtime behavior changes.
- Document why the test is local-only.
- Leave live-mode findings for human-reviewed follow-up.
- Remain open for BotAgent/SecurityAgent review unless a later policy explicitly permits low-risk bot test auto-merge.

## Non-Goals

This scope does not:

- Add tests.
- Change bot code.
- Change market maker behavior.
- Change risk limits.
- Change wallet, ledger, balances, orders, fills, trades, matching, settlement, deposits, withdrawals, admin auth, deployment, Prisma, migrations, or production behavior.
- Authorize live bot trading.

## Validation For This Scope

This scope is docs-only. Validation for this PR should be:

```bash
git diff --check
```
