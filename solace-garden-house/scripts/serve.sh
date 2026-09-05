#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-8080}"

if [[ ! -f "$ROOT/viewer/assets/house.glb" ]]; then
  echo "Missing viewer/assets/house.glb — run ./scripts/build.sh first." >&2
  exit 1
fi

echo "Walkthrough at http://127.0.0.1:${PORT}/"
exec python3 -m http.server "$PORT" --directory "$ROOT/viewer" --bind 127.0.0.1
