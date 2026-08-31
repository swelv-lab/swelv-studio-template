# Brand collateral

Reusable brand assets — the images that are not tied to one social post. OG /
link previews, banners, presentation covers, one-pagers, email footers, profile
art.

```
collateral/
├── src/
│   ├── _template/template.html    the starter — copy it
│   └── <asset>/<asset>.html       one folder per asset
├── output/<asset>/<asset>.png     generated; never hand-edit
└── render.sh                      HTML → PNG (default 1200×630)
```

Same mechanic as [`posts/`](../posts/README.md): a self-contained HTML file links
`../../../brand-kit/brand.css` and carries only its own layout.

## Render

```bash
cd collateral
./render.sh src/og-default/og-default.html            # default 1200×630
./render.sh src/cover/cover.html 1920 1080            # presentation cover
```

## Common canvas sizes

| Use                          | Canvas (1×) | Ratio  |
| ---------------------------- | ----------- | ------ |
| OG image / link preview      | 1200 × 630  | 1.91:1 |
| Square social / profile      | 1200 × 1200 | 1:1    |
| Presentation cover           | 1920 × 1080 | 16:9   |
| LinkedIn company cover       | 1128 × 191  | wide   |
| Email footer                 | 1200 × 300  | 4:1    |

Collateral gets cropped by other people's software — a link preview is trimmed
differently on every platform. **Keep anything important out of the outer 40px.**

## Inventory

Track what exists here so nobody regenerates an asset that already ships:

| Asset | Canvas | Where it's used |
| ----- | ------ | --------------- |
| _(add yours)_ | | |

## Making a new asset

```bash
mkdir -p src/my-asset
cp src/_template/template.html src/my-asset/my-asset.html
```

Then edit, render, look at it. The `/new-collateral` skill does this for you.

If an asset is meant to be permanent, publicly-served site collateral — the real
OG image on your domain, a favicon — this repo renders it, but somebody still has
to place it in the actual website. That happens wherever the site lives.
