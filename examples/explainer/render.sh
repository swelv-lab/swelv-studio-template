#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Build the explainer end to end: the story, then the shared ender.
#
#   ./render.sh              # full build (~6 min)
#   FAST=1 ./render.sh       # half frame rate, for checking a change quickly
#
# The chain, and why it is in this order:
#   1. voice.py       narration -> vo/*.wav, and MEASURES it (network; skips
#                     lines that already have a wav — FORCE=1 to redo them)
#   2. build.py       those measurements -> timings.js, and sound.json ->
#                     explainer.audio.json (every cue anchored to a line)
#   3. render-video   explainer.html -> frames -> MP4, with the synthesized SFX
#   4. ffmpeg         narration mixed over the SFX
#   5. ../ender       the brand's sign-off, rendered once, stream-copied on
#
# The animation is timed to the voice, never the other way round. Change a word
# in script.json and re-run: every scene, every join and every sound cue
# re-anchors itself to the new durations.
#
# Needs: edge-tts (pip install edge-tts, or uv), ffmpeg, Chrome, and
# `npm install` in the repo root for the fast frame renderer. The narration
# step needs network; nothing else here does.
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(cd ../.. && pwd)"

FPS="${FPS:-30}"
[ -n "${FAST:-}" ] && FPS=15
ENDER=../ender/rendered/ender.mp4
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "1/5 · narration"
./voice.py

echo "2/5 · timings + cue sheet"
./build.py

TOTAL=$(python3 -c "import json;print(json.load(open('vo/timing.json'))['total'])")
TAIL=0.9                                   # must match TAIL in timeline.js
DUR=$(python3 -c "print(round($TOTAL + $TAIL, 3))")
FRAMES=$(python3 -c "print(round($DUR * $FPS))")
echo "3/5 · ${FRAMES} frames at ${FPS}fps (${DUR}s)"
# holds are ZERO on purpose: the timeline carries its own pacing, and an
# inserted hold would slide the picture out of sync with the voice.
PRESET="${PRESET:-medium}" "$ROOT/posts/render-video.sh" \
  "$(pwd)/explainer.html" 1920 1080 "$FRAMES" "$FPS" 0 0 0

echo "4/5 · mixing the voice over the sound"
# Audio matched to the ender's stream (aac, 44.1k, mono) so the join below is
# a stream copy. The video is re-encoded here at crf 21: paper grain and a
# halftone are expensive to encode, and at the renderer's crf 18 this 88s piece
# is 40 MB for detail nobody sees under a voice. 21 is invisible and half that.
ffmpeg -y -loglevel error -i explainer.mp4 -i vo/narration.wav -filter_complex \
  "[0:a]aresample=44100,volume=1.0[sfx];[1:a]aresample=44100,volume=1.25[vo];\
   [sfx][vo]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.94,aresample=44100[a]" \
  -map 0:v -map "[a]" -c:v libx264 -crf 21 -preset "${PRESET:-medium}" -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 44100 -ac 1 -movflags +faststart "$tmp/story.mp4"
rm -f explainer.mp4

echo "5/5 · the ender"
[ -f "$ENDER" ] && [ ! ../ender/ender.html -nt "$ENDER" ] || FPS=$FPS ../ender/render.sh
mkdir -p rendered
# The story ends on bare navy and the ender opens on the same navy, so a
# straight concat reads as one film. Streams match, so no re-encode.
printf "file '%s'\nfile '%s'\n" "$tmp/story.mp4" "$(realpath "$ENDER")" > "$tmp/list.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$tmp/list.txt" \
  -c copy -movflags +faststart rendered/swelv-studio-explainer.mp4

echo
echo "wrote rendered/swelv-studio-explainer.mp4"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 rendered/swelv-studio-explainer.mp4
