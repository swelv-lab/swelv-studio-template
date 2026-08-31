#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Deck slide renderer
# Screenshots one self-contained slide HTML to a crisp 2x PNG using headless
# Chrome. Same mechanic as posts/render.sh and brand/render.sh, kept in sync.
#
#   ./render.sh src/<deck>/01-cover.html
#   ./render.sh <html> [WIDTH] [HEIGHT] [SCALE]
#
# Default canvas is 1920x1080 (16:9 presentation). Run from inside decks/.
# A deck is a folder of slides: src/<deck>/NN-name.html. Output mirrors the
# path under output/<deck>/NN-name.png. Render a whole deck with a loop, then
# combine to one PDF with ./to-pdf.sh <deck> (see README).
# ---------------------------------------------------------------------------
set -euo pipefail

html="${1:?usage: ./render.sh src/<deck>/slide.html [W] [H] [SCALE]}"
w="${2:-1920}"
h="${3:-1080}"
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
