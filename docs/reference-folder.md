# The `reference/` folder (optional)

Content that has to match your live site — a post styled like the hero section,
a card that reuses the exact copy from a product page — should be built from the
**site's own source**, not from memory. Approximating your own website produces
something that looks *almost* right, which reads worse than something that looks
deliberately different.

So the studio supports an optional read-only copy of your site at `reference/`.

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

Without `reference/`, everything else in this studio still works — you just build
from the brand kit rather than from the site.
