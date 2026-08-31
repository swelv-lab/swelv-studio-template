#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Layer real audio SAMPLES (e.g. a recorded water splash) onto the synthesized
// sign-off track. This is how a real recording gets edited and placed: each
// `sample` cue in a <name>.audio.json points at a file in posts/assets/audio/
// and can be trimmed, leveled, pitch-shifted, given room (reverb), faded, and
// dropped at an exact moment on the timeline. Everything is done with ffmpeg,
// so any wav/mp3/aac/flac the team hands us can be shaped to fit the brand.
//
//   node mix-samples.js <audio.json> <synth.wav> <samplesDir> <out.wav> <motionDur>
//
// If the cue file has no `sample` cues, this just copies synth.wav -> out.wav.
//
// Sample cue shape (all fields but `type`+`file` optional):
//   { "type": "sample", "file": "water-drop.wav",
//     "t": 0.80,           // 0..1 position on the motion timeline (or "time" in sec)
//     "gain": 1.0,         // volume multiplier
//     "trimStart": 0.0,    // seconds into the file to start from
//     "trimDur": 0.6,      // seconds of the file to keep
//     "semitones": 0,      // pitch shift (+/-); also nudges length slightly
//     "reverb": 0.0,       // 0..1 room tail (a drop "echoing in a room")
//     "fadeOut": 0.0 }     // seconds of fade at the tail
// ---------------------------------------------------------------------------
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const [, , audioJsonPath, synthWav, samplesDir, outWav, motionDurArg] = process.argv;
if (!audioJsonPath || !synthWav || !samplesDir || !outWav) {
  console.error("usage: node mix-samples.js <audio.json> <synth.wav> <samplesDir> <out.wav> <motionDur>");
  process.exit(1);
}
const motionDur = parseFloat(motionDurArg || "9");

const spec = JSON.parse(fs.readFileSync(audioJsonPath, "utf8"));
const SR = spec.sampleRate || 44100;
const samples = (spec.cues || []).filter((c) => c.type === "sample");

// No samples -> the synth track is the whole thing. Copy it straight through.
if (samples.length === 0) {
  fs.copyFileSync(synthWav, outWav);
  process.exit(0);
}

const startSec = (c) => (typeof c.time === "number" ? c.time : (c.t || 0) * motionDur);

// Resolve + validate every sample file up front so we fail with a clear message.
const files = samples.map((c) => {
  const p = path.isAbsolute(c.file) ? c.file : path.join(samplesDir, c.file);
  if (!fs.existsSync(p)) {
    console.error(`sample not found: ${c.file}  (looked in ${samplesDir})`);
    process.exit(1);
  }
  return p;
});

// Build the ffmpeg command: input 0 is the synth track, inputs 1..n are samples.
const inputs = ["-i", synthWav];
files.forEach((f) => inputs.push("-i", f));

const chains = [];
const mixLabels = ["[0:a]"]; // start the mix with the synth track
samples.forEach((c, i) => {
  const idx = i + 1;
  const parts = [`aformat=sample_rates=${SR}:channel_layouts=mono`];

  if (c.trimStart != null || c.trimDur != null) {
    const s = c.trimStart || 0;
    const seg = c.trimDur != null ? `:duration=${c.trimDur}` : "";
    parts.push(`atrim=start=${s}${seg}`, "asetpts=PTS-STARTPTS");
  }
  if (c.semitones) {
    const r = Math.round(SR * Math.pow(2, c.semitones / 12));
    parts.push(`asetrate=${r}`, `aresample=${SR}`);
  }
  parts.push(`volume=${c.gain != null ? c.gain : 1.0}`);
  if (c.reverb) {
    // A short, dense room tail scaled by the reverb amount (0..1): a drop that
    // echoes in a space, not discrete slap-back echoes.
    const wet = Math.min(0.95, 0.45 + 0.4 * c.reverb);
    parts.push(`aecho=0.85:${wet.toFixed(3)}:37|59|83|113:0.5|0.36|0.26|0.18`);
  }
  if (c.fadeOut) {
    parts.push(`afade=t=out:st=0:d=${c.fadeOut}:curve=exp`);
  }
  const delayMs = Math.max(0, Math.round(startSec(c) * 1000));
  parts.push(`adelay=${delayMs}`);

  const label = `[s${idx}]`;
  chains.push(`[${idx}:a]${parts.join(",")}${label}`);
  mixLabels.push(label);
});

// Sum without amix's auto-attenuation, then a limiter so layered peaks can't clip.
const filter =
  chains.join(";") +
  ";" +
  `${mixLabels.join("")}amix=inputs=${mixLabels.length}:normalize=0:duration=first[mixed];` +
  `[mixed]alimiter=limit=0.95:level=disabled[out]`;

execFileSync(
  "ffmpeg",
  ["-y", ...inputs, "-filter_complex", filter, "-map", "[out]", "-c:a", "pcm_s16le", outWav],
  { stdio: ["ignore", "ignore", "inherit"] }
);
