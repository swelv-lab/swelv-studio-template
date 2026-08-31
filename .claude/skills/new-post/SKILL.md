---
name: new-post
description: Create a new on-brand social media post image (LinkedIn by default). Use when the user wants to make a social post, a carousel slide, a stat card, a glossary card, or any shareable image for a social network. Handles the whole flow — copy, layout, brand rules, and rendering to a PNG.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Create a new social post

You are making a shareable image. Everything renders from a self-contained HTML
file through `posts/render.sh`. Work entirely inside `posts/`.

## Before you start — read these

1. **`brand-kit/BRAND.md`** — voice, positioning, the exact tagline, naming
   rules, banned words, and where product facts come from. Ground every claim in
   the sources it names, never from memory. Respect its "must never imply" list.
   If it still carries the demo-brand notice at the top, the studio has not been
   set up yet — offer `/setup-brand` first.
2. **`docs/design-rules.md`** and **`docs/writing-rules.md`** — binding, and the
   writing one is the more commonly broken.
3. **`posts/README.md`** — the mechanic, the canvas-size table, and the
   catalogue of posts already made.

## Steps

1. **Clarify the brief** if it is not already clear: what the post is about,
   which network, which format. Posts are grouped **network, then topic**:
   `posts/src/<network>/<topic>/`. Any network works — `linkedin` (the default),
   `twitter`, `instagram`. A **topic** is one carousel or card set; every slide
   of it lives in that folder. Pick the canvas from `posts/README.md` (LinkedIn
   feed portrait 1080×1350 is the default). **One or two questions maximum** —
   this is for non-technical teammates, keep it light.
2. **Start from the closest existing post, never a blank file.** Copy the nearest
   match into the topic folder as `posts/src/<network>/<topic>/<name>.html` and
   keep its structure: `.canvas` → `.stage` → header (logo lockup + index) →
   `.kicker` → `.headline` → `.subhead` → body → footer band. Nothing close?
   `posts/src/_template/` has a starter card and a starter carousel, and
   `examples/` has finished work worth reading for house style.
3. **Write the copy and the composition.** Brand tokens come from
   `brand-kit/brand.css` via a relative path — **never fork it, and never
   redefine a colour or typeface in the local `<style>`**. Local CSS is layout
   only. The moment a hex code appears outside the brand kit, a rebrand stops
   being one edit.
4. **Render:**
   ```bash
   cd posts && ./render.sh src/<network>/<topic>/<name>.html
   ```
   Add `[W] [H]` for a non-default canvas, e.g. `1200 1200` for a square card.
5. **Write the caption** into
   `posts/output/<network>/<topic>/<topic>-caption.txt`, following
   `docs/writing-rules.md` § Caption rules. The rule broken most often: **a
   carousel caption is 90 words maximum** — the slides already made the argument,
   so the caption only has to earn the first swipe. Do not re-narrate the slides.
   **Count the words before you call it done.** Write each paragraph as one
   single unwrapped line with a blank line between paragraphs — composers
   preserve pasted newlines, so a hard-wrapped file posts with sentences snapped
   mid-clause.
6. **Show the result:** `Read` the produced PNG so the user sees it, and check it
   honestly — fonts actually loaded (not a fallback stack), the accent appears
   once, nothing clipped, contrast holds. Iterate on the HTML and re-render.

## If they want motion (MP4 — or a GIF)

Hand off to `/new-video`. Motion posts get far more reach, MP4 is the default,
and that pipeline is deliberately specific — do not improvise one here.

## If they want it to match a real page of your site

Hand off to `/reference-section`, which reproduces a real section exactly from
the source under `reference/`.

## When it looks right

Ask in plain language whether to share it, e.g. "Want me to upload this so
everyone on the team can use it?" If yes, do the git save silently and confirm
plainly. Never say "commit/push/git," and never upload unasked. See `CLAUDE.md`
§ "Saving work so the team can use it."
