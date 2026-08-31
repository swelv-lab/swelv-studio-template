# Brand

> **This file is the demo brand.** It describes *Meridian*, a fictional freight
> operations company invented for this repo, so that a fresh clone has something
> coherent to render. Run **`/setup-brand`** and an agent will interview you and
> replace every section below with yours.
>
> Everything the studio writes — every headline, caption, slide and script — is
> grounded in this file. If a section here is vague, the output is vague. It is
> worth twenty minutes.

---

## 1 · What we are

**Meridian** is scheduling software for freight brokers. A broker running fifty
loads a day tracks them across phone calls, text messages and a spreadsheet;
Meridian puts every load on one timeline that the broker, the carrier and the
shipper all see at the same time.

- **Category:** freight operations software.
- **Stage:** early, ~40 customers.
- **We are not:** a load board, a marketplace, or a carrier. We do not move
  freight and we do not set rates.

## 2 · Who we talk to

| Audience        | What they care about                                    | What they already believe          |
| --------------- | ------------------------------------------------------- | ---------------------------------- |
| **Brokers**     | Loads not falling through the cracks; fewer check calls  | Their spreadsheet mostly works     |
| **Carriers**    | Getting told about changes without being chased          | Software is something done *to* them |
| **Shippers**    | Knowing where a load is without asking                   | Delays get hidden from them        |

Write to one of them at a time. A surface that addresses all three addresses
nobody.

## 3 · Positioning

**One line:** Every load on one timeline, from tender to proof of delivery.

**The stance:** the old way is manual by default, not by design. Nobody chose to
run freight on phone calls — it accumulated. So we describe the *number of
hand-offs*, never the intelligence of the people doing them. Forward-looking,
never sneering at incumbents or at the way people work today.

**The tagline, used exactly, always:** `One timeline for every load.`
Never reworded, re-punctuated or split. It appears in the footer of most
surfaces and nowhere twice on the same one.

## 4 · How the name is written

- Always title-case: **Meridian**. Never MERIDIAN, never meridian.
- The mark is a meridian line. It is not a globe, a target, or a clock — don't
  describe it as one.
- **Never personify the brand in body copy.** "Meridian sends the update" → "The
  platform sends the update" or "We send the update". Naming the product as an
  object ("why we built Meridian") is fine; the brand name as the *subject of a
  description* is not. This one rule kills more press-release voice than any
  other.

## 5 · Voice

**Precision over cleverness. One clear claim beats a clever metaphor, every time.**

- Say the mechanic, not the metaphor. A number, an actor, or a sequence beats an
  image. If a line could describe any industry, it isn't about ours.
- Concrete nouns. "Check call", "tender", "proof of delivery" — the words the
  reader already uses at work.
- Short declaratives. Full sentences, no verbless fragments for rhythm.
- Confident, not loud. No exclamation marks, no all-caps for emphasis.

**Words we never use:** streamline, empower, leverage, seamless, effortlessly,
unlock, game changer, revolutionise, robust, cutting-edge, best-in-class,
solution (as a noun for our product).

**Punctuation:** no em dashes anywhere — use a middle dot `·`, a comma, or
restructure the sentence. No emojis, on any surface.

## 6 · Grounding — where facts come from

Never write a product claim, a statistic or a mechanism from memory. Every claim
traces to one of these:

| Source                     | Where                                     | Good for                        |
| -------------------------- | ----------------------------------------- | ------------------------------- |
| Product docs               | `https://docs.example.com`                | How a feature actually works    |
| Website copy               | `https://example.com`                     | Approved wording, positioning   |
| Market data                | *(add your own file or link)*             | Numbers, sizing, sources        |

> **Replace this table with your real sources.** If a source is a private repo
> you can add it as a read-only git submodule at `reference/` — see
> `docs/reference-folder.md`. If a claim has no source, stop and ask, don't
> invent one.

**What we must never imply**

- That the platform moves freight or holds money. It coordinates; the carrier
  hauls, the broker books.
- That tracking is "real-time". Positions update on a cadence; say "updates on
  arrival at each stop", not "live".
- That onboarding a carrier is instant. It takes a day or so.

*(Your version of this list is the single most valuable part of this file. It is
what stops an eager agent shipping a claim your lawyers hate.)*

## 7 · Look

The palette, type and geometry live in `brand.css` — that is the source of
truth for anything visual, and every surface in the repo links it. The intent
behind the values shipped there:

- **Warm paper ground, deep-teal accent.** Deliberately not another dark SaaS
  gradient. Logistics is a physical, paper-heavy industry; the surfaces should
  feel like something printed and pinned up, not like a dashboard screenshot.
- **One accent, reserved.** Deep teal marks the single most important thing on a
  surface. Status colours mean status and nothing else.
- **Full-strength ink for figures.** Any number that matters is `--fg`. Muting a
  number to look elegant is the fastest way to look unserious.

The universal craft rules — hierarchy, spacing, what makes an image read as
machine-made — are brand-independent and live in
[`docs/design-rules.md`](../docs/design-rules.md) and
[`docs/writing-rules.md`](../docs/writing-rules.md). Read those too; they apply
whatever your palette is.
