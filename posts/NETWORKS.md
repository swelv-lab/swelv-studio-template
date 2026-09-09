# Networks

Every canvas size in the studio, where it comes from, and the things about each
platform that will catch you.

**The sizes themselves live in
[`src/_shared/canvas.css`](src/_shared/canvas.css)**, as preset classes. A post
declares one and inherits the canvas:

```html
<div class="canvas ig-story">
```

`render.sh` reads that class and resolves the dimensions, so you never pass a
width and a height by hand — which is the usual way a post silently ships
cropped.

```bash
cd posts
./render.sh src/tiktok/_template/photo.html        # 1080×1920, resolved
./render.sh src/linkedin/_template/square.html     # 1080×1080, resolved
```

Author at 1×; the renderer emits 2×, so a 1080-wide canvas ships as 2160.

That is for **stills**. Video renders at 1×: a still costs one screenshot and
the extra pixels are nearly free, while a video costs one per frame and 2×
turns minutes of rendering into most of an hour for a master nobody watches at
that size. See the new-video skill, "Master size".

---

## The table

| Network | Preset | Canvas (1×) | Ratio | Use |
| ------- | ------ | ----------- | ----- | --- |
| **LinkedIn** | `li-portrait` | 1080 × 1350 | 4:5 | Feed post · **the default** |
| | `li-square` | 1080 × 1080 | 1:1 | Feed post · also a document-post page |
| | `li-landscape` | 1200 × 627 | 1.91:1 | Link preview |
| **Instagram** | `ig-portrait` | 1080 × 1350 | 4:5 | Feed post · **the default** |
| | `ig-tall` | 1080 × 1440 | 3:4 | Maximum feed height |
| | `ig-square` | 1080 × 1080 | 1:1 | Feed post |
| | `ig-landscape` | 1080 × 566 | 1.91:1 | Feed post |
| | `ig-story` | 1080 × 1920 | 9:16 | Story · Reel cover |
| **X** | `x-landscape` | 1600 × 900 | 16:9 | In-stream · **the default** |
| | `x-square` | 1080 × 1080 | 1:1 | In-stream |
| | `x-portrait` | 1080 × 1350 | 4:5 | In-stream |
| **Facebook** | `fb-portrait` | 1080 × 1350 | 4:5 | Feed post |
| | `fb-square` | 1080 × 1080 | 1:1 | Feed post |
| | `fb-link` | 1200 × 630 | 1.91:1 | Shared-link card |
| | `fb-story` | 1080 × 1920 | 9:16 | Story |
| **TikTok** | `tt-photo` | 1080 × 1920 | 9:16 | Photo mode |
| **YouTube** | `yt-thumb` | 1280 × 720 | 16:9 | Video thumbnail |
| | `yt-short` | 1080 × 1920 | 9:16 | Short |
| **Pinterest** | `pin-standard` | 1000 × 1500 | 2:3 | Standard pin |
| | `pin-square` | 1000 × 1000 | 1:1 | Pin |
| **Threads** | `th-portrait` | 1080 × 1350 | 4:5 | Feed post |
| **Bluesky** | `bs-landscape` | 1200 × 675 | 16:9 | Feed post |
| | `bs-square` | 1080 × 1080 | 1:1 | Feed post |

Verified against Hootsuite's and Buffer's maintained guides, August 2026.
Platforms move these. When one moves, it moves in `canvas.css` and every
template in the repo follows.

---

## Safe zones

The vertical formats are **not fully visible**. The platform paints its own
interface over your image, and content underneath it is simply gone.

| Preset | Top | Bottom | Right | What is covering it |
| ------ | --- | ------ | ----- | ------------------- |
| `ig-story` · `fb-story` | 250px | 340px | — | Profile row and close button; caption, CTA, send bar |
| `tt-photo` | 180px | 480px | 200px | Handle, caption and sound ticker; the like/comment/share rail |
| `yt-short` | 180px | 420px | 180px | Title and channel row; the action rail |

`.stage` already sits inside those bands, so ordinary content is safe without
you thinking about it. **Anything you position absolutely is not.** To check,
add `guides` to the canvas class and re-render — the unsafe bands show up in
red:

```html
<div class="canvas ig-story guides">
```

Take it off before the real render.

---

## Per-platform notes worth knowing

**LinkedIn** accepts between 3:1 and 4:5 with a minimum width of 1080. Portrait
claims the most vertical space in the feed, which is why it is the default. What
LinkedIn calls a *document post* is the carousel: square pages, uploaded as one
PDF.

**Instagram** crops the profile grid to 4:5, so a square post is fine in the
feed and letterboxed on your profile. If a post has to work in both places,
build it at 4:5.

**X** shows a 16:9 in-stream image uncropped, which makes it the safest choice.
Taller ratios get cropped in the timeline and expand on tap.

**TikTok** is the one with three safe zones rather than two: the button rail
runs down the right side over your frame the whole time.

**YouTube thumbnails** are read at roughly 210px wide in a sidebar. Four or five
words, enormous. Anything you would need to lean in for is decoration.

**Pinterest** is a search surface rather than a feed: the title does the work,
and 2:3 is the only ratio that is never cropped.

**Threads and Bluesky** do not crop feed previews, so the ratio is genuinely a
choice. The presets here are what reads best on a phone.

---

## Adding a network

1. Add the preset to `src/_shared/canvas.css`, with a comment saying where the
   number came from and what covers it.
2. `mkdir -p src/<network>/_template` and copy the closest existing template in.
3. Swap the preset class, adjust the layout, render, look at it.
4. Add a row to the table above.

Nothing else needs touching — `render.sh` resolves the new preset on its own.
