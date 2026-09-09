# X

16:9 is shown uncropped in the timeline, which makes it the safe default. Taller ratios get cropped and expand on tap.

| Template | Preset |
| -------- | ------ |
| `_template/landscape.html` | `x-landscape` |
| `_template/square.html` | `x-square` |

Sizes, ratios and safe zones for every network live in
[`posts/NETWORKS.md`](../../NETWORKS.md); the presets themselves are in
[`src/_shared/canvas.css`](../_shared/canvas.css). Nothing in this folder
declares its own dimensions.

```bash
cd posts && ./render.sh src/x/_template/landscape.html
```

Posts go in a **topic** folder beside `_template/`, one folder per carousel or
card set: `src/x/<topic>/`. The renderer mirrors that into
`output/x/<topic>/`.
