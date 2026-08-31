---
name: calendar
description: Update the content calendar board — tick posts as done, add or reassign planned items, and re-render the shareable PNG. Use when the user says a post, essay or task shipped, wants to plan or move content, or asks where the content plan stands.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Update the content calendar

The board is one HTML file — `calendar/src/content-calendar.html` — rendered to
`calendar/output/content-calendar.png`. It is a planning tool that doubles as a
shareable image, which is why it has to stay honest.

**The image must always match reality.** Every completed item gets ticked and the
PNG re-rendered in the same session. All the numbers — the progress bar, the
"X / N shipped" count, section totals, weekly counters — are computed at render
time from the `done` flags. **Never edit a number by hand, and never hand-edit
anything in `output/`.**

## Tick a shipped item (the common case)

1. Open `calendar/src/content-calendar.html` and find the item in the `DATA`
   block near the bottom — a JSON list grouped by week. Search a few words of the
   topic. If several items match, quote them and ask which one they mean.
2. Flip that item's `"done": false` → `"done": true` (and back, to un-tick).
   Touch nothing else.
3. Re-render and verify:
   ```bash
   cd calendar && ./render.sh
   ```
4. **`Read` the PNG** and confirm the item shows a filled check and a
   struck-through title, and that the counters moved by one.
5. Tell the user in plain language what was ticked and the new total. Offer —
   never assume — to upload.

## Add, move, or reassign

- **Add:** append an object to the right week's array in `DATA`, copying the
  shape of a sibling (title, owner initial, pillar/kind tag, format, flags,
  `"done": false`). Longer pieces go in the separate `essays` array with a target
  week and a one-line premise.
- **Move or reassign:** relocate the object, or change its owner field. Never
  renumber anything by hand.
- Re-render and `Read` the PNG afterwards. Always.

## Status questions

"Where are we?" needs no edit at all — read the `DATA` block, count, and answer.
Or just show them the current PNG.

## Traps

- Ticking never changes the board's height, so renders stay stable. But if the
  calendar **grows** past the render height because items were added, bump the
  `maxh` default in `calendar/render.sh` and re-render.
- `render.sh` must run from inside `calendar/`; it needs Chrome and ImageMagick.
- The user speaks plain language ("the pricing post went out"). You do the JSON
  surgery silently. Never ask them to edit a flag, and never mention JSON.
