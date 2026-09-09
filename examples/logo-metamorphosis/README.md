# The logo metamorphosis

One lockup, two worlds, and a mark that arrives on water. 15 seconds: an 8.5s
story and a 6.5s ender, 1920×1080, made with this studio.

`rendered/logo-metamorphosis.mp4` · 1920×1080 · 30fps · ~8 MB

```bash
./render.sh          # the whole chain, about two minutes
FAST=1 ./render.sh   # half frame rate, for checking a change
```

## What it does

The wordmark is **written**, not faded in — real script letterforms uncovered
along each letter's own pen route. Then the paper burns off into 1984 and the
same lockup plays like an arcade attract screen: the floor scrolls at you, the
logo slams in, the chrome runs, the scanlines roll. It cools to bare navy and
the ender takes over: the mark hits a still lattice and the shockwave rides out
through it.

## The pattern worth stealing: interpolate state, not pictures

The obvious way to turn one logo into another is to cross-fade two finished
renders. That is a slideshow, and it looks like one.

Instead there is **one lockup that never gets replaced**, and about thirty
numbers that define how it looks — background and ink as colour components,
stroke weights, glow radii, slant, and the mark's own Bézier coordinates. Each
world is one object of those numbers. Every frame lerps between two of them and
writes the result into CSS custom properties on the stage:

```js
const ST = {
  hand: { bg:[244,239,228], ink:[27,36,48], vw:12.5, grain:0.22, sky:0, … },
  neon: { bg:[7,10,28],     ink:[255,214,138], vw:13, grain:0,    sky:1, … },
};
apply(blend(ST[from], ST[to], eased));
```

Everything downstream reads those variables, so the letters genuinely change
material rather than one picture dissolving into another. The mark morphs
geometrically the whole way through: its two strokes are written as two cubics
each, so a hand-drawn bowed V *becomes* a geometric one by lerping fourteen
numbers per path. No shape is ever swapped.

**CSS `transition` cannot do this.** It is wall-clock driven, so it would not be
deterministic under `seek(t)` and the render would not be reproducible. The
interpolation happens in JS and is pushed into the same properties a transition
would have driven.

## Why two clips

The ender is this brand's reusable sign-off — it gets concatenated onto other
films too. Rendering it separately means it is built once and stream-copied on,
never re-encoded. The story fades to bare navy and the ender opens on the same
navy, so the join is invisible.

Because the concat is a stream copy, **both clips must match in dimensions**.
Change the size of one and ffmpeg will refuse.

## The rules it still follows

Nothing here gets an exemption for being the showpiece:

- **Every frame is a pure function of `t`.** No clocks, no randomness, no CSS
  animation. Frame 200 is identical on every render. The paper grain and the
  ink wobble are SVG turbulence with fixed seeds; the water is a sum of radial
  wave fronts with fixed launch times.
- **1920×1080 at 1×.** A film costs one rasterise per frame, so 2× would
  quadruple the work for a master nobody watches at that size. See *Master
  size* in the `new-video` skill.
- **The sound is synthesized from a JSON file** — `metamorphosis.audio.json`
  and `ender.audio.json`, laid by `posts/render-audio.js`. Each world has its
  own voice: a nib scratch per pen stroke, a gated stab and an arpeggio for the
  arcade, a deep strike as the mark hits the water.
- **It works muted.** The picture carries it; the sound is the finish.
- **Layout only in each file's own `<style>`.** Colours come from the state
  objects, so a rebrand is an edit to those and nothing else.

## Fonts

`fonts/` holds every face this example uses, so it keeps rendering after you run
`/setup-brand` and the shipped brand is replaced. Examples are self-contained on
purpose — they are here to show the shape of the work, not to track your brand.
