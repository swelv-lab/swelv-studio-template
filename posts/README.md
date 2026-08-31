# Social posts

Shareable images and videos, one folder per **network**, then per **topic**.
Everything renders from a self-contained HTML file through headless Chrome.

```
posts/
├── src/
│   ├── cards.css              shared furniture for square "always-on" cards
│   ├── _template/             starter card + starter carousel — copy these
│   └── <network>/<topic>/     e.g. linkedin/pricing/ — one carousel per folder
├── output/                    mirrors src/ exactly. Generated; never hand-edit.
├── assets/audio/              real audio files a video can layer in
├── render.sh                  HTML → PNG
├── render-video.sh            HTML timeline → MP4 (with sound)
└── render-gif.sh              HTML timeline → looping GIF
```

`output/` mirrors `src/` path for path, so a post and its render are always one
`src`↔`output` swap apart. **`output/` is committed on purpose** — it's the
deliverable teammates open, and they should not have to install Chrome to see it.

## The mechanic

One HTML file is one image. It links `../../../brand-kit/brand.css` for tokens
and primitives, declares its canvas size, and carries only its own layout in a
local `<style>`. No build step, no framework, no dependencies.

That constraint is the whole design: an agent can write one file, render it, look
at the PNG, and fix it — with no state anywhere else.

## Render a still

```bash
cd posts
./render.sh src/linkedin/pricing/01-cover.html            # default 1080×1350
./render.sh src/linkedin/stats/rate-card.html 1200 1200   # square
```

Authored at 1×, emitted at 2× for crisp text on retina displays.

## Canvas sizes by network

| Network                    | Canvas (1×) | Output (2×) | Ratio  |
| -------------------------- | ----------- | ----------- | ------ |
| LinkedIn feed (portrait)   | 1080 × 1350 | 2160 × 2700 | 4:5    |
| LinkedIn square            | 1200 × 1200 | 2400 × 2400 | 1:1    |
| LinkedIn link / landscape  | 1200 × 627  | 2400 × 1254 | 1.91:1 |
| Instagram portrait         | 1080 × 1350 | 2160 × 2700 | 4:5    |
| X / Twitter                | 1600 × 900  | 3200 × 1800 | 16:9   |

Portrait 4:5 is the strongest for a LinkedIn feed — it claims the most vertical
space. **Every slide of a carousel must share one aspect ratio**, or the platform
letterboxes the odd one out.

## Animated posts

MP4 is the default; a GIF is the lighter, seamless-loop alternative.

```bash
./render-video.sh src/linkedin/pricing/pricing-video.html 1080 1080
./render-gif.sh   src/linkedin/pricing/pricing-loop.html
```

The HTML is **frame-addressable**: it exposes `window.renderFrame(t)` for
`t` in 0..1 and also honours a `#t` URL hash, so the renderer can ask for any
single frame. Everything must be a pure function of `t` — no clocks, no
randomness, no CSS animation. See the `/new-video` skill for the full contract,
the sound sidecar, and the traps.

`npm install` once, in the repo root, enables the fast renderer (one persistent
browser instead of one Chrome launch per frame — seconds instead of minutes).
Videos work without it, just slowly.

## Making a new post

1. Pick or make the topic folder: `mkdir -p src/linkedin/<topic>`.
2. **Copy the nearest existing post**, or `src/_template/starter-card.html`.
   Never start from a blank file.
3. Keep the skeleton: `.canvas` → `.stage` → header (logo lockup + index) →
   `.kicker` → `.headline` → `.subhead` → body → footer band.
4. Write the copy against [`../docs/writing-rules.md`](../docs/writing-rules.md),
   the composition against [`../docs/design-rules.md`](../docs/design-rules.md).
5. Render, **look at the PNG**, iterate.
6. Write the caption to `output/<network>/<topic>/<topic>-caption.txt`. Carousel
   captions are capped at 90 words, and never hard-wrapped — see the caption
   rules.

The `/new-post` skill does all of this for you.

## The one rule that keeps this maintainable

**A local `<style>` block is for layout only.** The moment a hex code or a
font-family appears outside `brand-kit/brand.css`, changing the brand stops being
one edit. Everything in this repo — including the demo brand you are looking at —
survives a rebrand because of that single rule.
