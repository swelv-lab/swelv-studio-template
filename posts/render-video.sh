#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Sequenced-video renderer: HTML timeline -> MP4 (plays once).
#
# MP4 is the default for animated posts — smaller and crisper than a GIF,
# autoplays in-feed, and LinkedIn treats it as a real video. The HTML is
# "frame-addressable": it reads a 0..1 value from the URL hash (position on the
# timeline) and draws that one still frame (see the *-video.html posts).
#
# Two holds are baked in for every video (house rules):
#   * READ hold  — the opening (fully-revealed text, pre-animation) is held so a
#                  human can read it. Length should scale with how much text there
#                  is (roughly words / 9, min 3s).  Frame held: READ_T on the timeline.
#   * BRAND hold — the final frame (the full brand lockup) is held END_HOLD seconds.
#                  LinkedIn freezes on the last frame, so the brand stays on screen.
#
#   ./render-video.sh src/linkedin/distributions/distributions-one-transfer-video.html
#   ./render-video.sh <html> [W] [H] [FRAMES] [FPS] [READ_HOLD] [END_HOLD] [READ_T]
#
# W/H are CSS pixels. Frames rasterise at RENDER_SCALE times that (default 1):
#
#   ./render-video.sh <html> 1920 1080 ...              # 1920x1080 — the default
#   RENDER_SCALE=4/3 ./render-video.sh <html> 1920 1080 # 2560x1440, for a
#                                                       # full-screen web player
#
# Do not reach for 2. Video at 2x doubles the render time and the file for
# detail nobody watching in a feed will ever see; that is the opposite trade to
# a still, where 2x is cheap and worth it. See the new-video skill.
#
# Output: output/<same path>/<name>.mp4. Needs google-chrome-stable + ffmpeg.
# For a looping GIF instead (lighter, seamless loop), use render-gif.sh.
# ---------------------------------------------------------------------------
set -euo pipefail

html="${1:?usage: ./render-video.sh <html> [W] [H] [FRAMES] [FPS] [READ_HOLD] [END_HOLD] [READ_T]}"
# 180 frames @ 20fps = 9s of motion — the timing that feels right. Fewer frames
# make the same timeline play faster and it reads as rushed; don't drop below ~180.
w="${2:-1080}"; h="${3:-1350}"; frames="${4:-270}"; fps="${5:-30}"
# 270 frames @ 30fps = 9s of smooth motion. Keep frames ≈ fps × 9s so every output
# frame is a unique render (drop the ratio and it gets choppy; drop the seconds and
# it feels rushed). The fast renderer (below) makes high frame counts cheap.
# READ_HOLD is EXTRA pause on top of the reveal — keep it small (the reveal already
# gives ~2.5s of readable still time); only bump it for genuinely wordy posts.
read_hold="${6:-0}"; end_hold="${7:-2}"; read_t="${8:-0.24}"

# x264 preset. veryslow is right for a 9-second post, where the encode is
# seconds and the file lands in a feed. For a long piece (an explainer, a
# narrated walkthrough) it dominates the render, so:  PRESET=medium ./render-video.sh …
preset="${PRESET:-veryslow}"

chrome="$(command -v google-chrome-stable || command -v google-chrome || command -v chromium || true)"
[ -z "$chrome" ] && { echo "no chrome binary found" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg not found (needed for the MP4)" >&2; exit 1; }

abs="$(realpath "$html")"
dir="$(dirname "$html")"; base="$(basename "$html" .html)"
outdir="${dir/#src/output}"; mkdir -p "$outdir"
out="${outdir}/${base}.mp4"

tmp="$(mktemp -d)"; mkdir -p "$tmp/seq"
trap 'rm -rf "$tmp"' EXIT

# 1) Render the unique timeline frames (t = 0..1 inclusive).
#    Fast path: one persistent browser via render-frames.js (needs `npm install`,
#    ~seconds for hundreds of frames). Fallback: one Chrome launch per frame — no
#    node deps required, just much slower. Same frames either way.
here="$(cd "$(dirname "$0")" && pwd)"
last=$((frames - 1))
if command -v node >/dev/null 2>&1 && [ -d "$here/../node_modules/puppeteer-core" ]; then
  node "$here/render-frames.js" "$abs" "$w" "$h" "$frames" "$tmp" "$chrome"
else
  echo "(slow path: one Chrome per frame — run 'npm install' once for the fast renderer)" >&2
  for ((k=0; k<frames; k++)); do
    t="$(awk "BEGIN{printf \"%.5f\", $k/$last}")"
    n="$(printf '%04d' "$k")"
    "$chrome" --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
      --force-color-profile=srgb --force-device-scale-factor="${RENDER_SCALE:-1}" \
      --window-size="${w},${h}" --virtual-time-budget=8000 \
      --screenshot="$tmp/f-$n.png" "file://${abs}#${t}" 2>/dev/null
  done
fi

# 2) Build the playback sequence, hard-linking frames and repeating the two holds.
read_idx="$(awk "BEGIN{printf \"%d\", $read_t*$last + 0.5}")"
read_frames="$(awk "BEGIN{printf \"%d\", $read_hold*$fps + 0.5}")"
end_frames="$(awk "BEGIN{printf \"%d\", $end_hold*$fps + 0.5}")"
s=0
put() { ln -f "$1" "$tmp/seq/$(printf '%06d' "$s").png"; s=$((s + 1)); }
for ((k=0; k<frames; k++)); do
  src="$tmp/f-$(printf '%04d' "$k").png"
  put "$src"
  if [ "$k" -eq "$read_idx" ]; then
    for ((r=0; r<read_frames; r++)); do put "$src"; done   # hold the opening to read
  fi
done
lastsrc="$tmp/f-$(printf '%04d' "$last").png"
for ((r=0; r<end_frames; r++)); do put "$lastsrc"; done      # hold the brand at the end

# 3) Optional sound. If there's a <name>.audio.json sidecar next to the HTML and
#    node is available, synthesize a WAV synced to the timeline and mux it in.
total=$((s))
motion_dur="$(awk "BEGIN{printf \"%.4f\", $frames/$fps}")"
total_dur="$(awk "BEGIN{printf \"%.4f\", $total/$fps}")"
audiojson="${dir}/${base}.audio.json"
audio_in=(); audio_codec=(); sound="no sound"
if [ -f "$audiojson" ] && command -v node >/dev/null 2>&1; then
  if node "$here/render-audio.js" "$audiojson" "$tmp/audio.wav" "$total_dur" "$motion_dur" 2>/dev/null; then
    audiowav="$tmp/audio.wav"
    # If the cue file layers in real recordings ("sample" cues), edit + place
    # them over the synth track (trim/level/pitch/room/fade) via ffmpeg.
    if grep -q '"type"[[:space:]]*:[[:space:]]*"sample"' "$audiojson"; then
      if node "$here/mix-samples.js" "$audiojson" "$tmp/audio.wav" "$here/assets/audio" "$tmp/audio_final.wav" "$motion_dur"; then
        audiowav="$tmp/audio_final.wav"; sound="with sound (+samples)"
      fi
    fi
    [ "$sound" = "no sound" ] && sound="with sound"
    audio_in=(-i "$audiowav"); audio_codec=(-c:a aac -b:a 192k -shortest)
  fi
fi

# 4) Encode. yuv420p + faststart for universal, in-feed playback.
ffmpeg -y -framerate "$fps" -i "$tmp/seq/%06d.png" "${audio_in[@]}" \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -preset "$preset" "${audio_codec[@]}" \
  -movflags +faststart "$out" >/dev/null 2>&1

echo "wrote ${out} ($(du -h "$out" | cut -f1), $(awk "BEGIN{printf \"%.1f\", $total/$fps}")s, ${sound}: ${read_hold}s read hold, ${end_hold}s brand hold)"
