# Testing

## Current Required CI

The current GitHub Actions workflow is `.github/workflows/ci.yml`.

It runs on:

- pull requests targeting `dev`
- pull requests targeting `main`
- pushes to `dev`
- pushes to `main`

Commands:

```sh
npm ci
npm exec -- prisma generate --schema=prisma/schema.prisma
npm exec -- prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

Agent and subagent PRs should run and report the local-safe validation commands before opening or updating a PR:

```sh
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

`npm run test:ci` is the stable Jest CI smoke command. It runs the same focused file list used by GitHub Actions:

```sh
jest --runInBand --detectOpenHandles src/__tests__/admin.market.invariants.route.test.ts src/__tests__/admin.withdrawals.complete.route.test.ts src/__tests__/config.validation.test.ts src/__tests__/health.route.test.ts src/__tests__/order_ticket_logic.test.ts src/__tests__/orderbook.events.bus.test.ts src/__tests__/orderbook.place-cancel.events.test.ts src/__tests__/sensitive.rate-limit.test.ts src/__tests__/sports.event-market-model.test.ts src/__tests__/sse.market.route.test.ts src/__tests__/sse.recovery.test.ts src/__tests__/sse.user.route.test.ts src/__tests__/wallet.balance.route.test.ts
```

Subagents must include the commands run and their results in PR bodies. High-risk tasks may require extra targeted validation beyond this baseline. Any work touching wallet, deposit, withdrawal, ledger, matching, settlement, or related balance state requires human review and should follow `docs/HIGH_RISK_AREAS.md` and `docs/LEDGER_AND_WALLET_RULES.md`.

## Known Non-CI-Safe Suites

`npm run test:jest` creates a disposable migrated Jest database by default, runs Jest against it, and drops it afterward. `npm run test:phase3` uses the same isolation wrapper for the ledger Vitest suite. This prevents DB-resetting integration tests from touching the server/runtime database. To use a pre-created test database, set `TEST_DATABASE_URL`; its database name must include `test`, `jest`, or `ci`.

Do not point broad Jest runs at a live/runtime database. Destructive test helpers refuse to reset databases unless `NODE_ENV=test`, `POLY_ALLOW_TEST_DB_RESET=true`, and the database name is test-like.

Historical note: broad `npm run test:jest` used to be unsafe because it mixed:

- Jest smoke tests
- DB-backed integration tests
- Vitest-authored tests collected by Jest

Known broad-suite failures include:

- Vitest imports inside Jest
- order rate-limit expectation drift
- admin market simulation auth expectation
- phase 8.5 simulation failure
- DB test isolation requirements

`npm run test:phase3` currently runs Vitest but one test calls `jest.resetModules`; that test needs a runner-compatible rewrite.

`npm run test:jest` should not replace `npm run test:ci` until the broad suite is isolated, runner-compatible, and repeatable in CI.

## Browser Testing

Playwright is intentionally not part of required dev/main CI unless it is explicitly enabled later.

Run Playwright checks separately with the `e2e:*` scripts after starting the app with the required local environment, including `ALLOW_DEV_LOGIN=true` for authenticated local-only flows.

Current Chrome smoke coverage from the audit:

- public pages load
- market detail hydrates
- order amount input accepts values
- sports pages 404 and need implementation
- authenticated admin/user order flows are not verified

## Safe Local Test Environment

Normal PR validation can run from a local Windows development checkout. The orchestrator shell scripts require a Bash-compatible shell when using the `agent:*` package scripts, but that is separate from the standard CI validation listed above.

Linux/server deployment checks, systemd service testing, live monitors, and production-like runtime validation are not normal PR validation. Keep those checks in separate deployment runbooks and never use production credentials for routine local tests.

Use test-only values:

```sh
DATABASE_URL=postgresql://user:pass@localhost:55432/poly_test
NEXTAUTH_SECRET=ci-nextauth-secret
NEXTAUTH_URL=http://127.0.0.1:3001
NODE_ENV=test
APP_ENV=development
```

Do not use production credentials for local tests.
