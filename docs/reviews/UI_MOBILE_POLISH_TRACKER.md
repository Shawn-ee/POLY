# UI Mobile Polish Tracker

Task id: UI-017

Assigned subagents: LeadAgent, FrontendAgent, TestingAgent, SecurityAgent

Risk level: Low for docs-only mobile tracking

Status: Active tracker

## Purpose

This tracker records mobile UI risks and safe next tasks. It does not implement responsive changes, run screenshots, change code, or approve public beta.

## Mobile Rules

- Public pages must be readable in a single column.
- Market and event cards must wrap long titles.
- Buttons must not overflow.
- Dense filters should wrap or move below the header.
- Tables need card alternatives before public beta when user-facing.
- Admin pages may remain desktop-first, but must still avoid broken layouts.

## Route Mobile Status

| Route | Mobile status | Risk | Safe next action |
|---|---|---:|---|
| `/` | Big milestone improved | Low | Add smoke/screenshot evidence. |
| `/sports` | Big milestone improved | Low | Add smoke/screenshot evidence. |
| `/sports/soccer` | Big milestone improved | Low | Add smoke/screenshot evidence. |
| `/sports/soccer/world-cup` | Big milestone improved | Low | Add smoke/screenshot evidence. |
| `/events` | Big milestone improved | Low | Add smoke/screenshot evidence. |
| `/events/[slug]` | Big milestone read-only shell polish | Medium | Human review and screenshot evidence; grouped trade surface is sensitive. |
| `/markets` | Big milestone improved | Low | Add smoke/screenshot evidence, especially filter wrapping. |
| `/markets/[id]` | Big milestone shared header polish | Medium/High | Human review; trade/order surface is sensitive. |
| `/login` | Big milestone improved | Low | Add smoke/screenshot evidence. |
| `/portfolio` | Big milestone display framing; table risk remains | Medium | Mobile card plan before table replacement. |
| `/wallet` | Big milestone beta-safe framing; dense history tables remain | High | Human review before deeper funding/mobile changes. |
| `/my-pools` | Big milestone improved | Medium | Further display-only polish only if scoped. |
| `/create` | Big milestone beta/private-pool framing | Medium | Product decision whether route remains public-facing. |
| `/admin/*` | Desktop-first | High | Admin IA plan before mobile work. |

## Evidence Needed

Safe evidence can include:

- Local screenshots with non-sensitive fixtures.
- Manual route smoke notes.
- Browser viewport notes.
- Docs-only checklists.

Do not capture:

- Production data.
- Secrets.
- Private keys.
- Raw custody details.
- Sensitive customer/admin information.

## Next Mobile Tasks

1. Public route smoke evidence for `/`, `/sports`, `/sports/soccer`, `/sports/soccer/world-cup`.
   - Preparation checklist: `docs/reviews/PUBLIC_ROUTE_SMOKE_ANONYMOUS_CHECKLIST.md`.
2. `/events` card wrapping and empty-state inventory.
3. `/markets` filter wrapping screenshot evidence.
4. `/login` mobile route smoke evidence.
5. `/portfolio` mobile card plan before implementation.

## Validation

This tracker is docs-only. Validation:

```bash
git diff --check
```
