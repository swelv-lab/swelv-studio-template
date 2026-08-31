# Logo files

Drop your logo here. The studio expects:

| File              | What it is                                                        |
| ----------------- | ----------------------------------------------------------------- |
| `mark.svg`        | The symbol alone, drawn with `currentColor` so it takes the ink colour of wherever it sits. Used in the `.logo-lockup` next to the wordmark. |
| `mark-accent.svg` | The same symbol locked to your accent colour, for places that need it to pop on its own. |
| `logo-full.png`   | Optional. A raster lockup at 2x, for video capture (SVG-in-canvas is fussy) and for anywhere you want the exact artwork rather than live text. |

The wordmark is **live text**, not an image — it renders from `.logo-lockup .wordmark`
in `brand.css` using your brand's sans at weight 700. That keeps it crisp at every
size and means a rename is one edit.

No mark yet? Delete the `<svg>` from the lockup markup and run wordmark-only. Plenty
of brands do.

*(The files shipped here belong to the fictional demo brand. Replace them.)*
