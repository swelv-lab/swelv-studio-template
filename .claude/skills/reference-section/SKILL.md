---
name: reference-section
description: Base a new image on a real section or component of your live website — copying its exact colours, copy and layout from the site's own source. Use when the user says "make a post that looks like the hero", "use the pricing section from the site", "copy that part of the landing page", or similar.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Reproduce a section of your site as an image

The point of this skill is **fidelity**. Approximating your own website from
memory produces something that looks *almost* right, which is worse than
something that looks different. So this reads the site's actual source.

## Prerequisite

This needs your site's source available read-only at `reference/`. If that folder
does not exist, say so plainly and point the user at
`docs/reference-folder.md` — it takes one command to add, and it is worth it if
you make this kind of image often. Then offer to build the image from a
screenshot or a description instead.

**Read from `reference/`, never write to it.** A guard hook blocks edits anyway.

## Steps

1. **Identify the target.** Map what the user names ("the hero", "the pricing
   table") to a real source file under `reference/`. Search by the copy they
   quote rather than by filename — it is faster and more reliable. If it is
   ambiguous, list two or three candidates and ask.
2. **Read the exact source**, plus wherever the site defines its design tokens
   (a theme file, a Tailwind config, a global stylesheet). This is the whole
   point of having the reference: match precisely rather than approximate.
3. **Decide the output** — a social post (hand to `/new-post`) or a brand asset
   (hand to `/new-collateral`) — and pick the canvas.
4. **Rebuild the look** as a self-contained canvas HTML using the primitives in
   `brand-kit/brand.css`. The site is probably a component framework; you are
   reproducing the *look* as static HTML, not importing the component. Keep the
   real headline, the real accent placement, and the real data if it is a demo —
   invented numbers in a reproduction of a real section is the one way this skill
   fails badly.
5. **Reconcile with the brand rules.** If the site does something
   `docs/design-rules.md` forbids, the site wins for this image — it is a
   reproduction. Mention the conflict to the user in one line; it usually means
   the site or the rules should change.
6. **Render and show** the PNG. Iterate.

## If the reference looks stale

`reference/` is pinned to a commit. Refresh it with:

```bash
git submodule update --remote --recursive reference
```

Then tell the user the reference is up to date and offer to save that.
