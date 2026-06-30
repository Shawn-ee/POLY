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

    local max_cycles
    max_cycles="$(next_cycle_ceiling)"
    write_status "restarting" "$verdict"
    log "Starting loop invocation with max-hours=$LOOP_MAX_HOURS max-cycles=$max_cycles"
    bash "$LOOP_SCRIPT" --max-hours "$LOOP_MAX_HOURS" --max-cycles "$max_cycles"
    local status=$?
    verdict="$(read_verdict)"
    write_status "last invocation exited status=$status" "$verdict"

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
