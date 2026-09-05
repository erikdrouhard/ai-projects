#!/usr/bin/env bash
set -euo pipefail

# Official blender.org is often Cloudflare-challenged from datacenter IPs.
# University mirrors serve the same 4.2 LTS tarball.
VERSION="${BLENDER_VERSION:-4.2.23}"
NAME="blender-${VERSION}-linux-x64"
DEST="${BLENDER_DIR:-$HOME/tools}"
URL="${BLENDER_URL:-https://plug-mirror.rcac.purdue.edu/blender/release/Blender4.2/${NAME}.tar.xz}"

mkdir -p "$DEST" /tmp/blender-dl
if [[ -x "$DEST/$NAME/blender" ]]; then
  echo "Blender already installed at $DEST/$NAME/blender"
  "$DEST/$NAME/blender" --version | head -n 1
  exit 0
fi

echo "Downloading $URL"
curl -L --retry 4 --retry-delay 4 -o /tmp/blender-dl/blender.tar.xz "$URL"
tar -xJf /tmp/blender-dl/blender.tar.xz -C "$DEST"
echo "Installed $DEST/$NAME/blender"
"$DEST/$NAME/blender" --version | head -n 1
