#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Brand asset renderer
# Screenshots a self-contained brand-asset HTML to a crisp 2x PNG using
# headless Chrome. No repo dependencies — just google-chrome-stable.
# Same mechanic as posts/render.sh, kept in sync deliberately.
#
#   ./render.sh src/template.html
#   ./render.sh <html> [WIDTH] [HEIGHT] [SCALE]
#
# WIDTH/HEIGHT default to 1200x630 (OG-image size). Run from inside brand/.
# Input must live under src/; output is written to the mirroring path under
# output/, same basename, .png.
# ---------------------------------------------------------------------------
set -euo pipefail

html="${1:?usage: ./render.sh src/asset.html [W] [H] [SCALE]}"
w="${2:-1200}"
h="${3:-630}"
scale="${4:-2}"

chrome="$(command -v google-chrome-stable || command -v google-chrome || command -v chromium || true)"
[ -z "$chrome" ] && { echo "no chrome binary found" >&2; exit 1; }

abs="$(realpath "$html")"

dir="$(dirname "$html")"
base="$(basename "$html" .html)"
outdir="${dir/#src/output}"
mkdir -p "$outdir"
out="${outdir}/${base}.png"

"$chrome" \
  --headless=new --no-sandbox --disable-gpu \
  --hide-scrollbars --force-color-profile=srgb \
  --force-device-scale-factor="$scale" \
  --window-size="${w},${h}" \
  --virtual-time-budget=10000 \
  --screenshot="$out" \
  "file://${abs}" 2>/dev/null

echo "wrote ${out} ($((w * scale))x$((h * scale)))"
