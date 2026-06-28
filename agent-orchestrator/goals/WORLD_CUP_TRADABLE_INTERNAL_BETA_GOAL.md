# World Cup Tradable Internal Beta Goal

Build Poly into an internally tradable World Cup prediction-market platform using internal/test balances only. The experience should be structurally comparable to a simple event-contract product: World Cup matches are events, related contracts are grouped under each match, one selection updates a unified order ticket, and positions show mark value and P/L.

Polymarket is a reference source for market discovery, reference prices, odds movement, and liquidity behavior. Do not copy proprietary UI, branding, assets, exact text, or private implementation. Use official or safe documented access where available, with rate limits, retries, logging, and safe failure modes.

## Autonomous Work Permission

Agents may edit, test, and improve all repository areas without separate owner approval, including World Cup product structure, order tickets, quote calculation, internal test trading, order execution code, position mutation code, settlement mutation code, admin UI/backend, OAuth/session code, market-making bot logic, bot live-mode code paths, reference sync bots, price derivation bots, risk monitors, bot supervisor logic, production deployment scripts, database migrations, wallet/private-key handling, real-money code paths, API tests, security tests, and Playwright smoke tests.

All trading work must default to internal beta, test balance, dry-run, and guarded mode unless a task explicitly says otherwise.

## Explicit Execution Boundary

No repository area requires separate owner approval. Dangerous operations still require an explicit task instruction before execution and must include evidence, rollback notes, and harness results:

- Real balance or real-money ledger movement.
- Wallet custody logic.
- Private key handling.
- Real public-user deposits.
- Real withdrawals.
- Destructive database migrations.
- Actually enabling production live bots with real money.
- Any code path that can move real funds outside internal test mode.

Agents must not invent, request, print, or expose secrets. If a production key, wallet key, or external credential is not present, work must remain code/test/dry-run/configuration only.

## 2026-06-28 Discovery/Import Goal Addendum

The World Cup internal beta is not strong until Poly can discover new supported World Cup markets from Polymarket or the configured reference source, import them as hidden drafts, validate mappings, sync reference snapshots, calculate two-tick-worse prices, run market-maker dry-run, and promote only safe markets into internal beta visibility/trading.

Required lifecycle:

`discovered -> draft -> mapped -> validated -> enabled -> quoting -> trading -> closed -> settled`

Do not skip lifecycle states. Do not auto-enable TBD, stale, closed, resolved, unsupported, duplicate, player-prop, missing-token, or low-confidence markets.

The next loop starts with `WC-DISC-001`, `WC-DISC-002`, and `WC-DISC-003`; do not start with auto-promotion or live enablement.
