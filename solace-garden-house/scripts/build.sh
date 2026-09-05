#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CANDIDATES=(
  "${BLENDER_BIN:-}"
  "$HOME/tools/blender-4.2.23-linux-x64/blender"
  "$HOME/tools/blender-4.5.0-linux-x64/blender"
  "blender"
)

BLENDER=""
for c in "${CANDIDATES[@]}"; do
  [[ -z "$c" ]] && continue
  if [[ -x "$c" ]]; then
    BLENDER="$c"
    break
  fi
  if command -v "$c" >/dev/null 2>&1; then
    BLENDER="$(command -v "$c")"
    break
  fi
done

if [[ -z "$BLENDER" ]]; then
  echo "Blender not found. Run ./scripts/install_blender.sh or set BLENDER_BIN." >&2
  exit 1
fi

echo "Using $BLENDER"
mkdir -p "$ROOT/output" "$ROOT/textures" "$ROOT/viewer/assets"

EXTRA=()
if [[ "${1:-}" == "--skip-render" ]]; then
  EXTRA+=(--skip-render)
fi

"$BLENDER" --background --python "$ROOT/blender/build_house.py" -- \
  --output "$ROOT/output" \
  --textures "$ROOT/textures" \
  --viewer "$ROOT/viewer/assets" \
  "${EXTRA[@]}"
