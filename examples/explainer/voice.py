#!/usr/bin/env python3
"""Render the narration and measure it.

The animation is timed to the voice, never the other way round: this writes
vo/<id>.wav for every line, measures what the voice actually took, and emits
vo/timing.json with a start and duration per line. build.py then injects those
numbers into the HTML, so changing a word or swapping the voice is a re-run
rather than a re-time.

    ./voice.py          # renders every line + the full mixed track

Needs edge-tts (pip install edge-tts) and ffmpeg. Network required: the voices
are Microsoft's neural TTS. Nothing else in this studio needs the network.
"""
import json, os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
VO = os.path.join(HERE, "vo")
os.makedirs(VO, exist_ok=True)
spec = json.load(open(os.path.join(HERE, "script.json")))


def dur(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", path], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


# edge-tts on PATH, or through uv if that is how it was installed
TTS = ["edge-tts"] if shutil.which("edge-tts") else ["uvx", "edge-tts"]

timing, t = {}, spec.get("lead", 0.5)
for ln in spec["lines"]:
    mp3 = os.path.join(VO, ln["id"] + ".mp3")
    wav = os.path.join(VO, ln["id"] + ".wav")
    if not os.path.exists(wav) or os.environ.get("FORCE"):
        subprocess.run([*TTS, "--voice", spec["voice"], "--rate", spec["rate"],
                        "--text", ln["text"], "--write-media", mp3],
                       check=True, capture_output=True)
        subprocess.run(["ffmpeg", "-y", "-i", mp3, "-ar", "48000", "-ac", "1", wav],
                       check=True, capture_output=True)
        os.remove(mp3)
    d = dur(wav)
    timing[ln["id"]] = {"start": round(t, 3), "dur": round(d, 3),
                        "end": round(t + d, 3), "text": ln["text"]}
    t += d + ln.get("gap", 0.3)
    print(f'  {ln["id"]:<9} {d:5.2f}s   ends {t:6.2f}s')

total = round(t, 3)
json.dump({"voice": spec["voice"], "total": total, "lines": timing},
          open(os.path.join(VO, "timing.json"), "w"), indent=2)

# One continuous narration track: each line dropped at its measured start.
inputs, filters, mixes = [], [], []
for i, ln in enumerate(spec["lines"]):
    inputs += ["-i", os.path.join(VO, ln["id"] + ".wav")]
    delay = int(timing[ln["id"]]["start"] * 1000)
    filters.append(f"[{i}:a]adelay={delay}|{delay},apad[a{i}]")
    mixes.append(f"[a{i}]")
fc = ";".join(filters) + ";" + "".join(mixes) + \
     f"amix=inputs={len(mixes)}:normalize=0,atrim=0:{total + 0.4},volume=1.6[out]"
subprocess.run(["ffmpeg", "-y", *inputs, "-filter_complex", fc, "-map", "[out]",
                "-ar", "48000", "-ac", "1", os.path.join(VO, "narration.wav")],
               check=True, capture_output=True)

print(f"\nnarration: {total:.2f}s of voice  ->  vo/narration.wav")
print(f"timings written to vo/timing.json")
