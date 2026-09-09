# Threads

No cropping of feed previews, so the ratio is a real choice. 4:5 reads best on a phone.

| Template | Preset |
| -------- | ------ |
| `_template/portrait.html` | `th-portrait` |

Sizes, ratios and safe zones for every network live in
[`posts/NETWORKS.md`](../../NETWORKS.md); the presets themselves are in
[`src/_shared/canvas.css`](../_shared/canvas.css). Nothing in this folder
declares its own dimensions.

```bash
cd posts && ./render.sh src/threads/_template/portrait.html
```

Posts go in a **topic** folder beside `_template/`, one folder per carousel or
card set: `src/threads/<topic>/`. The renderer mirrors that into
`output/threads/<topic>/`.
