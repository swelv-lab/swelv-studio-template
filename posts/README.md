# Social posts

Shareable images and videos, one folder per **network**, then per **topic**.
Everything renders from a self-contained HTML file through headless Chrome.

```
posts/
├── NETWORKS.md                every canvas size, ratio and safe zone
├── src/
│   ├── _shared/canvas.css     the canvas presets — one place, all networks
│   ├── cards.css              shared furniture for square "always-on" cards
│   ├── <network>/
│   │   ├── README.md          what that platform will do to your image
│   │   ├── _template/         starters at that network's sizes — copy these
│   │   └── <topic>/           one folder per carousel or card set
├── output/                    mirrors src/ exactly. Generated; never hand-edit.
├── assets/audio/              real audio files a video can layer in
├── render.sh                  HTML → PNG
├── render-video.sh            HTML timeline → MP4 (with sound)
└── render-gif.sh              HTML timeline → looping GIF
```

Nine networks ship with templates: `linkedin` `instagram` `x` `facebook`
`tiktok` `youtube` `pinterest` `threads` `bluesky`.

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

## Canvas sizes

**A post never declares its own width and height.** It picks a preset class and
inherits the canvas:

```html
<div class="canvas ig-story">
```

`render.sh` reads that class out of the file, resolves the size from
`src/_shared/canvas.css`, and renders it. So this is all you type:

```bash
./render.sh src/tiktok/_template/photo.html      # 1080×1920, resolved
```

Passing sizes by hand still works as an override, but it is the usual way a post
silently ships cropped.

**[`NETWORKS.md`](NETWORKS.md) has the full table** — 23 presets across nine
networks, with each platform's quirks and the safe zones its interface covers.

Two things that catch people:

- **Vertical formats are not fully visible.** Stories, Reels, TikTok and Shorts
  all paint UI over your image. The presets carry those safe zones and `.stage`
  respects them; add `guides` to the canvas class to see the unsafe bands.
- **Every slide of a carousel must share one ratio**, or the platform
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
2. **Copy the nearest existing post**, or the template for that network,
   e.g. `src/instagram/_template/story.html`.
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
one edit. Everything in this repo — including the brand you are looking at —
survives a rebrand because of that single rule.
