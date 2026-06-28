# Polymarket World Cup Reference Structure

Updated: 2026-06-28

Reference page inspected: `https://polymarket.com/zh/sports/world-cup/fifwc-rsa-can-2026-06-28`

## Event Header

- The event page is organized around a single fixture/event rather than a flat list of standalone markets.
- Header-level information includes the matchup, scheduled date/time, event status, and event-level navigation context.
- The event page makes it clear whether a market is scheduled, live, closed, or unavailable.
- Volume/liquidity indicators are presented near markets or market groups rather than as hidden diagnostics.

## Combo / Parlay Area

- Combo cards appear above single markets when available.
- A combo is not treated as a fake market row. It is a separate multi-leg surface that references individual outcomes.
- If combo data is unavailable, it should be hidden from the user-facing page rather than rendered as a fake placeholder.

## Category Tabs

Observed/target tab structure for soccer sports pages:

- All
- Match
- Qualify / Advance
- 1st Half
- Corners
- Goals
- Assists
- Shots
- Player Props
- Team Props
- Specials
- Live

Tabs are a browsing/filtering surface. Empty families should not dominate the page; disabled or empty categories can be hidden or shown with zero counts only in admin/debug contexts.

## Market Families

The page structure groups markets into recognizable sportsbook-style families:

- Team to Advance / Qualify
- Moneyline / Match Winner
- Draw No Bet
- Spread / Handicap
- Total Goals
- Both Teams to Score
- First Team to Score
- Team Totals
- 1st Half Result
- 2nd Half Result
- Exact Score
- Corners
- Player props, if data exists

The important structural target is not visual cloning. It is that related markets live together, with line selectors where appropriate, and each outcome has an explicit price/source state.

## Line Selectors

- Spread, total goals, and team total families use line selectors.
- Selecting a line changes which outcomes are shown and which outcome enters the trade ticket.
- A selected line must be visible in the trade ticket.

## Price Display

Required price behavior:

- Outcome prices are shown directly in cents or percentages.
- Bid/ask should be shown when local/internal orderbook liquidity exists.
- Reference prices can be shown when no local liquidity exists, but must be labeled reference-only.
- Stale, unmapped, or missing prices must be explained.
- Fake `50%` or unexplained `-- / --` should not appear as a fallback.

## Implications For Holiwyn

- The World Cup event page should be built from a normalized event-page model, not from raw internal market rows.
- Market families should determine display order and grouping.
- Price source and tradeability need to be first-class fields on every displayed outcome.
- The trade ticket should explain when an outcome is reference-only, stale, unmapped, or missing internal liquidity.

