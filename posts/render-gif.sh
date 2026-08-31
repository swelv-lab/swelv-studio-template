#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Animated-post renderer: HTML frames -> looping GIF.
#
# The HTML must be "frame-addressable": it reads a 0..1 value from the URL
# hash (e.g. #0.42) and draws that one still frame (see the *-animated.html
# posts). This screenshots each frame with headless Chrome and stitches them
# into a seamless loop with ffmpeg.
#
#   ./render-gif.sh src/linkedin/distributions/distributions-one-transfer-animated.html
#   ./render-gif.sh <html> [W] [H] [FRAMES] [FPS] [GIF_WIDTH]
#
# Output: output/<same path>/<name>.gif  (GIF_WIDTH px wide, loops forever).
# Needs google-chrome-stable + ffmpeg. Run from inside posts/ (or brand//decks/).
# ---------------------------------------------------------------------------
set -euo pipefail

html="${1:?usage: ./render-gif.sh <html> [W] [H] [FRAMES] [FPS] [GIF_WIDTH]}"
w="${2:-1080}"; h="${3:-1350}"; frames="${4:-40}"; fps="${5:-20}"; gifw="${6:-800}"

chrome="$(command -v google-chrome-stable || command -v google-chrome || command -v chromium || true)"
[ -z "$chrome" ] && { echo "no chrome binary found" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg not found (needed for the GIF)" >&2; exit 1; }

abs="$(realpath "$html")"
dir="$(dirname "$html")"; base="$(basename "$html" .html)"
outdir="${dir/#src/output}"; mkdir -p "$outdir"
out="${outdir}/${base}.gif"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# One screenshot per frame; the hash (0..1) tells the page which frame to draw.
for ((k=0; k<frames; k++)); do
  t="$(awk "BEGIN{printf \"%.5f\", $k/$frames}")"
  n="$(printf '%03d' "$k")"
  "$chrome" --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
    --force-color-profile=srgb --force-device-scale-factor=1 \
    --window-size="${w},${h}" --virtual-time-budget=8000 \
    --screenshot="$tmp/f-$n.png" "file://${abs}#${t}" 2>/dev/null
done

# Two-pass palette = clean colours + small file. Loops seamlessly because the
# animation is built so frame 0 continues smoothly from the last frame.
ffmpeg -y -framerate "$fps" -i "$tmp/f-%03d.png" \
  -vf "scale=${gifw}:-1:flags=lanczos,palettegen=stats_mode=diff" "$tmp/pal.png" >/dev/null 2>&1
ffmpeg -y -framerate "$fps" -i "$tmp/f-%03d.png" -i "$tmp/pal.png" \
  -lavfi "scale=${gifw}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3" \
  "$out" >/dev/null 2>&1

echo "wrote ${out} ($(du -h "$out" | cut -f1), ${frames} frames @ ${fps}fps)"

# Prefer an MP4 for LinkedIn (smaller + crisper, and LinkedIn autoplays video)?
# Render frames the same way, then instead of the two ffmpeg lines above use:
#   ffmpeg -y -framerate "$fps" -i "$tmp/f-%03d.png" -c:v libx264 -pix_fmt yuv420p \
#     -movflags +faststart "${outdir}/${base}.mp4"
