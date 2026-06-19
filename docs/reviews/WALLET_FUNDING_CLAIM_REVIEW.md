# Wallet Funding Claim Review

Task id: UI-007

Assigned subagents: LeadAgent, SecurityAgent, LedgerWalletReviewerAgent, FrontendAgent

Risk level: High by topic because `/wallet` is funding, withdrawal, balance, and linked-wallet adjacent.

Status: Review-only. This document does not change wallet UI code, API behavior, deposit behavior, withdrawal behavior, ledger, matching, settlement, auth, bot behavior, deployment, Prisma, migrations, secrets, package scripts, workflows, or production behavior.

## Purpose

The wallet page must not imply that POLY is ready for public deposits, withdrawals, custody, or production money movement before those flows are explicitly approved.

This review defines the funding claims that future UI work must avoid or clarify before any `/wallet` display PR is attempted.

## Current Risk Summary

The wallet page currently owns or displays concepts related to:

- Available, locked, and total balances.
- Wallet linking and external wallet network state.
- Deposit modal state.
- Deposit history placeholders.
- Withdrawal amount and destination state.
- Withdrawal history.
- Wallet transactions.
- Linked wallet USDC balance checks.

Those concepts are useful for an internal beta, but they can mislead users if the page looks like public real-money funding is ready.

## Claims To Avoid

Future UI copy must not claim or imply:

- Deposits are public-ready.
- Deposits are instant.
- Withdrawals are automated.
- A linked wallet is a payout wallet unless withdrawals are approved.
- External wallet USDC and POLY account balance are the same thing.
- A displayed deposit address is safe to fund in production.
- Manual, legacy, mock, or test flows are production custody flows.
- Balances are withdrawable unless withdrawal rules and gates are approved.

## Required Beta-Safe Copy

Future wallet display should make these points clear:

- POLY is in internal beta.
- Test credits and account balances are separate from external wallet funds unless explicitly stated.
- Deposits and withdrawals are gated until approved.
- Users should not send funds unless the page shows an approved deposit method.
- Withdrawal requests, if visible, are manual/reviewed unless automation is approved.
- Linked wallets are for account identity or future funding eligibility unless a human-approved flow says otherwise.

## Safe Future UI Scope

A future FrontendAgent PR may be considered if it is display-only and does not alter behavior:

- Add a concise beta funding warning.
- Improve section headings for account balance, linked wallets, deposits, withdrawals, and history.
- Clarify disabled/gated funding states.
- Clarify external wallet balance vs POLY account balance.
- Improve loading/empty/error copy.
- Improve mobile spacing for read-only sections.

## Forbidden Future UI Scope Without Human Approval

Future autonomous work must not:

- Enable deposits.
- Enable withdrawals.
- Show or generate a new deposit address.
- Change deposit modal behavior.
- Change withdrawal request behavior.
- Change linked-wallet signing, verification, or network switching.
- Change wallet API calls.
- Change balance calculations.
- Change ledger, matching, settlement, orders, fills, trades, positions, Prisma, migrations, deployment, workflows, scripts, or secrets.

## Human Review Required

Human review is required before any wallet UI PR that:

- Shows a deposit address or QR code to normal users.
- Changes deposit or withdrawal CTA availability.
- Changes withdrawal form copy from disabled/reviewed to active/ready.
- Changes wallet linking purpose or external wallet balance interpretation.
- Mentions real USDC funding as available.
- Touches wallet/deposit/withdrawal APIs or ledger-backed balances.

## Suggested Split PRs

| Task | Scope | Files likely affected | Auto-merge default |
|---|---|---|---|
| UI-007A | Wallet beta warning copy only | `src/app/wallet/page.tsx` | Human review by default |
| UI-007B | Wallet section heading cleanup | `src/app/wallet/page.tsx` | Human review by default |
| UI-007C | Wallet mobile/readability polish | `src/app/wallet/page.tsx` | Human review by default |
| UI-007D | Wallet route smoke/screenshot checklist | `docs/reviews/` | Docs-only yes |
| WDW-* | Funding gates implementation | config/API/UI/tests | Not autonomous |

## Acceptance Criteria For Future Wallet UI PRs

Any future wallet display PR must:

- State that it is display-only.
- Include SecurityAgent and LedgerWalletReviewerAgent review.
- Prove no deposit, withdrawal, linked-wallet, balance, API, or ledger behavior changed.
- Run full validation and focused lint.
- Include desktop/mobile visual evidence when practical and safe.
- Keep screenshots free of secrets, private keys, real addresses if sensitive, production data, and customer data.

## Validation Commands For Future Code PRs

```bash
git diff --check
git diff --cached --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npm run lint -- src/app/wallet/page.tsx
```

## Non-Goals

This review does not:

- Change `/wallet`.
- Change wallet linking.
- Change deposit, withdrawal, balance, ledger, matching, settlement, order, fill, trade, position, auth, admin, bot, deployment, Prisma, migration, package, workflow, script, or secret behavior.
- Approve public beta, custody, deposits, withdrawals, or production launch.
