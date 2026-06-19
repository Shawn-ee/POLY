# UI Page Status Matrix

Task id: UI-014

Assigned subagents: LeadAgent, FrontendAgent, PlannerAgent, SecurityAgent

Risk level: Low for docs-only inventory

Status: Active page matrix

## Purpose

This matrix tracks the UI standardization state of every major route. It does not change routes, UI code, APIs, auth, wallet, ledger, trading, admin behavior, bots, deployment, Prisma, migrations, or production settings.

## Status Legend

- Done: current safe standardization pass is complete.
- Needs display polish: route can receive small display-only UI work.
- Needs state polish: loading, empty, error, or signed-out states need work.
- Needs mobile polish: layout may be hard to scan on mobile.
- Needs copy cleanup: terminology, beta copy, or CTA hierarchy needs work.
- Human-review only: autonomous work should stay docs-only or leave code PRs open.
- Blocked: requires business, funding, trading, auth, deployment, or product decision.

## Public And User Routes

| Route | Current status | Primary issue | Safe next action | Auto-merge default |
|---|---|---|---|---|
| `/` | Done for first pass | Wallet/admin concepts still exist on page. | Docs-only decision before removing concepts. | Maybe |
| `/sports` | Done for first pass | Needs smoke/screenshot evidence. | Public route smoke evidence. | Docs-only yes |
| `/sports/soccer` | Done for first pass | Needs smoke/screenshot evidence. | Public route smoke evidence. | Docs-only yes |
| `/sports/soccer/world-cup` | Done for first pass | Needs smoke/screenshot evidence. | Public route smoke evidence. | Docs-only yes |
| `/events` | Done for first pass | Needs smoke/screenshot evidence. | Public route smoke evidence. | Docs-only yes |
| `/events/[slug]` | Planned/review-gated | Event detail includes grouped/trade behavior. | Only small loading/error/empty or metadata display PRs after UI-018. | No by default |
| `/markets` | Done for first pass | Needs smoke/screenshot evidence. | Public route smoke evidence. | Docs-only yes |
| `/markets/[id]` | Planned/review-gated | Market detail can touch trade/order, pool, position, bot, and wallet-adjacent behavior. | Screenshot/smoke checklist or small read-only shell PR only after UI-019. | No by default |
| `/login` | Done for first pass | Needs smoke/screenshot evidence. | Public route smoke evidence. | Docs-only yes |
| `/portfolio` | Human-review only | Account state and positions are calculation-adjacent. | Empty/mobile state plan before code. | No by default |
| `/wallet` | Human-review only | Funding copy can imply production readiness. | Funding-claim review before code. | No |
| `/create` | Needs copy cleanup | Private pools are delayed/post-MVP. | Hide/delay docs or display-only framing. | No by default |
| `/my-pools` | Done for first pass | Optional private-pool surface. | Further work only if small/display-only. | Maybe if strict |
| `/pool/[id]` | Done/hidden | Compatibility route only. | No UI work unless surfaced. | Maybe docs-only |

## Admin And Internal Routes

| Route | Current status | Primary issue | Safe next action | Auto-merge default |
|---|---|---|---|---|
| `/admin` | Human-review only | Dense market operations console. | Admin IA display plan. | No by default |
| `/admin/deposits` | Human-review only | Funding/reconciliation high risk. | Docs/screenshot requirements only. | No |
| `/admin/withdrawals` | Human-review only | Withdrawal operations critical risk. | Docs/screenshot requirements only. | No |
| `/admin/reference-markets` | Human-review only | Reference and bot/liquidity concerns overlap. | Split curation vs bot controls plan. | No |
| `/admin/bots` | Human-review only | Dry-run/live state must be explicit. | Display review/runbook docs first. | No |
| `/admin/agents` | Needs copy cleanup | Agent status should not imply production autonomy. | Display-only copy if narrow. | No by default |
| `/admin/system` | Human-review only | Readiness severity needs clearer hierarchy. | Display plan first. | No |
| `/admin/markets/[marketId]/invariants` | Human-review only | Financial invariants are high risk. | Keep review-gated. | No |

## Completed UI PRs

| PR | Route/surface | Result |
|---|---|---|
| #154 | `/my-pools` | Private pool list display polish and lint-safe initial load. |
| #158 | `/` | Sports-first beta copy and homepage CTA simplification. |
| #160 | `/sports`, `/sports/soccer`, `/sports/soccer/world-cup` | Sports discovery copy polish and non-demo World Cup framing. |
| #163 | `/events` | Events list display/state polish. |
| #164 | `/login` | Beta-safe login display polish. |
| #166 | `/markets` | Markets discovery display polish and beta-safe empty/fallback states. |

## Next Queue

1. Public route smoke evidence for `/`, `/sports`, `/events`, `/markets`, `/login`.
2. Portfolio/account display plan before code.
3. Wallet funding-claim review before code.
4. Event detail loading/error/empty display-only scope after UI-018.
5. Market detail screenshot/smoke checklist before code.

## Validation

This matrix is docs-only. Validation:

```bash
git diff --check
```
