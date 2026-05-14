#!/usr/bin/env bash
# Kill the local dev tmux session (graceful: each pane receives SIGINT from tmux kill-session).
set -euo pipefail

SESSION="${TMUX_SESSION:-deenquest-backend}"

if tmux has-session -t "${SESSION}" 2>/dev/null; then
  tmux kill-session -t "${SESSION}"
  echo "Stopped tmux session: ${SESSION}"
else
  echo "No session named ${SESSION}"
fi
