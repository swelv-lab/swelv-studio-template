# TikTok

The one platform with three safe zones rather than two: the button rail sits down the right side of your frame the whole time.

| Template | Preset |
| -------- | ------ |
| `_template/photo.html` | `tt-photo` |

Sizes, ratios and safe zones for every network live in
[`posts/NETWORKS.md`](../../NETWORKS.md); the presets themselves are in
[`src/_shared/canvas.css`](../_shared/canvas.css). Nothing in this folder
declares its own dimensions.

```bash
cd posts && ./render.sh src/tiktok/_template/photo.html
```

Posts go in a **topic** folder beside `_template/`, one folder per carousel or
card set: `src/tiktok/<topic>/`. The renderer mirrors that into
`output/tiktok/<topic>/`.
