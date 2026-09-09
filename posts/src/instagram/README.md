# Instagram

The profile grid crops to 4:5, so a square post is fine in the feed and letterboxed on your profile. Build at 4:5 if it has to work in both.

| Template | Preset |
| -------- | ------ |
| `_template/portrait.html` | `ig-portrait` |
| `_template/square.html` | `ig-square` |
| `_template/story.html` | `ig-story` |

Sizes, ratios and safe zones for every network live in
[`posts/NETWORKS.md`](../../NETWORKS.md); the presets themselves are in
[`src/_shared/canvas.css`](../_shared/canvas.css). Nothing in this folder
declares its own dimensions.

```bash
cd posts && ./render.sh src/instagram/_template/portrait.html
```

Posts go in a **topic** folder beside `_template/`, one folder per carousel or
card set: `src/instagram/<topic>/`. The renderer mirrors that into
`output/instagram/<topic>/`.
