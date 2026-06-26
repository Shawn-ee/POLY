#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PROMPT_PATH="$ROOT_DIR/agent-orchestrator/prompts/DUAL_AGENT_LOOP_OPERATING_PROMPT.md"
GOAL_PATH="${1:-}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_DIR="$ROOT_DIR/agent-orchestrator/runs/${STAMP}-dual-agent-loop"

mkdir -p "$RUN_DIR"

if [[ ! -f "$PROMPT_PATH" ]]; then
  echo "Dual-agent prompt not found: $PROMPT_PATH" >&2
  exit 1
fi

if [[ -n "$GOAL_PATH" ]]; then
  {
    cat "$PROMPT_PATH"
    printf '\n\nGoal file path provided by launcher:\n%s\n' "$GOAL_PATH"
  } | codex exec --full-auto - 2>&1 | tee "$RUN_DIR/dual-agent-loop.log"
else
  codex exec --full-auto "$(cat "$PROMPT_PATH")" 2>&1 | tee "$RUN_DIR/dual-agent-loop.log"
fi
