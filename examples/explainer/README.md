# The explainer

An 80-second narrated explainer for the studio, **made with the studio**. Same
brand kit, same renderer, same procedural sound as any other video in this repo.
The only thing it adds is a voice track.

`rendered/swelv-studio-explainer.mp4` · 1920×1080 · 30fps · ~4 MB

```bash
./render.sh          # the whole chain, about five minutes
FAST=1 ./render.sh   # half frame rate, for checking a change
```

## The pattern worth stealing: time the picture to the voice

The hard part of a narrated video is sync, and the usual approach — animate
first, then try to talk over it — guarantees drift. This inverts it:

| Step | File | What it does |
| ---- | ---- | ------------ |
| 1 | `script.json` | The narration, as lines with a gap after each |
| 2 | `voice.py` | Renders each line, **measures what it actually took**, writes `vo/timing.json` |
| 3 | `build.py` | Bakes those measurements into `timings.js` |
| 4 | `timeline.js` | Every animation anchors to a line's real start time |
| 5 | `render.sh` | Frames, then the SFX, then the voice mixed over it |

So a scene never guesses when a sentence ends. Change a word, re-run, and all
twelve scenes re-anchor themselves. Swap the voice and the same thing happens.

## The voice

Microsoft's neural TTS via [`edge-tts`](https://github.com/rany2/edge-tts) — free,
no API key, and the only step in this whole repo that needs the network. Change
`voice` in `script.json` and re-run:

```bash
edge-tts --list-voices | grep en-      # what's available
FORCE=1 ./voice.py                     # re-render every line
```

A real recorded voice-over works exactly the same way: drop your WAVs in `vo/`
named after the line ids, skip step 1, and run `build.py` onward.

## The rules it still follows

Nothing here gets an exemption because it is the flagship:

- **Every frame is a pure function of `t`.** No clocks, no randomness, no CSS
  animation. Frame 1,400 is identical on every render.
- **It ends on the full brand, held.** Feeds freeze on the last frame.
- **It works muted.** Subtitles carry the whole script, because most feeds
  autoplay silent, and the sound cues are mixed low enough to sit under a voice.
- **Layout only in the local `<style>`.** Every colour comes from the brand kit,
  so this video rebrands with everything else.
