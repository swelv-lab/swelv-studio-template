# Examples

Finished work, made with this studio, in the brand it ships with.

**Read these. Don't edit them.** A guard hook blocks writes here — new work
belongs in `posts/`, `collateral/`, `decks/`, `content/` and `calendar/`. These
stay as they are on purpose, even after you run `/setup-brand`: they are here to
show the *shape* of good work, and they keep rendering because each one is
self-contained.

They are also the honest test of everything the repo claims. If the rules in
`docs/` are any good, the examples should obey them — so they are worth reading
with the rules open beside them.

## What's here

| Example | What it demonstrates |
| ------- | -------------------- |
| [`brand-is-a-file/`](brand-is-a-file/) | A 3-slide carousel with its caption. Three slides, one argument, and a 76-word caption that does not narrate them. |
| [`explainer/`](explainer/) | An 80-second narrated film. The pattern: time the picture to the voice, never the other way round. |
| [`logo-metamorphosis/`](logo-metamorphosis/) | A 15-second logo film, and a logo system behind it. The pattern: interpolate state, not pictures. |

More land as they are built: a deck, an essay.

## Reading the logo film

[`logo-metamorphosis/`](logo-metamorphosis/) is the one to read if you are
making anything animated, because it is built the way animation in this repo
should be built:

- **One lockup that is never replaced.** Thirty-odd numbers define how it looks;
  each world is one object of those numbers; every frame lerps between two and
  writes the result into CSS custom properties. The letters change material
  rather than one picture dissolving into another.
- **The mark morphs geometrically**, not by cross-fade: its strokes are written
  as matched cubics, so one shape *becomes* another by lerping coordinates.
- **`CSS transition` is not used and cannot be.** It is wall-clock driven, so it
  would break the one rule every video here obeys — that a frame is a pure
  function of `t`.
- **Two clips, stream-copied together.** The ender is reusable, so it is
  rendered once and joined without re-encoding. Both clips therefore have to
  match in size.

## Reading the carousel

Worth noticing, because these are the things
[`docs/writing-rules.md`](../docs/writing-rules.md) is actually about:

- **Slide 1 opens on a claim with a number under it**, not on a mood.
- **Slide 2 quotes the actual file.** Showing the mechanic beats describing it,
  every time — and three token rows are enough to make the point.
- **Slide 3 ends on the loop**, which is the part a reader can act on.
- **Each footer adds a fact.** None of them restate the headline with flair,
  which is the single most common failure in a carousel.
- **The caption doesn't list what the slides list.** It adds one thing that
  appears nowhere on them, asks a question, and stops.
- **Nothing here is centred, and there is not one icon.** See the AI-slop list
  in [`docs/design-rules.md`](../docs/design-rules.md).

## Starters, if you want to copy something

The examples show finished work. For a blank-but-shaped starting point, each
pipeline ships one:

- `posts/src/<network>/_template/` — one per network, at that network's size
- `collateral/src/_template/template.html`
- `decks/src/_template/` — a full seven-slide deck
- `content/src/essays/_template/starter-essay.md`
