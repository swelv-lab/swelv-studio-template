# Bluesky

No cropping of feed previews either. 16:9 for a wide card, 1:1 when the image is the point.

| Template | Preset |
| -------- | ------ |
| `_template/landscape.html` | `bs-landscape` |

Sizes, ratios and safe zones for every network live in
[`posts/NETWORKS.md`](../../NETWORKS.md); the presets themselves are in
[`src/_shared/canvas.css`](../_shared/canvas.css). Nothing in this folder
declares its own dimensions.

```bash
cd posts && ./render.sh src/bluesky/_template/landscape.html
```

Posts go in a **topic** folder beside `_template/`, one folder per carousel or
card set: `src/bluesky/<topic>/`. The renderer mirrors that into
`output/bluesky/<topic>/`.
