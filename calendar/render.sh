#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Content-calendar renderer
# Renders a tall, self-contained tracker HTML to a crisp 2x PNG, then trims the
# navy margin so the image hugs the board exactly (the board grows/shrinks as
# posts are ticked off, so a fixed canvas size won't do).
#
#   ./render.sh                         # renders src/content-calendar.html
#   ./render.sh <html> [WIDTH] [MAXHEIGHT] [SCALE]
#
# Needs google-chrome-stable (or google-chrome / chromium) and ImageMagick
# (magick). Run from inside calendar/. Output goes to output/, same basename.
# ---------------------------------------------------------------------------
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=../lib/brand.sh
. "$here/../lib/brand.sh"
html="${1:-$here/src/content-calendar.html}"
w="${2:-1760}"
maxh="${3:-8000}"   # render tall, then trim; must exceed the board's height
scale="${4:-2}"
bg="$(brand_token bg '#ffffff')"

chrome="$(command -v google-chrome-stable || command -v google-chrome || command -v chromium || true)"
[ -z "$chrome" ] && { echo "no chrome binary found" >&2; exit 1; }
command -v magick >/dev/null 2>&1 || { echo "ImageMagick (magick) is required" >&2; exit 1; }

abs="$(realpath "$html")"
base="$(basename "$html" .html)"
outdir="$here/output"
mkdir -p "$outdir"
out="$outdir/${base}.png"
raw="$(mktemp --suffix=.png)"
trap 'rm -f "$raw"' EXIT

"$chrome" \
  --headless=new --no-sandbox --disable-gpu \
  --hide-scrollbars --force-color-profile=srgb \
  --force-device-scale-factor="$scale" \
  --window-size="${w},${maxh}" \
  --virtual-time-budget=12000 \
  --screenshot="$raw" \
  "file://${abs}" 2>/dev/null

# Trim the flat navy border down to the board, then add a clean navy margin back.
magick "$raw" -fuzz 1% -trim +repage -bordercolor "$bg" -border 60 "$out"

identify -format 'wrote %f  %wx%h\n' "$out"
