#!/usr/bin/env bash
set -u

MAX_HOURS=5
MAX_CYCLES=50
SLEEP_SECONDS="${SOAK_INTERVAL_SECONDS:-300}"
SESSION_STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-hours)
      MAX_HOURS="${2:-5}"
      shift 2
      ;;
    --max-cycles)
      MAX_CYCLES="${2:-50}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR" || exit 1

RUN_DIR="agent-orchestrator/runs/server-worldcup-bot-soak-loop"
SCREENSHOT_DIR="$RUN_DIR/screenshots"
LOG_FILE="$RUN_DIR/loop.out.log"
TARGET_EVENT_SLUG="${TARGET_EVENT_SLUG:-fifwc-fra-swe-2026-06-30-more-markets}"
LOCAL_EVENT_SLUG="${LOCAL_EVENT_SLUG:-france-vs-sweden-more-markets}"
SECONDARY_TARGET_EVENT_SLUG="${SECONDARY_TARGET_EVENT_SLUG:-fifwc-civ-nor-2026-06-30-more-markets}"
SECONDARY_LOCAL_EVENT_SLUG="${SECONDARY_LOCAL_EVENT_SLUG:-cte-divoire-vs-norway-more-markets}"
STALE_REGRESSION_LOCAL_EVENT_SLUG="${STALE_REGRESSION_LOCAL_EVENT_SLUG:-brazil-vs-japan}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://holiwyn.online}"
LOCAL_BASE_URL="${LOCAL_BASE_URL:-http://127.0.0.1:3001}"
START_EPOCH="$(date +%s)"
MAX_SECONDS="$((MAX_HOURS * 3600))"
START_COMMIT="$(git rev-parse HEAD 2>/dev/null || echo unknown)"

mkdir -p "$RUN_DIR" "$SCREENSHOT_DIR"

log() {
  local line
  line="[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
  echo "$line"
  echo "$line" >>"$LOG_FILE"
}

append_cmd() {
  local outfile="$1"
  shift
  {
    printf '\n```bash\n$'
    printf ' %q' "$@"
    printf '\n'
    "$@"
    local status=$?
    printf '\n# exit=%s\n```\n' "$status"
    return "$status"
  } >>"$outfile" 2>&1
}

append_note() {
  local outfile="$1"
  shift
  {
    printf '%s\n' "$*"
  } >>"$outfile"
}

write_static_files() {
  cat >"$RUN_DIR/ACCEPTANCE_CRITERIA.md" <<'MD'
# Acceptance Criteria

The loop is complete only if all are true:

1. World Cup listing is clean and user-facing.
2. At least one core event works end-to-end.
3. Target is at least 10 useful mapped user-facing markets if safe.
4. Match Winner 1X2 is Polymarket-like.
5. Spread selector is Polymarket-like enough for owner testing.
6. Total Goals selector is Polymarket-like enough where data exists.
7. No unmapped user-facing markets.
8. No fake 50.
9. No unexplained -- / --.
10. No normal user-facing No live price / No local book rows.
11. Probability chart exists and uses real data.
12. Price buttons are clean and usable.
13. Trade ticket is direct and clear.
14. Internal test trade works.
15. Balance updates.
16. Position/P&L updates.
17. Execution price/average fill/price improvement are clear.
18. Local-only MM quotes use fresh Polymarket reference.
19. Bot quotes are safely worse than reference.
20. Bot cancels/replaces stale orders.
21. Bot has exposure/cooldown/risk limits.
22. Bot remains local-only and never external.
23. Admin runtime explains bot/ref sync state.
24. Risk monitor has no critical alerts.
25. Full Jest passes with test DB isolation.
26. Build passes.
27. Browser screenshots exist.
28. 5-hour soak completes or reaches max cycles with clear result.
29. Reviewer verdict: READY FOR OWNER CONTINUED TESTING.
30. Auditor verdict: READY FOR OWNER CONTINUED TESTING.
31. FINAL_REPORT.md exists.
MD

  cat >"$RUN_DIR/CONTINUE_PROMPT.md" <<MD
# Continue Prompt

Resume the World Cup bot soak loop from the repo root:

\`\`\`bash
cd $ROOT_DIR
bash agent-orchestrator/scripts/server_worldcup_bot_soak_loop.sh --max-hours $MAX_HOURS --max-cycles $MAX_CYCLES
\`\`\`

Monitor an active detached run:

\`\`\`bash
tmux capture-pane -pt poly-worldcup-bot-soak -S -120
tail -f $RUN_DIR/loop.out.log
\`\`\`

Keep closed-beta safety flags unchanged.
MD

  cat >"$RUN_DIR/LOOP_STATE.md" <<MD
# World Cup Bot Soak Loop State

- Started: $SESSION_STARTED_AT
- Start commit: $START_COMMIT
- Branch: $(git branch --show-current 2>/dev/null || echo unknown)
- Max hours: $MAX_HOURS
- Max cycles: $MAX_CYCLES
- Sleep seconds between cycles: $SLEEP_SECONDS
- Local base URL: $LOCAL_BASE_URL
- Public base URL: $PUBLIC_BASE_URL
- Target Polymarket event: $TARGET_EVENT_SLUG
- Local event: $LOCAL_EVENT_SLUG
- Secondary Polymarket event: $SECONDARY_TARGET_EVENT_SLUG
- Secondary local event: $SECONDARY_LOCAL_EVENT_SLUG
- Stale regression local event: $STALE_REGRESSION_LOCAL_EVENT_SLUG
- Status: RUNNING
MD

  cat >"$RUN_DIR/CLEANUP_POLICY.md" <<'MD'
# Cleanup Policy

- Runtime reports stay under `agent-orchestrator/runs/server-worldcup-bot-soak-loop/`.
- Screenshots stay under `agent-orchestrator/runs/server-worldcup-bot-soak-loop/screenshots/`.
- DB backups, if needed, stay under `test-logs/server-loop-backups/`.
- `.env`, secrets, wallet/private-key material, DB dumps, and generated noise must not be committed.
- Per-cycle git status must classify files as source change, intended report, runtime artifact, generated noise, or unsafe/secret.
- Only meaningful source fixes and intentional orchestrator reports may be committed.
MD
}

safe_env_summary() {
  local outfile="$1"
  {
    echo "## Closed-Beta Safety Flags"
    echo
    if [[ -f .env ]]; then
      for key in \
        REAL_MONEY_MODE \
        INTERNAL_FUNDING_BETA_ENABLED \
        FUNDING_KILL_SWITCH \
        ALLOW_AUTO_DEPOSIT_CREDIT \
        INTERNAL_TRADING_BETA_ENABLED \
        TRADING_KILL_SWITCH \
        ALLOW_BOT_TRADING \
        LOCAL_BOT_TRADING_ONLY \
        POLYMARKET_MM_LIVE_LOCAL \
        POLYMARKET_MM_LOOP_FOREVER \
        POLYMARKET_MM_LOOP_MS \
        POLYMARKET_AUTO_IMPORT_ENABLED \
        POLYMARKET_AUTO_PROMOTE_ENABLED \
        POLYMARKET_DISCOVERY_FIXTURE_MODE \
        POLYMARKET_DISCOVERY_LIVE_SMOKE \
        POLYMARKET_DISCOVERY_SKIP_DB \
        POLYMARKET_REFERENCE_FIXTURE_MODE \
        REFERENCE_POLL_MS \
        REFERENCE_SYNC_ONLY_MM_ENABLED; do
        local value
        value="$(grep -E "^${key}=" .env | tail -n 1 | cut -d= -f2- || true)"
        echo "- $key=${value:-<unset>}"
      done
    else
      echo "- .env not found"
    fi
  } >>"$outfile"
}

require_safe_env_file() {
  local failed=0
  local checks=(
    "REAL_MONEY_MODE=false"
    "INTERNAL_FUNDING_BETA_ENABLED=false"
    "FUNDING_KILL_SWITCH=true"
    "ALLOW_AUTO_DEPOSIT_CREDIT=false"
    "INTERNAL_TRADING_BETA_ENABLED=true"
    "TRADING_KILL_SWITCH=false"
    "ALLOW_BOT_TRADING=true"
    "LOCAL_BOT_TRADING_ONLY=true"
    "POLYMARKET_MM_LIVE_LOCAL=true"
    "POLYMARKET_AUTO_IMPORT_ENABLED=false"
    "POLYMARKET_AUTO_PROMOTE_ENABLED=false"
  )

  if [[ ! -f .env ]]; then
    log "Safety check failed: .env missing"
    return 1
  fi

  for pair in "${checks[@]}"; do
    local key="${pair%%=*}"
    local expected="${pair#*=}"
    local actual
    actual="$(grep -E "^${key}=" .env | tail -n 1 | cut -d= -f2- || true)"
    if [[ "$actual" != "$expected" ]]; then
      log "Safety check failed: $key expected $expected got ${actual:-<unset>}"
      failed=1
    fi
  done

  return "$failed"
}

write_report_headers() {
  local cycle_dir="$1"
  local cycle_name="$2"
  for report in \
    ROOT_CAUSE_REPORT \
    SERVICE_STATUS_REPORT \
    BOT_HEALTH_REPORT \
    RISK_ALERT_REPORT \
    OBSERVATION_REPORT \
    POLYMARKET_GAP_REPORT \
    BOT_SOAK_REPORT \
    BUILDER_REPORT \
    REVIEW_REPORT \
    AUDIT_REPORT \
    UI_SCREENSHOT_REPORT \
    VALIDATION_REPORT \
    NEXT_ACTIONS; do
    cat >"$cycle_dir/${report}.md" <<MD
# $cycle_name - $report

Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)

MD
  done
}

service_active() {
  systemctl --user is-active --quiet "$1"
}

ensure_safe_services() {
  local outfile="$1"
  {
    echo "## Safe Service Verification"
    echo
  } >>"$outfile"
  for service in poly-web.service poly-reference-sync.service poly-reference-market-maker.service; do
    if service_active "$service"; then
      append_note "$outfile" "- $service: active"
    else
      append_note "$outfile" "- $service: inactive; restarting safe service"
      append_cmd "$outfile" systemctl --user restart "$service"
    fi
    append_cmd "$outfile" systemctl --user status "$service" --no-pager
  done
}

write_service_inventory() {
  local outfile="$RUN_DIR/SERVICE_INVENTORY.md"
  cat >"$outfile" <<MD
# Service Inventory

Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)

## Safe Services

MD
  for service in poly-web.service poly-reference-sync.service poly-reference-market-maker.service; do
    {
      echo "### $service"
      echo
      echo "- status: $(systemctl --user is-active "$service" 2>/dev/null || echo unknown)"
      echo
      echo '```text'
      systemctl --user status "$service" --no-pager 2>&1 || true
      echo '```'
      echo
    } >>"$outfile"
  done

  cat >>"$outfile" <<'MD'
## Safe Commands Run Manually

- `systemctl --user status poly-web.service --no-pager`
- `systemctl --user status poly-reference-sync.service --no-pager`
- `systemctl --user status poly-reference-market-maker.service --no-pager`
- Safe restarts are allowed only for the three services above.

## Unsafe Services Intentionally Disabled

- Real deposits
- Real withdrawals
- Wallet/private-key custody workers
- Real cash-out
- External-fund bots
- External Polymarket order submission
- Real-money mode
- Auto public import without admin gate
- Auto promote without admin gate

## Owner Action Required

- None unless the loop reports `OWNER DECISION REQUIRED`.
MD
}

classify_git_status() {
  local outfile="$1"
  {
    echo "## Git Status Classification"
    echo
    if [[ -z "$(git status --short)" ]]; then
      echo "- clean"
    else
      git status --short | while read -r status path; do
        case "$path" in
          agent-orchestrator/runs/server-worldcup-bot-soak-loop/*)
            echo "- $status $path: intended report/runtime artifact"
            ;;
          test-logs/server-loop-backups/*)
            echo "- $status $path: runtime backup artifact"
            ;;
          .env|*.env)
            echo "- $status $path: unsafe/secret; do not commit"
            ;;
          *.log|*.png|*.db|*.sqlite|*.sqlite3)
            echo "- $status $path: generated noise/runtime artifact"
            ;;
          *)
            echo "- $status $path: source change or intentional tracked file; review before commit"
            ;;
        esac
      done
    fi
  } >>"$outfile"
}

capture_screenshots() {
  local cycle="$1"
  local cycle_dir="$2"
  local out_dir="$SCREENSHOT_DIR/$cycle"
  mkdir -p "$out_dir"

  if ! npx playwright --version >/dev/null 2>&1; then
    append_note "$cycle_dir/UI_SCREENSHOT_REPORT.md" "- Playwright unavailable; screenshots skipped."
    return 0
  fi

  append_note "$cycle_dir/UI_SCREENSHOT_REPORT.md" "## Screenshot Targets"
  append_note "$cycle_dir/UI_SCREENSHOT_REPORT.md" "- $LOCAL_BASE_URL/sports/soccer/world-cup"
  append_note "$cycle_dir/UI_SCREENSHOT_REPORT.md" "- $LOCAL_BASE_URL/events/$LOCAL_EVENT_SLUG"
  append_note "$cycle_dir/UI_SCREENSHOT_REPORT.md" "- $LOCAL_BASE_URL/events/$SECONDARY_LOCAL_EVENT_SLUG"
  append_note "$cycle_dir/UI_SCREENSHOT_REPORT.md" "- $LOCAL_BASE_URL/events/$STALE_REGRESSION_LOCAL_EVENT_SLUG"
  append_note "$cycle_dir/UI_SCREENSHOT_REPORT.md" "- $LOCAL_BASE_URL/admin/runtime"

  timeout 90s npx playwright screenshot --full-page "$LOCAL_BASE_URL/sports/soccer/world-cup" "$out_dir/world-cup-list.png" >>"$cycle_dir/UI_SCREENSHOT_REPORT.md" 2>&1 || true
  timeout 90s npx playwright screenshot --full-page "$LOCAL_BASE_URL/events/$LOCAL_EVENT_SLUG" "$out_dir/active-event.png" >>"$cycle_dir/UI_SCREENSHOT_REPORT.md" 2>&1 || true
  timeout 90s npx playwright screenshot --full-page "$LOCAL_BASE_URL/events/$SECONDARY_LOCAL_EVENT_SLUG" "$out_dir/secondary-event.png" >>"$cycle_dir/UI_SCREENSHOT_REPORT.md" 2>&1 || true
  timeout 90s npx playwright screenshot --full-page "$LOCAL_BASE_URL/events/$STALE_REGRESSION_LOCAL_EVENT_SLUG" "$out_dir/stale-regression-event.png" >>"$cycle_dir/UI_SCREENSHOT_REPORT.md" 2>&1 || true
  timeout 90s npx playwright screenshot --full-page "$LOCAL_BASE_URL/admin/runtime" "$out_dir/admin-runtime.png" >>"$cycle_dir/UI_SCREENSHOT_REPORT.md" 2>&1 || true

  {
    echo
    echo "## Files"
    find "$out_dir" -maxdepth 1 -type f -name '*.png' -print | sort || true
  } >>"$cycle_dir/UI_SCREENSHOT_REPORT.md"
}

write_polymarket_gap_report() {
  local cycle_dir="$1"
  {
    echo "## Reference Pages"
    echo
    echo "- Polymarket event: https://polymarket.com/zh/sports/world-cup/$TARGET_EVENT_SLUG"
    echo "- Gamma event API: https://gamma-api.polymarket.com/events?slug=$TARGET_EVENT_SLUG"
    echo "- Secondary Polymarket event: https://polymarket.com/zh/sports/world-cup/$SECONDARY_TARGET_EVENT_SLUG"
    echo "- Secondary Gamma event API: https://gamma-api.polymarket.com/events?slug=$SECONDARY_TARGET_EVENT_SLUG"
    echo
    echo "## Gap Focus"
    echo
    echo "- Spread / handicap selector"
    echo "- Total Goals selector"
    echo "- Market group order"
    echo "- Price button style and direct ticket behavior"
    echo "- Probability chart"
    echo "- Clean user-facing page with diagnostics hidden"
    echo "- MM coverage and quote closeness"
  } >>"$cycle_dir/POLYMARKET_GAP_REPORT.md"
  append_cmd "$cycle_dir/POLYMARKET_GAP_REPORT.md" curl -I -L "https://polymarket.com/zh/sports/world-cup/$TARGET_EVENT_SLUG"
  append_cmd "$cycle_dir/POLYMARKET_GAP_REPORT.md" curl -sS "https://gamma-api.polymarket.com/events?slug=$TARGET_EVENT_SLUG"
  append_cmd "$cycle_dir/POLYMARKET_GAP_REPORT.md" curl -sS "https://gamma-api.polymarket.com/events?slug=$SECONDARY_TARGET_EVENT_SLUG"
}

run_cycle() {
  local index="$1"
  local cycle
  cycle="$(printf 'cycle-%03d' "$index")"
  local cycle_dir="$RUN_DIR/$cycle"
  mkdir -p "$cycle_dir"
  write_report_headers "$cycle_dir" "$cycle"
  log "Starting $cycle"
  ensure_safe_services "$cycle_dir/SERVICE_STATUS_REPORT.md"
  write_service_inventory

  {
    echo "## Git"
    echo
    echo "- Branch: $(git branch --show-current 2>/dev/null || echo unknown)"
    echo "- Commit: $(git rev-parse HEAD 2>/dev/null || echo unknown)"
    echo "- Status:"
    git status --short || true
    echo
    echo "## Health"
  } >>"$cycle_dir/OBSERVATION_REPORT.md"
  classify_git_status "$cycle_dir/OBSERVATION_REPORT.md"

  safe_env_summary "$cycle_dir/AUDIT_REPORT.md"
  append_cmd "$cycle_dir/OBSERVATION_REPORT.md" curl -sS "$LOCAL_BASE_URL/api/health"
  append_cmd "$cycle_dir/OBSERVATION_REPORT.md" systemctl --user status poly-web.service --no-pager
  append_cmd "$cycle_dir/OBSERVATION_REPORT.md" systemctl --user status poly-reference-sync.service --no-pager
  append_cmd "$cycle_dir/OBSERVATION_REPORT.md" systemctl --user status poly-reference-market-maker.service --no-pager
  append_cmd "$cycle_dir/OBSERVATION_REPORT.md" journalctl --user -u poly-reference-sync.service -n 150 --no-pager
  append_cmd "$cycle_dir/OBSERVATION_REPORT.md" journalctl --user -u poly-reference-market-maker.service -n 150 --no-pager
  append_cmd "$cycle_dir/OBSERVATION_REPORT.md" journalctl --user -u poly-web.service -n 100 --no-pager
  append_cmd "$cycle_dir/OBSERVATION_REPORT.md" npm run runtime:closed-beta:status
  append_cmd "$cycle_dir/OBSERVATION_REPORT.md" npm run worldcup:mapping:audit

  {
    echo "## Root Cause Focus"
    echo
    echo "- mmHeartbeat/null or equivalent MM health is diagnosed from runtime status, latest live-local intent, latest open bot order, and MM service logs."
    echo "- Risk alert counts are split between current risk monitor output and historical canonical risk events."
    echo "- liveLocalIntentCount is treated as historical unless recent intent counters show sustained high churn."
    echo "- Brazil/Japan is checked through runtime/mapping output and Polymarket API; if completed, England/DR Congo or the next fresh Polymarket-backed World Cup event becomes the active target."
  } >>"$cycle_dir/ROOT_CAUSE_REPORT.md"

  write_polymarket_gap_report "$cycle_dir"

  {
    echo "## Bot Soak Checks"
    echo
    echo "- Reference sync service status and logs recorded in OBSERVATION_REPORT.md."
    echo "- MM service status and logs recorded in OBSERVATION_REPORT.md."
    echo "- Runtime status below is the source of truth for active liquidity markets, open bot orders, risk, and skipped reasons."
  } >>"$cycle_dir/BOT_SOAK_REPORT.md"
  append_cmd "$cycle_dir/BOT_SOAK_REPORT.md" npm run runtime:closed-beta:status
  append_cmd "$cycle_dir/BOT_HEALTH_REPORT.md" npm run runtime:closed-beta:status
  append_cmd "$cycle_dir/BOT_HEALTH_REPORT.md" npm run polymarket-mm:status
  append_cmd "$cycle_dir/RISK_ALERT_REPORT.md" npm run risk:polymarket:once
  append_cmd "$cycle_dir/RISK_ALERT_REPORT.md" npm run runtime:closed-beta:status

  {
    echo "## Builder"
    echo
    echo "The enhanced loop records root-cause reports and validates source/runtime fixes made by the loop engineer between cycles."
    echo "Safe service restarts are automatic for the approved World Cup runtime services only."
  } >>"$cycle_dir/BUILDER_REPORT.md"

  append_cmd "$cycle_dir/VALIDATION_REPORT.md" git diff --check
  append_cmd "$cycle_dir/VALIDATION_REPORT.md" npm run build
  append_cmd "$cycle_dir/VALIDATION_REPORT.md" npm run runtime:closed-beta:status
  append_cmd "$cycle_dir/VALIDATION_REPORT.md" npm run worldcup:mapping:audit

  capture_screenshots "$cycle" "$cycle_dir"

  {
    echo "## Review"
    echo
    echo "Review the screenshots and runtime output for:"
    echo
    echo "- user-facing unmapped/no-price/no-book states"
    echo "- spread/total selector quality"
    echo "- active local-only MM coverage"
    echo "- quote freshness and skipped MM reasons"
    echo "- admin diagnostics clarity"
  } >>"$cycle_dir/REVIEW_REPORT.md"

  {
    echo "## Audit"
    echo
    echo "- Safety env summary is recorded above."
    echo "- The script does not enable real money, funding, custody, external orders, auto import, or auto promote."
    echo "- Any unsafe service/process findings must be handled manually and recorded in the next cycle."
  } >>"$cycle_dir/AUDIT_REPORT.md"

  {
    echo "## Next Actions"
    echo
    echo "- Compare $cycle screenshots against the Polymarket reference page."
    echo "- If a gap is found, patch it in the repo, restart only safe services, and let the next cycle validate."
    echo "- If no gaps remain after full soak and full Jest, update FINAL_REPORT.md with READY verdict."
  } >>"$cycle_dir/NEXT_ACTIONS.md"

  log "Finished $cycle"
}

finalize() {
  local cycles_completed="$1"
  local verdict="$2"
  local final_commit
  local finished_at
  local elapsed
  final_commit="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
  finished_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  elapsed="$(($(date +%s) - START_EPOCH))"

  npm run runtime:closed-beta:status >"$RUN_DIR/final-runtime-status.txt" 2>&1 || true
  npm run worldcup:mapping:audit >"$RUN_DIR/final-worldcup-mapping-audit.txt" 2>&1 || true

  cat >"$RUN_DIR/FINAL_REPORT.md" <<MD
# Final Report

- Started: $SESSION_STARTED_AT
- Finished: $finished_at
- Soak duration seconds: $elapsed
- Cycles completed: $cycles_completed
- Start commit: $START_COMMIT
- Final commit: $final_commit
- Branch: $(git branch --show-current 2>/dev/null || echo unknown)
- PR URL: https://github.com/Shawn-ee/POLY/pull/new/$(git branch --show-current 2>/dev/null || echo unknown)

## Services Running

Recorded in per-cycle OBSERVATION_REPORT.md files:

- poly-web.service
- poly-reference-sync.service
- poly-reference-market-maker.service

## Safety Flags

Closed-beta flags are recorded in per-cycle AUDIT_REPORT.md files. Required state remains:

- REAL_MONEY_MODE=false
- INTERNAL_FUNDING_BETA_ENABLED=false
- FUNDING_KILL_SWITCH=true
- ALLOW_AUTO_DEPOSIT_CREDIT=false
- INTERNAL_TRADING_BETA_ENABLED=true
- TRADING_KILL_SWITCH=false
- ALLOW_BOT_TRADING=true
- LOCAL_BOT_TRADING_ONLY=true
- POLYMARKET_MM_LIVE_LOCAL=true
- POLYMARKET_AUTO_IMPORT_ENABLED=false
- POLYMARKET_AUTO_PROMOTE_ENABLED=false

## Evidence

- Cycle reports: $RUN_DIR/cycle-*
- Screenshots: $SCREENSHOT_DIR/
- Final runtime status: $RUN_DIR/final-runtime-status.txt
- Final mapping audit: $RUN_DIR/final-worldcup-mapping-audit.txt

## Current URLs To Test

- $PUBLIC_BASE_URL/sports/soccer/world-cup
- $PUBLIC_BASE_URL/events/$LOCAL_EVENT_SLUG
- $PUBLIC_BASE_URL/events/$SECONDARY_LOCAL_EVENT_SLUG
- $PUBLIC_BASE_URL/admin/runtime

## GO/NO-GO

- Owner continued testing: GO only if final runtime status, mapping audit, screenshots, and owner browser check are clean.
- 2 friends: GO only after owner confirms the soak found no new trading/UI blockers.
- 10 users: NO-GO until broader liquidity/risk/user load review.

## Pause Commands

\`\`\`bash
npm run mm:polymarket:pause-all
npm run polymarket-mm:stop
systemctl --user stop poly-reference-market-maker.service
systemctl --user stop poly-reference-sync.service
\`\`\`

## Rollback Commands

\`\`\`bash
git checkout agent/server-polymarket-worldcup-experience-loop
git reset --hard $START_COMMIT
systemctl --user restart poly-web.service
systemctl --user restart poly-reference-sync.service
systemctl --user restart poly-reference-market-maker.service
\`\`\`

## Verdict

$verdict

Blockers remaining:

- The soak script collects evidence and validation. Any discovered Polymarket experience gaps still require code changes by the loop engineer.
- Full readiness requires reviewing the per-cycle screenshots/runtime reports and running full Jest before claiming 2-friend expansion.

Monitoring command:

\`\`\`bash
tail -f $LOG_FILE
\`\`\`

Next command to continue:

\`\`\`bash
bash agent-orchestrator/scripts/server_worldcup_bot_soak_loop.sh --max-hours $MAX_HOURS --max-cycles $MAX_CYCLES
\`\`\`
MD

  sed -i "s/Status: RUNNING/Status: ${verdict}/" "$RUN_DIR/LOOP_STATE.md" 2>/dev/null || true
  log "$verdict"
  log "Cycles completed: $cycles_completed"
  log "Soak duration seconds: $elapsed"
  log "Latest commit: $final_commit"
}

main() {
  {
    echo
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Loop invocation starting"
  } >>"$LOG_FILE"
  write_static_files

  if ! require_safe_env_file; then
    finalize 0 "LOOP NOT COMPLETE — CONTINUATION REQUIRED"
    exit 1
  fi

  local cycles_completed=0
  local index
  index="$(find "$RUN_DIR" -maxdepth 1 -type d -name 'cycle-[0-9][0-9][0-9]' -printf '%f\n' 2>/dev/null | sed 's/cycle-//' | sort -n | tail -n 1)"
  index="$((10#${index:-0} + 1))"
  while [[ "$index" -le "$MAX_CYCLES" ]]; do
    local now
    now="$(date +%s)"
    if [[ "$((now - START_EPOCH))" -ge "$MAX_SECONDS" ]]; then
      log "Max hours reached before cycle $index"
      break
    fi

    run_cycle "$index"
    cycles_completed="$index"

    now="$(date +%s)"
    if [[ "$index" -ge "$MAX_CYCLES" || "$((now - START_EPOCH))" -ge "$MAX_SECONDS" ]]; then
      break
    fi

    log "Sleeping $SLEEP_SECONDS seconds before next cycle"
    sleep "$SLEEP_SECONDS"
    index="$((index + 1))"
  done

  finalize "$cycles_completed" "LOOP NOT COMPLETE — CONTINUATION REQUIRED"
}

main "$@"
