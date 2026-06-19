# Bot Funding Runtime Safety

Date: 2026-06-19

## Executive Summary

Phase 8 reviewed the separation between controlled internal funding beta work in the main POLY app and bot/live-trading runtime behavior in `poly-bot`.

Result: **Ready for funding beta continuation with bot-live warnings**.

The funding monitor and funding APIs in the main app are separate from the bot runners. The app deposit monitor scans Polygon USDC transfer logs and applies ledger-backed deposit credit. It does not place orders, start bots, require bot credentials, use bot private material, or broadcast withdrawals.

The bot repo contains live internal liquidity scripts, but those scripts are gated by explicit dry-run, live-enabled, global kill-switch, mode, runtime readiness, and confirm-live controls. Live bot trading remains **not approved** for this controlled internal funding beta.

## Repositories Reviewed

- Main app repo: `C:\Users\hecto\Desktop\projects\PolyProj\poly`
- Bot repo: `C:\Users\hecto\Desktop\projects\PolyProj\poly-bot`

The bot repo contains a local `live-internal.env` file. It was intentionally not opened or inspected because secret-like local env files must not be printed or reviewed during autonomous work.

## Main App Funding Boundary

Reviewed files:

- `src/lib/deposits/polygonDeposits.ts`
- `src/lib/config.ts`
- `src/app/api/admin/deposits/rescan/route.ts`
- `src/app/api/markets/[id]/reference/route.ts`
- `src/app/api/admin/reference-markets/[id]/route.ts`
- `src/app/api/admin/reference-markets/[id]/seed-bot/route.ts`

Findings:

- `scanPolygonUsdcDeposits` and `creditPolygonDepositIfEligible` call `assertAutoDepositCreditAllowed`.
- Deposit monitor activity depends on funding beta controls, kill switch state, and auto-credit enablement through the app-side funding guard.
- Deposit scanning uses the Polygon RPC provider, configured USDC address, tracked deposit addresses, and ERC-20 `Transfer` logs.
- Deposit crediting flows through `applyDepositTx` and tx/log-index idempotency.
- No bot API client is used by the deposit monitor.
- No order placement or cancellation call is made by the deposit monitor.
- No treasury private key or withdrawal signing flow is used by the deposit monitor.
- Admin deposit rescan is admin-only and delegates to the same guarded scan function.

## Bot Runtime Boundary

Reviewed bot repo files:

- `src/config/botSafety.ts`
- `scripts/checkBotSafety.ts`
- `src/config/loadConfig.ts`
- `src/runner/botRiskManager.ts`
- `scripts/liveReferenceLiquidityMarket.ts`
- `src/referenceMarket/runtimeSupervisor.ts`
- `src/referenceMarket/liveMarketMaker.ts`
- `docs/live-internal-services.md`
- `docs/production-risk-controls.md`
- `docs/agent-safety-policy.md`

Findings:

- Bot execution mode defaults to `dryRun`.
- `POLY_BOTS_ENABLED` defaults to false.
- `POLY_BOTS_LIVE_TRADING` defaults to false.
- `POLY_BOTS_GLOBAL_KILL_SWITCH` defaults to true.
- `POLY_BOTS_MODE` must be `liveInternal` for live internal placement.
- `LIVE_SYSTEM_LIQUIDITY_ENABLED` must be true.
- `SYSTEM_LIQUIDITY_DRY_RUN` must not be true.
- Live reference liquidity runners require explicit live confirmation before live placement.
- Runtime supervisor returns quote previews instead of placement when dry-run is enabled, live orders are disabled, confirm-live is missing, runtime data is missing, lifecycle is not live-enabled, or readiness checks fail.
- Bot risk manager blocks placements for paused, emergency-stop, reduce-only buy, stale-state, order-size, open-order-count, open-order-notional, per-market exposure, global exposure, and inventory-limit conditions.
- Bot docs say live internal services do not perform withdrawals, external fund movement, on-chain transfers, or automatic resolution.

## Funding And Bot Separation

Controlled internal funding beta does not require bot credentials.

The following paths are separate:

- Deposit wallet generation: app-side wallet/funding code.
- Deposit monitor: app-side Polygon USDC log scan and ledger credit.
- Withdrawal request/manual review: app-side withdrawal services and admin routes.
- Bot trading: `poly-bot` strategies and app bot/reference-market admin routes.

No evidence was found that deposit monitoring starts bots, places orders, cancels orders, enables live liquidity, signs treasury transactions, or broadcasts withdrawals.

## Live Bot Status

Live bot trading is **not approved** for controlled internal funding beta.

To avoid accidental enablement, internal beta server configuration should keep:

- `POLY_BOTS_ENABLED=false` unless a separately reviewed bot dry-run service is needed.
- `POLY_BOTS_LIVE_TRADING=false`.
- `POLY_BOTS_GLOBAL_KILL_SWITCH=true`.
- `POLY_BOTS_MODE=dryRun`.
- `LIVE_SYSTEM_LIQUIDITY_ENABLED=false`.
- `SYSTEM_LIQUIDITY_DRY_RUN=true`.

If bot dry-run monitoring is enabled later, it should be treated as a separate operational lane from funding.

## Bot Credentials

Bot credentials are not required for the controlled internal funding beta funding monitor.

Bot credentials are required only for bot trading or live liquidity services. Those services remain out of scope for this funding beta and require separate owner approval and specialist review before live use.

## Risks And Warnings

- `poly-bot` contains live trading scripts by design. They are gated, but they are still high risk and must not be started during funding beta deployment.
- The local bot repo contains `live-internal.env`; this file may contain operational values and was not inspected.
- App admin reference-market routes can mark bot lifecycle states, but they are admin-only and unrelated to deposit monitor execution.
- The open Phase 4 PR #220 remains the funding UI entry-point PR and still needs human/specialist review before merge.

## Validation

Docs-only change.

Validation required:

- `git diff --check`
- `git diff --cached --check`

No npm, Prisma, TypeScript, or Jest validation is required for this docs-only review.

## Recommendation

Proceed to Phase 9 funding evidence and go/no-go documentation after this docs-only review is merged.

Do not start live bot services as part of internal funding beta deployment.
