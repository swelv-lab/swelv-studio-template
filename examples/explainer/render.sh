#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Build the explainer end to end.
#
#   ./render.sh              # full build (~5 min)
#   FAST=1 ./render.sh       # half frame rate, for checking a change quickly
#
# The chain, and why it is in this order:
#   1. voice.py       narration -> vo/*.wav, and MEASURES it
#   2. build.py       those measurements -> timings.js
#   3. render-video   explainer.html -> frames -> MP4, with the synthesized SFX
#   4. ffmpeg         narration mixed over the SFX
#
# The animation is timed to the voice, never the other way round. Change a word
# in script.json and re-run: every scene re-anchors itself to the new durations.
#
# Needs: edge-tts (pip install edge-tts), ffmpeg, Chrome, and `npm install` in
# the repo root for the fast frame renderer. The narration step needs network;
# nothing else here does.
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(cd ../.. && pwd)"

FPS="${FPS:-30}"
[ -n "${FAST:-}" ] && FPS=15

echo "1/4 · narration"
./voice.py

echo "2/4 · timings"
./build.py

TOTAL=$(python3 -c "import json;print(json.load(open('vo/timing.json'))['total'])")
SIGNOFF=4.6
DUR=$(python3 -c "print($TOTAL + $SIGNOFF)")
FRAMES=$(python3 -c "print(round($DUR * $FPS))")
echo "3/4 · ${FRAMES} frames at ${FPS}fps (${DUR}s)"
# read/end holds are ZERO on purpose: this video's sign-off hold is inside the
# timeline, and an inserted hold would slide the picture out of sync with the voice.
PRESET="${PRESET:-medium}" "$ROOT/posts/render-video.sh" \
  "$(pwd)/explainer.html" 1920 1080 "$FRAMES" "$FPS" 0 0 0

echo "4/4 · mixing the voice over the sound"
mkdir -p rendered
ffmpeg -y -i explainer.mp4 -i vo/narration.wav -filter_complex \
  "[0:a]aresample=48000,volume=1.0[sfx];[1:a]aresample=48000,volume=1.25[vo];\
   [sfx][vo]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.94,aresample=48000[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart rendered/swelv-studio-explainer.mp4 2>/dev/null
rm -f explainer.mp4

echo
echo "wrote rendered/swelv-studio-explainer.mp4"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 rendered/swelv-studio-explainer.mp4
