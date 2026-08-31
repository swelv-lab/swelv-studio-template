---
name: new-collateral
description: Create a new on-brand brand asset — OG/link-preview image, banner, presentation cover, one-pager, email footer, or other reusable collateral (as opposed to a network-specific social post). Handles layout, brand rules, and rendering to a PNG.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Create a brand asset

Reusable collateral (OG images, banners, presentation covers, one-pagers) renders
from a self-contained HTML file through `collateral/render.sh`. Work inside
`collateral/`.

## Before you start — read these

1. **`brand-kit/BRAND.md`** — voice, tagline, naming rules, grounding. If it
   still carries the demo-brand notice, offer `/setup-brand` first.
2. **`docs/design-rules.md`** — binding.
3. **`collateral/README.md`** — the mechanic, the **inventory of assets that
   already exist** (do not regenerate one that is already there), and the canvas
   sizes.

## Steps

1. **Confirm the format and canvas.** Common sizes, from
   `collateral/README.md`: OG / link preview 1200×630, square social 1200×1200,
   presentation cover 1920×1080, LinkedIn company cover 1128×191. Ask only if it
   is genuinely unclear.
2. **Check the inventory first.** If it already exists in `brand-kit/` or
   `collateral/output/`, point them at it rather than remaking it.
3. **Make a folder and start from the template:**
   ```bash
   mkdir -p collateral/src/<asset>
   cp collateral/src/_template/template.html collateral/src/<asset>/<asset>.html
   ```
   Or copy a closer existing asset. Keep the skeleton: `.canvas` → `.stage` →
   header (logo lockup) → hero content → footer.
4. **Follow the design rules exactly.** Tokens come from `brand-kit/brand.css`;
   asset-specific styling stays in the local `<style>` and covers layout only.
5. **Render:**
   ```bash
   cd collateral && ./render.sh src/<asset>/<asset>.html [W] [H]
   ```
   Defaults to 1200×630. Output lands in `collateral/output/<asset>/`.
6. **Show the PNG** so the user can eyeball it. Check the fonts loaded and
   nothing is clipped at the edges — collateral gets cropped by other people's
   software, so keep the important content away from the outer 40px.

## A note on where an asset ends up

If it is meant to become permanent, site-served collateral (a favicon, the real
OG image on your domain), say plainly that this repo renders it but somebody has
to place it in the actual website — that happens wherever the site lives, not
here.

## When it looks right

Ask in plain language whether to share it. If yes, do the git save silently and
confirm plainly. Never say "commit/push/git," and never upload unasked.
