# Homepage Wallet/Admin Surface Decision

Task id: UI-011

Assigned subagents: LeadAgent, FrontendAgent, PlannerAgent, SecurityAgent, LedgerWalletReviewerAgent

Risk level: Low for docs-only decision packet; medium/high for future wallet, funding, or admin UI implementation.

Status: Planning-only. This document does not change homepage UI code, navigation, auth behavior, wallet behavior, funding, ledger, matching, settlement, trading, admin auth, bot behavior, deployment, Prisma, migrations, package scripts, workflows, secrets, or production behavior.

## Purpose

The homepage should remain a sports-first public discovery surface. It should not become a wallet dashboard, admin console shortcut board, or funding entry point.

This decision packet records how wallet and admin concepts should be handled before any future homepage code PR changes those surfaces.

## Current Decision

For the public beta path, `/` should prioritize:

1. Sports-first product framing.
2. Public event/market discovery.
3. Internal beta and test-credit context.
4. A simple sign-in or account continuation path.
5. Safe links to sports and markets.

The homepage should not promote:

- Deposits.
- Withdrawals.
- Wallet funding.
- Admin operations.
- Bot/reference operations.
- Private pool creation as the default MVP path.
- Advanced filters that duplicate `/markets`.

## Surface Placement Rules

| Surface | Homepage placement | Preferred route/surface | Reason |
|---|---|---|---|
| Sports discovery | Primary | `/sports`, `/sports/soccer`, `/sports/soccer/world-cup` | Sports is the MVP entry path. |
| All-market browsing | Secondary | `/markets` | Keeps homepage simple while preserving full browse depth. |
| Event browsing | Preview or secondary | `/events`, event detail routes | Supports discovery without duplicating the full event browser. |
| Portfolio/account hint | Small logged-in hint only | `/portfolio` | Portfolio is the account home; homepage should not show detailed balances. |
| Wallet balance | Avoid detailed display | `/wallet` | Balance/funding wording is high-risk and can imply money movement readiness. |
| Deposits/withdrawals | Not shown | `/wallet`, admin finance routes after review | Funding is gated and human-reviewed. |
| Admin tools | Not normal content | Admin-only nav/account menu | Admin access should stay internal and role-gated. |
| Bot/reference controls | Not shown | `/admin/reference-markets`, `/admin/bots` | Bot/liquidity controls are internal and high-risk. |
| Private pools | Not primary MVP CTA | `/my-pools`, `/create` if product-approved | Private pools are a separate/delayed product track. |

## Anonymous Homepage State

Anonymous users should see:

- Sports-first discovery copy.
- Internal beta/test-credit context.
- Browse actions to sports/events/markets.
- Optional sign-in CTA that does not block read-only browsing.

Anonymous users should not see:

- Wallet balances.
- Deposit or withdrawal CTAs.
- Admin shortcuts.
- Bot/reference controls.
- Internal setup instructions.

## Logged-In Homepage State

Logged-in users may see:

- The same sports-first discovery path.
- A compact account continuation link such as `View portfolio`.
- A beta-safe account hint if already available without adding new data fetching or calculations.

Logged-in users should not see:

- Deposit or withdrawal controls.
- Detailed wallet balances on the homepage.
- External wallet balances.
- Funding readiness claims.
- Admin tools unless role-gated navigation already exposes admin access outside the main content.

## Admin Homepage State

Admin users may need a route to internal tools, but the normal homepage content should not look like an operations dashboard.

Preferred pattern:

- Keep public homepage content identical or nearly identical for admins.
- Put admin access in admin-only navigation, account menus, or an internal operations page.
- Do not mix admin operation cards into public discovery sections.

Future admin homepage changes require SecurityAgent review if they change visibility, route access, auth checks, or operation affordances.

## Future Homepage Code PR Boundary

Allowed for a future display-only homepage PR:

- Remove or de-emphasize wallet/admin concepts from the homepage.
- Replace detailed account data with a simple portfolio link.
- Keep beta-safe support copy aligned with `UI_COPY_TERMINOLOGY_GUIDE.md`.
- Use `UI_STATE_TERMINOLOGY_MAP.md` for loading, empty, error, and signed-out copy.
- Preserve existing public route browsing behavior.

Forbidden without human review:

- Changing wallet, balance, deposit, withdrawal, or faucet behavior.
- Changing admin visibility, auth checks, or admin route access.
- Changing API calls, request payloads, or data fetching semantics.
- Adding funding CTAs or production money-movement claims.
- Changing order, trade, position, ledger, matching, settlement, bot, deployment, Prisma, migration, package, workflow, script, or secret behavior.

## Recommended Split

| Task | Scope | Auto-merge default |
|---|---|---|
| UI-011A | Homepage account/admin surface code cleanup, display-only | Review-gated by default |
| UI-011B | Homepage route smoke/screenshot evidence | Docs-only/evidence yes if local-safe |
| UI-011C | Navigation/account-menu admin visibility review | Human review |
| UI-011D | Wallet or funding homepage CTA changes | Not autonomous |

## Acceptance Criteria For Future Code

A future homepage code PR may be considered only if it:

- Changes only homepage display/copy or safe shared presentation components.
- Does not add or alter wallet, funding, admin, bot, order, trade, or account-data behavior.
- Leaves anonymous public browsing intact.
- Keeps `/sports` as the primary CTA and `/markets` as the secondary browse path.
- Runs full validation and focused lint.
- Includes local-safe visual evidence if screenshots are captured.

## Validation

This decision packet is docs-only. Validation:

```bash
git diff --check
```
