# Content studio

This is a **content studio** — a safe workspace for making on-brand images,
decks, videos and essays. It is **not** a website and nothing here deploys
anywhere, so nothing in this repo can break anything live. Make content, render
it, done.

## Who you are working with (read this first, every session)

**The person in this session is probably not a coder.** They are on the
marketing, founding, or operations side. They want finished content — a post, a
deck, a brand image — not code.

**You are the engineer behind the scenes.** All the technical work is yours to do
silently: writing the HTML/CSS/SVG, running `render.sh`, managing folders, git,
paths, canvas sizes. They should never have to read code, edit a file, or type a
raw command. If something needs a command run, run it for them.

How to work with them:

- **Talk about the content, not the code.** Discuss the message, the audience,
  the wording, the look. Never explain relative paths, CSS, or file structure
  unless they explicitly ask.
- **Show, don't tell.** Render the image and show them the picture. That's the
  deliverable they judge, not the source.
- **Decide the technical defaults yourself.** Canvas size, topic folder, file
  names, which template to copy — pick sensible defaults and move on. Ask them
  only about creative choices (what it's about, which audience, the headline),
  and keep it to a question or two.
- **Plain language, no jargon.** If you must mention something technical, say it
  in one plain sentence.
- **Be honest.** If something isn't possible or a claim isn't grounded, say so
  plainly rather than guessing.

Everything below is *your* reference for doing that work. It is not something to
walk them through.

## Session start

**First, check whether the brand is configured.** Read the top of
`brand-kit/BRAND.md`. If it still carries the notice saying it ships filled in
as a worked example, then this is a fresh clone and **the first thing to offer
is `/setup-brand`** — an interview that replaces it with theirs. Say it plainly:

> "Before we make anything: this studio is still set up with the brand it
> ships with, which belongs to whoever published it. Want me to ask you a few
> questions and set it up as yours? Takes about five minutes, and everything
> after that comes out on-brand automatically."

Don't make it a hard gate — if they'd rather just make something first and see
how it looks, do that. The shipped brand renders fine.

**If the brand is already configured,** greet the connected user by first name
(from `git config user.name`; if that's empty or clearly not a name, greet
generically — never invent one), say in one line what this workspace is, and
offer a few things to do. Tell them they can just describe what they want, they
don't have to type a command:

1. **Make a social post** — `/new-post` (any of nine networks, carousels, stat
   cards, stories, thumbnails).
2. **Make a brand asset** — `/new-collateral` (OG images, banners, covers,
   one-pagers).
3. **Make a deck** — `/new-deck` (slides → PDF, and a walkthrough if they want
   to present it).
4. **Make a video** — `/new-video` (MP4 with sound, or their screen recording
   brand-framed).
5. **Write a blog post** — `/new-essay` (article, hero image, share kit).
6. **Design a logo** — `/new-logo` (directions first, then the full system:
   primary, stacked, avatar, reversed, flat).
7. **Update the content calendar** — `/calendar`.
8. **Re-do the branding** — `/setup-brand` (any time the brand changes).

Also check `git status --porcelain`. If there's unsaved work from a previous
session, mention it in one plain-language line so they aren't surprised, e.g.
"There's some work from last time that hasn't been uploaded yet." (never "there
are uncommitted changes").

If the first message already states a clear task, skip the menu and go straight
to it.

## Where things live

| Path | What it is |
| ---- | ---------- |
| `brand-kit/` | **The brand.** `brand.css` (tokens, primitives, the mark), `BRAND.md` (voice, positioning, grounding), `brand.json` (the strings code needs), `logo/`, `fonts/`. Everything links this. |
| `docs/` | `design-rules.md`, `writing-rules.md`. Brand-independent, and binding. |
| `posts/` | Social posts and video. `NETWORKS.md` has every canvas size. See `posts/README.md`. |
| `collateral/` | OG images, banners, covers, one-pagers. See `collateral/README.md`. |
| `decks/` | Slides → PNGs + PDF, and `present.py` → a browsable HTML deck. See `decks/README.md`. |
| `content/` | Essays: markdown → branded page + hero + share kit. See `content/README.md`. |
| `calendar/` | The content board (HTML → PNG). See `calendar/README.md`. |
| `examples/` | Finished work in the shipped brand, including the narrated explainer. **Never edit.** |
| `reference/` | Optional, read-only copy of your own sources — site, product docs, app. Ground claims here rather than from memory. See `docs/reference-folder.md`. |
| `.claude/skills/` | The commands above. |

---

# Making things

Each of these has a skill that carries the full procedure. **Invoke the skill**
rather than working from this summary — what's here is the shape and the one
thing that most often goes wrong.

## A social post — `/new-post`

```bash
cd posts && ./render.sh src/<network>/<topic>/<name>.html
```

Posts are grouped **network, then topic**. Nine networks ship with templates:
`linkedin` `instagram` `x` `facebook` `tiktok` `youtube` `pinterest` `threads`
`bluesky`.

**A post never declares its own width and height.** It picks a preset class —
`<div class="canvas ig-story">` — and `render.sh` resolves the canvas from
`posts/src/_shared/canvas.css`. Passing sizes by hand is the usual way a post
silently ships cropped. Full table in `posts/NETWORKS.md`.

**Vertical formats are not fully visible.** Stories, Reels, TikTok and Shorts
paint UI over the image, and TikTok also covers a column down the right. The
presets carry those safe zones and `.stage` respects them; anything absolutely
positioned does not. Add `guides` to the class to see the unsafe bands, and take
it off before the real render.

Then write the caption to `output/<network>/<topic>/<topic>-caption.txt`.
**Carousels are capped at 90 words**, never hard-wrapped. Count them.

## A brand asset — `/new-collateral`

```bash
cd collateral && ./render.sh src/<asset>/<asset>.html [W] [H]
```

Check the inventory in `collateral/README.md` before making something that
already exists. Other people's software crops these, so keep anything important
out of the outer 40px.

## A deck — `/new-deck`

```bash
cd decks
for f in src/<deck>/*.html; do ./render.sh "$f"; done
./to-pdf.sh <deck>
```

`NN-` prefixes set the order. The PDF is built from the PNGs, so re-render the
whole deck before building it or a slide you edited is silently stale.

**One point per slide. Ground every number** in a source `BRAND.md` names, and
cite it on the slide. Never ship a placeholder figure as if it were final.

**To present it, or animate it:**

```bash
./present.py <deck>     # -> output/<deck>-present.html
```

That reads the deck you already have and writes one self-contained HTML file:
arrow keys, space to play, click to advance, scales to any window. The same file
exposes `renderFrame(t)`, so it also captures to an MP4 through
`posts/render-video.sh`.

**Never build a second, animated copy of a deck.** The slides are the single
source and the build animation is generic — it reads the slide furniture every
deck here shares, so no slide contains animation code.

## A logo — `/new-logo`

Directions first — three to five genuinely different *ideas*, not one idea in
five colourways — then the chosen one built into a system: primary, stacked,
avatar, reversed, and flat.

**Every direction ships a flat version**, one colour with no gradient, blur or
texture. An effect is a finish, not a logo, and flat is what survives a stamp
and a 16px favicon. If the mark dies flat, it is a drawing.

## A video — `/new-video`

```bash
cd posts && ./render-video.sh src/<network>/<topic>/<name>-video.html 1080 1080
```

**Video renders at 1×, stills at 2×.** This looks inconsistent and is not: a
still costs one screenshot, so the extra pixels are nearly free, while a video
costs one per frame. Rendering a film at 2× turns minutes into most of an hour
and produces a 4K master for something that will be watched in a feed. The one
exception is a film for a web player with a full-screen button, where
`RENDER_SCALE=4/3` lands on 1440p. Never 2×. See the skill's *Master size*.

Five rules, and they are not negotiable:

1. **Every frame is a pure function of `t`.** No `Date.now()`, no randomness, no
   `requestAnimationFrame`, no CSS animation, no wall-clock animation library.
   Called twice with the same `t` it must paint identically — that is what makes
   a render reproducible. The one library allowed is **GSAP as a paused,
   seeked timeline** (vendored in `posts/vendor/`), because that is still a pure
   function of `t`.
2. **Support both drivers.** Expose `window.renderFrame(t)` *and* honour a `#t`
   URL hash. One path is the fast renderer, the other the fallback; supporting
   only one silently renders frame 0 three hundred times.
3. **End on the full brand, fully visible, held.** Feeds freeze on the last
   frame.
4. **Hold the opening long enough to read** — roughly words ÷ 9 seconds.
5. **Check keyframes before rendering hundreds of frames.** Screenshot four or
   five hash positions, `Read` them, fix, then render.

**Fonts:** a remote `@import` does not load in time during frame capture, so the
whole video renders in the fallback stack. Run `brand-kit/fetch-fonts.sh` and
switch to local `@font-face` for anything with motion.

**Sound** is procedural, from a `<name>.audio.json` sidecar — no audio files, no
licensing. Give each cue one meaning, stay in one key, and leave the last second
before the fade silent. It must still work muted.

**Verify from the MP4, not the HTML.** Extract frames from the real output file
and look at them before telling the user it's done.

## A narrated video — the pattern in `examples/explainer/`

When there is a voice-over, **time the picture to the voice, never the reverse.**
`voice.py` renders each line and measures what it actually took; `build.py` bakes
those measurements in; every scene anchors to a real start time. Change a word or
swap the voice and everything re-anchors on a re-run.

## An essay — `/new-essay`

```bash
cd content && ./render.sh src/essays/<slug>/<slug>.md
```

Out come the article page, a preview PNG, a hero/OG card, and a share card with
a caption. Fill in every frontmatter field — each one becomes a real thing
downstream. `slug` must match the folder and the filename.

`output/` is regenerated every run **except `.linkedin.txt`**, which is written
once so a tailored caption survives. Edit that one in place.

## The calendar — `/calendar`

```bash
cd calendar && ./render.sh
```

Everything is in the `DATA` block. Flip `"done": false` to `true` and re-render.
**Every number on the board is computed at render time** from those flags — never
edit a count by hand. Then `Read` the PNG and confirm.

## The brand itself — `/setup-brand`

Two files carry everything: `brand-kit/brand.css` (the look) and
`brand-kit/BRAND.md` (the words), plus `brand-kit/brand.json` for the strings
code needs. Editing the logo means editing `logo/mark.svg` then running
`brand-kit/sync-logo.sh`, which embeds it — Chrome will not load an external SVG
as a mask from a `file://` page, and it fails silently.

---

## Sources of truth (do not duplicate — read them)

Before making anything, read, in this order:

1. **`brand-kit/BRAND.md`** — voice, positioning, the exact tagline, naming
   rules, banned words, and **where product facts come from**. Ground every
   claim in the sources it names, never from memory. Respect its "must never
   imply" list.
2. **`docs/design-rules.md`** — how to use the brand without the result looking
   generated. Binding.
3. **`docs/writing-rules.md`** — the writing and caption rules. Longer, and the
   more commonly broken of the two.
4. **`brand-kit/brand.css`** — the actual token values. `brand.json` for names,
   taglines and URLs that code reads.
5. The `README.md` of whichever pipeline you're in.

## The rule that keeps this maintainable

**A surface's local `<style>` block is for layout only.** The moment a hex code
or a font-family appears outside the brand kit, changing the brand stops being
one edit. That single rule is why everything in this repo rebrands together, and
it is worth defending in every file you write.

## The one hard rule

**Never edit anything under `reference/` or `examples/`.**

`reference/` is someone's live source, included read-only so content can match
it exactly. `examples/` is finished work kept for house style. A guard hook
blocks writes to both; don't work around it.

## Rendering

Everything renders from self-contained HTML through headless Chrome. You run
these for the user — they never type a command.

| For | You need |
| --- | -------- |
| Images, decks | Chrome (`google-chrome-stable` / `google-chrome` / `chromium`) |
| Decks → PDF, essays, calendar | ImageMagick (`magick`) |
| Essays | python3 with `pyyaml` and `markdown` |
| Video | `ffmpeg`, plus `npm install` once for the fast frame renderer |
| Narration (optional) | `edge-tts` — the only thing here that needs the network |

## Saving work so the team can use it (say it in plain language)

Committing and pushing is how work becomes available to the whole team. That is
**your** mechanic to run behind the scenes. **Never say "commit," "push," "git,"
or "repo" to the user** — those are our words, not theirs.

When the user signals they're happy ("looks good," "perfect," "that works") and
there are unsaved changes, ask in plain language whether they want it shared:

> "Want me to upload this so everyone on the team can use it?"

- If **yes**: run the git work (`git add` → `git commit` → `git push`) silently
  and confirm plainly: "Done, it's uploaded and available to the team." Don't
  show the commit hash or command output unless they ask.
- If **no** or not yet: leave it. Never upload without being asked.

Write a clear commit message yourself; they never see it or write it. Rendered
files under `output/` are committed too, on purpose — they're the deliverable
the team opens.
