# Logo files

| File              | What it is                                                                 |
| ----------------- | -------------------------------------------------------------------------- |
| `mark.svg`        | **The source of truth for the mark.** Drawn in flat black, because it is painted as a CSS *mask* — only its alpha matters, and `--mark-ink` in `brand.css` decides the colour. Run `../sync-logo.sh` after editing it. |
| `mark-accent.svg` | The same mark in the accent colour, as a normal image, for places that need a real file (a favicon source, a slide deck in another tool). |
| `logo-full.png`   | Optional. A raster lockup at 2×, for video capture and anywhere you want the exact artwork rather than live text. |

**The wordmark is live text**, not an image — it renders from `.logo-lockup
.wordmark` using the brand sans at weight 700. That keeps it crisp at every size
and makes a rename one edit.

## The lockup

`brand.css` composes the two, and the whole arrangement is tokenised:

| Token           | Does                                                        |
| --------------- | ------------------------------------------------------------ |
| `--mark-order`  | `0` puts the mark before the wordmark, `2` after             |
| `--mark-ink`    | The mark's colour (`currentColor` to follow the text)         |
| `--mark-size`   | Its height, in `em`, so it scales with the lockup             |
| `--mark-aspect` | Width ÷ height of the artwork, so it is never squashed        |
| `--mark-gap`    | The space between mark and wordmark                           |

The brand shipped here uses `--mark-order: 2` with the wordmark set to `swel`,
because **the mark is the "v"**. Set `--mark-size: 0` for a wordmark-only brand,
or drop the `<span>` for mark-only.
