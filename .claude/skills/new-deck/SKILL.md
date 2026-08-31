---
name: new-deck
description: Create a new on-brand deck — a set of 16:9 slides rendered to PNGs and combined into one shareable PDF. Use when the user wants to make a pitch deck, an investor deck, a sales deck, a presentation, or a slide deck, or to add or edit slides in an existing deck.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Create a deck

A deck is a folder of 16:9 slides under `decks/src/<deck>/`, each a
self-contained HTML file rendered via `decks/render.sh` and combined into one PDF
via `decks/to-pdf.sh`. Work inside `decks/`.

## Before you start — read these

1. **`brand-kit/BRAND.md`** — voice, positioning, tagline, and **where facts
   come from**. Decks make more factual claims per surface than anything else in
   the studio, so this matters more here than anywhere.
2. **`docs/design-rules.md`** and **`docs/writing-rules.md`**.
3. **`decks/README.md`** — the mechanic, the recommended arc, and the naming
   convention (`NN-name.html` prefixes set the order).

## Steps

1. **Scope the deck** with the user: who is in the room, what you want them to do
   afterwards, how long they have. The default arc is cover · problem · solution
   · market · competition · team · closing — confirm or adjust it. A deck for an
   audience you already have slides for should be edited in place, not forked.
2. **Start from the closest deck:**
   ```bash
   cp -r decks/src/_template decks/src/<deck>
   ```
   Keep the per-deck `deck.css` and the slide skeleton (`.shead` → `.sbody` →
   `.sfoot`). Add or reorder slides by renaming with the right `NN-` prefix.
3. **Write each slide.** Tokens come from `brand-kit/brand.css`; shared slide
   layout from the deck's own `deck.css`; slide-specific styling stays local and
   covers layout only. **One point per slide.** A slide that needs two headlines
   is two slides.
4. **Ground every number.** Pull figures and sources from what
   `brand-kit/BRAND.md` § Grounding names. Cite them on the slide — a market
   slide without sources is the fastest way to lose a room. **Never ship a
   placeholder figure as if it were final**; if a number is not available, say so
   to the user and leave the slide visibly incomplete rather than plausible.
5. **Render and build:**
   ```bash
   cd decks
   for f in src/<deck>/*.html; do ./render.sh "$f"; done
   ./to-pdf.sh <deck>
   ```
6. **Show the result** — `Read` a few of the PNGs so the user can eyeball them.
   Check every slide for clipped text; 16:9 is unforgiving and a long headline
   silently overflows.

## Traps

- **Comparison slides use words, not ticks.** A column of checkmarks says
  nothing and reads as a template. Say what is built in and what is not.
- **Keep competition slides forward-looking.** Describe what you do differently,
  never what the incumbent does badly.
- The PDF is built from the PNGs, so a slide you edited but did not re-render is
  silently stale in the PDF. Re-render the whole deck before building it.

## When it looks right

Ask in plain language whether to share it. The slide PNGs and the assembled PDF
are the deliverable. If yes, do the git save silently and confirm plainly.
