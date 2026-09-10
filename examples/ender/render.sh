#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# The ender — this brand's sign-off, 6.5s at 1920x1080.
#
#   ./render.sh          # → rendered/ender.mp4
#
# It is rendered ONCE and stream-copied onto the end of every film in this
# repo (the metamorphosis, the explainer): built here, never re-encoded there.
# The other render scripts call this one when rendered/ender.mp4 is missing or
# older than ender.html. Keep it 1920x1080 at 1x — a concat is a stream copy,
# so the ender's dimensions have to match every film it is joined to.
#
# Needs: ffmpeg, Chrome, and `npm install` in the repo root. No network.
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(cd ../.. && pwd)"
FPS="${FPS:-30}"
DUR=6.5
frames=$(python3 -c "print(round($DUR * $FPS))")
mkdir -p rendered
echo "· ender — ${frames} frames at ${FPS}fps (${DUR}s)"
"$ROOT/posts/render-video.sh" "$(pwd)/ender.html" 1920 1080 "$frames" "$FPS" 0 0 0
mv -f ender.mp4 rendered/ender.mp4
echo "wrote rendered/ender.mp4"
