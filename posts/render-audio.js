// Procedural audio for videos — no external assets, no licensing, deterministic.
//
// Reads a cue spec (JSON sidecar next to the video HTML: <name>.audio.json) and
// synthesizes a WAV: soft sine "bells", warm "pads", and filtered-noise "whooshes"
// placed at exact moments. Cues position by `t` (0..1 along the motion timeline,
// converted to seconds here) or absolute `time` seconds. render-video.sh muxes the
// WAV into the MP4. Keep it subtle and financial — this is polish, and LinkedIn
// autoplays muted, so the video must still work silent.
//
//   node render-audio.js <cues.json> <out.wav> <totalDurSec> <motionDurSec>

const fs = require("fs");

const [cueFile, outWav, totalDurS, motionDurS] = process.argv.slice(2);
const totalDur = parseFloat(totalDurS);
const motionDur = parseFloat(motionDurS || totalDurS);
const spec = JSON.parse(fs.readFileSync(cueFile, "utf8"));
const sr = spec.sampleRate || 44100;
const N = Math.ceil(totalDur * sr);
const buf = new Float32Array(N);

// Seeded RNG so the noise (whoosh) is identical every render.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(spec.seed || 0x5f0e); // stable seed -> identical noise each render

const startSec = (c) => (c.time != null ? c.time : (c.t || 0) * motionDur);

// Soft bell: fundamental + gentle harmonics, fast attack, exponential decay.
function bell(start, freq, dur, gain, harmonics) {
  const s0 = Math.floor(start * sr), len = Math.floor(dur * sr);
  const atk = Math.max(1, Math.floor(0.006 * sr));
  for (let i = 0; i < len; i++) {
    const n = s0 + i; if (n < 0 || n >= N) continue;
    const tt = i / sr;
    const env = i < atk ? i / atk : Math.exp((-3.6 * (i - atk)) / (len - atk));
    let v = Math.sin(2 * Math.PI * freq * tt);
    if (harmonics) {
      v += 0.32 * Math.sin(2 * Math.PI * 2 * freq * tt);
      v += 0.12 * Math.sin(2 * Math.PI * 3 * freq * tt);
      v /= 1.44;
    }
    buf[n] += v * env * gain;
  }
}

// Warm pad: root + fifth, slow attack + release, steady sustain.
function pad(start, freq, dur, gain, attack, release) {
  const s0 = Math.floor(start * sr), len = Math.floor(dur * sr);
  const atk = Math.floor((attack || 1) * sr), rel = Math.floor((release || 1) * sr);
  for (let i = 0; i < len; i++) {
    const n = s0 + i; if (n < 0 || n >= N) continue;
    const tt = i / sr;
    const env = i < atk ? i / atk : i > len - rel ? (len - i) / rel : 1;
    const v = 0.6 * Math.sin(2 * Math.PI * freq * tt) + 0.4 * Math.sin(2 * Math.PI * freq * 1.5 * tt);
    buf[n] += v * env * gain;
  }
}

// Whoosh: lowpassed noise under a Hann window — a soft "shhoo".
function whoosh(start, dur, gain) {
  const s0 = Math.floor(start * sr), len = Math.floor(dur * sr);
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const n = s0 + i; if (n < 0 || n >= N) continue;
    const env = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / len);
    const white = rng() * 2 - 1;
    lp = lp * 0.86 + white * 0.14;
    buf[n] += lp * env * gain;
  }
}

// Sweep: a clean sine that glides f0 -> f1 (with optional +fifth), soft attack
// then a smooth fall-off. A tonal "send"/movement, not a noisy swoosh.
function sweep(start, f0, f1, dur, gain, fifth) {
  const s0 = Math.floor(start * sr), len = Math.floor(dur * sr);
  const atk = Math.floor(0.03 * sr);
  let ph = 0, ph5 = 0;
  for (let i = 0; i < len; i++) {
    const n = s0 + i; if (n < 0 || n >= N) continue;
    const p = i / len;
    const f = f0 + (f1 - f0) * p;
    ph += (2 * Math.PI * f) / sr;
    ph5 += (2 * Math.PI * f * 1.5) / sr;
    const env = (i < atk ? i / atk : 1) * (1 - p) * (1 - p); // ease-out tail
    let v = Math.sin(ph);
    if (fifth) v = v * 0.7 + Math.sin(ph5) * 0.3;
    buf[n] += v * env * gain;
  }
}

// Warm note: soft attack + warm decay + only a little 2nd-harmonic body (none of
// the bright upper partials that make a bell metallic). Reads as a soft, solid,
// confident tone — the timbre for the brand sign-off.
function note(start, freq, dur, gain) {
  const s0 = Math.floor(start * sr), len = Math.floor(dur * sr);
  const atk = Math.floor(0.014 * sr);
  for (let i = 0; i < len; i++) {
    const n = s0 + i; if (n < 0 || n >= N) continue;
    const tt = i / sr;
    const env = i < atk ? i / atk : Math.exp((-3.0 * (i - atk)) / (len - atk));
    const v = Math.sin(2 * Math.PI * freq * tt) * 0.82 + Math.sin(2 * Math.PI * 2 * freq * tt) * 0.18;
    buf[n] += v * env * gain;
  }
}

// Water drop: a sine whose pitch glides UP into a resonant bloom. Softer attack +
// gentler decay than a sharp "plink" (which reads cartoonish) — with reverb it's a
// deep droplet in a space. `decay` sets the tail (lower = longer). The "swell" half.
function drop(start, f0, f1, dur, gain, decay) {
  const s0 = Math.floor(start * sr), len = Math.floor(dur * sr);
  const atk = Math.max(1, Math.floor(0.01 * sr));
  const dk = decay != null ? decay : 4.0;
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const n = s0 + i; if (n < 0 || n >= N) continue;
    const p = i / len;
    const f = f0 + (f1 - f0) * (1 - (1 - p) * (1 - p)); // ease-out pitch rise
    ph += (2 * Math.PI * f) / sr;
    const env = i < atk ? i / atk : Math.exp((-dk * (i - atk)) / (len - atk));
    buf[n] += Math.sin(ph) * env * gain;
  }
}

// Clean chime: fundamental + OCTAVE partials only (2f, 4f) — pure and glassy, not
// the metallic 3f of a bell. Smooth ring. The "chime" half of the sign-off.
function chime(start, freq, dur, gain) {
  const s0 = Math.floor(start * sr), len = Math.floor(dur * sr);
  const atk = Math.max(1, Math.floor(0.005 * sr));
  for (let i = 0; i < len; i++) {
    const n = s0 + i; if (n < 0 || n >= N) continue;
    const tt = i / sr;
    const env = i < atk ? i / atk : Math.exp((-3.2 * (i - atk)) / (len - atk));
    const v = (Math.sin(2 * Math.PI * freq * tt)
      + 0.32 * Math.sin(2 * Math.PI * 2 * freq * tt)
      + 0.12 * Math.sin(2 * Math.PI * 4 * freq * tt)) / 1.44;
    buf[n] += v * env * gain;
  }
}

// Shimmer: a few soft high partials with a slow swell — adds "sheen" so a warm
// low resolve doesn't feel muffled.
function shimmer(start, freq, dur, gain) {
  const s0 = Math.floor(start * sr), len = Math.floor(dur * sr);
  const atk = Math.floor(0.25 * sr), rel = Math.floor(0.5 * sr);
  for (let i = 0; i < len; i++) {
    const n = s0 + i; if (n < 0 || n >= N) continue;
    const tt = i / sr;
    const env = (i < atk ? i / atk : i > len - rel ? (len - i) / rel : 1);
    const v = Math.sin(2 * Math.PI * freq * tt) * 0.6
      + Math.sin(2 * Math.PI * freq * 2 * tt) * 0.25
      + Math.sin(2 * Math.PI * freq * 3 * tt) * 0.15;
    buf[n] += v * env * gain;
  }
}

// Rich warm synth voice: several detuned oscillators + a soft octave, smooth
// attack/release. The "produced" fintech timbre (Visa/Mastercard/Revolut) — full
// and warm, not a thin sine or a metallic bell.
function synth(start, freq, dur, gain, attack, release) {
  const s0 = Math.floor(start * sr), len = Math.floor(dur * sr);
  const atk = Math.floor((attack != null ? attack : 0.02) * sr);
  const rel = Math.floor((release != null ? release : 0.5) * sr);
  const det = [0.994, 0.998, 1.0, 1.002, 1.006];
  const ph = [0, 0, 0, 0, 0];
  let ph2 = 0;
  for (let i = 0; i < len; i++) {
    const n = s0 + i; if (n < 0 || n >= N) continue;
    const env = i < atk ? i / atk : i > len - rel ? (len - i) / rel : 1;
    let v = 0;
    for (let d = 0; d < det.length; d++) { ph[d] += (2 * Math.PI * freq * det[d]) / sr; v += Math.sin(ph[d]); }
    v /= det.length;
    ph2 += (2 * Math.PI * freq * 2) / sr;
    v += 0.22 * Math.sin(ph2);
    buf[n] += v * env * gain;
  }
}

// Schroeder reverb (4 combs + 2 allpass) — a smooth diffuse tail for polish and
// space. This is what makes a sign-off sound produced, not like a raw beep.
function reverb(mix, fb) {
  const wet = new Float32Array(N);
  for (const d of [1116, 1188, 1277, 1356]) {
    const line = new Float32Array(d); let idx = 0;
    for (let i = 0; i < N; i++) { const out = line[idx]; line[idx] = buf[i] + out * fb; wet[i] += out; if (++idx >= d) idx = 0; }
  }
  for (let i = 0; i < N; i++) wet[i] *= 0.25;
  for (const d of [556, 441]) {
    const line = new Float32Array(d); let idx = 0;
    for (let i = 0; i < N; i++) { const bo = line[idx]; const inp = wet[i]; line[idx] = inp + bo * 0.7; wet[i] = -inp * 0.7 + bo; if (++idx >= d) idx = 0; }
  }
  for (let i = 0; i < N; i++) buf[i] = buf[i] * (1 - mix) + wet[i] * mix;
}

// Water splash/drop: a broadband IMPACT transient (the surface break) + a low
// resonant bloop with a little wet noise. This is what actually reads as water —
// a clean sine alone sounds cartoonish. With reverb it's a heavy drop echoing in
// a room. `f0`/`f1` = the bloop's rising pitch (lower = heavier).
function splash(start, f0, f1, dur, gain) {
  const s0 = Math.floor(start * sr), len = Math.floor(dur * sr);
  // impact: short filtered-noise burst (the "plip"/break)
  const imp = Math.floor(0.03 * sr);
  let lpn = 0;
  for (let i = 0; i < imp; i++) {
    const n = s0 + i; if (n < 0 || n >= N) continue;
    const env = Math.exp((-4.2 * i) / imp);
    lpn = lpn * 0.5 + (rng() * 2 - 1) * 0.5;
    buf[n] += lpn * env * gain * 0.85;
  }
  // resonant bloop: rising sine + a little wet noise for texture
  const atk = Math.max(1, Math.floor(0.004 * sr));
  let ph = 0, lpw = 0;
  for (let i = 0; i < len; i++) {
    const n = s0 + i; if (n < 0 || n >= N) continue;
    const p = i / len;
    const f = f0 + (f1 - f0) * (1 - Math.pow(1 - p, 1.7));
    ph += (2 * Math.PI * f) / sr;
    const env = i < atk ? i / atk : Math.exp((-3.4 * (i - atk)) / (len - atk));
    lpw = lpw * 0.9 + (rng() * 2 - 1) * 0.1;
    buf[n] += (Math.sin(ph) * 0.85 + lpw * 0.15) * env * gain;
  }
}

for (const c of spec.cues || []) {
  const st = startSec(c);
  if (c.type === "bell") bell(st, c.freq, c.dur || 0.5, c.gain || 0.2, true);
  else if (c.type === "tone") bell(st, c.freq, c.dur || 0.4, c.gain || 0.2, false);
  else if (c.type === "chord") (c.freqs || []).forEach((f) => bell(st, f, c.dur || 2, c.gain || 0.14, true));
  else if (c.type === "pad") pad(st, c.freq, c.dur || 2, c.gain || 0.1, c.attack, c.release);
  else if (c.type === "whoosh") whoosh(st, c.dur || 0.5, c.gain || 0.15);
  else if (c.type === "sweep") sweep(st, c.f0, c.f1, c.dur || 0.6, c.gain || 0.12, c.fifth);
  else if (c.type === "shimmer") shimmer(st, c.freq, c.dur || 2, c.gain || 0.06);
  else if (c.type === "note") note(st, c.freq, c.dur || 0.6, c.gain || 0.13);
  else if (c.type === "drop") {
    const f0 = c.f0 || 700, f1 = c.f1 || 1300, dr = c.dur || 0.1;
    drop(st, f0, f1, dr, c.gain || 0.12, c.decay);
    // optional echo (usually not needed now that we have reverb)
    let g = c.gain || 0.12, et = st;
    for (let e = 0; e < (c.echoes || 0); e++) {
      g *= c.echoDecay || 0.5;
      et += c.echoDelay || 0.14;
      drop(et, f0, f1, dr, g, c.decay);
    }
  }
  else if (c.type === "chime") chime(st, c.freq, c.dur || 1.2, c.gain || 0.13);
  else if (c.type === "synth") synth(st, c.freq, c.dur || 1.5, c.gain || 0.11, c.attack, c.release);
  else if (c.type === "splash") splash(st, c.f0 || 220, c.f1 || 420, c.dur || 0.32, c.gain || 0.14);
}

// Reverb (subtle) for polish/space — applied after cues, before warmth + master.
if (spec.reverb) reverb(spec.reverb, spec.reverbDecay || 0.82);

// Global warmth: a gentle one-pole lowpass takes the harsh, bright, game-y edge
// off and leaves a warmer, more financial tone. Tune with spec.lowpass (Hz).
{
  const fc = spec.lowpass || 3000;
  const a = 1 - Math.exp((-2 * Math.PI * fc) / sr);
  let y = 0;
  for (let i = 0; i < N; i++) { y += a * (buf[i] - y); buf[i] = y; }
}

// Master: tiny fade-in, fade the tail so it doesn't clip off, soft-normalize.
const fin = Math.floor(0.03 * sr), fout = Math.floor(0.4 * sr);
for (let i = 0; i < fin; i++) buf[i] *= i / fin;
for (let i = 0; i < fout; i++) buf[N - 1 - i] *= i / fout;
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(buf[i]));
const norm = peak > 0.9 ? 0.9 / peak : 1;

// 16-bit PCM mono WAV.
const out = Buffer.alloc(44 + N * 2);
let o = 0;
out.write("RIFF", o); o += 4; out.writeUInt32LE(36 + N * 2, o); o += 4; out.write("WAVE", o); o += 4;
out.write("fmt ", o); o += 4; out.writeUInt32LE(16, o); o += 4; out.writeUInt16LE(1, o); o += 2;
out.writeUInt16LE(1, o); o += 2; out.writeUInt32LE(sr, o); o += 4; out.writeUInt32LE(sr * 2, o); o += 4;
out.writeUInt16LE(2, o); o += 2; out.writeUInt16LE(16, o); o += 2;
out.write("data", o); o += 4; out.writeUInt32LE(N * 2, o); o += 4;
for (let i = 0; i < N; i++) {
  const s = Math.max(-1, Math.min(1, buf[i] * norm));
  out.writeInt16LE(Math.round(s * 32767), o); o += 2;
}
fs.writeFileSync(outWav, out);
