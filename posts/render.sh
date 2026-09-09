#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Social post renderer
# Screenshots a self-contained post HTML to a crisp 2x PNG using headless
# Chrome. No repo dependencies — just google-chrome-stable.
#
#   ./render.sh src/linkedin/capital-call-the-manual-way.html
#   ./render.sh <html> [WIDTH] [HEIGHT] [SCALE]
#
# WIDTH/HEIGHT are resolved from the preset class on .canvas (see
# src/_shared/canvas.css) and only need passing to override it.
# Run from inside posts/. Input must live under src/<network>/; output is
# written to output/<network>/, same basename, .png.
# ---------------------------------------------------------------------------
set -euo pipefail

html="${1:?usage: ./render.sh src/<network>/post.html [W] [H] [SCALE]}"
scale="${4:-2}"

# Resolve the canvas from the preset class the post declares, e.g.
#   <div class="canvas tt-photo">   ->   src/_shared/canvas.css  ->  1080x1920
# Passing sizes by hand is how a post silently ships cropped, so this is the
# default and the arguments are the override.
here="$(cd "$(dirname "$0")" && pwd)"
presets="$here/src/_shared/canvas.css"
w="${2:-}"; h="${3:-}"
if [ -z "$w" ] || [ -z "$h" ]; then
  # Pull the preset out of the class attribute. Tolerates extra classes, so
  # `class="canvas ig-story guides"` still resolves, and never kills the script
  # when a post declares no preset at all.
  attr="$(grep -om1 'class="canvas [^"]*"' "$html" 2>/dev/null | sed 's/^class="//; s/"$//' || true)"
  cls=""
  for tok in $attr; do
    case "$tok" in
      canvas | guides) ;;
      *) cls="$tok"; break ;;
    esac
  done
  if [ -n "$cls" ] && [ -f "$presets" ]; then
    # Read the whole rule block: the vertical presets declare their safe zones
    # on following lines, so matching a single line misses --w / --h entirely.
    block="$(awk -v c=".${cls}" '$1 == c { f = 1 } f { print } f && /}/ { exit }' "$presets")"
    pw="$(printf '%s' "$block" | grep -o -- '--w: *[0-9]*' | grep -o '[0-9]*$' || true)"
    ph="$(printf '%s' "$block" | grep -o -- '--h: *[0-9]*' | grep -o '[0-9]*$' || true)"
    [ -n "$pw" ] && w="$pw"
    [ -n "$ph" ] && h="$ph"
  fi
fi
# Fall back to the LinkedIn portrait default when a post declares no preset.
w="${w:-1080}"
h="${h:-1350}"

chrome="$(command -v google-chrome-stable || command -v google-chrome || command -v chromium || true)"
[ -z "$chrome" ] && { echo "no chrome binary found" >&2; exit 1; }

abs="$(realpath "$html")"

dir="$(dirname "$html")"
base="$(basename "$html" .html)"
outdir="${dir/#src/output}"
# Run from anywhere else and the src->output swap never fires, so the PNG lands
# beside the source and quietly pollutes src/. Say so rather than doing it.
if [ "$outdir" = "$dir" ] && [ "${html#src/}" = "$html" ]; then
  echo "run this from inside posts/ - e.g.  cd posts && ./render.sh src/${html##*/src/}" >&2
  exit 1
fi
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
