# LinkedIn

Portrait is the default: it claims the most feed height. A *document post* is what LinkedIn calls a carousel — square pages, uploaded as one PDF.

| Template | Preset |
| -------- | ------ |
| `_template/landscape.html` | `li-landscape` |
| `_template/portrait.html` | `li-portrait` |
| `_template/square.html` | `li-square` |

Sizes, ratios and safe zones for every network live in
[`posts/NETWORKS.md`](../../NETWORKS.md); the presets themselves are in
[`src/_shared/canvas.css`](../_shared/canvas.css). Nothing in this folder
declares its own dimensions.

```bash
cd posts && ./render.sh src/linkedin/_template/landscape.html
```

Posts go in a **topic** folder beside `_template/`, one folder per carousel or
card set: `src/linkedin/<topic>/`. The renderer mirrors that into
`output/linkedin/<topic>/`.
