# The `reference/` folder (optional)

Content that has to match something real — a post styled like your hero section,
a card that reuses the exact copy from a product page, a claim about what your
product actually does — should be built from **the source itself**, not from
memory. Approximating your own website produces something that looks *almost*
right, which reads worse than something that looks deliberately different; and
an agent writing about your product from memory gets it subtly wrong in a way
you then have to correct, every time.

So the studio supports an optional read-only copy of your own sources at
`reference/`: your site, your product docs, your app — whatever the studio
should read rather than guess.

## Add it

If your site lives in a git repo:

```bash
git submodule add <your-site-repo-url> reference
git submodule update --init --recursive
```

Anyone cloning the studio afterwards gets it with:

```bash
git clone --recurse-submodules <this-repo>
```

No git repo for the site? A plain copy works just as well — the studio only ever
reads it:

```bash
mkdir reference && cp -r ~/path/to/site/src reference/
```

**More than one source.** Give each its own subfolder, and say in `CLAUDE.md`
what each one is for, so a session knows which to read:

```
reference/
├── site/     the marketing site's source — layout, tokens, the live copy
├── docs/     the product docs — what the product actually does
└── app/      the app's source — the real flows, names and states
```

The rule for all of them is the same: **read, never write, and never from
memory.** A product claim comes out of `reference/docs`, not out of the model.

## Refresh it

A submodule is pinned to a commit, so it goes stale silently:

```bash
git submodule update --remote --recursive reference
```

## It is read-only, and enforced

A `PreToolUse` hook blocks any write under `reference/`. That is deliberate:
editing the reference here changes nothing real, and silently desynchronises the
copy from the site it is supposed to mirror. To change the site, change the site.

## What it unlocks

The `/reference-section` skill: *"make a post that looks like the hero"* reads
the real component and the real design tokens, and reproduces them exactly.

Everything else gains the same thing quietly: a deck, an essay or a post that
makes a claim about the product is written from the docs in `reference/`, so it
is right the first time instead of after three corrections.

Without `reference/`, everything else in this studio still works — you just build
from the brand kit rather than from your own sources.
