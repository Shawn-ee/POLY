# Public Route Smoke Manual-Run Prerequisites

Task id: DOC-060

Phase: Phase B/D/G - Public route smoke readiness and beta evidence

Assigned subagents: TestingAgent, FrontendAgent, SecurityAgent

Risk level: Low for docs-only prerequisites

## Purpose

This document defines the prerequisites for a future local manual public route smoke evidence run.

It does not start a dev server, run browsers, capture screenshots, add Playwright tests, change package scripts, change workflows, change UI, change APIs, deploy, or approve public beta.

## Required Local Preconditions

Before a future manual route smoke run, confirm:

- The branch under test is known and recorded.
- The exact commit SHA is recorded.
- The working tree is clean except for ignored local artifacts.
- The app is running against local/dev data only.
- No production URL is used.
- No production database is used.
- No production secrets, private keys, wallet seeds, API tokens, or deployment credentials are opened or printed.
- No real chain RPC, custody provider, payment provider, exchange, or external credential is required.
- Screenshots, logs, and copied output will be stored only if they contain no secrets, private customer data, raw custody details, or sensitive internal notes.

## Recommended First Route Set

The first manual smoke run should use anonymous routes only:

- `/`
- `/markets`
- `/events`
- `/sports`
- `/sports/soccer`
- `/sports/soccer/world-cup`
- `/login`

Do not include `/wallet`, `/portfolio`, admin routes, bot routes, private pool routes, market-detail fixture routes, or event-detail fixture routes in the first anonymous-only run.

## Deferred Route Sets

These route groups need additional prerequisites before manual smoke evidence:

| Route group | Required prerequisite |
|---|---|
| `/markets/[id]` | Safe local public market fixture and target contract review. |
| `/events/[slug]` | Safe local public event fixture. |
| `/portfolio` | Local test-user auth setup with no production account data. |
| `/wallet` | Local test-user auth setup and explicit beta/funding no-action confirmation. |
| `/admin/*` | Admin auth test plan and human-reviewed local admin fixture. |
| pool/private routes | Human-reviewed UI/action-surface scope. |

## Forbidden Manual Smoke Behavior

Future manual smoke runs must not:

- execute wallet, deposit, withdrawal, faucet, or funding actions
- place orders
- cancel orders
- create fills or trades
- update positions
- execute matching, settlement, or resolution actions
- execute admin operations
- start bot dry-run or live runtime actions
- use production data
- expose secrets in screenshots or logs
- change package scripts, workflows, Playwright config, deployment config, Prisma, migrations, or runtime code

## Evidence Recording Checklist

Use `docs/reviews/PUBLIC_ROUTE_SMOKE_EVIDENCE_TEMPLATE.md` or a dated copy of that template. Record:

- date
- branch
- commit
- local base URL
- route list
- user state
- command or manual steps used
- pass/fail/partial result
- screenshot or artifact path if safe
- empty/loading/error state observations
- no-leak observations
- limitations and deferred routes

For the first anonymous-only run, use `docs/reviews/PUBLIC_ROUTE_SMOKE_ANONYMOUS_CHECKLIST.md` to keep observations limited to public discovery routes and login, with no auth, wallet, funding, trading, admin, bot, fixture, or mutation steps.

## Safe Validation Before Recording Evidence

At minimum, record:

```bash
git diff --check
git status --short
git branch --show-current
git log -1 --oneline
```

If a future PR adds automated smoke tests or commands, use the full validation policy from `docs/TESTING.md` and keep package/workflow changes human-reviewed.

## Auto-Merge Guidance

Docs-only prerequisite updates may be auto-merged after validation.

Do not auto-merge future work that changes:

- `package.json`
- GitHub workflows
- executable scripts
- Playwright config
- source UI code
- API behavior
- auth/admin behavior
- wallet, deposit, withdrawal, ledger, matching, settlement, trading, bot, Prisma, migrations, deployment, secrets, or production behavior

## Non-Goals

This prerequisite document does not:

- run the manual smoke pass
- capture evidence
- add tests
- start a server
- approve public beta
- approve deployment
- approve funding, trading, wallet, admin, or bot readiness
