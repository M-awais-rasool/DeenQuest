#!/usr/bin/env bash
# One-shot local dev: tmux session with gateway, auth, core, worker (Air) + whisper (uvicorn --reload).
# Usage: make dev-tmux  (from backend/)
#
# tmux panes often get a minimal PATH (or an old tmux server env). We re-export PATH/GOPATH/GOROOT
# from this script so the same toolchain works as in the terminal where you ran `make dev-all`.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SESSION="${TMUX_SESSION:-deenquest-backend}"
WINDOW="${SESSION}:svc"

command -v tmux >/dev/null 2>&1 || {
  echo "tmux not found. Install: brew install tmux" >&2
  exit 1
}

cd "${BACKEND_ROOT}"

if tmux has-session -t "${SESSION}" 2>/dev/null; then
  echo "Attaching to existing session: ${SESSION}"
  echo "Tip: if APIs fail here but work when you run services manually, try: make dev-fresh"
  exec tmux attach -t "${SESSION}"
fi

# Shell snippet each pane runs: same env as the parent terminal, then cwd, then the real command.
dev_env() {
  local q
  q="export PATH=$(printf '%q' "$PATH")"
  if [[ -n "${GOPATH:-}" ]]; then
    q+="; export GOPATH=$(printf '%q' "$GOPATH")"
  fi
  if [[ -n "${GOROOT:-}" ]]; then
    q+="; export GOROOT=$(printf '%q' "$GOROOT")"
  fi
  if [[ -n "${HOME:-}" ]]; then
    q+="; export HOME=$(printf '%q' "$HOME")"
  fi
  q+="; cd $(printf '%q' "$BACKEND_ROOT")"
  printf '%s' "$q"
}

# Detached sessions default to 80×24; that is too small for four splits → "no space for new pane".
# Use a virtual size for creation; your real terminal size applies after attach.
TMUX_DEV_WIDTH="${TMUX_DEV_WIDTH:-200}"
TMUX_DEV_HEIGHT="${TMUX_DEV_HEIGHT:-60}"
tmux new-session -d -x "${TMUX_DEV_WIDTH}" -y "${TMUX_DEV_HEIGHT}" \
  -s "${SESSION}" -n svc -c "${BACKEND_ROOT}"

# Five panes: gateway | auth | core | worker | whisper
for _ in 1 2 3 4; do
  tmux split-window -t "${WINDOW}" -c "${BACKEND_ROOT}"
done
tmux select-layout -t "${WINDOW}" tiled

# Let shells finish init before we inject commands (avoids truncated / lost keys).
sleep 0.4

BASE="$(dev_env)"

tmux send-keys -t "${WINDOW}.0" "${BASE}" " && exec make air-gateway" C-m
tmux send-keys -t "${WINDOW}.1" "${BASE}" " && exec make air-auth" C-m
tmux send-keys -t "${WINDOW}.2" "${BASE}" " && exec make air-core" C-m
tmux send-keys -t "${WINDOW}.3" "${BASE}" " && exec make air-worker" C-m
tmux send-keys -t "${WINDOW}.4" "${BASE}" " && exec make whisper-dev" C-m

echo "Session ${SESSION} started. Detach: Ctrl-b d  |  Stop: make dev-stop"
exec tmux attach -t "${SESSION}"
