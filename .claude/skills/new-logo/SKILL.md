---
name: new-logo
description: Design a logo — a mark, or a whole direction for one — and build it out into a usable system (primary, stacked, avatar, reversed, flat). Use when the user wants a logo, a wordmark, a brand mark, an icon, a sub-brand lockup, or variations on the one they have.
allowed-tools: Read, Write, Edit, Bash
---

# Design a logo

A logo is not a picture. It is a small system that has to survive being shrunk,
reversed, embroidered, faxed, and put on a background you did not choose. This
skill produces **directions** first, then builds the chosen one into that system.

Everything renders from self-contained HTML through `collateral/render.sh`, the
same way the rest of the studio works. Nothing here needs a design tool.

## Non-negotiable

1. **Read `brand-kit/BRAND.md` and `docs/design-rules.md` first.** If the brand
   already has a mark, you need to know what it means before you touch it — the
   etymology, what the shapes stand for, and any rule about how it may be varied.
   Getting this wrong is worse than an ugly logo.
2. **Show directions before building a system.** Three to five, each a genuinely
   different *idea* — not one idea in five colourways. If they all share a
   typeface and a palette you have made colourways, and the user will tell you
   so. Different typefaces, different grounds, different techniques.
3. **Every direction ships a flat version.** See below. This is the rule people
   skip and regret.
4. **Ground every claim the lockup makes.** A tagline, a qualifier, a legal mark
   — check it against `brand-kit/brand.json` and `BRAND.md`. Do not invent a
   tagline that nearly matches the real one.

## Step 1 · Directions

One board, several directions, each with the mark, the lockup, and a one-line
statement of what the idea *is*. Say what each one is for and where each one is
weak — a direction with no stated weakness has not been thought about.

Look outside the folder. A logo made only from what the brand already owns tends
to come out as a rearrangement of it. Read what identity design is actually
doing right now, and steal a *technique*, not a look.

## Step 2 · The system

Once a direction is chosen, build it out. Give the direction its own stylesheet —
`src/<name>/<name>.css` — holding the typeface, the grounds, the mark and the
lockup proportions, so every asset file below is a few lines:

| File | What it is |
| ---- | ---------- |
| `system.html` | The review sheet. Every variant on one page. |
| `primary.html` | Horizontal lockup, on its native ground |
| `primary-light` / `-ink` | Reversed onto the opposite ground |
| `stacked.html` | Stacked lockup |
| `avatar.html` | Square, for a profile picture |
| `flat.html` | One colour, no effects |

Sizes that work: system sheet 1600×1400, primary 1400×560, stacked 900×900,
avatar 1000×1000.

## Step 3 · The flat version is the honest test

Most directions lean on something — a gradient, a blur, a glow, a texture, an
opacity trail. **An effect is a finish, not a logo.** The flat version is one
colour, no gradient, no blur, no texture: what survives a stamp, an embroidery
machine, a single-colour print and a 16px favicon.

If the mark dies flat, the direction is a drawing, not a logo. Build the flat
version early enough that this is still cheap to learn.

**When an effect carries meaning, flat has to carry it another way.** If a trail
is made of opacity, flat has no opacity to spend — so the copies have to move
apart far enough to stay separate marks. Work out what the substitute is and
write it on the sheet; whoever uses the logo next will hit it.

## Step 4 · Check it at the sizes it will actually be used

Put a small row on the system sheet — the lockup at ~48px and the mark at ~28px.
That is the size a favicon, an avatar and an email signature actually get, and it
is where clever marks fall apart. State the size below which detail is dropped.

## Traps

- **Low-opacity colour on a light ground desaturates to grey.** A 16% orange over
  cream is not a pale orange, it is a warm grey. On light, step through *tints*
  of the accent instead of through opacity.
- **A CSS class rule beats an SVG `stroke="…"` presentation attribute.** To
  recolour one instance of a mark, use inline `style="stroke:…"`, not the
  attribute, or your override will be silently ignored.
- **`em` on an inline SVG resolves against its own font-size, not the wordmark's.**
  Where the mark and the text are siblings, pin the mark's height in px or it
  collapses.
- **Every typeface has a different x-height,** so a ratio that seats a mark
  correctly in one face will float or sink in another. Re-seat it per face.
- **A canvas clips silently.** A mark that overruns just vanishes with no error.
  Look at every rendered PNG.

## Animating a mark

If the logo is going to move, the film is a separate job — see the `new-video`
skill, and `examples/` for one that turns three directions into each other.

Two things that matter more than the motion itself:

- **Interpolate state, not pictures.** Cross-fading between two finished
  renders is a slideshow. Put the numbers that define the mark — colours as
  components, weights, coordinates — in one object per state, lerp between them
  each frame, and write them into CSS custom properties. Then the letters change
  material rather than one image dissolving into another.
- **CSS `transition` cannot be used** in a frame-addressable timeline. It is
  wall-clock driven, so it will not be deterministic under `seek(t)`. Do the
  interpolation in JS and push the result into the same properties a transition
  would have driven.
- **Sequence it on GSAP, as a paused timeline.** For the joins between worlds —
  the moves, the drops, the collapses — write a `gsap.timeline({ paused:true })`
  and have `window.seek(t)` call `tl.seek(t, true)` then apply the state. That is
  still a pure function of `t`. Never a clock-driven library (Framer Motion) and
  never `style.transform` on an element GSAP owns. See the `new-video` skill's
  *Sequencing with GSAP* and `examples/logo-metamorphosis/`.
