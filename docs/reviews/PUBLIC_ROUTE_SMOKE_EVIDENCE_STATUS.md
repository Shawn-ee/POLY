# Public Route Smoke Evidence Status

Task id: DOC-054

Phase: Phase B/D/G - Public route smoke readiness and beta evidence

Assigned subagents: TestingAgent, SecurityAgent, FrontendAgent

Risk level: Low for docs-only status

## Purpose

This status document records the current public route/page smoke evidence state before any package script, workflow, Playwright, or UI implementation change is proposed.

It does not run browsers, start a server, add tests, change UI, change APIs, change package scripts, change workflows, deploy, or approve beta launch.

## Current Status

| Area | Status | Evidence |
|---|---|---|
| Smoke evidence plan | Ready | `docs/reviews/PUBLIC_ROUTE_PAGE_SMOKE_EVIDENCE_PLAN.md` |
| Evidence template | Ready | `docs/reviews/PUBLIC_ROUTE_SMOKE_EVIDENCE_TEMPLATE.md` |
| Command scope | Ready | `docs/reviews/PUBLIC_ROUTE_SMOKE_COMMAND_SCOPE.md` |
| Anonymous manual checklist | Ready | `docs/reviews/PUBLIC_ROUTE_SMOKE_ANONYMOUS_CHECKLIST.md` |
| Dedicated route smoke command | Not implemented | Package/script/workflow changes require human-reviewed PR. |
| Browser/Playwright smoke run | Not run | No safe local run artifact has been recorded yet. |
| Screenshot evidence | Not recorded | Future screenshots must use local safe data only. |
| CI promotion | Not approved | Any CI/package/workflow lane remains human-reviewed. |

## Candidate First Manual Evidence Run

The first manual smoke evidence run should be local-only and anonymous-only:

| Route | User state | Current evidence status | Notes |
|---|---|---|---|
| `/` | anonymous | Not run | Should verify no admin, funding, bot, or internal controls leak. |
| `/markets` | anonymous | Not run | Should verify public list or safe empty state. |
| `/events` | anonymous | Not run | Should verify public event list or safe empty state. |
| `/sports` | anonymous | Not run | Core MVP sports-first route. |
| `/sports/soccer` | anonymous | Not run | Core MVP soccer route. |
| `/sports/soccer/world-cup` | anonymous | Not run | Core MVP World Cup route. |
| `/login` | anonymous | Not run | Should remain simple and not expose internal auth details. |

Routes that require fixtures or auth should be deferred:

| Route | Reason to defer |
|---|---|
| `/markets/[id]` | Requires a safe local public market fixture and an agreed target contract. |
| `/events/[slug]` | Requires a safe local event fixture. |
| `/portfolio` | Requires local test-user auth; do not use production accounts. |
| `/wallet` | Wallet/funding-adjacent and high-risk by topic; evidence only, no funding actions. |

## Required Safety Notes For Future Evidence

Future smoke evidence must confirm:

- No production secrets were opened or printed.
- No production data or real customer data was used.
- No real chain RPC, custody provider, payment provider, or external credential was required.
- No wallet, deposit, withdrawal, faucet, or funding action was executed.
- No order placement, order cancellation, fill, trade, matching, settlement, or position mutation was executed.
- No admin operation was executed.
- No bot live or dry-run runtime action was executed.
- Screenshots and logs do not expose private keys, tokens, credentials, raw custody details, private customer data, or sensitive internal notes.

## Implementation Boundary

Future route smoke implementation should be split into reviewable lanes:

1. **Manual evidence lane**: run locally with safe data and record results using `docs/reviews/PUBLIC_ROUTE_SMOKE_EVIDENCE_TEMPLATE.md`.
2. **Test-only lane**: add local-only mocked/read-only smoke tests without package or workflow changes where possible.
3. **Package script lane**: add `package.json` smoke command only through human-reviewed PR.
4. **CI lane**: add workflow requirements only through human-reviewed PR after the command is stable.

## Auto-Merge Guidance

Docs-only status updates like this document may be auto-merged after validation.

Do not auto-merge future smoke work if it changes:

- `package.json`
- GitHub workflows
- executable scripts
- Playwright config
- production/deployment config
- runtime UI behavior
- API behavior
- auth/admin behavior
- wallet, deposit, withdrawal, ledger, matching, settlement, trading, bot, Prisma, migrations, secrets, or production behavior

## Next Recommended Step

Run a future local-only manual evidence pass only after a safe local dev server and safe test data are available. Use `docs/reviews/PUBLIC_ROUTE_SMOKE_ANONYMOUS_CHECKLIST.md` for the first anonymous route set, then record the results in a copy of `docs/reviews/PUBLIC_ROUTE_SMOKE_EVIDENCE_TEMPLATE.md` or a dated evidence file under `docs/reviews/`.

## Non-Goals

This status does not:

- add tests
- run tests
- run browsers
- start a dev server
- add screenshots
- change UI
- change API behavior
- change package scripts
- change workflows
- deploy
- approve public beta
- alter wallet, deposit, withdrawal, ledger, matching, settlement, trading, admin auth, bot, Prisma, migrations, secrets, or production behavior
