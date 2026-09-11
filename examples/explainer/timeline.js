/* ===========================================================================
   THE EXPLAINER · one paused GSAP timeline, anchored to the voice

   Read this file as the worked example of how video is sequenced in this
   studio. There are four ideas in it, and they are worth more than any of the
   individual moves:

   1 · EVERY FRAME IS A PURE FUNCTION OF t. The renderer screenshots
       renderFrame(0..1) across DUR seconds. No Date.now(), no rAF, no CSS
       transitions, no randomness — any of those makes a frame that will not
       reproduce. GSAP is allowed under that rule because the timeline is
       PAUSED: tl.seek(t) is a lookup, not a playback.

   2 · THE ANCHORS COME FROM THE VOICE. timings.js is generated from the
       measured narration, so L.print.start is the real second she starts the
       line with id "print". Every tween is positioned at `L.<line>.start +
       offset` and the timeline reads like the script: "the file appears 0.55s
       after she says 'one file'". Change a word, re-run voice.py and build.py,
       and every move — and every sound cue, see sound.json — re-anchors.

   3 · A SCENE IS build() + cues(). build() makes DOM once and hands back refs;
       cues() adds that scene's tweens to the ONE timeline. There is no
       per-scene draw loop; GSAP owns the interpolation. The few things that
       are genuinely a function of t rather than a tween — a blinking caret,
       the filmstrip's playhead, subtitles, the progress bar, the scrolling
       floor — live in post(), which runs after every seek.

   4 · THE JOINS ARE PHYSICAL, AND EACH WORLD HAS AN ENTRANCE. Content in the
       hand act is WRITTEN (a clip wipe); in neon it SWITCHES ON (a CRT
       expanding from a line); in press it is PRINTED (a blue plate lands, then
       the orange); in cel it is CUT (a hard cut with a one-frame flash); in
       brand it RISES. The five helpers are ten lines each, and the acts read
       as different materials because the same card arrives differently.

   Two traps, both learned by hitting them:
     · never write style.transform on an element GSAP is transforming — it
       stamps over GSAP's value every frame. Route it through gsap.set.
     · tl.seek(t, true) suppresses callbacks, so an onUpdate never fires under
       seek. Anything derived from a tweened value is applied in post().
   ========================================================================= */

const L = T.lines;
const TAIL = 0.9;                        // bare navy after the last word; the ender opens on it
const DUR = T.total + TAIL;
const FPS = 30, F = 1 / FPS;
const W = 1920, H = 1080;
const TOTAL_FRAMES = Math.round(DUR * FPS);

/* the four joins, named once. Everything below positions itself off these. */
const T1  = L.turn.start + 0.10;         // hand → neon: the page turns over
const T2  = L.print.start - 0.45;        // neon → press: the screen switches off
const T3  = L.video1.start - 0.10;       // press → cel: the sheet is pulled
const HIT = L.video1.end - 0.12;         // the cut that opens the cel act
const T4  = L.video4.end + 0.03;         // cel → brand: the last cut

/* -- helpers ---------------------------------------------------------------- */
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t, a, b) => cl((t - a) / (b - a || 1e-6));
const eio = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eoq = x => 1 - Math.pow(1 - x, 4);
const lerp = (a, b, p) => a + (b - a) * p;
const La = (a, b, p) => a.map((v, i) => lerp(v, b[i], p));
const rgb = s => s.match(/[\d.]+/g).slice(0, 3).map(Number);
const Lc = (a, b, p) => `rgb(${Math.round(lerp(a[0], b[0], p))},${Math.round(lerp(a[1], b[1], p))},${Math.round(lerp(a[2], b[2], p))})`;
const $ = id => document.getElementById(id);
const E = (tag, cls, css, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (css) Object.assign(e.style, css);
  if (html != null) e.innerHTML = html;
  return e;
};
const SVG = (tag, attrs) => {
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
};

const stage = $("stage"), scenesEl = $("scenes"), hdrEl = $("hdr"), subEl = $("sub"), chapEl = $("chapter"), progEl = $("prog");
const progBar = progEl.querySelector("i");

/* ===========================================================================
   THE ONE TIMELINE. lazy:false makes GSAP record a tween's start values the
   first time it renders rather than a tick later — under seek there is no
   later tick.
   ========================================================================= */
const tl = gsap.timeline({ paused: true, defaults: { overwrite: false, lazy: false } });
/* numbers post() reads — tweened here, applied there */
const S = { type: 0, type2: 0, msg: 0, ph: 0, wp: 0, done: 0, chapter: "", live: 1, phT: 0, slides: 0, deckN: 0 };
const world = (name, at) => tl.set(stage, { attr: { "data-world": name } }, at);

/* ===========================================================================
   THE GROUND — the film's state machine. One object GSAP tweens; apply()
   writes it to the DOM. Colours are CSS strings, which GSAP interpolates.
   ========================================================================= */
const V = {
  handC: [27,22, 37,44,   50,69,   61,86, 71,68,   82,44,   93,23],
  geoC:  [30,24, 40,43.33,50,62.67,60,82, 70,62.67,80,43.33,90,24],
  handS: [47,19, 51,28,   56,38,   60,46, 64,38,   69,28,   73,20],
  geoS:  [45,22, 50,31,   55,40,   60,49, 65,40,   70,31,   75,22],
};
const dOf = a => `M ${a[0]} ${a[1]} C ${a[2]} ${a[3]}, ${a[4]} ${a[5]}, ${a[6]} ${a[7]} C ${a[8]} ${a[9]}, ${a[10]} ${a[11]}, ${a[12]} ${a[13]}`;

const cur = {
  bg: "rgb(244,239,228)", ink: "rgb(27,36,48)", vink: "rgb(226,80,10)",
  lw: 7.5, vw: 12.5, sw: 7.5, swo: 0.5, grain: 0.22, sky: 0, grid: 0, scan: 0, bloom: 0,
  wordop: 0, handop: 1, vop: 0, wob: 2.2, sunY: 0, chrome: 0, vm: 0,
  mtn: 0, dots: 0, dotsIn: 0, plate: 0, face: "hand", lockY: 0, blueY: 0,
};
const FACE = {
  hand:  ['"Audiowide"', 400, 72],
  neon:  ['"Audiowide"', 400, 60],
  press: ['"Satoshi"', 900, 74],
  cel:   ['"Noto Serif JP","Noto Serif CJK JP",serif', 900, 76],
};
const NEON_C  = { bg: "rgb(7,10,28)",     ink: "rgb(255,214,138)", vink: "rgb(255,180,80)", lw: 12, vw: 13,   sw: 9,  swo: 0.75, grain: 0 };
const PRESS_C = { bg: "rgb(242,236,224)", ink: "rgb(232,72,10)",   vink: "rgb(232,72,10)",  lw: 12, vw: 12.5, sw: 10, swo: 0.55, grain: 0.30 };
const CEL_C   = { bg: "rgb(22,36,60)",    ink: "rgb(246,234,214)", vink: "rgb(242,102,42)", swo: 0.85, grain: 0 };
const NAVY    = "rgb(10,14,39)";

const sun = $("sun"), floor = $("floor"), sky = $("sky"), hz = $("hz"), scan = $("scan"), bloom = $("bloom");
const lockEl = $("lockup"), brandlock = $("brandlock"), qual = $("qual"), crt = $("crt"), flash = $("flash");
const wobMap = $("wobMap"), vcrest = $("vcrest"), vswell = $("vswell"), hcrest = $("hcrest"), hswell = $("hswell"), hunder = $("hunder"), word = $("word");
const wmPaths = [...$("wm").querySelectorAll("path")];
const CH = [$("c0"), $("c1"), $("c2"), $("c3"), $("c4")];
const CH_ON = [[255,246,226], [180,97,28], [255,255,255], [255,180,87], [168,58,8]];
const neon = buildNeon(sun, $("hzg"), W);
const DOT = buildDots($("dots"), W, 220);
const yoteiHost = $("yotei");
const yoteiUpdate = buildYotei(yoteiHost, W, H);
const bands = yoteiHost._bands, celSun = yoteiHost._sun, celSvg = yoteiHost._svg;
const celFlash = $("celFlash"), ring = $("celRing");

function apply(s) {
  const st = stage.style;
  st.setProperty("--gbg", s.bg); st.setProperty("--ink", s.ink); st.setProperty("--vink", s.vink);
  ["lw","vw","sw","swo","grain","sky","grid","scan","bloom","wordop","handop","mtn","dots"].forEach(k => st.setProperty("--" + k, s[k]));
  wobMap.setAttribute("scale", s.wob.toFixed(2));
  vcrest.setAttribute("d", dOf(La(V.handC, V.geoC, s.vm)));
  vswell.setAttribute("d", dOf(La(V.handS, V.geoS, s.vm)));
  $("vmk").style.opacity = s.vop;
  hcrest.setAttribute("d", dOf(V.handC)); hswell.setAttribute("d", dOf(V.handS));
  /* through GSAP, not style.transform: the CRT-off scales these same elements */
  gsap.set(sun, { y: (1 - s.sunY) * 560 }); gsap.set(floor, { y: (1 - s.sunY) * 429 });
  const ink = rgb(s.ink);
  CH.forEach((el, i) => el.setAttribute("stop-color", Lc(ink, CH_ON[i], s.chrome)));
  const f = FACE[s.face];
  st.setProperty("--face", f[0]); st.setProperty("--fw", f[1]); st.setProperty("--fs", f[2] + "px");
  word.style.fill = s.chrome > 0.02 ? "url(#chrome)" : s.ink;
  /* the blue plate is the lockup's own hard offset copy; the offset the filter
     needs is the difference between the two plates' positions */
  const pdy = s.blueY - s.lockY + 6;
  const plate = s.plate > 0.01 ? `drop-shadow(-7px ${pdy.toFixed(1)}px 0 rgba(43,58,143,${(0.92 * s.plate).toFixed(3)})) ` : "";
  const g = s.bloom;
  const depth = g > 0.02 ? `drop-shadow(0 0 ${3*g}px rgba(6,4,18,.98)) drop-shadow(0 0 ${14*g}px rgba(6,4,18,.85)) drop-shadow(0 0 ${26*g}px rgba(255,110,20,.6))` : "";
  lockEl.style.filter = plate + depth;
}

/* ===========================================================================
   THE ENTRANCES — one per material. Everything in an act arrives this way.
   ========================================================================= */
const RISE = "power4.out";
/* hand: written, left to right */
function write(el, at, dur = 0.55) {
  gsap.set(el, { clipPath: "inset(-12% 100% -12% -3%)" });
  tl.to(el, { clipPath: "inset(-12% 0% -12% -3%)", duration: dur, ease: "power1.inOut" }, at);
}
/* neon: switched on — a CRT expanding from a bright line */
function crtOn(el, at, dur = 0.34) {
  gsap.set(el, { opacity: 0, scaleY: 0.006, scaleX: 1.04, transformOrigin: "50% 50%" });
  tl.set(el, { opacity: 1, scaleY: 0.006, scaleX: 1.04, filter: "brightness(3.5)" }, at)
    .to(el, { scaleY: 1, scaleX: 1, duration: dur, ease: "expo.out" }, at)
    .to(el, { filter: "brightness(1)", duration: 0.45, ease: "power2.out" }, at + 0.05);
}
/* neon: switched off — collapses to a line, then to nothing */
function crtOff(el, at) {
  tl.to(el, { scaleY: 0.006, duration: 0.22, ease: "expo.in" }, at)
    .to(el, { scaleX: 0, duration: 0.12, ease: "power3.in" }, at + 0.2)
    .set(el, { opacity: 0 }, at + 0.33);
}
/* press: printed — a sheet is {el, plate, card}; the blue plate lands first */
function sheet(w, h, css, fill, bars = true) {
  const el = E("div", "sheet", { width: w + "px", height: h + "px", opacity: 0, ...css });
  const plate = E("div", "plate"), card = E("div", "card", { position: "absolute", inset: "0" });
  if (fill) fill(card);
  /* the plate carries the bars only, never the words — a second plate of text
     is unreadable, a second plate of tone is the whole point of the register */
  if (bars) [...card.querySelectorAll(".tl, .tb")].forEach((b) => plate.appendChild(b.cloneNode(false)));
  el.append(plate, card);
  return { el, plate, card };
}
function print(sh, at) {
  gsap.set([sh.plate, sh.card], { y: -420 });
  tl.set(sh.el, { opacity: 1 }, at)
    .to(sh.plate, { y: 0, duration: 0.44, ease: "back.out(1.6)" }, at)
    .to(sh.card,  { y: 0, duration: 0.44, ease: "back.out(1.6)" }, at + 0.14);
}
function pull(sh, at) {
  tl.to(sh.plate, { y: -460, duration: 0.34, ease: "power3.in" }, at)
    .to(sh.card,  { y: -460, duration: 0.36, ease: "power3.in" }, at + 0.06);
}
/* cel: cut — it is there, and for one frame it is blown out */
function cut(el, at) {
  gsap.set(el, { opacity: 0 });
  tl.set(el, { opacity: 1, filter: "brightness(5)" }, at).set(el, { filter: "brightness(1)" }, at + 2 * F);
}
/* cel: slashed — a diagonal wipe, top-right to bottom-left */
function slash(el, at, dur = 0.28) {
  gsap.set(el, { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, -60% 100%)" });
  tl.set(el, { filter: "brightness(4)" }, at).set(el, { filter: "brightness(1)" }, at + F)
    .to(el, { clipPath: "polygon(160% 0%, 100% 0%, 100% 100%, 100% 100%)", duration: dur, ease: "power3.in" }, at);
}
/* brand: the quiet rise the whole studio uses */
function rise(el, at, dur = 0.6, dy = 26) {
  gsap.set(el, { opacity: 0, y: dy });
  tl.to(el, { opacity: 1, y: 0, duration: dur, ease: RISE }, at);
}
function leave(els, at) {
  tl.to(els, { opacity: 0, y: -24, duration: 0.35, ease: "power2.in", stagger: 0.03 }, at);
}

/* a thumbnail of each material, for the timeline card's scrub and its last row */
function thumb(world) {
  const t = E("div", "thumb");
  const P = {
    hand:  '<rect width="116" height="66" fill="#f4efe4"/><path d="M 12 40 C 26 18, 40 54, 54 34 S 76 30, 86 40" fill="none" stroke="#1b2430" stroke-width="3" stroke-linecap="round"/><path d="M 84 22 L 96 44 L 108 22" fill="none" stroke="#e2500a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    neon:  '<rect width="116" height="66" fill="#070a1c"/><rect y="20" width="116" height="24" fill="#4a2140"/><circle cx="58" cy="40" r="20" fill="#ff8a1e"/><rect x="34" y="38" width="48" height="3" fill="#0b0d22"/><rect x="34" y="45" width="48" height="4" fill="#0b0d22"/><rect x="34" y="53" width="48" height="5" fill="#0b0d22"/><rect y="44" width="116" height="22" fill="#0a0c20"/><path d="M 58 44 L 0 66 M 58 44 L 30 66 M 58 44 L 58 66 M 58 44 L 86 66 M 58 44 L 116 66 M 0 52 L 116 52 M 0 60 L 116 60" stroke="#ff6a12" stroke-width="1"/>',
    press: '<rect width="116" height="66" fill="#f2ece0"/><rect x="26" y="20" width="60" height="34" fill="none" stroke="#2b3a8f" stroke-width="2.5"/><rect x="31" y="15" width="60" height="34" fill="none" stroke="#e8480a" stroke-width="2.5"/><rect x="38" y="22" width="30" height="4" fill="#e8480a"/><rect x="38" y="30" width="20" height="3" fill="#2b3a8f"/>',
    cel:   '<rect width="116" height="26" fill="#16243c"/><rect y="26" width="116" height="18" fill="#6b3a52"/><rect y="44" width="116" height="22" fill="#dd8b41"/><circle cx="94" cy="50" r="10" fill="#f3c67e"/><polygon points="28,60 58,24 88,60" fill="#2c2140"/><polygon points="50,34 58,24 66,34 63,36 60,33 57,37 54,34" fill="#efd9bd"/><rect y="58" width="116" height="8" fill="#080a12"/>',
  }[world];
  t.innerHTML = `<svg viewBox="0 0 116 66" xmlns="http://www.w3.org/2000/svg">${P}</svg>`;
  return t;
}

/* ===========================================================================
   SCENES. A scene is visible only inside its window; outside it the browser
   does not paint it, which is what keeps a 2,600-frame render honest.
   ========================================================================= */
function scene(id, from, to, chapter, build, cues) {
  const el = E("div", "scene");
  scenesEl.appendChild(el);
  const refs = build(el) || {};
  tl.set(el, { visibility: "visible" }, from).set(el, { visibility: "hidden" }, to);
  if (chapter) tl.set(S, { chapter }, from + 0.2);
  cues(refs, el);
}

/* ---------------------------------------------------------------------------
   ACT I · HAND — ink on paper. The brief, the interview, the one file.
   --------------------------------------------------------------------------- */
scene("hook", 0, L.brand1.start - 0.05, "what this is",
  (el) => {
    const t1 = E("div", "big", {}, '<span class="l">A content studio</span><span class="l">in your <span class="o">terminal</span>.</span>');
    const t2 = E("div", "lede", {}, "You use it by talking to it.");
    el.append(t1, t2);
    return { l: [...t1.querySelectorAll(".l")], t1, t2 };
  },
  (r) => {
    write(r.l[0], 0.45, 0.9);
    write(r.l[1], 1.25, 0.8);
    write(r.t2, 2.35, 0.9);
    tl.to([r.t1, r.t2], { y: -460, opacity: 0, duration: 0.5, ease: "power3.in", stagger: 0.05 }, L.brand1.start - 0.5);
  });

scene("brand", L.brand1.start - 0.3, L.ask.start + 0.35, "your brand, once",
  (el) => {
    const stack = E("div", "", { display: "grid", placeItems: "center", width: "100%", height: "100%" });
    const term = E("div", "term", { gridArea: "1/1" });
    term.append(E("div", "bar", {}, "<i></i><i></i><i></i><span>/setup-brand</span>"));
    const body = E("div", "body"); term.appendChild(body);
    const lines = [
      ['<span class="p">?</span>  What is your background colour', "#0a0e27"],
      ['<span class="p">?</span>  And your one accent', "#ff5100"],
      ['<span class="p">?</span>  How should the writing sound', "Precise. Never salesy."],
    ].map(([q, a]) => {
      const w = E("div");
      w.append(E("div", "ln ai", {}, q), E("div", "ln you", {}, "&nbsp;&nbsp;&nbsp;" + a));
      body.appendChild(w); return w;
    });
    const file = E("div", "card", { gridArea: "1/1", width: "780px", padding: "8px 38px" });
    file.appendChild(E("div", "mono", { fontSize: "22px", color: "var(--faint)", letterSpacing: ".06em", padding: "22px 0 8px" }, "brand-kit / brand.css"));
    const toks = [["--bg", "#0a0e27", "#0a0e27"], ["--accent", "#ff5100", "#ff5100"], ["--sans", "Satoshi", null]].map(([k, v, sw]) => {
      const row = E("div", "tokrow");
      row.append(E("span", "k", {}, k), E("span", "v", {}, v), E("span", "sw", { background: sw || "transparent", borderColor: sw ? "var(--line)" : "transparent" }));
      file.appendChild(row); return row;
    });
    const strip = E("div", "row", { gridArea: "1/1", gap: "34px" });
    const tiles = ["post", "slide", "card", "video"].map((name) => {
      const tile = E("div", "tile", { width: "244px", height: "305px" });
      tile.append(E("i", "tl", { width: "94px", background: "var(--line)" }), E("i", "tb", { top: "54px", width: "178px" }),
                  E("i", "tb", { top: "80px", width: "138px" }), E("i", "tb", { top: "106px", width: "158px" }), E("span", "tcap", {}, name));
      strip.appendChild(tile); return tile;
    });
    /* your own sources → one read-only folder the studio reads before it writes */
    const ref = E("div", "", { gridArea: "1/1", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" });
    const srcRow = E("div", "srcs");
    /* the label is INSIDE the element that gets written, or the clip that
       writes the card eats a caption hanging below it */
    const srcs = ["your site", "your docs", "your app"].map((lab) => {
      const w = E("div", "src");
      const c = E("div", "card");
      c.append(E("i", "tl", { top: "18px", left: "18px", width: "58px", background: "var(--line)" }),
               E("i", "tb", { top: "46px", left: "18px", width: "150px" }),
               E("i", "tb", { top: "66px", left: "18px", width: "118px" }),
               E("i", "tb", { top: "86px", left: "18px", width: "138px" }));
      w.append(c, E("div", "cap", {}, lab));
      srcRow.appendChild(w); return w;
    });
    const arrowSvg = SVG("svg", { viewBox: "0 0 840 128" });
    Object.assign(arrowSvg.style, { width: "840px", height: "128px", display: "block", marginTop: "18px" });
    const arrows = [118, 420, 722].map((x) => {
      const p = SVG("path", { d: `M ${x} 4 C ${x} 62, 420 56, 420 112`, stroke: "var(--accent)", "stroke-width": 3,
                              fill: "none", "stroke-linecap": "round" });
      arrowSvg.appendChild(p); return p;
    });
    const refbox = E("div", "card refbox");
    refbox.append(E("div", "p", {}, "reference/"), E("div", "r", {}, "read-only"));
    const right = E("div", "firstright", { marginTop: "10px" });
    const tickSvg = SVG("svg", { viewBox: "0 0 40 40" });
    Object.assign(tickSvg.style, { width: "40px", height: "40px" });
    const tick = SVG("path", { d: "M 5 21 L 15 32 L 35 7", stroke: "var(--accent)", "stroke-width": 5, fill: "none",
                               "stroke-linecap": "round", "stroke-linejoin": "round" });
    tickSvg.appendChild(tick);
    right.append(tickSvg, E("span", "", {}, "right the first time"));
    ref.append(srcRow, arrowSvg, refbox, right);

    stack.append(term, file, ref, strip);
    el.appendChild(stack);
    /* each line hides behind its own length so it can draw itself */
    [...arrows, tick].forEach((p) => { const l = p.getTotalLength(); p.setAttribute("stroke-dasharray", l); p.setAttribute("stroke-dashoffset", l); });
    return { term, lines, file, toks, tiles, ref, srcs, arrows, refbox, right, tick };
  },
  (r) => {
    const A = L.brand1.start, B = L.brand2.start;
    /* the interview is written, one answer per question */
    write(r.term, A - 0.15, 0.7);
    r.lines.forEach((ln, i) => write(ln, A + 0.5 + i * 1.35, 0.7));
    tl.to(r.term, { x: -1900, duration: 0.5, ease: "power3.in" }, B + 0.3);
    /* "one file" — written 0.55s after she says it */
    write(r.file, B + 0.55, 0.6);
    r.toks.forEach((row, i) => {
      write(row, B + 0.95 + i * 0.4, 0.45);
      const sw = row.querySelector(".sw");
      gsap.set(sw, { scale: 0 });
      tl.to(sw, { scale: 1, duration: 0.35, ease: "back.out(2)" }, B + 1.2 + i * 0.4);
    });
    /* "point it at your own sources" — the file steps aside for the shelf */
    const G = L.ground.start;
    tl.to(r.file, { y: -520, opacity: 0, duration: 0.45, ease: "power3.in" }, G - 0.45);
    r.srcs.forEach((c, i) => write(c, G + 0.15 + i * 0.42, 0.45));
    /* three sources, one folder: the arrows are drawn, not faded */
    r.arrows.forEach((p, i) => tl.to(p, { attr: { "stroke-dashoffset": 0 }, duration: 0.55, ease: "power2.inOut" }, G + 1.55 + i * 0.18));
    write(r.refbox, G + 2.15, 0.5);
    /* "so you are not correcting the same thing every time" */
    write(r.right.querySelector("span"), G + 6.15, 0.5);
    tl.to(r.tick, { attr: { "stroke-dashoffset": 0 }, duration: 0.4, ease: "power2.out" }, G + 6.0);
    /* the shelf lifts as the surfaces arrive */
    tl.to(r.ref, { y: -560, opacity: 0, duration: 0.45, ease: "power3.in" }, L.turn.start - 1.15);
    gsap.set(r.tiles, { scale: 0.94, transformPerspective: 900, transformOrigin: "50% 50%" });
    r.tiles.forEach((tile, i) => {
      const at = L.turn.start - 0.95 + i * 0.16;
      write(tile, at, 0.5);
      tl.to(tile, { scale: 1, duration: 0.5, ease: RISE }, at)
        .set(tile.querySelector(".tl"), { background: "var(--accent)" }, at + 0.5)
        .set(tile, { borderColor: "var(--accent-line)" }, at + 0.5);
    });
    /* T1 · "whatever the surface": the tiles turn over with the page and come
       back as the next material. Same elements, new tokens. */
    tl.to(r.tiles, { rotationY: 92, duration: 0.24, ease: "power2.in" }, T1 + 0.35)
      .set(r.tiles, { rotationY: -92 }, T1 + 0.59)
      .to(r.tiles, { rotationY: 0, duration: 0.34, ease: "back.out(1.7)", stagger: 0.05 }, T1 + 0.59)
      .fromTo(r.tiles, { scale: 1.16 }, { scale: 1, duration: 0.5, ease: "expo.out" }, T1 + 0.91);
    /* and then they sink into the floor as the prompt arrives */
    tl.to(r.tiles, { y: 780, duration: 0.45, ease: "power3.in", stagger: 0.04 }, L.ask.start - 0.2);
  });

/* ---------------------------------------------------------------------------
   ACT II · NEON — a CRT. You type, it switches things on.
   --------------------------------------------------------------------------- */
const MSG1 = "make a carousel about the new pricing", MSG2 = "make slide two about the free tier";
let askTxt;
scene("ask", L.ask.start - 0.2, T2 + 0.4, "just ask",
  (el) => {
    const prompt = E("div", "card", { padding: "26px 34px", width: "1200px", marginBottom: "62px" });
    askTxt = E("div", "ln you", { fontSize: "32px", lineHeight: "1.4" }, '<span class="p">&rsaquo;</span>  ');
    prompt.appendChild(askTxt);
    const row = E("div", "row", { gap: "34px" });
    const slides = [0, 1, 2].map(() => {
      const sl = E("div", "card slide");
      sl.append(
        E("i", "tl", { top: "28px", left: "28px", width: "78px", background: "var(--line)" }),
        E("i", "tb", { top: "78px", left: "28px", width: "0px", height: "16px", background: "var(--fg)" }),
        E("i", "tb", { top: "110px", left: "28px", width: "0px", height: "16px", background: "var(--fg)" }),
        E("i", "tb", { top: "160px", left: "28px", width: "0px" }),
        E("i", "tb", { top: "182px", left: "28px", width: "0px" }),
        E("div", "card panel", { position: "absolute", left: "28px", right: "28px", bottom: "32px", height: "0px", background: "var(--panel-2)", overflow: "hidden" }));
      row.appendChild(sl); return sl;
    });
    const chip = E("div", "pill on", { marginTop: "44px" }, "re-rendered in 2.1s");
    el.append(prompt, row, chip);
    return { prompt, slides, chip };
  },
  (r) => {
    const A = L.ask.start, C = L.carousel.start, I = L.iterate.start;
    crtOn(r.prompt, A - 0.05);
    /* typing is a NUMBER — how many characters are in — and post() writes it,
       because the caret blink is a function of t, not a tween */
    tl.fromTo(S, { type: 0 }, { type: 1, duration: 2.0, ease: "none" }, A + 0.3);
    /* "builds the slides": each one switches on, then fills a beat later */
    const w = [208, 164, 236, 186];
    r.slides.forEach((sl, i) => {
      const a = C + 0.5 + i * 0.55;
      crtOn(sl, a);
      tl.set(sl.querySelector(".tl"), { background: "var(--accent)" }, a + 0.4);
      [...sl.querySelectorAll(".tb")].forEach((b, j) => tl.to(b, { width: w[j], duration: 0.4, ease: RISE }, a + 0.35 + j * 0.13));
      tl.to(sl.querySelector(".panel"), { height: 108, duration: 0.45, ease: RISE }, a + 1.0);
    });
    /* "slide two feels flat? say so" — the same prompt, a second message; the
       slide is switched off and switched back on different */
    const sel = r.slides[1], bars = [...sel.querySelectorAll(".tb")];
    tl.set(S, { msg: 1 }, I - 0.02).fromTo(S, { type2: 0 }, { type2: 1, duration: 1.15, ease: "none" }, I + 0.05);
    tl.set(sel, { className: "card slide sel" }, I + 1.3);
    crtOff(sel, I + 1.5);
    [244, 128, 186, 150].forEach((x, j) => tl.set(bars[j], { width: x }, I + 1.9));
    crtOn(sel, I + 2.05);
    crtOn(r.chip, I + 2.95, 0.3);
  });

/* ---------------------------------------------------------------------------
   ACT III · PRESS — a duplicator. Decks and long-form, printed in two plates.
   --------------------------------------------------------------------------- */
let deckRefs;
/* one slide's furniture, the way a deck in this repo is actually built: a
   kicker, a headline, a lead, then the figures. present.py animates a deck by
   building exactly these, in this order — no slide contains animation code —
   so the build shown here is the build you get for free. */
function deckSlide(card, kicker, title, lead) {
  const k = E("div", "mono skicker", {}, kicker);
  const t = E("div", "stitle", {}, title);
  const l = E("div", "slead", {}, lead);
  const band = E("div", "statband");
  card.append(k, t, l, band);
  return { k, t, l, band };
}

scene("deck", T2 + 0.25, L.essay.start + 0.35, "decks",
  (el) => {
    const wrap = E("div", "", { display: "flex", flexDirection: "column", alignItems: "center", gap: "30px" });

    /* THE SLIDE — one sheet, two slides' worth of content stacked on it */
    const big = sheet(908, 512, {}, (c) => { c.style.cssText += "display:grid"; }, false);
    const a = E("div", "sfill"), b = E("div", "sfill");
    big.card.append(a, b);
    const A = deckSlide(a, "example deck &middot; 04", "A slide that builds itself",
                        "Kicker, headline, lead, then the figures &mdash; in that order, every time.");
    /* A's figures are a chart, so the motion is a shape growing rather than a
       claim: four columns, no numbers to misread */
    const cols = ["Q1", "Q2", "Q3", "Q4"].map((q, i) => {
      const cell = E("div", "col");
      const bar = E("i", "", { height: "6px" });
      cell.append(bar, E("span", "mono", {}, q));
      A.band.appendChild(cell);
      return bar;
    });
    const B = deckSlide(b, "example deck &middot; 05", "Then the next one, the same way",
                        "The build is generic. It comes off the slide furniture every deck here shares.");
    /* B's figures are facts about the deck itself — nothing to get wrong */
    const stats = [["24", "slides"], ["0", "lines of animation"], ["3", "ways to ship"]].map(([n, lab]) => {
      const cell = E("div", "stat");
      const num = E("div", "n", {}, "0");
      cell.append(num, E("div", "mono l", {}, lab));
      B.band.appendChild(cell);
      return { num, to: parseInt(n, 10) };
    });

    /* THE DECK — a rail of sheets that runs off the frame, because the number
       of slides is whatever you wrote */
    const railWrap = E("div", "", { position: "relative", width: "1660px", height: "76px", overflow: "hidden", flex: "none" });
    const rail = E("div", "", { position: "absolute", left: "0", top: "0", display: "flex", gap: "12px" });
    const minis = [];
    for (let i = 0; i < 24; i++) {
      const sh = sheet(104, 58, { flex: "none" }, (c) => c.append(
        E("i", "tl", { top: "10px", left: "10px", width: "22px", height: "5px" }),
        E("i", "tb", { top: "24px", left: "10px", width: "58px", height: "5px", background: "var(--fg)" }),
        E("i", "tb", { top: "36px", left: "10px", width: "40px", height: "4px" })));
      rail.appendChild(sh.el); minis.push(sh);
    }
    railWrap.appendChild(rail);
    const count = E("div", "mono dcount", {}, "0 slides");

    /* THE OUTPUTS — the same deck, two ways off the press */
    /* stamped onto the sheet itself, the way a press marks what a run is for */
    const stamps = [["deck.pdf", "-236px", "auto", "-7deg"], ["deck.mp4", "auto", "-236px", "5deg"]].map(([n, l, r2, rot]) => {
      const st = E("div", "stamp", { opacity: 0, fontSize: "30px", padding: "9px 20px", bottom: "96px", left: l, right: r2, zIndex: 20 }, n);
      big.el.appendChild(st); return st;
    });

    wrap.append(big.el, count, railWrap);
    el.append(wrap);
    deckRefs = { count, stats };
    return { big, a, b, A, B, cols, stats, rail, minis, count, stamps, railWrap };
  },
  (r) => {
    const P = L.print.start, D = L.deckplay.start;
    /* "however many slides you need" — they print along the rail and keep
       going past the edge of the frame; the count runs with them */
    print(r.big, P + 0.05);
    gsap.set(r.b, { opacity: 0 });
    r.minis.forEach((sh, i) => print(sh, P + 0.55 + i * 0.055));
    tl.fromTo(S, { slides: 0 }, { slides: 24, duration: 1.5, ease: "none" }, P + 0.6);
    /* the rail keeps running: more slides than the frame can hold */
    tl.to(r.rail, { x: -540, duration: 2.4, ease: "power2.inOut" }, P + 1.6);

    /* "the same slides present themselves" — slide 4 builds, element by
       element, straight off the furniture above */
    const mark = (i, at) => tl.set(r.minis[i].card, { borderColor: "var(--accent)", background: "var(--accent-soft)" }, at)
      .to(r.minis[i].el, { scale: 1.14, duration: 0.22, ease: "back.out(2)" }, at)
      .to(r.minis[i].el, { scale: 1, duration: 0.2 }, at + 1.9);
    write(r.A.k, D + 0.15, 0.35);
    write(r.A.t, D + 0.5, 0.55);
    write(r.A.l, D + 1.05, 0.5);
    mark(3, D + 0.1);
    r.cols.forEach((bar, i) => tl.to(bar, { height: [96, 62, 128, 158][i], duration: 0.55, ease: "power3.out" }, D + 1.5 + i * 0.14));
    /* the deck moves on: slide 4 is pulled, slide 5 prints and builds the same way */
    tl.to(r.a, { y: -520, opacity: 0, duration: 0.34, ease: "power3.in" }, D + 3.5)
      .set(r.b, { opacity: 1 }, D + 3.8);
    mark(4, D + 3.8);
    tl.to(r.rail, { x: -656, duration: 0.4, ease: "power3.out" }, D + 3.8);
    write(r.B.k, D + 3.9, 0.35);
    write(r.B.t, D + 4.2, 0.55);
    write(r.B.l, D + 4.75, 0.5);
    /* the figures count — the one move a printed page can never make */
    tl.fromTo(S, { deckN: 0 }, { deckN: 1, duration: 1.1, ease: "power2.out" }, D + 5.2);
    /* "send the PDF, or send the film" — both come off the same sheet */
    tl.to(r.count, { opacity: 0, duration: 0.25 }, D + 6.35);
    r.stamps.forEach((st, i) => {
      gsap.set(st, { scale: 1.8, rotation: i ? 9 : -11 });
      tl.to(st, { opacity: 1, scale: 1, rotation: i ? 5 : -7, duration: 0.18, ease: "power3.in" }, D + 6.55 + i * 0.45);
    });
    /* fed out to the left as the next sheet comes through */
    tl.to([r.big.el, r.railWrap, r.count, ...r.stamps], { x: -2100, duration: 0.5, ease: "power3.in", stagger: 0.03 }, L.essay.start - 0.25);
  });

scene("essay", L.essay.start - 0.2, T3 + 0.5, "long-form",
  (el) => {
    const wrap = E("div", "", { display: "flex", alignItems: "center", gap: "56px" });
    const md = sheet(372, 470, {}, (c) => {
      c.style.padding = "32px";
      c.appendChild(E("div", "mono", { fontSize: "15px", color: "var(--accent)", letterSpacing: ".12em" }, "post.md"));
      [200, 168, 214, 140, 196, 178, 150, 206, 120].forEach((w, i) =>
        c.appendChild(E("i", "tb", { position: "relative", display: "block", marginTop: i === 0 ? "26px" : "13px", left: "0", width: w + "px" })));
    }, false);
    const arrow = E("div", "", { fontSize: "40px", color: "var(--faint)", opacity: 0 }, "&rarr;");
    const outs = E("div", "", { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px" });
    const cards = ["article page", "hero image", "share card", "caption"].map((lab, i) => {
      const sh = sheet(330, 218, {}, (c) => {
        c.style.cssText += "display:flex;align-items:flex-end;padding:18px";
        c.append(E("i", "tl", { top: "18px", left: "18px", width: "50px" }),
                 E("i", "tb", { top: "44px", left: "18px", width: "150px", height: "11px", background: "var(--fg)" }),
                 E("i", "tb", { top: "66px", left: "18px", width: "108px" }));
        if (i === 1) c.appendChild(E("div", "halftone"));
        c.appendChild(E("div", "mono", { fontSize: "13px", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--faint)", position: "relative" }, lab));
      });
      outs.appendChild(sh.el); return sh;
    });
    wrap.append(md.el, arrow, outs);
    el.appendChild(wrap);
    return { md, arrow, cards };
  },
  (r) => {
    const A = L.essay.start;
    print(r.md, A + 0.05);
    tl.to(r.arrow, { opacity: 1, duration: 0.3 }, A + 0.7);
    /* "all in one go" — but one after another, or the eye cannot count them */
    r.cards.forEach((sh, i) => print(sh, A + 1.05 + i * 0.45));
    /* T3 · the sheets are pulled off the press */
    pull(r.md, T3);
    r.cards.forEach((sh, i) => pull(sh, T3 + 0.04 * i));
    tl.to(r.arrow, { opacity: 0, duration: 0.2 }, T3);
  });

/* ---------------------------------------------------------------------------
   ACT IV · CEL — a painted cel. Video: the act that explains this file.
   --------------------------------------------------------------------------- */
let vid;
scene("video", L.video1.start + 0.2, T4 + 0.4, "video",
  (el) => {
    const stack = E("div", "", { display: "grid", placeItems: "center", width: "100%", height: "100%" });
    /* part one: the filmstrip and the cue file */
    const one = E("div", "", { gridArea: "1/1", display: "flex", flexDirection: "column", alignItems: "center" });
    const title = E("div", "mono", { fontSize: "17px", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "26px" }, "every frame is one screenshot");
    const strip = E("div"); strip.id = "strip";
    const frames = [];
    for (let i = 0; i < 9; i++) {
      const fr = E("div", "fr"), q = i / 8;
      /* each frame is a tiny cel: three flat bands and a sun a little further along */
      fr.append(E("i", "", { top: "0", height: "58%", background: "#2b2b4e" }), E("i", "", { top: "58%", height: "24%", background: "#6b3a52" }),
                E("i", "", { top: "82%", height: "18%", background: "#b8532c" }),
                E("b", "", { width: "26px", height: "26px", left: lerp(14, 110, q) + "px", top: lerp(92, 30, q) + "px" }),
                E("i", "", { top: "76%", height: "24%", background: "#080a12", clipPath: "polygon(0 100%, 30% 40%, 55% 70%, 80% 20%, 100% 100%)" }));
      strip.appendChild(fr); frames.push(fr);
    }
    const cueTitle = E("div", "mono", { fontSize: "17px", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--muted)", margin: "40px 0 20px" }, "the sound is a json file");
    const bottom = E("div", "", { display: "flex", alignItems: "flex-end", gap: "54px" });
    const cues = E("div", "card", { padding: "18px 26px", width: "520px" });
    const cueLines = ['{ "type": "whoosh", "at": "video1 - 0.1" }', '{ "type": "chime",  "at": "video1 + 2.57" }', '{ "type": "tone",   "at": "video2 + 3.3" }']
      .map((c) => { const d = E("div", "ln", { fontSize: "18px", lineHeight: "2.0" }, c); cues.appendChild(d); return d; });
    const wave = E("div"); wave.id = "wave";
    const bars = [];
    for (let i = 0; i < 34; i++) { const b = E("i"); wave.appendChild(b); bars.push(b); }
    bottom.append(cues, wave);
    one.append(title, strip, cueTitle, bottom);

    /* part two: THIS timeline. The lanes are real tweens from this file at
       their real positions, and the playhead is where the film actually is. */
    const two = E("div", "tlcard card", { gridArea: "1/1" });
    two.appendChild(E("div", "mono tlhead", {}, "one paused timeline &middot; the renderer seeks it, one frame at a time"));
    const ruler = E("div", "ruler");
    for (let s = 0; s <= DUR; s += 10) {
      const x = (4 + s / DUR * 90);
      ruler.appendChild(E("i", "", { left: x + "%" }));
      ruler.appendChild(E("span", "mono", { position: "absolute", left: x + "%", top: "-8px", fontSize: "12px", color: "var(--faint)", transform: "translateX(-50%)" }, s + "s"));
    }
    two.appendChild(ruler);
    const LANES = [
      [L.brand2.start + 0.55, 0.6,  "L.brand2.start + 0.55", "the file is written", "hand"],
      [T2,                    0.4,  "L.print.start &minus; 0.45", "the screen switches off", "neon"],
      [T3,                    0.85, "L.video1.start &minus; 0.1", "the sky arrives, one band at a time", "press"],
      [L.video3.start + 0.25, 0.4,  "L.video3.start + 0.25", "this diagram", "cel"],
    ];
    const lanes = LANES.map(([at, dur, lab, what, wld]) => {
      const lane = E("div", "lane");
      const x = 4 + at / DUR * 90, w = dur / DUR * 90;
      const tw = E("div", "tw", { left: x + "%", width: `max(${w}%, 14px)`, opacity: 0 });
      const fill = E("i"); tw.appendChild(fill);
      const txt = E("div", "mono at", { left: `calc(${x}% + max(${w}%, 14px) + 14px)`, top: "20px", fontSize: "17px", opacity: 0 }, `tl.to(&hellip;, <b style="color:var(--fg)">${lab}</b>) &nbsp;&middot;&nbsp; ${what}`);
      /* the frame the renderer got back when it asked for this moment */
      const th = thumb(wld); th.classList.add("thumb"); Object.assign(th.style, { position: "absolute", left: `calc(${x}% - 128px)`, top: "6px", opacity: 0 });
      lane.append(tw, txt, th); two.appendChild(lane);
      return { tw, fill, txt, th, at };
    });
    const ph = E("div", "ph"); two.appendChild(ph);
    const code = E("div", "mono code", {}, "");
    two.appendChild(code);
    const wrow = E("div", "wrow", { opacity: 0 });
    const wsw = ["hand", "neon", "press", "cel"].map((n) => { const s = thumb(n); s.style.opacity = 0; wrow.appendChild(s); return s; });
    const wlab = E("span", "", { opacity: 0 }, "the four materials you just watched &mdash; the same tweens, in this file");
    wrow.appendChild(wlab); two.appendChild(wrow);
    stack.append(one, two);
    el.appendChild(stack);
    vid = { one, title, frames, cueTitle, cues, cueLines, wave, bars, two, lanes, ph, code, wrow, wsw, wlab };
    return vid;
  },
  (r, el) => {
    const V2 = L.video2.start, V3 = L.video3.start, V4 = L.video4.start;
    /* the cut opens the act; everything in it arrives on a cut */
    cut(r.title, HIT + 0.06);
    r.frames.forEach((fr, i) => cut(fr, V2 + 0.15 + i * 0.09));
    tl.fromTo(S, { ph: 0 }, { ph: 1, duration: 2.2, ease: "none" }, V2 + 1.15);
    cut(r.cueTitle, V2 + 3.3);
    cut(r.cues, V2 + 3.45);
    r.cueLines.forEach((c, i) => cut(c, V2 + 3.6 + i * 0.3));
    cut(r.wave, V2 + 3.95);
    tl.fromTo(S, { wp: 0 }, { wp: 1, duration: 2.4, ease: "none" }, V2 + 4.0);
    /* "the motion is one paused timeline": part one is slashed, the diagram is cut in */
    slash(r.one, V3 - 0.15);
    cut(r.two, V3 + 0.25);
    r.lanes.forEach((ln, i) => {
      gsap.set(ln.tw, { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(ln.fill, { scaleX: 0 });
      tl.set(ln.tw, { opacity: 1 }, V3 + 0.6 + i * 0.22).to(ln.tw, { scaleX: 1, duration: 0.4, ease: "expo.out" }, V3 + 0.6 + i * 0.22);
      cut(ln.txt, V3 + 0.8 + i * 0.22);
    });
    /* "nothing plays. the renderer asks it for a frame": the playhead does not
       travel — it JUMPS to each tween's anchor, the tween runs, and the frame
       that came back is shown. Then it snaps to where this film actually is. */
    tl.set(S, { live: 0, phT: 0 }, V3 + 1.6);
    cut(r.ph, V3 + 1.7);
    cut(r.code, V3 + 1.8);
    r.lanes.forEach((ln, i) => {
      const at = V3 + 2.2 + i * 1.1;
      tl.set(S, { phT: ln.at }, at)
        .to(ln.fill, { scaleX: 1, duration: 0.4, ease: "expo.out" }, at + 0.05);
      cut(ln.th, at + 0.25);
    });
    tl.set(S, { live: 1 }, V3 + 6.8);
    /* "not even for what you just watched" */
    cut(r.wrow, V4 + 1.6);
    r.wsw.forEach((s, i) => cut(s, V4 + 1.7 + i * 0.12));
    cut(r.wlab, V4 + 2.3);
    /* T4 · the last cut takes the whole act with it */
    slash(el, T4, 0.3);
  });

/* ---------------------------------------------------------------------------
   ACT V · BRAND — the kit as shipped. The calendar, the model, the point.
   --------------------------------------------------------------------------- */
let calCount;
scene("calendar", L.calendar.start - 0.15, L.agnostic.start - 0.1, "the calendar",
  (el) => {
    const say = E("div", "card", { padding: "18px 26px", width: "620px", marginBottom: "38px" });
    say.appendChild(E("div", "ln you", { fontSize: "23px" }, '<span class="p">&rsaquo;</span>  the pricing carousel went out'));
    const board = E("div", "card", { width: "1080px", padding: "12px 12px 22px" });
    const rows = [["Pricing carousel", "Mon"], ["Founder note", "Tue"], ["Product video", "Wed"], ["Glossary card", "Thu"], ["Long read", "Fri"]].map(([txt, day]) => {
      const row = E("div", "crow"), box = E("div", "box");
      box.appendChild(E("div", "tick", {}, "&#10003;"));
      row.append(box, E("div", "t", {}, txt), E("div", "d", {}, day));
      board.appendChild(row); return row;
    });
    const barWrap = E("div", "", { width: "1040px", height: "6px", background: "var(--line-soft)", borderRadius: "3px", margin: "26px auto 0", overflow: "hidden" });
    const bar = E("i", "", { display: "block", height: "100%", width: "0", background: "var(--accent)" });
    barWrap.appendChild(bar);
    calCount = E("div", "mono", { fontSize: "20px", color: "var(--muted)", marginTop: "18px", letterSpacing: ".1em" }, "0 / 5 shipped");
    el.append(say, board, barWrap, calCount);
    return { say, board, rows, bar, barWrap };
  },
  (r) => {
    const A = L.calendar.start;
    rise(r.say, A + 0.15, 0.55, 20);
    rise(r.board, A + 0.4, 0.6, 24);
    rise(r.barWrap, A + 0.9, 0.4, 10);
    rise(calCount, A + 1.0, 0.4, 10);
    /* "ticks itself": each row is a hard state change with a pulse on the box */
    r.rows.forEach((row, i) => {
      const at = A + 1.45 + i * 0.42, box = row.querySelector(".box"), lab = row.querySelector(".t");
      tl.to(box, { scale: 1.22, duration: 0.17, ease: "sine.out" }, at - 0.17)
        .set(box, { background: "var(--accent)", borderColor: "var(--accent)" }, at)
        .set(box.querySelector(".tick"), { opacity: 1 }, at)
        .set(lab, { textDecoration: "line-through", color: "var(--faint)" }, at)
        .to(box, { scale: 1, duration: 0.17, ease: "sine.in" }, at)
        .to(r.bar, { width: ((i + 1) / 5 * 100) + "%", duration: 0.25, ease: RISE }, at)
        .set(S, { done: i + 1 }, at);
    });
    leave([r.say, r.board, r.barWrap, calCount], L.agnostic.start - 0.45);
  });

scene("agnostic", L.agnostic.start - 0.15, L.hour.start - 0.1, "bring your own model",
  (el) => {
    /* fixed widths, so the lines below can be drawn to the chips' centres
       without measuring anything: 4 × 180 + 300, gap 20 → 1100 wide */
    const chips = E("div", "row", { gap: "20px", marginBottom: "8px" });
    const models = ["Claude", "GPT", "Gemini", "Llama", "whatever is next"].map((m, i) => {
      const c = E("div", "pill", { fontSize: "19px", width: (i === 4 ? 300 : 180) + "px", textAlign: "center" }, m); chips.appendChild(c); return c;
    });
    const CX = [90, 290, 490, 690, 950], FX = 550;
    const svg = SVG("svg", { viewBox: "0 0 1100 124" });
    Object.assign(svg.style, { width: "1100px", height: "124px", display: "block" });
    const paths = CX.map((x) => {
      const p = SVG("path", { d: `M ${x} 2 C ${x} 62, ${FX} 54, ${FX} 122`, stroke: "var(--accent)", "stroke-width": "2", fill: "none", "stroke-linecap": "round", opacity: 0.25 });
      svg.appendChild(p); return p;
    });
    const folder = E("div", "card", { padding: "26px 40px", borderColor: "var(--accent-line)", background: "var(--accent-soft)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" });
    folder.append(E("div", "mono", { fontSize: "26px", color: "var(--accent)" }, ".claude / skills"), E("div", "mono", { fontSize: "16px", color: "var(--muted)", letterSpacing: ".08em" }, "plain markdown instructions"));
    const note = E("div", "lede", { marginTop: "40px" }, "No lock-in. It is a folder of files, in your git repo.");
    el.append(chips, svg, folder, note);
    /* each line hides behind its own length, so it can draw itself */
    paths.forEach((p) => { const l = p.getTotalLength(); p.setAttribute("stroke-dasharray", l); p.setAttribute("stroke-dashoffset", l); });
    return { models, paths, folder, note, svg };
  },
  (r) => {
    const A = L.agnostic.start;
    r.models.forEach((c, i) => { gsap.set(c, { opacity: 0, y: -22 }); tl.to(c, { opacity: 1, y: 0, duration: 0.55, ease: RISE }, A + 0.2 + i * 0.28); });
    tl.set(r.models[4], { className: "pill on" }, A + 1.85);
    gsap.set(r.svg, { opacity: 0 });
    tl.to(r.svg, { opacity: 1, duration: 0.4 }, A + 1.4);
    /* "point whichever model at it": each line draws itself down to the folder */
    r.paths.forEach((p, i) => tl.to(p, { attr: { "stroke-dashoffset": 0, opacity: 0.8 }, duration: 0.8, ease: RISE }, A + 1.5 + i * 0.16));
    rise(r.folder, A + 2.3, 0.6, 22);
    rise(r.note, A + 4.6, 0.6, 18);
    leave([r.models, r.svg, r.folder, r.note].flat(), L.hour.start - 0.45);
  });

scene("hour", L.hour.start - 0.15, L.close.start - 0.1, "the point",
  (el) => {
    const wrap = E("div", "", { display: "flex", alignItems: "center", gap: "80px" });
    const svg = SVG("svg", { viewBox: "0 0 100 100" });
    Object.assign(svg.style, { width: "268px", height: "268px" });
    const C = 2 * Math.PI * 44;
    svg.append(SVG("circle", { cx: 50, cy: 50, r: 44, stroke: "var(--line)", "stroke-width": 6, fill: "none" }),
               SVG("circle", { cx: 50, cy: 50, r: 44, stroke: "var(--accent)", "stroke-width": 6, fill: "none", "stroke-linecap": "round", transform: "rotate(-90 50 50)", "stroke-dasharray": C, "stroke-dashoffset": C }));
    const arc = svg.lastChild;
    const left = E("div", "", { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" });
    left.append(svg, E("div", "mono", { fontSize: "17px", letterSpacing: ".18em", textTransform: "uppercase", color: "var(--faint)" }, "one hour, monday"));
    const week = E("div", "", { display: "flex", gap: "18px" });
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => {
      const c = E("div", "card", { width: "190px", height: "248px" });
      c.append(E("i", "tl", { top: "20px", left: "18px", width: "56px" }), E("i", "tb", { top: "54px", left: "18px", width: "142px", height: "13px", background: "var(--fg)" }),
               E("i", "tb", { top: "78px", left: "18px", width: "108px" }), E("span", "tcap", { bottom: "12px", color: "var(--muted)" }, d));
      week.appendChild(c); return c;
    });
    wrap.append(left, week);
    el.appendChild(wrap);
    return { arc, left, days };
  },
  (r) => {
    const A = L.hour.start;
    rise(r.left, A - 0.05, 0.55, 20);
    tl.to(r.arc, { attr: { "stroke-dashoffset": 0 }, duration: 1.8, ease: "power2.inOut" }, A + 0.2);
    r.days.forEach((c, i) => {
      gsap.set(c, { opacity: 0, y: 30, scale: 0.92 });
      tl.to(c, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: RISE }, A + 0.7 + i * 0.24)
        .set(c, { borderColor: "var(--accent-line)" }, A + 1.17 + i * 0.24);
    });
    leave([r.left, ...r.days], L.close.start - 0.45);
  });

scene("close", L.close.start - 0.15, DUR + 1, "open source",
  (el) => {
    const t1 = E("div", "big", {}, 'Open source.<br>Yours in <span class="o">five minutes</span>.');
    const chips = E("div", "row", { gap: "16px", marginTop: "40px" });
    ["MIT licensed", "no account", "nothing hosted"].forEach((c) => chips.appendChild(E("div", "pill", {}, c)));
    el.append(t1, chips);
    return { t1, chips: [...chips.children] };
  },
  (r) => {
    const A = L.close.start;
    rise(r.t1, A - 0.05, 0.7, 34);
    r.chips.forEach((c, i) => rise(c, A + 0.8 + i * 0.22, 0.5, 18));
    /* the story ends on bare navy; the ender opens on the same navy and lands
       the mark. Feeds freeze on the ender's last frame, not on this one. */
    tl.to([scenesEl, hdrEl, progEl, subEl], { opacity: 0, duration: 0.45, ease: "power2.inOut" }, L.close.end + 0.25);
  });

/* ===========================================================================
   THE JOINS — the film's transitions, on the ground and the header. The
   content's part of each join is in the scene it belongs to, above.
   ========================================================================= */
const NEON = [sky, sun, hz, floor, scan, bloom];
gsap.set(sky,   { clipPath: "inset(100% 0 0 0)", transformOrigin: "50% 540px" });
gsap.set(sun,   { transformOrigin: "50% 390px" });
gsap.set(hz,    { transformOrigin: "50% -108px" });
gsap.set(floor, { transformOrigin: "50% -111px" });
gsap.set(scan,  { transformOrigin: "50% 50%" });
gsap.set(bloom, { transformOrigin: "50% 340px" });
gsap.set(scenesEl, { transformOrigin: "50% 50%" });
gsap.set(hdrEl, { transformOrigin: "50% 504px" });
gsap.set(subEl, { transformOrigin: "50% -395px" });
gsap.set(progEl, { transformOrigin: "50% -486px" });
gsap.set(brandlock, { transformPerspective: 900, transformOrigin: "118px 50%" });
gsap.set(bands, { xPercent: (i) => (i % 2 ? 100 : -100) });
gsap.set(celSvg, { y: 760 }); gsap.set(celSun, { y: -1250 });
gsap.set([$("kitlock"), $("kitqual")], { opacity: 0, y: 18 });

/* T1 · HAND → NEON — the sunset rises up over the paper; the page turns over
   like a card and comes back as chrome; the V morphs the whole way. */
tl.to(cur, { ...NEON_C, duration: 0.9, ease: "power2.inOut" }, T1)
  .set(cur, { sky: 1 }, T1)
  .to(sky, { clipPath: "inset(0% 0 0 0)", duration: 0.85, ease: "expo.out" }, T1)
  .to(cur, { sunY: 1, duration: 0.90, ease: "expo.out" }, T1 + 0.07)
  .to(cur, { grid: 1, duration: 0.45, ease: "power2.out" }, T1 + 0.20)
  .to(cur, { vm: 1, wob: 0, duration: 0.55, ease: "power2.inOut" }, T1 + 0.33)
  .to(brandlock, { rotationY: 92, duration: 0.24, ease: "power2.in" }, T1 + 0.35)
  .set(cur, { face: "neon", handop: 0, wordop: 1, vop: 1 }, T1 + 0.59)
  .set(brandlock, { rotationY: -92 }, T1 + 0.59)
  .to(brandlock, { rotationY: 0, duration: 0.34, ease: "back.out(1.7)" }, T1 + 0.59)
  .to(cur, { chrome: 1, duration: 0.45, ease: "power2.out" }, T1 + 0.59)
  .to(cur, { scan: 1, bloom: 1, duration: 0.40 }, T1 + 0.67)
  .fromTo(brandlock, { scale: 1.30 }, { scale: 1, duration: 0.52, ease: "expo.out" }, T1 + 0.91);
world("neon", T1 + 0.59);

/* T2 · NEON → PRESS — the machine is switched off: the whole screen collapses
   to a line, then a dot. The press runs: the blue plate drops and lands, the
   orange lands a beat later, slightly off; the halftone prints in from the foot. */
const COLLAPSE = [...NEON, scenesEl, hdrEl, subEl, progEl];
tl.to(COLLAPSE, { scaleY: 0.006, duration: 0.26, ease: "expo.in" }, T2)
  .to(crt, { opacity: 1, duration: 0.05 }, T2 + 0.21)
  .to(COLLAPSE, { scaleX: 0, duration: 0.14, ease: "power3.in" }, T2 + 0.26)
  .to(crt, { scaleX: 0, opacity: 0, duration: 0.16, ease: "power3.in" }, T2 + 0.27)
  .to(cur, { ...PRESS_C, duration: 0.20, ease: "power2.out" }, T2 + 0.39)
  .set(cur, { sky: 0, grid: 0, scan: 0, bloom: 0, chrome: 0, sunY: 0, face: "press" }, T2 + 0.43)
  .set(COLLAPSE, { scaleX: 1, scaleY: 1 }, T2 + 0.45)
  .set(brandlock, { rotationY: 0, scale: 1 }, T2 + 0.45)
  .set(cur, { lockY: -340, blueY: -340, plate: 1 }, T2 + 0.45)
  .to(cur, { blueY: 0, duration: 0.44, ease: "back.out(1.6)" }, T2 + 0.59)
  .to(cur, { lockY: 0, duration: 0.44, ease: "back.out(1.6)" }, T2 + 0.73)
  .set(cur, { dots: 1 }, T2 + 0.85)
  .to(cur, { dotsIn: 1, duration: 0.62, ease: "power2.out" }, T2 + 0.85);
world("press", T2 + 0.43);

/* T3 · PRESS → CEL — the sheet is pulled off the press; the painted sky
   arrives one band at a time, top to bottom, alternating sides; the land comes
   up, the sun drops in, the mountain rises; then the cut. */
tl.to(cur, { blueY: -360, duration: 0.34, ease: "power3.in" }, T3)
  .to(cur, { lockY: -360, duration: 0.36, ease: "power3.in" }, T3 + 0.06)
  .to(qual, { y: -380, duration: 0.36, ease: "power3.in" }, T3 + 0.06)
  .to(cur, { dotsIn: 0, duration: 0.42, ease: "power2.in" }, T3 + 0.06)
  .set(cur, { plate: 0, wordop: 0, vop: 0, dots: 0 }, T3 + 0.44)
  .set(cur, { mtn: 1 }, T3 + 0.15)
  .to(cur, { bg: CEL_C.bg, duration: 0.15 }, T3 + 0.15)
  .to(bands, { xPercent: 0, duration: 0.46, ease: "expo.out", stagger: 0.075 }, T3 + 0.15)
  .to(celSvg, { y: 0, duration: 0.62, ease: "expo.out" }, T3 + 0.56)
  .to(celSun, { y: 0, duration: 0.55, ease: "back.out(1.3)" }, T3 + 0.68)
  .set(qual, { y: 0, opacity: 0 }, T3 + 0.5)
  .set(cur, { ...CEL_C, face: "cel", wordop: 1, vop: 1, lockY: 0, blueY: 0 }, HIT)
  .set(qual, { opacity: 1 }, HIT);
world("cel", T3 + 0.56);          /* after the last pulled sheet has left the frame */
const CEL_RISE = [T3 + 0.95, T3 + 1.70];

/* T4 · CEL → BRAND — the bands leave the way they came, bottom first; the
   lockup shrinks to nothing and the brand kit's own comes up in its place. */
tl.to(bands, { xPercent: (i) => (i % 2 ? 100 : -100), duration: 0.42, ease: "power3.in", stagger: { each: 0.06, from: "end" } }, T4 + 0.05)
  .to(celSun, { y: 560, duration: 0.40, ease: "power3.in" }, T4 + 0.10)
  .to(celSvg, { y: 420, duration: 0.45, ease: "power3.in" }, T4 + 0.15)
  .to(brandlock, { scale: 0, duration: 0.42, ease: "power3.in" }, T4 + 0.20)
  .to(cur, { bg: NAVY, duration: 0.5 }, T4 + 0.10)
  .set(cur, { mtn: 0, wordop: 0, vop: 0 }, T4 + 0.62)
  .set(brandlock, { opacity: 0 }, T4 + 0.64);
world("brand", T4 + 0.55);
rise($("kitlock"), L.calendar.start - 0.05, 0.6, 18);
rise($("kitqual"), L.calendar.start + 0.05, 0.5, 14);

/* ===========================================================================
   post(t) — what is a function of t rather than a tween, and the chrome.
   ========================================================================= */
const lineList = Object.values(L);
const PEN = { write: [0.35, 2.15], vDraw: [2.15, 2.62], under: [2.55, 2.88], qual: [2.75, 3.35] };
function post(t) {
  /* the header: the pen writes the lockup, then draws the V, then underlines */
  const wp = lin(t, PEN.write[0], PEN.write[1]);
  wmPaths.forEach((p, i) => {
    const a = i / wmPaths.length, b = (i + 1) / wmPaths.length, q = eoq(cl((wp - a) / (b - a)));
    if (!p._L) p._L = p.getTotalLength();
    p.style.strokeDasharray = p._L; p.style.strokeDashoffset = p._L * (1 - q);
  });
  const vp = eoq(lin(t, PEN.vDraw[0], PEN.vDraw[1])), sp = eoq(lin(t, PEN.vDraw[0] + 0.35, PEN.vDraw[1] + 0.25));
  [[hcrest, vp], [hswell, sp]].forEach(([el, q]) => { const l = el.getTotalLength(); el.style.strokeDasharray = l; el.style.strokeDashoffset = l * (1 - q); });
  { const l = hunder.getTotalLength(), q = eio(lin(t, PEN.under[0], PEN.under[1])); hunder.style.strokeDasharray = l; hunder.style.strokeDashoffset = l * (1 - q); }
  qual.style.clipPath = t < T1 ? `inset(-25% ${(1 - eio(lin(t, PEN.qual[0], PEN.qual[1]))) * 100}% -25% -5%)` : "none";

  /* the attract screen: the floor scrolls at you, the chrome runs, the scanlines roll */
  const fp = (t - T1) * 0.95, NHZ = neon.NHZ;
  neon.lines.forEach((l, i) => {
    const u = (((i + fp) % NHZ) + NHZ) % NHZ / NHZ, y = 429 * Math.pow(u, 2.4);
    l.setAttribute("y1", y); l.setAttribute("y2", y); l.setAttribute("opacity", (0.9 * Math.min(1, u * 5)).toFixed(3));
  });
  flash.style.opacity = (0.30 * Math.pow(1 - lin(t, T1 + 1.05, T1 + 1.25), 3)).toFixed(3);
  $("chrome").setAttribute("gradientTransform", `translate(0 ${(0.085 * Math.sin((t - T1) * 2.1)).toFixed(4)})`);
  scan.style.backgroundPosition = `0 ${((t * 46) % 4).toFixed(2)}px`;

  /* the press: the dots swell in a wave that travels across the sheet */
  { const dr = 1 + 0.30 * Math.sin(t * 2.3) + 0.10 * Math.sin(t * 5.1), visRows = DOT.rows * cur.dotsIn;
    for (let r = 0; r < DOT.rows; r++) {
      const on = r >= DOT.rows - visRows, base = 4.4 * Math.pow((r + 1) / DOT.rows, 0.9);
      for (let c = 0; c < DOT.cols; c++) {
        const e = DOT.els[r * DOT.cols + c];
        if (!on || cur.dots < 0.01) { e.setAttribute("r", 0); continue; }
        e.setAttribute("r", (base * (0.70 + 0.30 * Math.sin(c * DOT.pitch * 0.017 - t * 7.2 + r * 0.42) * dr)).toFixed(2));
      }
    } }

  /* the cel: the flock, the rise, the two cuts */
  yoteiUpdate(lin(t, L.video2.start + 0.2, L.video3.end), t, eoq(lin(t, CEL_RISE[0], CEL_RISE[1])));
  celFlash.style.opacity = ((t >= HIT && t < HIT + 2 * F) || (t >= T4 && t < T4 + 2 * F)) ? 0.92 : 0;
  const ru = lin(t, HIT + F, HIT + 0.62);
  ring.style.transform = `scale(${(0.30 + eoq(ru) * 6.2).toFixed(3)})`;
  ring.style.borderWidth = (11 - 8.5 * ru).toFixed(1) + "px";
  ring.style.opacity = (ru > 0 && ru < 1 ? (1 - ru) * 0.85 : 0).toFixed(3);

  /* the typed prompt: the character count is tweened; the caret blinks on t */
  const msg = S.msg ? MSG2 : MSG1, n = Math.floor((S.msg ? S.type2 : S.type) * msg.length);
  const caret = t % 1 < 0.55 ? '<span class="cursor">&#9614;</span>' : "";
  askTxt.innerHTML = '<span class="p">&rsaquo;</span>  ' + msg.slice(0, n) + (n < msg.length ? caret : "");

  /* the filmstrip's playhead, the wave's envelope */
  vid.frames.forEach((fr, i) => { fr.style.borderColor = S.ph > 0 && S.ph < 1 && Math.abs(S.ph * 8 - i) < 0.6 ? "var(--accent)" : "var(--line)"; });
  vid.bars.forEach((b, i) => {
    const on = cl(S.wp * 34 - i), shape = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.31));
    b.style.height = 4 + on * shape * 88 + "px"; b.style.opacity = 0.35 + 0.65 * on;
  });
  /* the diagram's playhead is where THIS film is — quantised to a frame,
     because that is what the renderer does to this file — except while it is
     demonstrating a seek, when it sits at the frame it was asked for */
  const fr = Math.floor((S.live ? t : S.phT) * FPS + 1e-6);
  vid.ph.style.left = (4 + (fr / FPS) / DUR * 90) + "%";
  vid.code.innerHTML = `window.renderFrame(${(fr / TOTAL_FRAMES).toFixed(4)}) &nbsp;&rarr;&nbsp; tl.seek(${(fr / FPS).toFixed(2)}) &nbsp;&middot;&nbsp; <span class="o">frame ${String(fr).padStart(4, "0")}</span> of ${TOTAL_FRAMES}`;

  calCount.textContent = S.done + " / 5 shipped";

  /* the deck: the slide count as the rail prints, and the figures counting on
     slide five — a page that can do this is not a PDF */
  deckRefs.count.textContent = Math.round(S.slides) + " slides";
  deckRefs.stats.forEach((st) => { st.num.textContent = Math.round(st.to * S.deckN); });

  /* chrome: chapter, subtitles, progress */
  chapEl.textContent = S.chapter;
  chapEl.style.opacity = S.chapter ? 1 : 0;
  let sub = "", a = 0;
  for (const ln of lineList) {
    if (t >= ln.start - 0.25 && t <= ln.end + 0.35) {
      sub = ln.text;
      a = Math.min(lin(t, ln.start - 0.25, ln.start + 0.05), 1 - lin(t, ln.end + 0.1, ln.end + 0.35));
    }
  }
  subEl.innerHTML = sub ? "<span>" + sub + "</span>" : "";
  subEl.style.opacity = cl(a);
  progBar.style.width = (t / DUR) * 100 + "%";
}

/* ===========================================================================
   The contract with the renderer. seek() is the whole engine: move the paused
   timeline's playhead, hand GSAP the one transform the ground owns, apply the
   ground, then the handful of t-driven things. renderFrame(0..1) is what
   render-frames.js calls; the URL hash is the no-node fallback.
   ========================================================================= */
window.seek = function (t) {
  t = cl(t, 0, DUR);
  tl.seek(t, true);                       /* true: suppress callbacks — nothing renders from inside a tween */
  gsap.set(lockEl, { y: cur.lockY });
  apply(cur);
  post(t);
};
window.renderFrame = (u) => window.seek(cl(u, 0, 1) * DUR);
function fromHash() { const h = parseFloat(location.hash.slice(1)); window.renderFrame(isNaN(h) ? 0 : h); }
addEventListener("hashchange", fromHash);
fromHash();
