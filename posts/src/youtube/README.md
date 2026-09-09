# YouTube

A thumbnail is read at about 210px wide in a sidebar. Four or five words, enormous. Design for that size, not the one on your screen.

| Template | Preset |
| -------- | ------ |
| `_template/short.html` | `yt-short` |
| `_template/thumbnail.html` | `yt-thumb` |

Sizes, ratios and safe zones for every network live in
[`posts/NETWORKS.md`](../../NETWORKS.md); the presets themselves are in
[`src/_shared/canvas.css`](../_shared/canvas.css). Nothing in this folder
declares its own dimensions.

```bash
cd posts && ./render.sh src/youtube/_template/short.html
```

Posts go in a **topic** folder beside `_template/`, one folder per carousel or
card set: `src/youtube/<topic>/`. The renderer mirrors that into
`output/youtube/<topic>/`.
