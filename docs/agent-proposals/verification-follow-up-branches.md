# Verification Follow-Up Branch Proposals

These are proposed follow-up branches from the full-platform verification audit. They should be implemented as separate scoped branches and PRs.

## Proposed Branches

- `agent/sports-ui-pages`: add missing public sports pages and Chrome smoke coverage.
- `agent/sports-event-seed-api-alignment`: make sports seed data produce event records consumed by sports APIs.
- `agent/test-runner-isolation`: separate Jest, Vitest, and DB-backed suites so broad commands are meaningful.
- `agent/ledger-phase3-vitest-fix`: remove Jest globals from Vitest tests.
- `agent/auth-admin-dev-login-qa`: add or document safe local authenticated admin test flow.
- `agent/orderbook-ledger-qa`: strengthen order placement, cancel, fill, settlement, balance, and position tests.
- `agent/security-production-guards`: audit auth/admin/deposit/withdrawal production guards.
- `agent/remove-committed-screenshot-artifact`: remove or justify committed screenshot artifact.
- `agent/playwright-smoke-phase1`: add first stable Playwright smoke suite after UI routes are stable.
- `agent/bot-market-discovery-qa`: verify bot-facing market discovery and paused/closed filtering.

## Proposal Boundary

These proposals are not implementation approval. Deposit, withdrawal, wallet, custody, payment, production deployment, ledger, settlement, and admin permission changes still require explicit scope approval.
