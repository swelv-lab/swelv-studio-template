# The explainer

A 95-second narrated explainer for the studio, **made with the studio** — and
cut the way the logo film is cut. Five acts, each set in a different way images
have been made, joined by physical transitions rather than cross-fades. Same
brand kit, same renderer, same procedural sound as any other video in this
repo. The two things it adds are a voice track and GSAP.

`rendered/swelv-studio-explainer.mp4` · 1920×1080 · 30fps · 88s of story + the 6.5s [ender](../ender/)

```bash
./render.sh          # the whole chain, about six minutes
FAST=1 ./render.sh   # half frame rate, for checking a change
```

This is the file to read if you want to know **how video is sequenced here**.
`timeline.js` is written to be read top to bottom, and the film's fourth act
explains itself on screen: the diagram it shows is this timeline, with four of
its real tweens at their real positions. The playhead does what the renderer
does — it *jumps* to each anchor, the tween runs, the frame that came back is
shown — and then snaps to the frame you are actually watching.

## The five acts

| Act | Material | Lines | What the material does |
| --- | -------- | ----- | ---------------------- |
| I   | **hand** — ink on paper | `hook` → `turn` | Everything is *written*: a clip wipe, left to right. The lockup is drawn by a pen. |
| II  | **neon** — a CRT | `ask` → `iterate` | Everything *switches on*: a bright line that expands into a panel. A re-render is the slide switching off and on again. |
| III | **press** — a duplicator | `print` → `essay` | Everything is *printed*: a blue plate lands, the orange lands a beat later, slightly off. A halftone prints in from the foot. |
| IV  | **cel** — a painted cel | `video1` → `video4` | Everything is *cut*: a hard cut with a one-frame flash. The mountain rises; the flock crosses. |
| V   | **brand** — the kit as shipped | `calendar` → `close` | Everything *rises*, the way the rest of the studio does. Then bare navy, and the ender. |

The joins between them are the logo film's, reused: the sunset rises over the
paper and the page turns over; the screen collapses to a line and a dot; the
sheet is pulled and the painted sky arrives one band at a time; the last cut
leaves the navy. The header lockup goes through all of it — it is the film's
lockup, morphing material with the act — and reads *swelv studio* in each
world's own hand.

**One set of furniture, five skins.** The cards, bars, pills and the terminal
are the same classes in every act. Each world re-declares the brand kit's
tokens (`--fg`, `--panel`, `--line`, `--accent`, `--sans`) on the stage, so
switching `data-world` re-dresses the whole act with no second set of markup.
That is the same idea as the brand kit itself, one level down.

## How it is sequenced — the pattern worth stealing

### 1 · Every frame is a pure function of `t`

The renderer calls `window.renderFrame(u)` for `u = 0 … 1` and screenshots each
one. No `Date.now()`, no `requestAnimationFrame`, no CSS `transition`, no
`Math.random()`: any of those makes a frame that will not reproduce, and frame
1,400 has to be identical on every render.

GSAP is allowed under that rule because the timeline is **paused**:

```js
const tl = gsap.timeline({ paused: true, defaults: { overwrite: false, lazy: false } });

window.seek = (t) => {
  tl.seek(t, true);          // a lookup, not a playback — nothing is on a clock
  apply(cur);                // the ground's state object → CSS variables
  post(t);                   // the few things that are a function of t, not a tween
};
window.renderFrame = (u) => window.seek(u * DUR);
```

`tl.seek(t)` renders the exact state at `t`. Seek it twice, get the same
frame. That is the whole trick, and it is why a wall-clock library (Framer
Motion, a ticker, CSS transitions) cannot be used here and this one can.

### 2 · The anchors come from the voice

`voice.py` renders the narration and **measures** it; `build.py` writes the
measurements into `timings.js`. So `L.print.start` is the real second she
starts the line with id `print`, and every tween is positioned off a line:

```js
tl.to(r.file, { clipPath: "inset(-12% 0% -12% -3%)", duration: 0.6 }, L.brand2.start + 0.55);
```

Read aloud: *the file is written 0.55 seconds after she says "one file"*. The
four joins are named once at the top (`T1 = L.turn.start + 0.10`, and so on)
and everything else positions off those. Change a word in `script.json`,
re-run, and every scene, every join and every sound cue re-anchors itself.

The sound is anchored the same way. `sound.json` says `"at": "print - 0.45"`;
`build.py` resolves it into the absolute seconds `render-audio.js` needs.

### 3 · A scene is `build()` + `cues()`

```js
scene("ask", L.ask.start - 0.2, T2 + 0.4, "just ask",
  (el) => { /* make DOM once, hand back refs */ },
  (r)  => { /* add this scene's tweens to THE ONE timeline */ });
```

There is no per-scene draw loop. GSAP owns the interpolation; a scene is only
visible inside its window, so the browser is not painting twelve scenes for
2,600 frames.

### 4 · Each material has an entrance

The five helpers in `timeline.js` are ten lines each — `write()`, `crtOn()`,
`print()`, `cut()`, `rise()` — and each act uses only its own. That is what
makes the acts read as different *materials* rather than different colour
schemes: the same card arrives differently.

### 5 · What lives in `post(t)`

A caret blinks on `t % 1`. The filmstrip's playhead, the halftone's wave, the
scrolling floor, subtitles, the progress bar. Anything that is genuinely a
function of `t` — or is derived from a tweened number — is applied after the
seek, never inside a tween callback, because `seek(t, true)` suppresses
callbacks and an `onUpdate` will simply never fire under the renderer. Numbers
that post() needs are tweened on a plain object (`S.type`, `S.ph`) and read
there.

## Two traps (both learned by hitting them)

- **Never write `style.transform` on an element GSAP is transforming.** It
  stamps over GSAP's value every frame. Route it through `gsap.set`. The one
  transform the ground owns (the press plate's drop) is handed to GSAP in
  `seek()` for exactly this reason.
- **`display:none` and `visibility:hidden` are not the same to a measurement.**
  Scenes use `visibility`, so anything that needs a `getBBox()` still has one.

## The voice

Microsoft's neural TTS via [`edge-tts`](https://github.com/rany2/edge-tts) —
free, no API key, and the only step in this whole repo that needs the network.
`voice.py` finds it on `PATH` or runs it through `uv`. Change `voice` in
`script.json` and re-run:

```bash
edge-tts --list-voices | grep en-      # what's available
FORCE=1 ./voice.py                     # re-render every line
```

A real recorded voice-over works exactly the same way: drop your WAVs in `vo/`
named after the line ids, skip step 1, and run `build.py` onward.

## The ender

The last 6.5 seconds are [`../ender/`](../ender/) — the brand's sign-off,
rendered once and stream-copied onto every film in this repo. The story ends
on bare navy and the ender opens on the same navy, so the join is invisible.
Both are 1920×1080 at 1× and the audio is matched (aac, 44.1k, mono) so the
concat never re-encodes.

## Files

| File | What it is |
| ---- | ---------- |
| `script.json` | The narration, as lines with a gap after each. The four join lines are marked. |
| `voice.py` | Renders each line, measures it, writes `vo/timing.json` and `vo/narration.wav` |
| `build.py` | `vo/timing.json` → `timings.js`; `sound.json` → `explainer.audio.json` |
| `explainer.html` | Layout, the world tokens, the grounds' markup, the header lockup |
| `worlds.js` | The grounds, built once: the neon floor, the halftone, Mount Yōtei |
| `timeline.js` | The one timeline: entrances, scenes, joins, `post()`, `seek()` |
| `sound.json` | The cue sheet, anchored to lines. Edit this, not the generated `.audio.json` |
| `render.sh` | The chain, in order |
