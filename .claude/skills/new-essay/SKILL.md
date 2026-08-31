---
name: new-essay
description: Write and render a long-form essay or blog article. Use when the user wants a blog post, founder essay, article, thought piece, or the social share kit for one. Produces the markdown source, a branded HTML page + PNG preview, a hero/OG card, and a share card with caption scaffold via content/render.sh.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Write an essay

You are writing **prose**, not an image: one markdown file at
`content/src/essays/<slug>/<slug>.md`, rendered by `content/render.sh` into a
branded article page, a preview PNG, a hero/OG card and a social share kit.

Publishing happens wherever the blog lives — you produce the article, not blog
infrastructure.

## Before you start — read these

1. **`brand-kit/BRAND.md`** — voice, positioning, banned words, and the
   grounding sources. An essay makes more claims than any other surface in the
   studio; every one of them traces to a source named there.
2. **`docs/writing-rules.md`** — all of it. Long-form is where the antithesis
   pair and the aphorism breed.
3. The closest existing essay under `content/src/essays/` or `examples/`.

## Non-negotiable rules

1. **Never write a product claim, a statistic, or a mechanism from memory.** If a
   number is not in a source `BRAND.md` names, either cut it or ask the user to
   approve a new source. "It sounds about right" is how a company ends up
   quoting a made-up figure back to itself six months later.
2. **Argue the why, not the how.** A founder essay makes the case for a
   position and what it unlocks. It does not hand a competitor an
   implementation.
3. **Image-free body.** Rhythm comes from numbered sections, pull quotes and the
   FAQ — not from stock illustration. A genuine data visual belongs inline as
   on-brand SVG (raw HTML passes straight through the markdown).
4. **`output/` is generated — never hand-edit it.** One exception by design: the
   caption at `output/essays/<slug>/<slug>.linkedin.txt` is written once and
   never overwritten, so tailor the caption *there*, not by re-rendering.

## Steps

### 1 · Clarify and ground

One or two questions maximum if the brief is vague: the topic, the audience, and
**the argument** — what does the reader believe at the end that they didn't at
the start? If the answer is "that we're good", it isn't an essay yet.

Then read the grounding sources and write down: the claims you may make, the
numbers you may cite, and the must-never-imply list.

### 2 · Start from the closest existing essay

```bash
cd content
ls src/essays/
mkdir -p src/essays/<slug>
cp src/essays/<nearest>/<nearest>.md src/essays/<slug>/<slug>.md
```

### 3 · Frontmatter — every field, it is all SEO surface

`title` (the H1) · `slug` (**must** equal the folder and filename) ·
`kind: article` · `eyebrow` (two or three word category) · `deck` (one-line
summary for listing cards and social; not shown on the post itself) ·
`description` (fuller meta, one or two sentences) · `author` and `role` (check
`git config user.name`, or ask) · `date` (today, `YYYY-MM-DD`) · `tags[]` ·
`faq[]` (three or four Q&As, **each answer self-contained** — these are what
search engines and language models quote) · `heroImage` (optional; omit for the
default generated card).

### 4 · Body — the locked shape

Numbered `## H2` sections (the numbers render as large accent numerals — write
plain titles), short paragraphs, one or two `> pull quotes` of your sharpest
lines, no `###` nesting, no images. **700–1200 words.** End on the argument, not
a pitch.

### 5 · Render, and look at it

```bash
cd content && ./render.sh src/essays/<slug>/<slug>.md
```

Needs Chrome, ImageMagick, and python3 with `pyyaml` and `markdown`. Then
`Read` — as images — `output/essays/<slug>/<slug>.png`, `<slug>.hero.png` and
`<slug>.linkedin.png`. Check the title, eyebrow and byline render; the section
numbers show; the FAQ is present; and the share-card text stays legible over the
hero.

### 6 · Tailor the share caption

Open `output/essays/<slug>/<slug>.linkedin.txt` — a scaffold built from the deck
line — and rewrite it into a real post: a hook, two or three short paragraphs,
the link, and no hashtag spam (three at most). It survives re-renders, so edit it
in place.

### 7 · Hand off

Tell the user in plain language: which PNG to review, that publishing happens
wherever the blog lives, and the posting ritual (paste the caption, delete the
platform's auto link-preview, attach the share card). Offer to tick the matching
item on the calendar board with `/calendar`. Offer — never assume — to upload.

## Traps

- `render.sh` must run from inside `content/`.
- A `slug` mismatch between folder, filename and frontmatter breaks every output
  path, quietly.
- Re-rendering does **not** refresh `.linkedin.txt`. That is deliberate. Edit the
  file.
- Markdown turns `--` into an em dash. Write the middle dot explicitly and check
  the rendered page for strays.
