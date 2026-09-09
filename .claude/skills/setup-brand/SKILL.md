---
name: setup-brand
description: Set up (or change) the brand this studio makes content for — colours, typefaces, logo, voice, positioning, tagline, and where product facts come from. Use on a fresh clone before making anything, when the user says the studio "still looks like the template", or any time the brand changes.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - WebFetch
  - AskUserQuestion
---

# Set up the brand

The studio ships with its publisher's brand filled in, as a worked example of
a finished brand kit, so a fresh clone renders something real immediately. This
skill replaces it with the user's own. Two files carry everything:

- `brand-kit/brand.css` — colours, typefaces, geometry (**the look**)
- `brand-kit/BRAND.md` — voice, positioning, tagline, grounding (**the words**)

Every post, slide, asset, essay and video in the repo reads those two. Get them
right and everything downstream comes out on-brand without being told.

## How to run this

**You are interviewing a person, not filling in a form.** Keep it conversational
and short. Batch questions — never ask twelve things one at a time. Use
`AskUserQuestion` for anything that's a choice between options, plain chat for
anything open-ended.

Tell them up front, in one line, what they're in for: *"About five minutes. I'll
ask about your colours, your type, and how you talk. Then everything this studio
makes comes out on-brand automatically."*

---

## Step 1 · Find the fast path

Ask this before anything else, because it can skip half the interview:

> "Quickest way to do this: do you have a website I can look at? I can pull your
> colours, typefaces and the way you write straight off it."

Handle whichever they give you:

- **A URL** → `WebFetch` the homepage. Extract: the background and text colours,
  the accent, the typefaces, the tagline, how the brand name is written, the
  tone of the copy. Fetch a second page (about / product) for voice. Then
  **confirm what you found** rather than assuming: "Looks like a near-black
  ground with a lime accent, and you use Inter. Right?"
- **A logo file or brand guidelines PDF** → `Read` it. An image gives you the
  mark and usually the palette.
- **Nothing** → run the full interview below. It's fine, it just takes longer.

If web access isn't available in this session, say so plainly and go to the
interview.

## Step 2 · The look

Fill in whatever the fast path didn't answer.

**Ask (batched, with `AskUserQuestion` where it's a choice):**

1. **Light or dark ground?** Show them the trade: a dark ground reads as
   technical and stands out in a feed; a light one reads as editorial and prints
   well. They pick one and everything commits to it.
2. **The background colour and the one accent.** Push for hex codes if they have
   them. If they say "blue", ask which blue, or offer three and let them pick.
   **Insist on exactly one accent** — explain that a second accent makes both
   mean nothing. This is the single most common way a brand kit goes wrong.
3. **Typefaces.** One sans (headlines and body) and one mono (kickers, labels,
   figures). If they don't know, recommend a pairing and move on — don't make
   them shop. Safe, free, and good: `Space Grotesk` + `IBM Plex Mono`,
   `Inter` + `JetBrains Mono`, `Instrument Sans` + `Geist Mono`. All on Google
   Fonts, all with an open licence.
4. **A logo?** If they have an SVG, copy it to `brand-kit/logo/mark.svg` and
   run `brand-kit/sync-logo.sh`, which embeds it into `brand.css` as the mask
   the lockup paints. It is painted as a *mask*, so only the artwork's shape
   matters — the colour comes from `--mark-ink`. Then set `--mark-order`
   (before or after the wordmark), `--mark-size`, and `--mark-aspect` (width ÷
   height, so it is never squashed). If they only have a raster logo, use it and
   say plainly that a vector renders sharper. **No mark at all is fine** — set
   `--mark-size: 0` and run wordmark-only.
5. **Corners and air.** One question, phrased as feel, not numbers: "Sharp and
   editorial, or soft and friendly?" → `--radius: 0` vs `12px` vs `20px`.

**Then edit `brand-kit/brand.css`:**

- Replace the values in the `:root` block. **Only the values.** Never rename a
  token and never delete one — the whole repo references these names.
- Derive what you can rather than asking: `--panel` / `--panel-2` are the ground
  stepped toward the ink; `--line` / `--line-soft` are hairlines between them;
  `--muted` and `--faint` are the ink stepped toward the ground. Keep body copy
  at roughly 4.5:1 contrast against the ground and don't let `--faint` drop
  below 3:1 — check, don't eyeball.
- Update the `@import` at the top to the chosen Google Fonts families, and
  `--sans` / `--mono` to match.
- Update the comment above each block so it describes *their* brand rather than
  the one that shipped. Those comments are what a future agent reads when it has
  to make a judgement call, so they matter more than they look.

## Step 3 · The words

This half matters more than the colours, and people under-invest in it. Push
gently for real answers.

Ask, in two or three batches:

1. **What is it, in one sentence a stranger would understand?** And: what is it
   *not* — what do people wrongly assume you do? (That second answer is worth
   more than the first.)
2. **Who are you talking to?** Get two or three audiences, and for each: what
   they care about, and what they already believe. Push past job titles to
   beliefs.
3. **The tagline** — the exact string, punctuation included, that goes in the
   footer of everything. If they don't have one, say so in the file rather than
   inventing one.
4. **How is the name written?** Capitalisation, any it's-not-a-verb rules,
   anything the mark must never be called.
5. **Words you never want to see.** Give them the default ban list from
   `docs/writing-rules.md` as a starting point and ask what to add. Industry
   clichés are the valuable additions here.
6. **Where do facts come from?** URLs, doc sites, a market-data file, a private
   repo. **This is the most valuable question in the interview** — it's what
   stops an eager agent inventing a statistic. If a source is a private repo,
   point them at `docs/reference-folder.md` for adding it read-only.
7. **What must the content never imply?** Legal or accuracy landmines — the
   claims that would cause a problem. Ask directly: "Anything a keen intern
   might write about you that would make you wince?"

**Then rewrite `brand-kit/BRAND.md`** section by section, keeping its structure
(the skills and every other agent expect those headings). **Delete the
blockquote at the top** — its absence is how every future session knows the
studio is configured. Replace it with one line naming the brand and the date.

Also update `brand-kit/brand.json`: the name, wordmark, tagline, site URL and
blog path. The essay builder reads it for canonical URLs and structured data, so
a stale value there ships in the page metadata where nobody looks.

Never leave a section carrying the shipped brand's content. If they genuinely don't have an answer,
write `*Not defined yet — ask before writing copy that depends on this.*` so an
agent knows to stop rather than guess.

## Step 4 · Prove it worked

Don't end on a description. **Show them.**

1. Render an example in their new brand:
   ```bash
   cd posts && ./render.sh src/linkedin/_template/portrait.html
   ```
2. `Read` the PNG so it appears in the conversation, and check it honestly:
   fonts actually loaded (not a fallback), contrast holds, the accent appears
   once, nothing clipped. If a font didn't load, fix it before showing them.
3. Ask what feels off. Adjust `brand.css` and re-render. **Expect two or three
   rounds** — this is the moment to get it right, because everything later
   inherits it.

## Step 5 · Loose ends

- **Video?** If they'll want video, run `brand-kit/fetch-fonts.sh` and switch
  `brand.css` to the local `@font-face` block. Remote fonts do not load in time
  during video frame capture and the whole video silently renders in a fallback.
- **Examples.** Say in plain language that the finished pieces in `examples/`
  stay in the shipped brand on purpose — they're there to show the house style,
  not to be reused. Say plainly that anything they publish should come out of
  their own brand kit, and offer to delete `examples/` if they'd rather not have
  it in the repo at all.
- **The calendar** still has the sample plan in it. Offer `/calendar` to replace
  it with their own.
- **Offer to save.** "Want me to upload this so it's set for everyone on the
  team?" If yes, do the git work silently (see `CLAUDE.md`).

## Traps

- **Don't invent a tagline, a statistic, or a positioning line.** Blank and
  flagged beats plausible and wrong — everything downstream will treat whatever
  you write here as fact.
- **Don't accept two accent colours.** Explain why, once, and offer to make the
  second one a status colour instead.
- **Don't rename tokens** to match their internal naming. `--accent` is
  `--accent` everywhere in the repo.
- **Check the contrast**, especially with a light ground and a pale accent —
  it's the most common way a brand kit that sounded good renders unreadable.
- **A brand kit is not a style guide.** Keep `BRAND.md` to what changes what
  gets written. Nobody, human or agent, reads forty pages.
