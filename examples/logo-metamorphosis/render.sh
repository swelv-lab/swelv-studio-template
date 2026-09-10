#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Build the logo metamorphosis: a 9.4s story, then a 6.5s ender, concatenated.
#
#   ./render.sh          # the whole chain, about two minutes
#   FAST=1 ./render.sh   # half frame rate, for checking a change
#
# Two clips because the ender is reusable: it is this brand's sign-off and gets
# concatenated onto other films too. Rendering it separately means it is built
# once and stream-copied on, never re-encoded.
#
# Both are 1920x1080 at 1x. Do not raise the scale — see the "Master size"
# section of the new-video skill. The concat is a stream copy, so if you change
# the size of one clip you must change both or ffmpeg will refuse.
#
# Needs: ffmpeg, Chrome, and `npm install` in the repo root for the fast
# frame renderer. Nothing here needs the network.
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(cd ../.. && pwd)"

FPS="${FPS:-30}"
[ -n "${FAST:-}" ] && FPS=15

STORY=9.4
ENDER=6.5
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p rendered

# render-video.sh finds the <name>.audio.json sidecar beside each HTML and lays
# the sound itself. Holds are zero: both timelines carry their own pacing, and
# an inserted hold would slide the picture out of sync with the cue sheet.
for clip in metamorphosis:$STORY ender:$ENDER; do
  name="${clip%%:*}"; dur="${clip##*:}"
  frames=$(python3 -c "print(round($dur * $FPS))")
  echo "· $name — ${frames} frames at ${FPS}fps (${dur}s)"
  "$ROOT/posts/render-video.sh" "$(pwd)/$name.html" 1920 1080 "$frames" "$FPS" 0 0 0
done

echo "· joining"
# The story fades to bare navy and the ender opens on the same navy, so a
# straight concat reads as one film. Streams match, so no re-encode.
printf "file '%s'\nfile '%s'\n" "$(pwd)/metamorphosis.mp4" "$(pwd)/ender.mp4" > "$tmp/list.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$tmp/list.txt" \
  -c copy -movflags +faststart rendered/logo-metamorphosis.mp4
rm -f metamorphosis.mp4 ender.mp4

echo
echo "wrote rendered/logo-metamorphosis.mp4"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 rendered/logo-metamorphosis.mp4
