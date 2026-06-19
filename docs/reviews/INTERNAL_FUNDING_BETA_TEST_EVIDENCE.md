# Internal Funding Beta Test Evidence

Date: 2026-06-19

## Scope

This document consolidates actual evidence for Controlled Internal Funding Beta. It distinguishes what has been run from what remains manual, blocked, or not run.

This is not public beta evidence and not production launch approval.

## Current Classification

**Limited Internal Funding Beta Only**

Reason: core funding safety tests and docs exist for allowlist, kill switch, deposit wallet no-leak, deposit auto-credit idempotency, withdrawal hold, admin manual withdrawal review, and bot/funding separation. However, the guarded deposit UI PR #220 remains open for human review, no private server deployment smoke has been run, and no controlled real-chain deposit drill has been recorded.

## Actually Run

### Funding Allowlist And Kill Switch

Evidence source:

- PR #217
- `docs/reviews/FUNDING_BETA_ALLOWLIST_KILLSWITCH_REVIEW.md`
- `src/__tests__/funding-beta.guard.test.ts`
- `src/__tests__/funding-beta.routes.test.ts`
- `src/__tests__/funding-beta.deposit-monitor.test.ts`

Covered:

- anonymous funding access blocked.
- non-allowlisted funding access blocked.
- allowlisted users allowed only when internal funding beta is enabled and kill switch is off.
- kill switch blocks deposit address access.
- kill switch blocks withdrawal request creation.
- kill switch blocks deposit monitor before chain provider access.
- deposit address response omits `privateKey`.
- deposit address response omits `encryptedPrivateKey`.
- withdrawal request response omits broadcast transaction fields.

Validation recorded:

- targeted Jest passed.
- Prisma generate passed.
- Prisma validate passed.
- TypeScript passed.
- `npm run test:ci` passed.
- GitHub CI Validate passed.

### Deposit Wallet Generation

Evidence source:

- PR #218
- `docs/reviews/FUNDING_BETA_DEPOSIT_WALLET_GENERATION_REVIEW.md`
- `src/__tests__/funding-beta.deposit-wallet-generation.test.ts`

Covered:

- existing active wallet reuse avoids new private-key generation.
- new wallet creation stores encrypted private key only.
- raw private key is not persisted in Prisma create payload.
- unsafe encryption config blocks generation before key creation.

Validation recorded:

- targeted Jest passed.
- Prisma generate passed.
- Prisma validate passed.
- TypeScript passed.
- `npm run test:ci` passed.
- GitHub CI Validate passed.

### Deposit Wallet Security And No-Leak

Evidence source:

- PR #219
- `docs/reviews/DEPOSIT_WALLET_SECURITY_EVIDENCE.md`
- `src/__tests__/funding-beta.routes.test.ts`

Covered:

- anonymous deposit-address access blocked before wallet generation.
- non-allowlisted access blocked before wallet generation.
- deposit address responses omit `privateKey`.
- deposit address responses omit `encryptedPrivateKey`.
- deposit address responses omit `seed`.
- deposit address responses omit `mnemonic`.
- deposit address responses do not include synthetic test secret markers.
- kill switch blocks deposit-address wallet generation.
- unsafe deposit config blocks deposit-address wallet generation.
- production unsafe-config errors do not echo env names or values.

Validation recorded:

- targeted Jest passed.
- Prisma generate passed.
- Prisma validate passed.
- TypeScript passed.
- `npm run test:ci` passed.
- GitHub CI Validate passed.

### Deposit Monitor And Auto-Credit

Evidence source:

- PR #221
- `docs/reviews/DEPOSIT_AUTO_CREDIT_EVIDENCE.md`
- `src/__tests__/funding-beta.deposit-monitor.test.ts`

Covered:

- monitor scan is blocked by guard before chain access when kill switch or auto-credit gates are closed.
- unsupported chain is ignored.
- unsupported token is ignored.
- unconfirmed supported transfer records a deposit and marks it confirming without ledger credit.
- confirmed deposit calls `applyDepositTx` with deterministic tx/log-index idempotency key.
- confirmed deposit references the `Deposit` row when applying ledger credit.
- already credited deposit does not call `applyDepositTx` again.

Validation recorded:

- targeted Jest passed.
- Prisma generate passed.
- Prisma validate passed.
- TypeScript passed.
- `npm run test:ci` passed.
- GitHub CI Validate passed.

### Withdrawal Request And Hold

Evidence source:

- PR #222
- `docs/reviews/WITHDRAWAL_HOLD_EVIDENCE.md`
- `src/__tests__/funding-beta.routes.test.ts`
- `src/server/services/__tests__/withdrawals.phase8.test.ts`

Covered:

- anonymous withdrawal request blocked.
- non-allowlisted withdrawal request blocked.
- kill switch blocks withdrawal request creation.
- invalid address blocked.
- invalid amount blocked.
- insufficient balance blocked.
- valid request creates hold.
- rejection releases hold.
- completion consumes held funds and records payout tx hash.
- no automatic broadcast fields returned.

Validation recorded:

- targeted withdrawal tests passed.
- Prisma generate passed.
- Prisma validate passed.
- TypeScript passed.
- `npm run test:ci` passed.
- GitHub CI Validate passed.

### Admin Manual Withdrawal Review

Evidence source:

- PR #223
- `docs/reviews/ADMIN_MANUAL_WITHDRAWAL_REVIEW_EVIDENCE.md`
- `src/__tests__/admin.withdrawals.review.route.test.ts`
- `src/__tests__/admin.withdrawals.complete.route.test.ts`

Covered:

- normal users cannot list admin withdrawal queue.
- admin can list pending and recent withdrawals.
- admin list responses omit treasury private keys and broadcast transaction fields.
- admin can reject a withdrawal through manual review route.
- admin can complete withdrawal with provided payout tx hash.
- completion response omits treasury private keys and broadcast transaction fields.
- route handlers call rate limiter and manual review services.

Validation recorded:

- targeted admin withdrawal route tests passed.
- Prisma generate passed.
- Prisma validate passed.
- TypeScript passed.
- `npm run test:ci` passed.
- GitHub CI Validate passed.

### Bot/Funding Runtime Separation

Evidence source:

- PR #224
- `docs/reviews/BOT_FUNDING_RUNTIME_SAFETY.md`

Covered:

- app deposit monitor is separate from bot runners.
- app deposit monitor does not place orders, cancel orders, start bots, require bot credentials, or broadcast withdrawals.
- bot repo live trading scripts are gated by dry-run, live-enabled, kill-switch, mode, readiness, and confirm-live controls.
- live bot trading remains not approved for funding beta.

Validation recorded:

- docs-only diff validation passed.
- GitHub CI Validate passed.

## Open Or Blocked

### PR #220

Status: open for human/specialist review.

Reason:

- It exposes the guarded funding UI entry point.
- It is not merged into `dev`.
- It should be reviewed before owner deploys a server intended for internal funding testers.

### Controlled Real-Chain Deposit Drill

Status: not run.

Required before declaring ready without warnings:

- configure private server env values without printing them.
- add at least one allowlisted internal tester.
- verify deposit address generation on private server.
- send a small supported-token deposit on supported chain.
- wait required confirmations.
- verify deposit record and ledger credit.
- verify duplicate scan does not double-credit.

### Controlled Withdrawal Drill

Status: not run.

Required before declaring ready without warnings:

- create withdrawal request as allowlisted tester.
- verify hold entry and locked balance.
- reject one request and verify hold release.
- complete one request with manually provided payout tx hash.
- verify no automatic blockchain broadcast happens.

### Admin Operator Drill

Status: not run.

Required before declaring ready without warnings:

- admin list pending withdrawals.
- admin reject request.
- admin complete request with payout tx hash.
- verify normal user blocked from admin routes.

### Server Deployment Smoke

Status: not run.

Required before deployment-ready classification:

- env checklist reviewed.
- server starts.
- Prisma generate/validate run.
- TypeScript and tests run.
- health routes checked.
- funding kill switch tested.
- public/anonymous funding blocked.

## Manual Required

- Owner must provide actual allowlist emails in private server env.
- Owner must provide actual RPC and supported token env values in private server env.
- Owner must provide deposit wallet encryption key in private server env.
- Owner must decide whether env-backed allowlist is sufficient for first internal cohort or whether schema-backed funding profiles are required first.
- Owner/admin must perform manual payout outside the app for completed withdrawals.
- Owner must decide when to enable `ALLOW_AUTO_DEPOSIT_CREDIT`.

## Evidence Boundary

This evidence supports continued controlled internal funding beta preparation.

It does not approve:

- public funding.
- anonymous funding.
- public beta.
- production launch.
- automatic withdrawal broadcast.
- live bot trading.
- deployment without owner env setup and smoke testing.
