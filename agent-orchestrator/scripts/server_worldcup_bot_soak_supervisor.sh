#!/usr/bin/env bash
set -u

ROOT_DIR="/home/shawn/projects/poly/Poly"
RUN_DIR="agent-orchestrator/runs/server-worldcup-bot-soak-loop"
LOOP_SCRIPT="agent-orchestrator/scripts/server_worldcup_bot_soak_loop.sh"
SUPERVISOR_LOG="$RUN_DIR/supervisor.out.log"
LOCK_DIR="$RUN_DIR/supervisor.lock"
LOOP_SESSION_NAME="${WORLD_CUP_SOAK_LOOP_SESSION:-poly-worldcup-bot-soak}"
SUPERVISOR_SLEEP_SECONDS="${WORLD_CUP_SOAK_SUPERVISOR_SLEEP_SECONDS:-60}"
WAIT_FOR_ACTIVE_LOOP_SECONDS="${WORLD_CUP_SOAK_WAIT_FOR_ACTIVE_LOOP_SECONDS:-60}"
LOOP_MAX_HOURS="${WORLD_CUP_SOAK_LOOP_MAX_HOURS:-5}"
LOOP_CYCLE_WINDOW="${WORLD_CUP_SOAK_LOOP_CYCLE_WINDOW:-50}"
ACCEPTANCE_DIR="$RUN_DIR/supervisor-acceptance"

cd "$ROOT_DIR" || exit 1
mkdir -p "$RUN_DIR"

log() {
  local line
  line="[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
  echo "$line"
  echo "$line" >>"$SUPERVISOR_LOG"
}

latest_cycle_number() {
  find "$RUN_DIR" -maxdepth 1 -type d -name 'cycle-[0-9][0-9][0-9]' -printf '%f\n' 2>/dev/null \
    | sed 's/cycle-//' \
    | sort -n \
    | tail -n 1
}

next_cycle_ceiling() {
  local latest
  latest="$(latest_cycle_number)"
  latest="$((10#${latest:-0}))"
  echo "$((latest + LOOP_CYCLE_WINDOW))"
}

active_loop_pids() {
  pgrep -af "bash $LOOP_SCRIPT" 2>/dev/null | awk -v self="$$" '$1 != self {print $1}' || true
}

loop_session_active() {
  tmux has-session -t "$LOOP_SESSION_NAME" 2>/dev/null
}

read_verdict() {
  local files=("$RUN_DIR/FINAL_REPORT.md" "$RUN_DIR/LOOP_STATE.md" "$RUN_DIR/loop.out.log")
  local file
  for file in "${files[@]}"; do
    [[ -f "$file" ]] || continue
    if grep -q "LOOP COMPLETE — WORLDCUP BOT SOAK READY" "$file"; then
      echo "LOOP COMPLETE — WORLDCUP BOT SOAK READY"
      return 0
    fi
    if grep -q "OWNER DECISION REQUIRED" "$file"; then
      echo "OWNER DECISION REQUIRED"
      return 0
    fi
    if grep -q "CRITICAL SAFETY STOP" "$file"; then
      echo "CRITICAL SAFETY STOP"
      return 0
    fi
  done
  if grep -Rqs "LOOP NOT COMPLETE — CONTINUATION REQUIRED" "$RUN_DIR/FINAL_REPORT.md" "$RUN_DIR/LOOP_STATE.md" "$RUN_DIR/loop.out.log" 2>/dev/null; then
    echo "LOOP NOT COMPLETE — CONTINUATION REQUIRED"
    return 0
  fi
  echo "UNKNOWN"
}

assert_safe_env() {
  local failed=0
  require_env "REAL_MONEY_MODE" "false" || failed=1
  require_env "INTERNAL_FUNDING_BETA_ENABLED" "false" || failed=1
  require_env "FUNDING_KILL_SWITCH" "true" || failed=1
  require_env "ALLOW_AUTO_DEPOSIT_CREDIT" "false" || failed=1
  require_env "INTERNAL_TRADING_BETA_ENABLED" "true" || failed=1
  require_env "TRADING_KILL_SWITCH" "false" || failed=1
  require_env "ALLOW_BOT_TRADING" "true" || failed=1
  require_env "LOCAL_BOT_TRADING_ONLY" "true" || failed=1
  require_env "POLYMARKET_MM_LIVE_LOCAL" "true" || failed=1
  require_env "POLYMARKET_MM_LOOP_FOREVER" "true" || failed=1
  require_env "POLYMARKET_AUTO_IMPORT_ENABLED" "false" || failed=1
  require_env "POLYMARKET_AUTO_PROMOTE_ENABLED" "false" || failed=1
  return "$failed"
}

require_env() {
  local key="$1"
  local expected="$2"
  local actual="${!key:-}"
  if [[ -z "$actual" && -f .env ]]; then
    actual="$(grep -E "^${key}=" .env | tail -n 1 | cut -d= -f2- | tr -d '"' || true)"
  fi
  if [[ "$actual" != "$expected" ]]; then
    log "CRITICAL SAFETY STOP: $key expected $expected, found ${actual:-unset}"
    echo "CRITICAL SAFETY STOP" >"$RUN_DIR/SUPERVISOR_VERDICT.txt"
    return 1
  fi
  return 0
}

write_status() {
  local original_state="$1"
  local verdict="$2"
  local latest
  latest="$(latest_cycle_number)"
  cat >"$RUN_DIR/SUPERVISOR_STATUS.md" <<MD
# Supervisor Status

- Updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
- Original loop state: $original_state
- Supervisor script path: agent-orchestrator/scripts/server_worldcup_bot_soak_supervisor.sh
- Managed loop script path: $LOOP_SCRIPT
- Supervisor tmux session: poly-worldcup-bot-soak-supervisor
- Managed loop tmux session: $LOOP_SESSION_NAME
- Current cycle: cycle-${latest:-000}
- Current verdict: $verdict
- Remaining blockers: final completion requires full loop acceptance, final Jest, screenshot review, runtime status, mapping audit, service checks, and safety checks.
- Auto-continue: yes, unless verdict becomes LOOP COMPLETE, OWNER DECISION REQUIRED, or CRITICAL SAFETY STOP.

## Monitor

\`\`\`bash
tmux capture-pane -pt poly-worldcup-bot-soak-supervisor -S -120
tmux capture-pane -pt $LOOP_SESSION_NAME -S -120
tail -f $SUPERVISOR_LOG
\`\`\`

## Pause

\`\`\`bash
tmux kill-session -t poly-worldcup-bot-soak-supervisor
tmux send-keys -t $LOOP_SESSION_NAME C-c
npm run mm:polymarket:pause-all
\`\`\`
MD
}

run_acceptance_check() {
  local latest
  latest="$(latest_cycle_number)"
  local latest_cycle="cycle-${latest:-000}"
  local screenshot_dir="$RUN_DIR/screenshots/$latest_cycle"
  mkdir -p "$ACCEPTANCE_DIR"

  log "Running supervisor acceptance check against $latest_cycle"
  npm run runtime:closed-beta:status >"$ACCEPTANCE_DIR/runtime-status.txt" 2>&1 || return 1
  npm run worldcup:mapping:audit >"$ACCEPTANCE_DIR/worldcup-mapping-audit.txt" 2>&1 || return 1

  if ! node - "$ACCEPTANCE_DIR/runtime-status.txt" "$ACCEPTANCE_DIR/worldcup-mapping-audit.txt" "$screenshot_dir" <<'NODE'
const fs = require("fs");
const [runtimePath, auditPath, screenshotDir] = process.argv.slice(2);

function loadJsonFromOutput(path) {
  const text = fs.readFileSync(path, "utf8");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error(`No JSON object found in ${path}`);
  return JSON.parse(text.slice(start, end + 1));
}

const runtime = loadJsonFromOutput(runtimePath);
const audit = loadJsonFromOutput(auditPath);
const screenshots = fs.existsSync(screenshotDir)
  ? fs.readdirSync(screenshotDir).filter((name) => name.endsWith(".png"))
  : [];

const failures = [];
function requireOk(condition, message) {
  if (!condition) failures.push(message);
}

requireOk(runtime.serviceHealth?.status === "ready_for_rehearsal", "runtime is not ready_for_rehearsal");
requireOk(Boolean(runtime.serviceHealth?.referenceSyncHeartbeat), "reference sync heartbeat missing");
requireOk(Boolean(runtime.serviceHealth?.mmHeartbeat), "MM heartbeat missing");
requireOk(Number(runtime.risk?.currentCriticalAlerts ?? 1) === 0, "current critical risk alerts are not zero");
requireOk(Number(runtime.risk?.currentAlerts ?? 1) === 0, "current risk alerts are not zero");
requireOk(Array.isArray(runtime.risk?.unsafeFlags) && runtime.risk.unsafeFlags.length === 0, "unsafe flags present");
requireOk(runtime.safety?.realMoneyMode === false, "real money mode is not false");
requireOk(runtime.safety?.fundingEnabled === false, "funding appears enabled");
requireOk(runtime.safety?.fundingKillSwitch === true, "funding kill switch is not true");
requireOk(runtime.safety?.autoDepositCredit === false, "auto deposit credit is not false");
requireOk(runtime.safety?.autoImport === false, "auto import is not false");
requireOk(runtime.safety?.autoPromote === false, "auto promote is not false");
requireOk(runtime.safety?.localBotTradingOnly === true, "local bot trading only is not true");
requireOk(runtime.safety?.liveLocalMm === true, "live local MM is not true");
requireOk(Number(runtime.marketMaker?.enabledConfigCount ?? 0) >= 10, "enabled MM configs below 10");
requireOk(Number(runtime.marketMaker?.openInternalOrders ?? 0) >= 10, "open internal bot orders below 10");
requireOk(Number(runtime.ownerTesting?.activeLiquidityMarkets ?? 0) >= 10, "active liquidity markets below 10");
requireOk(runtime.ownerTesting?.canOwnerTrade === true, "owner internal trading is not available");
requireOk(Number(runtime.worldCup?.eligibleUserFacingMarkets ?? 0) >= 10, "eligible user-facing markets below 10");
requireOk(Number(runtime.worldCup?.eventsWithEligibleMarkets ?? 0) >= 2, "events with eligible markets below 2");
requireOk(Number(runtime.worldCup?.publicDraftLeakCount ?? 1) === 0, "public draft leak count is not zero");

requireOk(Number(audit.totals?.userFacingEligibleMarkets ?? 0) >= 10, "mapping audit eligible markets below 10");
requireOk(Number(audit.totals?.localBotBookMarkets ?? 0) >= 10, "mapping audit local bot book markets below 10");
requireOk(Number(audit.totals?.eventsWithEligibleMarkets ?? 0) >= 2, "mapping audit eligible events below 2");
requireOk(Number(audit.totals?.userFacingLeakWithoutMapping ?? 1) === 0, "mapping audit user-facing leak exists");
requireOk(screenshots.length >= 4, "latest cycle screenshot set is incomplete");

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures, screenshots }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, screenshots }, null, 2));
NODE
  then
    return 1
  fi

  npm run test:jest >"$ACCEPTANCE_DIR/full-jest.txt" 2>&1 || return 1
  write_complete_report
  return 0
}

write_complete_report() {
  local final_commit
  final_commit="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
  cat >"$RUN_DIR/FINAL_REPORT.md" <<MD
# Final Report

- Finished: $(date -u +%Y-%m-%dT%H:%M:%SZ)
- Final commit: $final_commit
- Branch: $(git branch --show-current 2>/dev/null || echo unknown)
- Runtime status: $ACCEPTANCE_DIR/runtime-status.txt
- Mapping audit: $ACCEPTANCE_DIR/worldcup-mapping-audit.txt
- Full Jest: $ACCEPTANCE_DIR/full-jest.txt

## Verdict

LOOP COMPLETE — WORLDCUP BOT SOAK READY
MD
  echo "Status: LOOP COMPLETE — WORLDCUP BOT SOAK READY" >>"$RUN_DIR/LOOP_STATE.md"
}

main() {
  if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    log "Supervisor already running; exiting duplicate invocation"
    exit 0
  fi
  trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT

  log "Supervisor starting"
  while true; do
    if ! assert_safe_env; then
      write_status "safety check failed" "CRITICAL SAFETY STOP"
      log "CRITICAL SAFETY STOP"
      exit 3
    fi

    local verdict
    verdict="$(read_verdict)"
    case "$verdict" in
      "LOOP COMPLETE — WORLDCUP BOT SOAK READY")
        write_status "complete" "$verdict"
        log "$verdict"
        exit 0
        ;;
      "OWNER DECISION REQUIRED")
        write_status "owner decision required" "$verdict"
        log "$verdict"
        exit 2
        ;;
      "CRITICAL SAFETY STOP")
        write_status "critical safety stop" "$verdict"
        log "$verdict"
        exit 3
        ;;
    esac

    if [[ -n "$(active_loop_pids)" ]] || loop_session_active; then
      write_status "active or sleeping" "$verdict"
      log "Existing loop is active; waiting ${WAIT_FOR_ACTIVE_LOOP_SECONDS}s before rechecking"
      sleep "$WAIT_FOR_ACTIVE_LOOP_SECONDS"
      continue
    fi

    if run_acceptance_check; then
      verdict="LOOP COMPLETE — WORLDCUP BOT SOAK READY"
      write_status "complete" "$verdict"
      log "$verdict"
      exit 0
    fi

    local max_cycles
    max_cycles="$(next_cycle_ceiling)"
    write_status "restarting" "$verdict"
    log "Starting loop invocation with max-hours=$LOOP_MAX_HOURS max-cycles=$max_cycles"
    bash "$LOOP_SCRIPT" --max-hours "$LOOP_MAX_HOURS" --max-cycles "$max_cycles"
    local status=$?
    verdict="$(read_verdict)"
    write_status "last invocation exited status=$status" "$verdict"

    if [[ "$verdict" == "LOOP NOT COMPLETE — CONTINUATION REQUIRED" || "$verdict" == "UNKNOWN" ]]; then
      if run_acceptance_check; then
        verdict="LOOP COMPLETE — WORLDCUP BOT SOAK READY"
        write_status "complete" "$verdict"
        log "$verdict"
        exit 0
      fi
    fi

    case "$verdict" in
      "LOOP COMPLETE — WORLDCUP BOT SOAK READY")
        log "$verdict"
        exit 0
        ;;
      "OWNER DECISION REQUIRED")
        log "$verdict"
        exit 2
        ;;
      "CRITICAL SAFETY STOP")
        log "$verdict"
        exit 3
        ;;
      *)
        log "Loop exited with verdict '$verdict'; sleeping ${SUPERVISOR_SLEEP_SECONDS}s and continuing"
        sleep "$SUPERVISOR_SLEEP_SECONDS"
        ;;
    esac
  done
}

main "$@"
