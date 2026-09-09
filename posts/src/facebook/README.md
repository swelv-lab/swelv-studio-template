# Facebook

Same shapes as Instagram, plus the shared-link card at 1.91:1.

| Template | Preset |
| -------- | ------ |
| `_template/link.html` | `fb-link` |
| `_template/portrait.html` | `fb-portrait` |
| `_template/story.html` | `fb-story` |

Sizes, ratios and safe zones for every network live in
[`posts/NETWORKS.md`](../../NETWORKS.md); the presets themselves are in
[`src/_shared/canvas.css`](../_shared/canvas.css). Nothing in this folder
declares its own dimensions.

```bash
cd posts && ./render.sh src/facebook/_template/link.html
```

Posts go in a **topic** folder beside `_template/`, one folder per carousel or
card set: `src/facebook/<topic>/`. The renderer mirrors that into
`output/facebook/<topic>/`.
