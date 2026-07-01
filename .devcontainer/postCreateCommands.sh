#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[postCreateCommands] $*"
}

trap 'echo "[postCreateCommands] failed at line $LINENO" >&2' ERR

log "Checking prerequisites"
command -v node >/dev/null 2>&1 || { echo "node is required" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required" >&2; exit 1; }

log "Installing claude-code"
npm install -g --no-audit --no-fund @anthropic-ai/claude-code

log "Installing openspec"
npm install -g --no-audit --no-fund @fission-ai/openspec@latest

log "Installing project dependencies"
npm install --no-fund