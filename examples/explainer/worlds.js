/* ----------------------------------------------------------------------------
   THE WORLDS · the grounds the explainer stands on

   The explainer borrows the logo film's idea: one piece, four materials. Each
   act of the script is set in a different way images have been made — ink on
   paper, a CRT, a duplicator, a painted cel — and the joins between them are
   the film's own physical transitions, not cross-fades.

   Every ground is BUILT ONCE here and never touched again. What moves is a
   handful of numbers the timeline tweens (a sun's height, how many rows of
   halftone have printed, how far the mountain has risen) and post() turns
   those numbers into attributes each frame. Nothing here reads a clock.

   Colours are literal on purpose: the content furniture takes its tokens from
   the brand kit (re-skinned per world in explainer.html), but the scenery is
   scenery — it is not meant to rebrand.
---------------------------------------------------------------------------- */

const WNS = "http://www.w3.org/2000/svg";
function wEl(tag, attrs) {
  const n = document.createElementNS(WNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}

/* ── NEON · the attract screen ──────────────────────────────────────────────
   A striped sun and a floor of perspective lines. The vertical lines are static
   markup; the horizontals are made here so post() can scroll them at you. */
function buildNeon(sunEl, floorG, W) {
  let y = 540 * 0.42;
  for (let i = 0; i < 14; i++) {
    const h = (3 + i * 1.7) * (540 / 470);
    const e = document.createElement("i");
    e.style.top = y + "px"; e.style.height = h + "px";
    sunEl.appendChild(e);
    y += h + Math.max(5, 20 - i * 1.15) * (540 / 470);
  }
  const NHZ = 11;
  const lines = Array.from({ length: NHZ }, () => {
    const l = wEl("line", { x1: 0, x2: W, stroke: "#ff6a12", "stroke-width": 2 });
    floorG.appendChild(l); return l;
  });
  return { lines, NHZ };
}

/* ── PRESS · the halftone ───────────────────────────────────────────────────
   Real dots, one circle each, so the band can PRINT in row by row and the dots
   can swell in a wave as the drum turns. A tiled background can only scroll,
   and scrolling is not a press running. */
function buildDots(host, W, height) {
  const DOT = { cols: Math.ceil(W / 10), rows: Math.floor(height / 10), pitch: 10, els: [] };
  const svg = wEl("svg", { viewBox: `0 0 ${W} ${height}` });
  for (let r = 0; r < DOT.rows; r++) for (let c = 0; c < DOT.cols; c++) {
    const e = wEl("circle", { cx: c * DOT.pitch + 5, cy: r * DOT.pitch + 5, fill: "#2b3a8f", r: 0 });
    svg.appendChild(e); DOT.els.push(e);
  }
  host.appendChild(svg);
  return DOT;
}

/* ── CEL · Mount Yōtei ──────────────────────────────────────────────────────
   Flat colour, hard edges, nothing glows. A volcano's profile is concave —
   steep at the summit, easing to the plain — and that exponent is the whole
   difference between a mountain and a triangle, so the snow and the shadow are
   built from the SAME slope function rather than derived separately. */
const SLOPE = 1.32, NS_ = 14;
const JIT_L = [0, .004, -.006, .003, -.004, .002, -.003, .001, -.002, .001, 0, 0, 0, 0, 0];
const JIT_R = [0, -.005, .004, -.003, .005, -.002, .003, -.001, .002, -.001, 0, 0, 0, 0, 0];

function slopePt(cx, baseY, w, h, u, side) {
  const hw = w / 2, rim = w * 0.035;
  const jit = (side < 0 ? JIT_L : JIT_R)[Math.min(NS_, Math.round(u * NS_))] || 0;
  return [cx + side * (hw * (1 - u) + rim / 2 * u) + w * jit, baseY - h * Math.pow(u, SLOPE)];
}
function walk(cx, baseY, w, h, from, to, side, steps) {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const pt = slopePt(cx, baseY, w, h, from + (to - from) * (i / steps), side);
    d += ` L ${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`;
  }
  return d;
}
function cone(cx, baseY, w, h) {
  const hw = w / 2;
  return `M ${(cx - hw).toFixed(1)} ${baseY.toFixed(1)}` +
         walk(cx, baseY, w, h, 0, 1, -1, NS_) + walk(cx, baseY, w, h, 1, 0, 1, NS_) +
         ` L ${(cx + hw).toFixed(1)} ${baseY.toFixed(1)} Z`;
}
function snowCap(cx, baseY, w, h, line) {
  const uS = Math.pow(line, 1 / SLOPE);
  const a = slopePt(cx, baseY, w, h, uS, -1);
  let d = `M ${a[0].toFixed(1)} ${a[1].toFixed(1)}` +
          walk(cx, baseY, w, h, uS, 1, -1, 6) + walk(cx, baseY, w, h, 1, uS, 1, 6);
  const F = [.00, .30, .12, .52, .20, .66, .16, .40, .08, .34, .00];
  const xR = slopePt(cx, baseY, w, h, uS, 1)[0], xL = slopePt(cx, baseY, w, h, uS, -1)[0];
  for (let i = 0; i < F.length; i++) {
    const f = i / (F.length - 1);
    const u = uS - (1 - uS) * F[i] * 0.42;
    d += ` L ${(xR + (xL - xR) * f).toFixed(1)} ${(baseY - h * Math.pow(u, SLOPE)).toFixed(1)}`;
  }
  return d + " Z";
}
function shadowWedge(cx, baseY, w, h) {
  const hw = w / 2, top = slopePt(cx, baseY, w, h, 1, 1);
  return `M ${top[0].toFixed(1)} ${top[1].toFixed(1)}` + walk(cx, baseY, w, h, 1, 0, 1, NS_) +
         ` L ${(cx + hw).toFixed(1)} ${baseY.toFixed(1)} L ${(cx + hw * 0.12).toFixed(1)} ${baseY.toFixed(1)} Z`;
}
function ridge(w, y, amp, phase, drop) {
  let d = `M 0 ${(y + drop).toFixed(1)}`;
  for (let i = 0; i <= 24; i++) {
    const yy = y - amp * (0.55 * Math.sin(i * 0.52 + phase) + 0.32 * Math.sin(i * 1.13 - phase * 1.7) +
                          0.13 * Math.sin(i * 2.31 + phase * 0.6));
    d += ` L ${(w * i / 24).toFixed(1)} ${yy.toFixed(1)}`;
  }
  return d + ` L ${w} ${(y + drop).toFixed(1)} Z`;
}
function celStreak(cx, cy, w, h) {
  const r = h / 2, x0 = cx - w / 2 + r, x1 = cx + w / 2 - r;
  return `M ${x0} ${cy - r} L ${x1} ${cy - r} A ${r} ${r} 0 0 1 ${x1} ${cy + r}` +
         ` L ${x0} ${cy + r} A ${r} ${r} 0 0 1 ${x0} ${cy - r} Z`;
}
function celCloud(cx, cy, w, h) {
  return celStreak(cx, cy, w, h) + celStreak(cx - w*0.22, cy - h*0.46, w*0.46, h*0.72) +
         celStreak(cx + w*0.28, cy - h*0.20, w*0.38, h*0.80) + celStreak(cx + w*0.06, cy + h*0.34, w*0.66, h*0.56);
}

function buildYotei(host, W, H) {
  /* Six flat bands, each its own element rather than one banded gradient, so
     the timeline can slide them in one after another — a painted sky arriving
     the way a painter lays it: one flat at a time, top to bottom. */
  const BANDS = [["#16243c", 0, 30], ["#2b2b4e", 30, 22], ["#6b3a52", 52, 18],
                 ["#b8532c", 70, 14], ["#dd8b41", 84, 9], ["#efb469", 93, 7]];
  host._bands = BANDS.map(function (b) {
    const d = document.createElement("div");
    d.style.cssText = `position:absolute;left:0;right:0;top:${b[1]}%;height:${b[2] + 0.2}%;background:${b[0]}`;
    host.appendChild(d); return d;
  });

  const hy = H * 0.87, mh = H * 0.25, mw = mh * 3.05, cx = W * 0.5, base = hy + H * 0.035;

  /* the disc: one flat circle, hard edge, no rays and no falloff */
  const r = H * 0.20;
  const sun = document.createElement("div");
  sun.style.cssText = `position:absolute;border-radius:50%;background:#f3c67e;` +
    `width:${r*2}px;height:${r*2}px;left:${W*0.795 - r}px;top:${hy - r*0.92}px`;
  host.appendChild(sun);
  host._sun = sun;

  const svg = wEl("svg", { viewBox: `0 0 ${W} ${H}`, style: "position:absolute;inset:0;width:100%;height:100%" });
  [[W*0.13, hy*0.24, W*0.32, 30, "#3b3a60"], [W*0.86, hy*0.16, W*0.26, 24, "#3b3a60"],
   [W*0.20, hy*0.60, W*0.28, 26, "#8a4a53"], [W*0.89, hy*0.52, W*0.26, 28, "#8a4a53"],
   [W*0.26, hy*0.84, W*0.30, 22, "#c9703c"]].forEach(function (b) {
    svg.appendChild(wEl("path", { d: celCloud(b[0], b[1], b[2], b[3] * 1.9), fill: b[4] }));
  });
  svg.appendChild(wEl("path", { d: ridge(W, hy - H*0.045, H*0.030, 1.4, H), fill: "#6b4358" }));

  /* the cone lives in its own group so it can RISE from behind the land */
  const mtn = wEl("g", {});
  mtn.appendChild(wEl("path", { d: cone(cx, base, mw, mh), fill: "#2c2140" }));
  mtn.appendChild(wEl("path", { d: snowCap(cx, base, mw, mh, 0.56), fill: "#efd9bd" }));
  mtn.appendChild(wEl("path", { d: shadowWedge(cx, base, mw, mh), fill: "#2b1a4e", opacity: 0.62 }));
  svg.appendChild(mtn);

  svg.appendChild(wEl("path", { d: ridge(W, hy + H*0.045, H*0.022, 3.1, H), fill: "#241a2e" }));
  svg.appendChild(wEl("path", { d: ridge(W, hy + H*0.135, H*0.030, 0.7, H), fill: "#080a12" }));
  host.appendChild(svg);
  host._svg = svg;
  const RISE = H * 0.29;

  /* the flock, drawn fresh each frame: the one thing in this world genuinely
     moving through space */
  const flock = wEl("svg", { viewBox: `0 0 ${W} ${H}`, style: "position:absolute;inset:0;width:100%;height:100%" });
  host.appendChild(flock);
  const FLOCK = [[0.00, 0.00, 1.00], [0.07, 0.045, 0.82], [0.13, -0.03, 0.90],
                 [0.19, 0.075, 0.74], [0.24, 0.015, 0.86], [0.31, -0.05, 0.70]];

  return function update(u, t, rise) {
    mtn.setAttribute("transform", `translate(0 ${((1 - rise) * RISE).toFixed(1)})`);
    if (u <= 0 || u >= 1) { flock.replaceChildren(); return; }
    const g = wEl("g", { fill: "none", stroke: "#080a12", "stroke-width": 4.6, "stroke-linecap": "round",
                         opacity: (Math.min(1, u / 0.10) * Math.min(1, (1 - u) / 0.16)).toFixed(3) });
    FLOCK.forEach(function (b, i) {
      const p = Math.max(0, Math.min(1, u - b[0] * 0.5));
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const x = W + 200 - e * (W + 440) - b[0] * 260;
      const y = H * 0.20 + b[1] * H * 1.15 + Math.sin(t * 2.1 + i) * 8;
      const lift = 0.55 + 0.75 * (0.5 + 0.5 * Math.sin(t * 9.5 + i * 1.7));
      const sc = 2.3 * b[2];
      g.appendChild(wEl("path", { d:
        `M ${x - 7*sc} ${y} Q ${x - 3*sc} ${y - 4*sc*lift} ${x} ${y - 1.4*sc}` +
        ` Q ${x + 3*sc} ${y - 4*sc*lift} ${x + 7*sc} ${y}` }));
    });
    flock.replaceChildren(g);
  };
}
