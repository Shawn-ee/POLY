# Market Detail Screenshot And Smoke Checklist

Task id: UI-019A

Assigned subagents: LeadAgent, FrontendAgent, TestingAgent, SecurityAgent, LedgerWalletReviewerAgent, BotAgent

Risk level: Low for docs-only checklist; high by future market-detail topic.

Status: Planning-only. This document does not start a server, open a browser, capture screenshots, add tests, change UI code, change API behavior, change order behavior, wallet behavior, ledger, matching, settlement, positions, pool actions, bot/reference behavior, deployment, Prisma, migrations, package scripts, workflows, secrets, or production behavior.

## Purpose

Before any future `/markets/[id]` UI cleanup, reviewers need a safe checklist for market-detail screenshot and smoke evidence.

Market detail is high-risk because it can route into orderbook, order ticket, open orders, positions, pool actions, reference data, and bot diagnostics. Screenshot/smoke evidence must prove that a future display-only change did not drift into action behavior or expose sensitive internals.

## Required Preconditions

Before capturing market-detail evidence, confirm:

- Branch and commit are recorded.
- Working tree is clean except intentional docs or local artifacts.
- Base URL is local only.
- Market fixture is local/dev data only.
- No production URL, production database, production account, production secrets, private keys, wallet seeds, chain RPC credentials, custody provider, payment provider, or exchange credentials are used.
- The target market is safe to view and contains no private customer data or sensitive internal notes.
- Screenshots are reviewed before attaching or committing.

## Preferred Fixture Types

Use the lowest-risk fixture available:

| Fixture | Use first? | Notes |
|---|---:|---|
| Public scheduled market with no orders | Yes | Best first fixture for layout, not-found, and coming-soon states. |
| Public open market with simple Yes/No prices | Yes, if local-only | Good for price/summary display without exercising order actions. |
| Public resolved market | Maybe | Useful for resolved/canceled state checks if no settlement details leak. |
| Orderbook market with user open orders | No by default | Requires local test user and order-behavior review. |
| Pool market with owner controls | No by default | Pool join, bet, cancel, and resolve actions are review-gated. |
| Bot/reference-heavy market | No by default | Bot/reference internals are specialist-reviewed. |

## Route Evidence Checklist

Record these fields in the future evidence artifact:

- Date.
- Branch.
- Commit.
- Local base URL.
- Market ID or safe fixture label.
- User state: anonymous, logged-in local test user, or admin local test user.
- Market mechanism: orderbook, pool, or other.
- Market state: scheduled, open, paused, resolved, canceled, hidden, no liquidity, or not found.
- Browser/viewport if screenshots are captured.
- Screenshot path only if safe.
- Result: pass, fail, partial, or not run.

## Visual Checks

For every screenshot or manual pass, check:

- Market title, description, status, and event link are readable.
- Yes/No or outcome labels are clear.
- Price/probability wording follows `UI_COPY_TERMINOLOGY_GUIDE.md`.
- Loading, not-found, no-price, no-liquidity, and error copy follow `UI_STATE_TERMINOLOGY_MAP.md`.
- Beta copy does not imply production funding, guaranteed prices, or public real-money readiness.
- Orderbook, trades, positions, reference, bot, and pool sections are visually secondary to the market summary.
- Action-bearing sections are separated from read-only summary content.
- Mobile viewport does not overlap text, controls, or cards.
- No admin-only setup instructions are visible to anonymous users.
- No secrets, credentials, private keys, custody details, raw internal notes, or private customer data are visible.

## Forbidden During Evidence Capture

Do not:

- Place an order.
- Cancel an order.
- Join a pool.
- Place a pool bet.
- Resolve or cancel a pool.
- Trigger bot, reference, quote, pause, reset, or emergency-stop actions.
- Execute wallet, deposit, withdrawal, faucet, or funding actions.
- Execute admin operations.
- Use production data or production accounts.
- Capture screenshots containing secrets, real customer data, raw custody details, private keys, or sensitive internal notes.

## Future Evidence File Pattern

Use a dated file under `docs/reviews/`, for example:

```text
MARKET_DETAIL_SCREENSHOT_SMOKE_EVIDENCE_YYYY_MM_DD.md
```

The evidence file should include:

- Safety confirmation.
- Preconditions result.
- Route evidence table.
- Visual findings.
- No-leak observations.
- Failures or limitations.
- Follow-up tasks.

If no safe local fixture exists, record `Not run` rather than forcing evidence from production or sensitive data.

## Auto-Merge Guidance

Docs-only checklist updates may be auto-merged after validation.

Do not auto-merge future market-detail work if it changes:

- `OrderTicket`.
- Order placement or cancellation.
- Open orders, fills, trades, positions, balances, locked funds, or PnL.
- Pool join, bet, resolve, or cancel behavior.
- API endpoints, request payloads, polling, response parsing, or route contracts.
- Reference/liquidity/bot behavior.
- Wallet, deposit, withdrawal, ledger, matching, settlement, admin auth, deployment, Prisma, migrations, package scripts, workflows, executable scripts, secrets, or production config.

## Validation

This checklist is docs-only. Validation:

```bash
git diff --check
```
