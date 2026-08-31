---
name: new-video
description: Create an on-brand video — a square or landscape MP4 with sound and the branded sign-off. Use when the user wants an animated post, a product-feature video, a logo/brand animation, sound added to an existing animation, OR wants to brand-frame a real narrated screen recording they paste in (raw walkthrough → branded intro + overlays + sign-off).
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Create a video

Motion outperforms stills in every feed, and this pipeline makes a video the same
way it makes an image: **self-contained HTML, rendered by headless Chrome**. No
video editor, no timeline app, no motion-design tool.

The whole trick is that the HTML is **frame-addressable** — it reads a position
on the timeline and draws that one still frame. `render-video.sh` walks the
timeline, screenshots every frame, synthesizes the sound, and encodes an MP4.

## Before you start — read these

1. **`brand-kit/BRAND.md`** — ground every claim. Video is the surface where an
   unsourced claim does the most damage, because it is the most shared.
2. **`docs/design-rules.md`** and **`docs/writing-rules.md`**.
3. **`posts/README.md`** § Animated posts — the mechanic and the flags.
4. The closest existing video under `posts/src/` or `examples/`. **Copy it.
   Never start a video from a blank file.**

## The five rules (memorise before writing anything)

1. **Every frame is a pure function of time.** All animation lives in one
   function of `t`. Never `Date.now()`, `Math.random()`, `requestAnimationFrame`,
   CSS `animation` or `transition`, or a video/gif asset. Called twice with the
   same `t`, it must paint the identical frame. This is what makes renders
   deterministic and re-runs comparable.
2. **The video must end on the full brand, fully visible, held.** Feeds freeze on
   the last frame — that frozen frame is a free billboard, and a video that ends
   mid-fade wastes it. `render-video.sh` holds the last frame for `END_HOLD`
   (default 2s). Never add anything after the sign-off.
3. **Hold the opening long enough to read.** Scale it to the amount of text —
   roughly `words / 9` seconds, minimum 3. The single most common failure in
   this pipeline is a video nobody can read.
4. **Motion is quiet.** Fades and small rises (opacity plus a short translate,
   ease-out). No bounces, no overshoot, no rotation, no parallax. A few moving
   elements on an otherwise still frame reads far better than everything moving.
5. **Land effects honestly.** A row turns green when its dot actually arrives,
   not a beat before. Motion that lies about causality is the thing people can't
   name but do notice.

## The contract with the renderer

Your HTML must expose the timeline both ways:

```js
window.renderFrame = (t) => { /* draw the frame at t, where t is 0..1 */ };
// and honour the URL hash on load, for the no-node fallback path:
addEventListener("DOMContentLoaded", () => renderFrame(parseFloat(location.hash.slice(1)) || 0));
```

`render-frames.js` (fast path, needs `npm install`) calls `renderFrame(t)` on one
persistent page. The fallback path launches Chrome per frame at `file://…#t`.
Same frames either way — but **support both** or the fallback silently renders
frame 0 three hundred times.

## Steps

### 1 · Storyboard before you write code

Produce a timeline table and, if the brief was vague, show it to the user before
building. Times in seconds:

| t | visual | sound |
|---|---|---|
| 0.0–0.4 | ground, empty | opening swell |
| 0.4–3.0 | kicker, then the two-line headline rises, then the subhead | one tick per line as it lands |
| 3.0–3.6 | the title compresses upward, subhead fades | — |
| 3.6–8.6 | **the scene** — the actual thing the video is about | per the cue vocabulary |
| 8.6–9.3 | the result settles; a figure lands in the footer | one tick |
| 9.3–10.0 | scene fades to the bare ground | **silence** |
| 10.0–12.0 | sign-off: mark lands, wordmark, tagline. Held. | the brand cue, once |

Headline grammar for the series: two short lines, the first states the actor or
the problem, the second the outcome. Keep it under twelve words total.

### 2 · Build from the closest existing video

```bash
cd posts/src/<network>
mkdir -p <topic>
cp <nearest>/<nearest>-video.html <topic>/<topic>-video.html
```

Keep verbatim: the `:root` link to `brand-kit/brand.css`, the stage mechanics,
the header, the easing helpers, the `renderFrame` shim and the sign-off block.
Replace only the scene markup and the middle of the timeline function. Expose
every cue time as a `const` at the top of the script so the sound file can point
at the same numbers.

### 3 · Add the sound

Sound is **procedural** — synthesized from a JSON sidecar, no audio files, no
licensing, deterministic. Write `<name>.audio.json` next to the HTML:

```json
{
  "seed": 24334,
  "cues": [
    { "type": "whoosh", "t": 0.02, "dur": 0.9, "gain": 0.10 },
    { "type": "tone",   "t": 0.09, "freq": 587.33, "gain": 0.16 },
    { "type": "bell",   "t": 0.86, "freq": 587.33, "dur": 1.4, "gain": 0.18 }
  ]
}
```

Cue types: `bell` `tone` `chord` `pad` `whoosh` `sweep` `shimmer` `note` `drop`
`chime` `synth` `splash`, plus `sample` to layer a real audio file from
`posts/assets/audio/` (trimmed, levelled, pitched, placed). Position a cue with
`t` (0..1 along the motion timeline) or `time` (absolute seconds).

**The discipline matters more than the palette:**

- **Give each cue exactly one meaning and never reuse it for anything else.** One
  sound for "a thing landed", one for "a process is running", one for "settled",
  one reserved for the brand mark. Across a series this becomes recognisable —
  which is the entire point of sound on a muted-autoplay platform.
- **Pick one key and stay in it.** Every pitch in the set should belong to one
  scale. Wrong-key notes are how a video sounds cheap without anyone knowing why.
  A deliberately off-key note is then available to you, once, to mean *wrong* —
  fraud, failure, the old way.
- **The last second before the fade is silent.** Always.
- **It must work muted.** Feeds autoplay silent. Sound is polish, never load-bearing.

### 4 · Keyframe check — before the full render

Do not render three hundred frames to discover the headline overflows.

```bash
cd posts
for t in 0.15 0.35 0.60 0.85 1.00; do
  google-chrome-stable --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
    --force-color-profile=srgb --window-size=1080,1080 --virtual-time-budget=8000 \
    --screenshot="/tmp/kf-$t.png" "file://$(realpath src/<network>/<topic>/<topic>-video.html)#$t"
done
```

**`Read` every one of those PNGs.** Check: nothing overflows, nothing overlaps
illegibly, nothing is visible before its cue (the classic bug — an element shows
at t=0 because its opacity expression defaults to 1 outside its window; pin it
with an explicit `t < start ? 0 : …`), colours follow the brand rules, the copy
is real and grounded. Fix and repeat until clean.

### 5 · Render

```bash
cd posts && ./render-video.sh src/<network>/<topic>/<topic>-video.html 1080 1080
# ./render-video.sh <html> [W] [H] [FRAMES] [FPS] [READ_HOLD] [END_HOLD] [READ_T]
```

Keep `FRAMES ≈ FPS × seconds` so every output frame is a unique render — drop
that ratio and the motion goes choppy. For a lighter looping GIF instead, use
`./render-gif.sh`.

### 6 · Verify the actual output file, then deliver

Never tell the user a video is done without having looked at frames from the
**real MP4**, not from the HTML:

```bash
V=output/<network>/<topic>/<topic>-video.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 "$V"
for t in 1 5 9 11.5; do ffmpeg -y -ss $t -i "$V" -frames:v 1 /tmp/out-$t.png 2>/dev/null; done
```

`Read` them all, including one inside the sign-off. Then report what the video
shows act by act, the sound map, and the file path — and offer, never assume, to
upload.

## Traps (every one of these has actually happened)

- **A remote `@import` font does not load during frame capture.** Frames render
  in the fallback stack and the whole video is silently off-brand. Run
  `brand-kit/fetch-fonts.sh` and use the local `@font-face` block for video.
- **Only supporting the hash, not `renderFrame`** (or the reverse) — one path
  works, the other renders a still repeated hundreds of times. Test both.
- **Editing anything in `output/`.** It is regenerated on every render; the edit
  vanishes and you debug a ghost.
- **A cue that ends after the fade starts** — the video ends on an audible tail
  cut off mid-decay.
- **Something looks wrong at exactly one timestamp and fine either side** — it is
  an expression evaluating outside its intended window. Clamp it explicitly.

---

# Brand-framing a real screen recording

**This is the default for product walkthroughs**, and it beats reconstructing a
flow from screenshots every time. The user pastes a real recording with their own
voiceover; you wrap it:

`[branded intro] → [the recording, cleaned and branded] → [branded sign-off]`

### 1 · Intake and quality gate — every time, first

```bash
ffprobe -v error -show_entries stream=codec_type,width,height,r_frame_rate,bit_rate:format=duration <raw>
ffmpeg -i <raw> -af volumedetect -f null /dev/null 2>&1 | grep _volume
```

**Bitrate is the quality ceiling and you cannot raise it.** 720p under ~1 Mbps is
soft and blocky, and upscaling only softens it further. Several popular recorders'
free exports land at 140–310 kbps, which is too low. If the source is weak, say so
up front and ask for a better export (1080p, high bitrate) rather than promising
sharpness the file cannot give. A mild `unsharp` is the only lever and it is marginal.

### 2 · Script and trim plan — the centrepiece, show it before building

The user's own voice is the sync guide: where they talk about a feature is where
that feature is on screen. Map speech against silence, sample the scenes, and
propose cuts:

```bash
ffmpeg -i <raw> -af silencedetect=noise=-38dB:d=0.8 -f null /dev/null 2>&1 | grep silence_
for t in 5 40 80 120 160 195; do ffmpeg -ss $t -i <raw> -frames:v 1 /tmp/raw-$t.png; done
```

Produce a table — raw timestamp, scene, what they say, the plan — and get a nod
before cutting.

- **Long silent stretches are the safe cut targets.** A progress bar the narrator
  waits through is the classic one: trim it, or speed-ramp video and audio
  together (`setpts` / `atempo`) so the voice stays natural-pitched.
- **Never cut mid-sentence.** Cut only at pauses `silencedetect` actually found.
- A three-and-a-half minute raw usually wants to land near two minutes.

### 3 · Build the wrapper

**Intro** — a short HTML piece in the studio's own pipeline: the title and the
starting context held together on one screen for ~3.5s, then a fade to the bare
ground so it splices invisibly into the recording.

**Overlay cards** — HTML cards rendered on a **chroma-green** page, then keyed
over the footage: a persistent brand banner in one corner, plus timed tip cards
that explain a feature or mask a stray notification.

**Clean and composite** — `delogo` any recorder watermark, scale, sharpen, then
key and overlay the cards:

```bash
ffmpeg -y -i <raw> -i brand-card.png -filter_complex "
 [0:v]delogo=x=1:y=636:w=468:h=78,scale=1920:1080:flags=lanczos,unsharp=5:5:0.8:5:5:0.0,fps=30[base];
 [1:v]colorkey=0x00ff00:0.32:0.10,despill=type=green:mix=0.4,format=rgba[c];
 [c]split[card][s];[s]lutrgb=r=0:g=0:b=0,gblur=sigma=11,colorchannelmixer=aa=0.5[shadow];
 [base][shadow]overlay=x=40:y=924[o];[o][card]overlay=x=36:y=916[v]" \
 -map "[v]" -map 0:a -t <recdur> -c:v libx264 -crf 18 -pix_fmt yuv420p \
 -c:a aac -b:a 192k -movflags +faststart rec.mp4
```

**Assemble** intro + recording + sign-off with fade-through-ground seams —
`xfade` for video, `acrossfade` for audio, offsets computed from the real
durations.

### 4 · Chroma-key rules — learned the hard way, do not skip

- **Key the card element tightly.** Screenshot the card itself, never a padded
  green wrapper: the wrapper's rectangular green edge survives 4:2:0 chroma
  subsampling as a faint one-pixel ghost line across the frame.
- **`despill`** removes the green fringe on anti-aliased rounded corners.
- **Generate the drop shadow in ffmpeg**, not as a CSS `box-shadow` captured
  inside a green wrapper — that reintroduces the wrapper edge and clips the
  shadow into a hard line.
- **Bound the output with `-t`** when an input uses `-loop 1`, or the render runs
  to the loop's length and you ship a frozen tail.
- Fade a timed card and its shadow layer on the same `st` and `d` so they move
  together.

### 5 · Tell the user how to record — before they record

- 1080p, high bitrate, no zoom effects, whole app visible.
- Turn the recorder's own watermark off at source.
- Disable the browser's password-manager prompt; it will pop up mid-demo.
- Hide framework dev indicators and error overlays.
- Reset demo data first so the flow is clean and the names are sensible.

### 6 · Verify and deliver

Extract frames across the intro, each scene, every tip card, and inside the
sign-off. `Read` them all. Confirm: no chroma line, watermark gone, each tip
fully covers its target for the whole time it is up (extend the fade-out about a
second past what it masks), audio present throughout, seams clean. Then deliver
and offer to upload.

## Sound-only briefs

"Add sound to X" or "change that cue" → edit only the `.audio.json`, re-render,
and remux without re-capturing frames:

```bash
ffmpeg -y -i <video>.mp4 -i <new>.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k <out>.mp4
```
