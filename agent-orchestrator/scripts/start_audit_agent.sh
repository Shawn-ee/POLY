#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PROMPT_PATH="$ROOT_DIR/agent-orchestrator/prompts/AUDIT_AGENT_OPERATING_PROMPT.md"
REPORT_PATH="${1:-}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_DIR="$ROOT_DIR/agent-orchestrator/runs/${STAMP}-audit-agent"

mkdir -p "$RUN_DIR"

if [[ ! -f "$PROMPT_PATH" ]]; then
  echo "Audit prompt not found: $PROMPT_PATH" >&2
  exit 1
fi

if [[ -n "$REPORT_PATH" ]]; then
  {
    cat "$PROMPT_PATH"
    printf '\n\nAudit report path provided by launcher:\n%s\n' "$REPORT_PATH"
  } | codex exec --full-auto - 2>&1 | tee "$RUN_DIR/audit-agent.log"
else
  codex exec --full-auto "$(cat "$PROMPT_PATH")" 2>&1 | tee "$RUN_DIR/audit-agent.log"
fi
