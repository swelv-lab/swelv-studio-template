#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Social post renderer
# Screenshots a self-contained post HTML to a crisp 2x PNG using headless
# Chrome. No repo dependencies — just google-chrome-stable.
#
#   ./render.sh src/linkedin/capital-call-the-manual-way.html
#   ./render.sh <html> [WIDTH] [HEIGHT] [SCALE]
#
# WIDTH/HEIGHT default to the canvas the post declares (LinkedIn 1080x1350).
# Run from inside posts/. Input must live under src/<network>/; output is
# written to output/<network>/, same basename, .png.
# ---------------------------------------------------------------------------
set -euo pipefail

html="${1:?usage: ./render.sh src/<network>/post.html [W] [H] [SCALE]}"
w="${2:-1080}"
h="${3:-1350}"
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
