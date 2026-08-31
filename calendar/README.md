# Content calendar

A planning board that doubles as a shareable image. One HTML file holds both the
layout and the plan; `render.sh` turns it into a PNG you can drop in a channel.

```
calendar/
├── src/content-calendar.html    layout + the plan, in a JSON block at the bottom
├── output/content-calendar.png  generated; never hand-edit
└── render.sh                    renders tall, then trims to the board
```

## Update it

Everything lives in the `DATA` block near the bottom of the HTML. To tick
something shipped, flip its `"done": false` to `true` and re-render:

```bash
cd calendar && ./render.sh
```

**Every number on the board is computed at render time** from the `done` flags —
the progress bar, the totals, the per-week counters. Never edit a number by hand;
it will be wrong at the next render and right-looking in between, which is worse.

## The data

```jsonc
{
  "setup":  [ { "t": "…", "a": "M", "done": false } ],           // one-off groundwork
  "essays": [ { "when": "Wk 4", "t": "…", "d": "…", "done": false } ],
  "weeks":  [ { "n": 1, "dates": "Jul 6–10", "theme": "…",
                "personal": [ { "day": "Mon", "p": "3.1", "t": "…",
                               "meta": "Text · Follow", "a": "S", "done": false } ],
                "company":  [ { "day": "Tue", "k": "Category", "t": "…",
                               "a": "S", "done": false } ] } ]
}
```

`a` is the owner (two lanes), `p` the content pillar, `k` the company-page lens,
`mark` / `hot` an optional format badge.

The shipped plan is a **sample**. Replace it with yours — the `/calendar` skill
will do the edits for you from plain language ("the pricing post went out").

## One trap

Ticking an item never changes the board's height, so renders stay stable. But if
the calendar *grows* past the render height because items were added, bump the
`maxh` default in `render.sh`.
