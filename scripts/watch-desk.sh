#!/usr/bin/env bash
# Keep the Errata Desk ask-server on :8791. Restart if the port is empty.
set -euo pipefail
ROOT=/root/sanity-challenge/errata-desk
LOG=/tmp/errata-desk.log
while true; do
  if ! ss -ltn | rg -q '127.0.0.1:8791'; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) restart" >>"$LOG"
    (cd "$ROOT" && node ask-server.mjs >>"$LOG" 2>&1) &
  fi
  sleep 20
done
