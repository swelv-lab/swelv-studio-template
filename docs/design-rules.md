# Design rules

These are **brand-independent**. They hold whether your ground is cream or
near-black, whether your accent is teal or orange. Your specific colours, type
and geometry live in [`brand-kit/brand.css`](../brand-kit/brand.css); the rules
below are how you use them without the result looking generated.

Every skill in this repo reads this file before it draws anything.

---

## 1 · One ground, one accent

- **One background colour, everywhere.** It is the thing people recognise in a
  feed before they read a word. Light or dark — pick one and never mix grounds
  across a set.
- **One accent.** Not two, not a gradient. The accent marks the single most
  important thing on a surface. If it appears on three things, it marks nothing
  and the eye gives up.
- **Status colours mean status.** Green = done/settled. Blue = in progress.
  Red/orange = risk or the-old-way. They never appear as decoration, and a
  colour never picks up a second meaning on a second slide.
- **No gradients, no glows, no drop shadows** unless your brand is explicitly
  built on one and it is defined in `brand.css`. A wash added by hand, per
  surface, is how a set stops looking like a set.

## 2 · Type

- **Two families, no more.** One sans for everything you read, one mono for
  kickers, labels, figures and meta. A third family is almost always a mistake
  being justified.
- **Headline line-height stays ≥ 1.08.** Tight tracking plus tight leading turns
  a two-line title into a brick. `1.1` is the default in `brand.css`; a surface
  that overrides it must stay above `1.08`.
- **Figures use full-strength ink.** Any number that carries the argument gets
  `--fg`, never `--muted`. Muting a number to look refined reads as unserious —
  and if the number doesn't deserve full ink, it doesn't deserve the surface.
- **Footer text stays readable.** Small type gets the *mid* ink (`--muted`),
  never the faintest (`--faint`). `--faint` is for kickers at wide tracking,
  where the letterforms are doing the work.
- **The kicker→title gap should roughly match the title→subhead gap.** Gluing
  the kicker to the title is the most common spacing tell in the whole studio.

## 3 · The AI-slop list — none of these, ever

Every one of these is a thing generated design does by default. Their absence is
most of what makes work look commissioned rather than produced:

- Icons in circles. Icons in rounded squares. Icons at all, mostly.
- Decorative blobs, wavy dividers, floating dots, abstract "network" graphics
  that don't depict a real network.
- Three-column feature grids where the three columns are the design.
- Centered-everything. Left-aligned is the default; centering is a decision you
  should be able to defend.
- Card grids that don't earn their place — cards for things that are not
  separable objects.
- Emoji. On any surface. Including "just in the caption".
- Stock-photo people looking at laptops.
- A checkmark used as a brand mark, or a brand mark bent into a checkmark.

## 4 · Composition

- **Every surface makes one point.** If you can't say what the single point is in
  one sentence, the surface isn't finished — it's two surfaces.
- **The skeleton is fixed:** frame → kicker → headline → subhead → body →
  footer band. Follow it until you have a reason not to. Consistency across
  twenty posts beats novelty on one.
- **Air is the cheapest quality signal there is.** When something looks wrong and
  you can't say why, it is nearly always too tight. Increase `--pad` before you
  shrink type.
- **Never redefine a colour or typeface in a local `<style>` block.** Per-surface
  CSS handles *layout only*. The moment a hex code appears outside `brand.css`,
  a rebrand stops being one edit — and that is the whole point of this repo.
- **Start from the closest existing surface, never a blank file.** Copy, then
  replace content. A blank file is how a set drifts.

## 5 · Identity placement

- **The wordmark is live text**, not an image, so it stays crisp at any size and
  a rename is one edit.
- **Never place the mark and the wordmark such that the mark repeats a letter of
  the name.** If your mark *is* a letterform, it replaces that letter — it
  doesn't sit next to it.
- **The tagline is one exact string**, used identically everywhere, and it
  appears once per surface at most.
- **The brand appears once.** A logo in the header and a logo in the footer of
  the same card is a leaflet, not a brand asset.

## 6 · Claims

- **Ground every product claim in the sources listed in `brand-kit/BRAND.md`**,
  never from memory. Who does what is the easiest thing in the world to get
  subtly, embarrassingly wrong.
- **Respect the "must never imply" list** in `BRAND.md`. It exists because
  someone already had that conversation with a lawyer.
- **Keep copy global unless a surface is explicitly for one market.** Generalise
  region-bound mechanics rather than naming a single jurisdiction, rail or
  regulator.
- **Never disparage incumbents.** The old way is manual by default, not by
  design. The number of hand-offs is the story; the competence of the people
  doing them is not.

---

Writing has its own list, and it is longer:
[`docs/writing-rules.md`](writing-rules.md).
