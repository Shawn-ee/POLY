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
| `/` | Improved first pass | Low | Add smoke/screenshot evidence. |
| `/sports` | Improved copy only | Low | Add smoke/screenshot evidence. |
| `/sports/soccer` | Improved copy only | Low | Add smoke/screenshot evidence. |
| `/sports/soccer/world-cup` | Improved copy only | Low | Add smoke/screenshot evidence. |
| `/events` | Improved first pass | Low | Add smoke/screenshot evidence. |
| `/events/[slug]` | Unknown | Medium | Plan first; grouped trade surface is sensitive. |
| `/markets` | Unknown | Low/Medium | Inventory filters and card wrapping. |
| `/markets/[id]` | Unknown | Medium/High | Plan first; trade/order surface is sensitive. |
| `/login` | Improved first pass | Low | Add smoke/screenshot evidence. |
| `/portfolio` | Table risk | Medium | Mobile card plan before code. |
| `/wallet` | Dense/beta-sensitive | High | Funding-claim review before mobile polish. |
| `/my-pools` | Improved first pass | Medium | Further display-only polish only if scoped. |
| `/create` | Dense form | Medium | Delay or docs-only plan. |
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
2. `/events` card wrapping and empty-state inventory.
3. `/markets` filter wrapping inventory.
4. `/login` mobile copy polish.
5. `/portfolio` mobile card plan before implementation.

## Validation

This tracker is docs-only. Validation:

```bash
git diff --check
```
