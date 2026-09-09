# Brand

> **This file ships filled in, as a worked example.** It describes *swelv studio*
> — this repo, the thing you are holding — so that a fresh clone has a coherent
> voice to render with and you can see what a finished brand doc looks like.
>
> Run **`/setup-brand`** and an agent will interview you and replace every
> section below with yours.
>
> Everything the studio writes — every headline, caption, slide and script — is
> grounded in this file. If a section here is vague, the output is vague. It is
> worth twenty minutes.

---

## 1 · What we are

**swelv studio** is a content studio that runs from a terminal. You describe what
you want; an agent writes it, renders it, and shows you the picture. Posts, brand
assets, decks, videos and essays — all from self-contained HTML through headless
Chrome.

- **Category:** content tooling for small teams.
- **Who publishes it:** [swelv](https://swelv.io), who built it to make their own.
- **We are not:** a design tool, a template marketplace, a scheduler, or a
  hosted service. Nothing here deploys, and nothing phones home.

The thing that makes it work is not the rendering. It is that the brand is a
file. Say that plainly and often.

## 2 · Who we talk to

| Audience             | What they care about                                | What they already believe          |
| -------------------- | ---------------------------------------------------- | ---------------------------------- |
| **Founders**         | Shipping content without hiring for it                | Good design needs a designer       |
| **Solo marketers**   | Consistency across fifty surfaces they made alone     | Consistency means a rigid template |
| **Engineers**        | That it is files, in git, with no lock-in             | AI-made content looks AI-made      |

Write to one of them at a time. A surface that addresses all three addresses
nobody.

## 3 · Positioning

**One line:** The brand is a file. Everything else follows from that.

**The stance:** design systems did not fail small teams, they were just never
handed to them in a usable shape. So we describe *what becomes possible*, never
what other tools get wrong. No swipes at Canva, at agencies, or at anyone's
Figma file.

**On AI:** we are candid that an agent writes this content, and equally candid
that most agent-written content is bad. The rules in `docs/` exist because we
had to write them to stop our own output reading as machine-made. That honesty
is the position — never "AI does it for you", always "here is what it takes to
make AI output you would sign".

**The tagline, used exactly, always:** `Content infrastructure in motion.`
Never reworded, re-punctuated or split. It appears in the footer of most
surfaces and nowhere twice on the same one.

## 4 · How the name is written

- Always lowercase: **swelv studio**. Never Swelv, never SWELV.
- The wordmark is the lockup: the text `swel` plus the mark as the `v`. Never
  write the word and place the mark beside it — that repeats the letter.
- **The mark is not a checkmark.** It is a chevron, and it is the `v`. Never
  position it as a tick, a completion state, or a "done" symbol.
- **Never personify the brand in body copy.** "swelv studio writes the caption"
  → "The studio writes the caption" or "You describe it, the agent writes it".
  Naming the product as an object ("why we built swelv studio") is fine; the
  brand name as the *subject of a description* is not.

## 5 · Voice

**Precision over cleverness. One clear claim beats a clever metaphor, every time.**

- Say the mechanic, not the metaphor. A number, an actor, or a sequence beats an
  image. Show the command, name the file, state what changes.
- Concrete nouns. "One CSS file", "a headless Chrome screenshot", "ninety words"
  — not "a powerful design system".
- Short declaratives. Full sentences, no verbless fragments for rhythm.
- Confident, not loud. No exclamation marks, no all-caps for emphasis.
- **Admit the limits.** Anything that says this makes content effortless is
  wrong and will read as a lie to exactly the people we want.

**Words we never use:** streamline, empower, leverage, seamless, effortlessly,
unlock, game changer, revolutionise, robust, cutting-edge, best-in-class,
solution (as a noun for the product), 10x, supercharge.

**Punctuation:** no em dashes anywhere — use a middle dot `·`, a comma, or
restructure the sentence. No emojis, on any surface.

## 6 · Grounding — where facts come from

Never write a claim from memory. Everything traces to something in this repo:

| Source                     | Where                              | Good for                          |
| -------------------------- | ---------------------------------- | --------------------------------- |
| The repo itself            | `README.md`                        | What it is, what it needs to run  |
| The craft rules            | `docs/design-rules.md`, `docs/writing-rules.md` | What we claim about quality |
| The pipelines              | each pipeline's `README.md`        | How a thing is actually made      |
| The publisher              | <https://swelv.io>                 | Who built it                      |

**What we must never imply**

- That it designs for you. It applies a brand you defined. If the brand kit is
  vague, so is the output — say so.
- That the output needs no review. Every skill ends by showing you the picture,
  because you are the one who signs it.
- That it is a hosted product, has an account, or costs anything.
- Any claim about how many people use it. We do not have that number.
- Any performance or time-saving figure we have not measured.

*(Your version of this list is the single most valuable part of this file. It is
what stops an eager agent shipping a claim your lawyers hate.)*

## 7 · Look

The palette, type and geometry live in `brand.css` — that is the source of truth
for anything visual, and every surface in the repo links it. The intent behind
the values shipped there:

- **Deep navy ground, one orange accent.** The ground is the thing recognised in
  a feed before a word is read. Orange marks the single most important element
  on a surface, and nothing else.
- **Full-strength ink for figures.** Any number that carries an argument is
  `--fg`. Muting a number to look elegant is the fastest way to look unserious.
- **A hairline frame, and a lot of air.** The chrome reads as intent rather than
  decoration, and air is the cheapest quality signal there is.

The universal craft rules — hierarchy, spacing, what makes a surface read as
machine-made — are brand-independent and live in
[`docs/design-rules.md`](../docs/design-rules.md) and
[`docs/writing-rules.md`](../docs/writing-rules.md). Read those too; they apply
whatever your palette is.
