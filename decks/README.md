# Decks

16:9 slides as self-contained HTML, rendered to PNGs and combined into one
shareable PDF.

```
decks/
├── src/
│   ├── _template/            a 7-slide starter deck — copy the folder
│   │   ├── deck.css          shared slide layout, travels with the deck
│   │   └── NN-name.html      the NN- prefix sets the order
│   └── <deck>/               one folder per deck, usually per audience
├── output/
│   ├── <deck>/NN-name.png    rendered slides
│   └── <deck>.pdf            the deliverable
├── render.sh                 one slide → PNG (1920×1080)
├── to-pdf.sh                 all a deck's PNGs → one PDF
└── present.py                the whole deck → one self-contained HTML that
                              presents in a browser and renders to video
```

## Render a deck

```bash
cd decks
for f in src/my-deck/*.html; do ./render.sh "$f"; done
./to-pdf.sh my-deck
```

## Present it, or animate it

The same slides you just rendered can also be a walkthrough. `present.py` reads
that deck and writes **one self-contained HTML file** — the brand kit, every
slide and a generic build animation, inlined, no dependencies:

```bash
./present.py my-deck        # -> output/my-deck-present.html
```

Open it and it presents: **arrow keys** move between slides, **space** plays and
pauses, **click** advances. It scales to any window, so it works full screen on
a projector or in a browser tab you send someone.

That same file also exposes `renderFrame(t)`, so it captures like any other
video in the studio:

```bash
../posts/render-video.sh "$(pwd)/output/my-deck-present.html" 1920 1080 1008 30 0 0 0
```

One deck, written once, shipped three ways: PNGs, a PDF, and a walkthrough with
sound. **No slide contains any animation code** — the build is generic, driven
off the slide furniture every deck here shares (`.skicker`, `.stitle`,
`.slead`, `.statband`, and so on), so a deck you write today animates without
you doing anything about it.

Timing knobs: `BUILD=3 HOLD=2.5 XFADE=0.6 ./present.py my-deck`.

Slides are ordered by filename, so **keep the `NN-` prefix**. The PDF is built
from the PNGs — a slide you edited but did not re-render is silently stale in the
PDF, so re-render the whole deck before building it.

## The recommended arc

| # | Slide | The job it does |
| - | ----- | --------------- |
| 01 | Cover | Say what you are in one line, not a mission statement |
| 02 | Problem | The specific, costly thing that happens today |
| 03 | Solution | What changes, mechanically |
| 04 | Market | Why this is big, with sources on the slide |
| 05 | Landscape | What you do differently — never what others do badly |
| 06 | Team | Why *these* people |
| 07 | Closing | The ask, and how to reach you |

Adjust freely. This is the shape a first deck should argue itself out of, not a
rule.

## Working on a deck

- **One point per slide.** A slide that needs two headlines is two slides.
- **Ground every number** in a source named in
  [`../brand-kit/BRAND.md`](../brand-kit/BRAND.md), and cite it in the footer. A
  market slide without sources is the fastest way to lose a room.
- **Never ship a placeholder figure as if it were final.** Leave the slide
  visibly incomplete instead — the shipped deck is the one that gets forwarded.
- **Comparison slides use words, not ticks.** A column of checkmarks says nothing
  and reads as a template.
- Per-deck layout goes in that deck's own `deck.css`; brand tokens come from
  `brand-kit/brand.css`. Never a colour in a slide's local `<style>`.

The `/new-deck` skill handles the mechanics.
