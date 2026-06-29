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
      echo "Unknown arg: $1" >&2
      exit 2
      ;;
  esac
done
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
RUN_DIR="agent-orchestrator/runs/server-execution-mm-loop"
mkdir -p "$RUN_DIR"
echo "Server execution/MM loop scaffold. Max cycles: $MAX_CYCLES"
echo "This script records state; Codex performs audited implementation cycles interactively."
git rev-parse HEAD | tee "$RUN_DIR/last-script-head.txt"
git status --short | tee "$RUN_DIR/last-script-status.txt"
