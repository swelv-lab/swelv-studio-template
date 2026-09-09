# Pinterest

A search surface, not a feed. The title does the work, and 2:3 is the only ratio Pinterest never crops.

| Template | Preset |
| -------- | ------ |
| `_template/pin.html` | `pin-standard` |

Sizes, ratios and safe zones for every network live in
[`posts/NETWORKS.md`](../../NETWORKS.md); the presets themselves are in
[`src/_shared/canvas.css`](../_shared/canvas.css). Nothing in this folder
declares its own dimensions.

```bash
cd posts && ./render.sh src/pinterest/_template/pin.html
```

Posts go in a **topic** folder beside `_template/`, one folder per carousel or
card set: `src/pinterest/<topic>/`. The renderer mirrors that into
`output/pinterest/<topic>/`.
