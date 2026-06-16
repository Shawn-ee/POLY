# Full Platform Verification Report

Audit branch: `audit/full-platform-verification`

Audit date: 2026-06-16

Base: `origin/main`

## Summary

POLY has a working CI Phase 1 baseline, a broad API and UI surface, valid Prisma schema and migrations, and a usable public market detail/order ticket flow for seeded markets. It is not pre-money launch ready yet.

Primary blockers:

- Sports UI routes requested by the roadmap are missing on `main`: `/sports`, `/sports/soccer`, and `/sports/soccer/world-cup` return 404.
- Sports/event APIs return empty arrays after the current NBA seed; seeded markets are tagged sports but not grouped into `Event` records.
- Broad Jest is not CI-safe and still fails outside the focused smoke subset.
- Ledger Vitest has one runner mismatch: a Vitest suite calls `jest.resetModules`.
- Dev/admin browser login flow is not present on `main`; authenticated admin UI flows could not be completed in Chrome without manually creating a session.
- `dev` is behind `main`, so follow-up branches targeting `dev` need branch-base coordination.

## Repository State

- `main`: synced and contains CI workflow.
- `dev`: exists but is behind `main`.
- Audit branch created from `origin/main`.
- CI workflow exists at `.github/workflows/ci.yml`.
- Worktree started clean.

## Validation Results

| Check | Result | Notes |
| --- | --- | --- |
| `git diff --check` | Pass | No whitespace errors before docs edits. |
| `npm ci` | Pass with warnings | 38 audit vulnerabilities reported by npm; deprecated `inflight` and `glob` warnings. |
| `npm exec -- prisma generate --schema=prisma/schema.prisma` | Pass | Prisma client generated. Prisma config deprecation warning. |
| `npm exec -- prisma validate --schema=prisma/schema.prisma` | Pass | Schema valid. Prisma config deprecation and major update notice. |
| `npx tsc --noEmit --pretty false --incremental false` | Pass | No type errors. |
| CI Jest smoke command | Pass | 13 suites / 39 tests passed. |
| Prisma migrate deploy to disposable Postgres | Pass | 39 migrations applied cleanly. |
| Broad `npm run test:jest` without test DB | Fail | Expected local setup failure against existing port 5432 database with different credentials. |
| Broad `npm run test:jest` with migrated audit DB | Fail | 6 failed suites, 22 passed. Failures include test isolation/data reset issues, Vitest tests collected by Jest, order rate-limit expectation drift, admin simulation auth expectation, and phase 8.5 settlement simulation failure. |
| `npm run test:phase3` with isolated migrated DB | Fail | 13 passed, 1 failed. Failure: `jest is not defined` inside a Vitest run. |
| Secret pattern scan | Pass | No high-confidence key/token/private-key matches in repo scan excluding generated/local folders. |

Safe test env used:

- `DATABASE_URL=postgresql://user:pass@localhost:55432/poly_test`
- `NEXTAUTH_SECRET=ci-nextauth-secret`
- `NEXTAUTH_URL=http://127.0.0.1:3001`
- `NODE_ENV=test` for test commands
- `APP_ENV=development` for local browser server

## Browser Verification

Chrome was used against local server `http://127.0.0.1:3001`.

Disposable test DB:

- Docker container: `poly_audit_postgres`
- Port: `55432`
- Database: `poly_test`
- Seed: `npm run seed:nba`

Public page results:

| Page | Result | Notes |
| --- | --- | --- |
| `/` | Pass with empty-state caveat | Home loads. Initially showed no markets before hydration/seed data was inspected separately. |
| `/markets` | Pass | Page loads. |
| `/events` | Pass empty | Page loads, but `/api/events` returns no events. |
| `/portfolio` | Partial | Loads unauthenticated placeholder/loading state; authenticated portfolio not verified. |
| `/wallet` | Partial | Loads beta/test-credit wallet UI; authenticated wallet behavior not verified. |
| `/markets/[id]` | Pass | Seeded market detail loads after hydration. |
| order ticket amount input | Pass | Amount input accepted `5`; UI remained stable and showed no-liquidity state. |
| `/sports` | Fail | 404. |
| `/sports/soccer` | Fail | 404. |
| `/sports/soccer/world-cup` | Fail | 404. |
| `/admin` | Partial | Shows login/admin gate when unauthenticated. |
| `/admin/reference-markets` | Partial | Loads admin permission/loading gate when unauthenticated. |

Chrome console warnings were dominated by an installed browser extension content script and are not attributed to POLY.

## API Verification

Verified manually by local HTTP requests:

- `GET /api/health` returned 200.
- `GET /api/markets` returned seeded NBA markets.
- `GET /api/events` returned an empty event list.
- `GET /api/sports` returned an empty sports list.
- `GET /api/sports/soccer/events` returned an empty event list.
- `GET /api/sports/soccer/world-cup/events` returned an empty event list.

## Database And Migrations

Prisma validation passed. All migrations applied cleanly to a disposable Postgres 16 database.

Migration safety note:

- This audit did not introduce any migrations.
- Existing migrations were applied to an empty test database only.
- No existing production data was read, rewritten, or modified.

## Ledger And Orderbook Findings

Positive:

- CI smoke tests cover selected orderbook route/event behavior.
- Ledger Phase 3 suite mostly passes when run alone against a migrated database.
- Migrations for orderbook, ledger, positions, fills, and sports event market model apply successfully.

Blockers/gaps:

- `npm run test:phase3` is configured as Vitest but one test uses Jest global API.
- Broad Jest still collects Vitest-authored suites and DB-heavy tests that are not isolated for one command.
- Broad DB Jest still reports order/rate-limit and phase 8.5 simulation failures after DB setup.
- Full placement/cancel/fill/settlement browser flows were not verified because authenticated dev login is not present on `main`.

## Sports/Event Findings

Positive:

- Sports/event database models and API routes exist.
- Sports tagged markets can be seeded through `seed:nba`.

Blockers/gaps:

- No public sports pages exist on `main`.
- `seed:nba` creates sports-tagged markets but no event records; sports event APIs are empty.
- Event detail and event-market UI could not be verified with seeded data because no sports events were produced.

## Auth/Admin Findings

Positive:

- `/api/auth/login` is disabled with 410 and instructs users to use Google or wallet sign-in.
- Admin API routes generally call `requireAdmin` or `assertAdmin`.
- Production cookies are marked secure when `NODE_ENV === "production"`.

Gaps:

- No `ALLOW_DEV_LOGIN` flow exists on `main`, so local headed authenticated admin Playwright/Chrome flows cannot be completed without manual session creation.
- `requireAdmin` accepts `x-dev-admin-user-id` in any non-production environment. This is useful for tests, but it needs explicit documentation and test coverage to confirm it cannot be active in production.
- `getSessionSecret` falls back to `dev-insecure-secret`; config validation should ensure production cannot run with that fallback.

## Deposit/Withdrawal Safety Review

No deposit, withdrawal, wallet, custody, or payment logic was modified.

Architecture/interface observations:

- UI displays an internal beta warning that test credits are used and deposits/withdrawals are disabled.
- Real deposit and withdrawal routes exist.
- Deposit address route validates configuration before creating an address.
- Deposit verify route exposes debug transfer details outside production only.
- Withdrawal request route requires user auth and delegates to ledger/withdrawal services.
- Admin withdrawal completion/rejection routes require admin and sensitive rate limiting.

Launch implication:

- Deposit/withdrawal must remain restricted until a dedicated security and operational review is complete.

## Security And Secret Exposure

- High-confidence token/private-key scan found no matches.
- `.gitignore` excludes `.env`, `.env.*`, logs, `node_modules`, `.next`, local DB files, key/cert formats, and `test-logs`.
- `.env.example` contains public Polygon defaults and placeholder encryption key only.
- A committed screenshot file exists: `screenshotsforchat/Screenshot 2026-02-09 200522.png`. It should be reviewed and likely removed or moved out of the repository if not intentionally public.

## CI/Test Coverage Gaps

- CI Phase 1 is intentionally narrow and passing.
- No CI Playwright coverage yet.
- No CI Vitest suite yet.
- No full DB-backed Jest suite yet.
- No authenticated admin UI E2E in CI.
- No sports UI E2E in CI.
- No bot discovery CI coverage.

## Launch Readiness

Current state: not pre-money launch ready.

Reasons:

- Sports/event UI is incomplete on `main`.
- Full orderbook/ledger/settlement suite is not green as a broad command.
- Authenticated admin and user order flows are not verified in real browser automation.
- Deposit/withdrawal safety remains architecture-only and must not be enabled for real money.

## Recommended Follow-Up Branches

1. `agent/sports-ui-pages`
2. `agent/sports-event-seed-api-alignment`
3. `agent/test-runner-isolation`
4. `agent/ledger-phase3-vitest-fix`
5. `agent/auth-admin-dev-login-qa`
6. `agent/orderbook-ledger-qa`
7. `agent/security-production-guards`
8. `agent/remove-committed-screenshot-artifact`
9. `agent/playwright-smoke-phase1`
10. `agent/bot-market-discovery-qa`

## Do Not Touch Yet

- Real-money deposit enablement
- Real-money withdrawal completion automation
- Custody sweeping
- Production deployment
- Payment processor integration
