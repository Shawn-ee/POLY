# Public Route Smoke Anonymous Checklist

Task id: UI-012A

Phase: Phase UI/G - Public route smoke evidence preparation

Assigned subagents: TestingAgent, FrontendAgent, SecurityAgent

Risk level: Low for docs-only checklist

## Purpose

This checklist defines the exact observations to record during a future local-only anonymous public route smoke pass.

It does not start a dev server, open a browser, capture screenshots, add tests, change package scripts, change workflows, change UI, change APIs, deploy, approve public beta, or alter wallet, ledger, trading, admin, bot, Prisma, migration, secret, or production behavior.

## Required Preconditions

Before using this checklist, confirm the prerequisites in `docs/reviews/PUBLIC_ROUTE_SMOKE_MANUAL_RUN_PREREQUISITES.md`.

At minimum:

- Use a local URL only.
- Use anonymous user state only.
- Use local/dev data only.
- Keep the route set limited to public discovery and login pages.
- Do not use production accounts, production databases, production URLs, production secrets, private keys, wallet seeds, API tokens, real chain RPC, custody providers, payment providers, or exchanges.
- Do not execute wallet, funding, trading, admin, bot, or mutation actions.

## Anonymous Route Set

| Route | Required observation | No-leak observation | Mobile observation | Defer if |
|---|---|---|---|---|
| `/` | Page loads, sports-first entry points are visible, and beta context is present. | No admin controls, funding prompts, bot controls, secret values, or internal operational notes are visible. | Header, calls to action, featured sections, and cards fit without horizontal overflow. | The local app cannot load public data safely. |
| `/markets` | Market list or safe empty state renders, filters are understandable, and no-price fallbacks are clear. | No private liquidity controls, admin actions, wallet balances, bot internals, or hidden market metadata are exposed. | Filter groups wrap cleanly and cards remain readable. | Route depends on unsafe production data. |
| `/events` | Event list or safe empty state renders, and event status/timing copy is understandable. | No admin, funding, bot, private pool, or internal controls are visible. | Event cards wrap long names without clipping. | Route depends on unsafe production data. |
| `/sports` | Sports discovery page renders and points users toward public sports paths. | No admin, funding, bot, wallet, or operational controls are visible. | Sport tiles, links, and empty states fit in one column. | Public sports data cannot load safely. |
| `/sports/soccer` | Soccer discovery page renders with safe event or empty-state copy. | No private market controls, internal notes, or bot/reference controls are visible. | Event groups and market links wrap without overflow. | Public sports data cannot load safely. |
| `/sports/soccer/world-cup` | World Cup page renders with non-demo, beta-safe framing. | No admin, funding, bot, or internal fixture details are visible. | Hero/header copy and route cards remain readable. | Public sports data cannot load safely. |
| `/login` | Login entry renders with beta-safe account copy and no confusing production claim. | No provider secrets, callback details, admin paths, or internal auth diagnostics are visible. | Form/buttons fit and error area has room to render. | Login route requires unsafe credentials to view. |

## Observations To Record Per Route

Use `docs/reviews/PUBLIC_ROUTE_SMOKE_EVIDENCE_TEMPLATE.md` or a dated evidence copy and record:

- Result: pass, fail, partial, or not run.
- Visible loading, empty, and error state behavior if encountered.
- Whether page copy follows `docs/reviews/UI_STATE_TERMINOLOGY_MAP.md`.
- Whether layout is readable at desktop width.
- Whether layout is readable at mobile width.
- Whether viewport observations follow `docs/reviews/PUBLIC_ROUTE_SMOKE_MOBILE_VIEWPORT_CHECKLIST.md`.
- Whether any admin, funding, wallet, bot, secret, internal, or production-data leak is visible.
- Screenshot or artifact path only if the artifact is local, non-sensitive, and explicitly safe to keep.
- Any deferred routes and the reason.

## Forbidden Actions

During this anonymous route pass, do not:

- sign in
- open portfolio, wallet, private pool, market-detail fixture, event-detail fixture, or admin routes
- click buy, sell, order, cancel, resolve, deposit, withdraw, faucet, rescan, complete, reject, import, quote, pause, reset, emergency-stop, or bot controls
- submit forms
- mutate local or remote data
- print environment variables or secrets
- capture screenshots that contain secrets, customer data, raw custody details, private keys, tokens, or production data

## Stop Conditions

Stop the smoke run and record `Blocked` or `Not run` if:

- the app points at a production URL or production database
- any required step would reveal a secret or private customer data
- any route requires a real account, real wallet, real payment provider, real chain RPC, exchange credential, or admin credential
- a route requires a mutation to proceed
- a screenshot would include sensitive data that cannot be safely redacted

## Evidence Outcome

This checklist can support only local anonymous route evidence. Passing it does not approve:

- public beta launch
- production deployment
- real funding
- wallet custody
- trading, matching, settlement, or ledger readiness
- admin auth readiness
- bot live or dry-run readiness

## Validation

This checklist is docs-only. Validation:

```bash
git diff --check
```
