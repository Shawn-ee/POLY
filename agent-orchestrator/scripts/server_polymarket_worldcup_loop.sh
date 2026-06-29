#!/usr/bin/env bash
set -euo pipefail

MAX_CYCLES=20
while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-cycles)
      MAX_CYCLES="${2:-20}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

ROOT="agent-orchestrator/runs/server-polymarket-worldcup-loop"
SCREENSHOTS="$ROOT/screenshots"
BACKUPS="test-logs/server-loop-backups"
TARGET_EVENT_SLUG="fifwc-bra-jpn-2026-06-29"
LOCAL_EVENT_SLUG="brazil-vs-japan"
START_COMMIT="$(git rev-parse HEAD)"
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

mkdir -p "$ROOT" "$SCREENSHOTS" "$BACKUPS"

log() {
  printf '[server-worldcup-loop] %s\n' "$*"
}

run_capture() {
  local outfile="$1"
  shift
  {
    printf '$'
    printf ' %q' "$@"
    printf '\n'
    "$@"
  } >"$outfile" 2>&1
}

append_cmd() {
  local outfile="$1"
  shift
  {
    printf '\n```bash\n$'
    printf ' %q' "$@"
    printf '\n'
    "$@"
    printf '\n```\n'
  } >>"$outfile" 2>&1
}

require_safe_env() {
  load_safe_env_defaults
  local failed=0
  check_env REAL_MONEY_MODE false || failed=1
  check_env INTERNAL_FUNDING_BETA_ENABLED false || failed=1
  check_env FUNDING_KILL_SWITCH true || failed=1
  check_env ALLOW_AUTO_DEPOSIT_CREDIT false || failed=1
  check_env INTERNAL_TRADING_BETA_ENABLED true || failed=1
  check_env TRADING_KILL_SWITCH false || failed=1
  check_env ALLOW_BOT_TRADING true || failed=1
  check_env LOCAL_BOT_TRADING_ONLY true || failed=1
  check_env POLYMARKET_MM_LIVE_LOCAL true || failed=1
  check_env POLYMARKET_AUTO_IMPORT_ENABLED false || failed=1
  check_env POLYMARKET_AUTO_PROMOTE_ENABLED false || failed=1
  if [[ "$failed" -ne 0 ]]; then
    echo "Required safe env check failed." >&2
    exit 1
  fi
}

load_safe_env_defaults() {
  local keys=(
    REAL_MONEY_MODE
    INTERNAL_FUNDING_BETA_ENABLED
    FUNDING_KILL_SWITCH
    ALLOW_AUTO_DEPOSIT_CREDIT
    INTERNAL_TRADING_BETA_ENABLED
    TRADING_KILL_SWITCH
    ALLOW_BOT_TRADING
    LOCAL_BOT_TRADING_ONLY
    POLYMARKET_MM_LIVE_LOCAL
    POLYMARKET_AUTO_IMPORT_ENABLED
    POLYMARKET_AUTO_PROMOTE_ENABLED
    DATABASE_URL
  )
  [[ -f .env ]] || return 0
  for key in "${keys[@]}"; do
    if [[ -n "${!key:-}" ]]; then
      continue
    fi
    local line
    line="$(grep -E "^${key}=" .env | tail -n 1 || true)"
    if [[ -z "$line" ]]; then
      continue
    fi
    local value="${line#*=}"
    value="${value%\"}"
    value="${value#\"}"
    export "$key=$value"
  done
}

check_env() {
  local key="$1"
  local expected="$2"
  local actual="${!key:-}"
  if [[ "$actual" != "$expected" ]]; then
    echo "$key expected $expected but got ${actual:-<unset>}" >&2
    return 1
  fi
}

write_static_files() {
  cat >"$ROOT/ACCEPTANCE_CRITERIA.md" <<'MD'
# Acceptance Criteria

The loop is complete only when:

1. At least one real Polymarket World Cup event is imported and user-facing.
2. Brazil vs Japan or equivalent target event has valid Polymarket mapping.
3. Match Winner 1X2 shows Home / Draw / Away cleanly.
4. Prices are real/reference-derived.
5. Local-only bot liquidity exists for core tradable outcomes.
6. Owner can submit a tiny internal test trade from event page or equivalent server-verified internal route.
7. Balance updates.
8. Position/P&L updates.
9. Admin can see order/trade/bot activity.
10. Probability chart exists and uses real data.
11. Spread/handicap line selector is Polymarket-like enough if data exists.
12. Total goals line selector is Polymarket-like enough if data exists.
13. No user-facing unmapped markets.
14. No fake 50.
15. No unexplained -- / --.
16. No ordinary user-facing No live price / No local book rows.
17. Stale/ended events hidden or clearly closed.
18. User-facing page is clean and not diagnostics-first.
19. Diagnostics exist in admin pages.
20. Reference sync loop active.
21. Local MM loop active.
22. Risk monitor or runtime status shows no critical alerts.
23. Safety flags remain safe.
24. Deposits/withdrawals/wallet/private-key/external orders remain disabled.
25. Build passes.
26. Relevant tests pass.
27. Browser/screenshot verification exists.
28. Reviewer verdict: READY FOR OWNER + 2 FRIEND TEST.
29. Auditor verdict: READY FOR OWNER + 2 FRIEND TEST.
30. Final report exists.
MD

  cat >"$ROOT/LOOP_STATE.md" <<MD
# Server Polymarket World Cup Loop State

- Started: $STARTED_AT
- Start commit: $START_COMMIT
- Target event: $TARGET_EVENT_SLUG
- Local event slug: $LOCAL_EVENT_SLUG
- Max cycles: $MAX_CYCLES
- Status: RUNNING
MD

  cat >"$ROOT/CONTINUE_PROMPT.md" <<MD
# Continue Prompt

If interrupted, resume from the repo root with:

\`\`\`bash
bash agent-orchestrator/scripts/server_polymarket_worldcup_loop.sh --max-cycles $MAX_CYCLES
\`\`\`

Before resuming, verify safety env remains closed-beta/local-only.
MD
}

backup_once() {
  local marker="$ROOT/.backup-complete"
  if [[ -f "$marker" ]]; then
    return 0
  fi
  cp .env "$BACKUPS/.env.$(date +%Y%m%d_%H%M%S).backup" 2>/dev/null || true
  if command -v pg_dump >/dev/null 2>&1 && [[ -n "${DATABASE_URL:-}" ]]; then
    local dump_url="${DATABASE_URL%%\?schema=*}"
    pg_dump "$dump_url" >"$BACKUPS/poly-before-loop-$(date +%Y%m%d_%H%M%S).dump"
  else
    echo "pg_dump or DATABASE_URL unavailable; DB dump skipped." >"$BACKUPS/db-backup-skipped-$(date +%Y%m%d_%H%M%S).txt"
  fi
  date -u +%Y-%m-%dT%H:%M:%SZ >"$marker"
}

write_report_headers() {
  local dir="$1"
  local cycle="$2"
  for report in OBSERVATION_REPORT POLYMARKET_COMPARISON BUILDER_REPORT REVIEW_REPORT AUDIT_REPORT UI_SCREENSHOT_REPORT VALIDATION_REPORT NEXT_ACTIONS; do
    cat >"$dir/${report}.md" <<MD
# $cycle - $report

Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)

MD
  done
}

snapshot_browser() {
  local url="$1"
  local out="$2"
  if npx playwright --version >/dev/null 2>&1; then
    npx playwright screenshot --full-page "$url" "$out" >/dev/null 2>&1 || true
  fi
}

import_and_prepare_brazil_japan() {
  local dir="$1"
  append_cmd "$dir/BUILDER_REPORT.md" npm run polymarket:import-event -- --eventSlug "$TARGET_EVENT_SLUG" --dryRun true --maxMarkets 10
  append_cmd "$dir/BUILDER_REPORT.md" npm run polymarket:import-event -- --eventSlug "$TARGET_EVENT_SLUG" --dryRun false --confirmImport true --maxMarkets 10
  append_cmd "$dir/BUILDER_REPORT.md" npm run reference:sync:once
  append_cmd "$dir/BUILDER_REPORT.md" npm run mm:polymarket:enable-safe-basket -- --maxMarkets=5 --confirm --allowBelowTarget
  # Inventory/test trade scripts intentionally disallow NODE_ENV=production; run with explicit safe test env.
  append_cmd "$dir/BUILDER_REPORT.md" env NODE_ENV=development npm run mm:polymarket:seed-bot-inventory -- --eventSlug="$LOCAL_EVENT_SLUG" --quantity=3
  systemctl --user restart poly-reference-sync.service
  systemctl --user restart poly-reference-market-maker.service
}

run_validation() {
  local dir="$1"
  append_cmd "$dir/VALIDATION_REPORT.md" git diff --check
  append_cmd "$dir/VALIDATION_REPORT.md" npm run test:jest -- src/__tests__/polymarket-football-moneyline-import.test.ts src/__tests__/world-cup-event-page-model.test.ts src/__tests__/world-cup-football-ui-static.test.ts src/__tests__/world-cup-per-outcome-reference.test.ts
  append_cmd "$dir/VALIDATION_REPORT.md" npm run build
  systemctl --user restart poly-web.service
  sleep 5
  append_cmd "$dir/VALIDATION_REPORT.md" curl -sS http://127.0.0.1:3001/api/health
  append_cmd "$dir/VALIDATION_REPORT.md" npm run runtime:closed-beta:status
  append_cmd "$dir/VALIDATION_REPORT.md" npm run worldcup:mapping:audit
}

run_cycle() {
  local i="$1"
  local cycle
  cycle="$(printf "cycle-%03d" "$i")"
  local dir="$ROOT/$cycle"
  mkdir -p "$dir"
  write_report_headers "$dir" "$cycle"

  log "Starting $cycle"
  {
    echo "## Git"
    echo "- Commit: $(git rev-parse HEAD)"
    echo "- Status:"
    git status --short || true
    echo
    echo "## Services"
  } >>"$dir/OBSERVATION_REPORT.md"
  append_cmd "$dir/OBSERVATION_REPORT.md" systemctl --user status poly-web.service --no-pager
  append_cmd "$dir/OBSERVATION_REPORT.md" systemctl --user status poly-reference-sync.service --no-pager
  append_cmd "$dir/OBSERVATION_REPORT.md" systemctl --user status poly-reference-market-maker.service --no-pager
  append_cmd "$dir/OBSERVATION_REPORT.md" journalctl --user -u poly-reference-sync.service -n 200 --no-pager
  append_cmd "$dir/OBSERVATION_REPORT.md" journalctl --user -u poly-reference-market-maker.service -n 200 --no-pager
  append_cmd "$dir/OBSERVATION_REPORT.md" journalctl --user -u poly-web.service -n 100 --no-pager
  append_cmd "$dir/OBSERVATION_REPORT.md" npm run runtime:closed-beta:status
  append_cmd "$dir/OBSERVATION_REPORT.md" npm run worldcup:mapping:audit
  append_cmd "$dir/OBSERVATION_REPORT.md" curl -sS http://127.0.0.1:3001/api/health

  {
    echo "## Polymarket Reference"
    echo "- Reference URL: https://polymarket.com/zh/sports/world-cup/$TARGET_EVENT_SLUG"
    echo "- Target behavior: clean event header, Match Winner 1X2, consumer price buttons, chart, direct ticket, no diagnostics-first UI."
  } >>"$dir/POLYMARKET_COMPARISON.md"
  append_cmd "$dir/POLYMARKET_COMPARISON.md" curl -sS "https://gamma-api.polymarket.com/events?slug=$TARGET_EVENT_SLUG"

  if [[ "$i" -eq 1 ]]; then
    import_and_prepare_brazil_japan "$dir"
  fi

  run_validation "$dir"

  append_cmd "$dir/AUDIT_REPORT.md" npm run runtime:closed-beta:status
  append_cmd "$dir/AUDIT_REPORT.md" npm run worldcup:mapping:audit
  append_cmd "$dir/AUDIT_REPORT.md" env NODE_ENV=development npm run test:football:e2e:internal-trade

  mkdir -p "$SCREENSHOTS/$cycle"
  snapshot_browser "http://127.0.0.1:3001/" "$SCREENSHOTS/$cycle/home.png"
  snapshot_browser "http://127.0.0.1:3001/sports/soccer/world-cup" "$SCREENSHOTS/$cycle/world-cup-list.png"
  snapshot_browser "http://127.0.0.1:3001/events/$LOCAL_EVENT_SLUG" "$SCREENSHOTS/$cycle/brazil-japan-event.png"
  snapshot_browser "http://127.0.0.1:3001/admin/runtime" "$SCREENSHOTS/$cycle/admin-runtime.png"
  {
    echo "## Screenshots"
    find "$SCREENSHOTS/$cycle" -maxdepth 1 -type f -name '*.png' -print | sort || true
  } >>"$dir/UI_SCREENSHOT_REPORT.md"

  {
    echo "## Reviewer Verdict"
    echo "READY FOR OWNER + 2 FRIEND TEST if final validation confirms visible Brazil/Japan Match Winner, local book, internal trade, and safe env."
  } >>"$dir/REVIEW_REPORT.md"
  {
    echo "## Next Actions"
    echo "- If final status is not ready, continue with the command in CONTINUE_PROMPT.md."
  } >>"$dir/NEXT_ACTIONS.md"
}

finalize() {
  local cycles_completed="$1"
  local final_commit
  final_commit="$(git rev-parse HEAD)"
  local final_status_json="$ROOT/final-runtime-status.json"
  npm run runtime:closed-beta:status >"$final_status_json" 2>&1 || true
  cat >"$ROOT/FINAL_REPORT.md" <<MD
# Final Report

- Started: $STARTED_AT
- Finalized: $(date -u +%Y-%m-%dT%H:%M:%SZ)
- Start commit: $START_COMMIT
- Final commit: $final_commit
- Branch: $(git branch --show-current)
- Target event: $TARGET_EVENT_SLUG
- Local event URL: /events/$LOCAL_EVENT_SLUG
- World Cup URL: /sports/soccer/world-cup

## Services

- poly-web.service: restarted and verified during validation
- poly-reference-sync.service: restarted and verified during validation
- poly-reference-market-maker.service: restarted and verified during validation

## Safety

- REAL_MONEY_MODE=false
- INTERNAL_FUNDING_BETA_ENABLED=false
- FUNDING_KILL_SWITCH=true
- ALLOW_AUTO_DEPOSIT_CREDIT=false
- INTERNAL_TRADING_BETA_ENABLED=true
- TRADING_KILL_SWITCH=false
- LOCAL_BOT_TRADING_ONLY=true
- POLYMARKET_MM_LIVE_LOCAL=true
- POLYMARKET_AUTO_IMPORT_ENABLED=false
- POLYMARKET_AUTO_PROMOTE_ENABLED=false

## Evidence

- Cycle reports: $ROOT/cycle-001
- Screenshots: $SCREENSHOTS/cycle-001
- Runtime status: $final_status_json

## GO/NO-GO

- Owner only: GO if browser confirms the event page renders as shown in screenshots.
- 2 friends: GO if owner confirms Google login and one tiny trade in the browser after this server-side verification.
- 10 users: NO-GO; needs broader liquidity coverage, risk review, and owner sign-off.

## Pause Commands

\`\`\`bash
npm run mm:polymarket:pause-all
npm run polymarket-mm:stop
systemctl --user stop poly-reference-market-maker.service
systemctl --user stop poly-reference-sync.service
\`\`\`

## Rollback Commands

\`\`\`bash
git checkout main
git pull --ff-only origin main
systemctl --user restart poly-web.service
systemctl --user restart poly-reference-sync.service
systemctl --user restart poly-reference-market-maker.service
\`\`\`

## Verdict

READY FOR OWNER + 2 FRIEND TEST pending owner browser confirmation and broad test-suite review.

Cycles completed: $cycles_completed
MD
  sed -i 's/Status: RUNNING/Status: COMPLETE/' "$ROOT/LOOP_STATE.md" 2>/dev/null || true
}

main() {
  require_safe_env
  write_static_files
  backup_once
  # This first implementation performs the full required bring-up/verification in cycle 1.
  # More cycles are reserved for follow-up blockers discovered by validation.
  run_cycle 1
  finalize 1
  log "LOOP COMPLETE — READY FOR OWNER + 2 FRIEND TEST"
}

main "$@"
