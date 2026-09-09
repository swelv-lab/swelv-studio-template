#!/usr/bin/env python3
"""Turn a deck into one self-contained HTML file that presents AND renders.

    ./present.py _template          -> output/_template-present.html

The deck you already have is the source. Nothing gets duplicated: this reads
the same slide files that render.sh turns into PNGs, inlines them with the brand
kit, and adds a generic build animation driven off the slide furniture every
deck in this studio shares (.skicker, .stitle, .slead, .statband, and so on).

The result is one file with no dependencies, and two ways to drive it:

  open it in a browser   arrow keys, space to play, click to advance
  render-video.sh        it exposes renderFrame(t), so it captures like any
                         other video in the repo

So a deck is written once and shipped three ways: PNGs, a PDF, and a
walkthrough.
"""
import os, re, sys, glob, html

HERE = os.path.dirname(os.path.abspath(__file__))
deck = (sys.argv[1] if len(sys.argv) > 1 else "").strip("/") or sys.exit(
    "usage: ./present.py <deck>   e.g. ./present.py _template")
src = os.path.join(HERE, "src", deck)
os.path.isdir(src) or sys.exit(f"no deck at src/{deck}")

BUILD = float(os.environ.get("BUILD", 2.6))   # seconds of build per slide
HOLD = float(os.environ.get("HOLD", 2.2))     # still time before the cut
XFADE = float(os.environ.get("XFADE", 0.55))


def read(p):
    return open(p, encoding="utf-8").read()


def scope_css(css, sel):
    """Prefix every rule in a slide's own <style> with its slide id, so two
    slides can both define .motto without one winning."""
    out, i = [], 0
    for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", css, re.S):
        head, body = m.group(1).strip(), m.group(2)
        out.append(css[i:m.start()])
        i = m.end()
        if head.startswith("@"):          # @media / @font-face: leave alone
            out.append(m.group(0))
            continue
        parts = []
        for one in head.split(","):
            one = one.strip()
            if not one:
                continue
            # `.canvas` and `.stage` are the slide's own frame here
            one = re.sub(r"^\.canvas\b", "", one).strip() or "&"
            parts.append(f"{sel} {one}".replace("& ", "").replace(" &", "")
                         if one != "&" else sel)
        out.append(", ".join(parts) + " {" + body + "}")
    out.append(css[i:])
    return "".join(out)


slides = sorted(glob.glob(os.path.join(src, "*.html")))
slides or sys.exit(f"no slides in src/{deck}")

brand = read(os.path.join(HERE, "..", "brand-kit", "brand.css"))
deckcss_path = os.path.join(src, "deck.css")
deckcss = read(deckcss_path) if os.path.exists(deckcss_path) else ""

bodies, styles, names = [], [], []
for n, f in enumerate(slides, 1):
    raw = read(f)
    sid = f"s{n:02d}"
    st = re.search(r"<style>(.*?)</style>", raw, re.S)
    if st:
        styles.append(f"/* --- {os.path.basename(f)} --- */\n"
                      + scope_css(st.group(1), f"#{sid}"))
    m = re.search(r'<div class="canvas([^"]*)">(.*?)</div>\s*</body>', raw, re.S)
    inner = m.group(2) if m else ""
    extra = (m.group(1).strip() if m else "")
    bodies.append(f'      <section class="dslide {extra}" id="{sid}">\n{inner}\n      </section>')
    names.append(os.path.splitext(os.path.basename(f))[0])

TPL = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>%(deck)s</title>
    <style>
/* ===== brand kit (inlined) ===================================== */
%(brand)s
/* ===== deck layout (inlined) =================================== */
%(deckcss)s
/* ===== presenter =============================================== */
html, body {
  background: var(--bg); margin: 0; padding: 0;
  width: 100%%; height: 100%%; overflow: hidden;
}
/* The deck is a fixed 1920x1080 block scaled to fit the window. Everything the
   presenter draws lives INSIDE that block, in its coordinate space, so it all
   scales together and stays put at any window size.
   The page background is the brand ground, so the letterbox on a window that is
   not 16:9 is invisible rather than a band. */
#fit {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
#deck {
  position: relative; width: 1920px; height: 1080px; flex: none;
  transform-origin: 50%% 50%%; background: var(--bg); overflow: hidden;
}
.dslide {
  position: absolute; inset: 0; opacity: 0;
  background: var(--bg); color: var(--fg); font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
}
.dslide::after {
  content: ""; position: absolute; inset: var(--frame);
  border: 1px solid var(--hairline); pointer-events: none;
}
.dslide .stage {
  position: absolute; inset: var(--frame); padding: 92px 104px;
  display: flex; flex-direction: column;
}
/* elements the animator moves - it sets opacity/transform per frame */
.anim { will-change: opacity, transform; }
    </style>
    <style>
%(styles)s
    </style>
  </head>
  <body>
    <div id="fit"><div id="deck">
%(bodies)s
    </div></div>
    <script>
%(js)s
    </script>
  </body>
</html>
"""

JS = """/* ===========================================================================
   ONE DRAW FUNCTION, TWO DRIVERS.

     renderFrame(t)  pure function of time. No clock, no randomness, no CSS
                     animation. This is what the frame renderer screenshots.
     present mode    a requestAnimationFrame loop driving that same function,
                     with arrow keys, for when a person opens the file.

   The clock lives in the driver, never in the drawing. That is why the MP4 is
   reproducible frame for frame and this file is still presentable.

   The build animation is GENERIC: it reads the slide furniture every deck in
   this studio shares, so no slide contains any animation code of its own.
   ========================================================================= */
const BUILD = %(build)s, HOLD = %(hold)s, XFADE = %(xfade)s;
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => cl((t - a) / (b - a || 1e-6));
const eo = (x) => 1 - Math.pow(1 - x, 4);
const lerp = (a, b, p) => a + (b - a) * p;

const SLIDES = [...document.querySelectorAll(".dslide")].map((el, i) => {
  /* The order things arrive in. Anything matching an earlier selector keeps
     its earlier place, so a slide reads top-down however it is built. */
  const ORDER = [
    ".shead", ".skicker", ".stitle", ".motto > *", ".slead", ".desc",
    ".statband .cell", ".points .point", ".compare .row", ".team > div",
    ".closemotto", ".ask", ".cta", ".backed", ".sfoot",
  ];
  const seen = new Set(), parts = [];
  ORDER.forEach((sel) => el.querySelectorAll(sel).forEach((n) => {
    if (!seen.has(n)) { seen.add(n); n.classList.add("anim"); parts.push(n); }
  }));
  return { el, parts, start: i * (BUILD + HOLD), dur: BUILD + HOLD };
});
const DUR = SLIDES.length * (BUILD + HOLD);

function fit() {
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  document.getElementById("deck").style.transform = "scale(" + s + ")";
}
addEventListener("resize", fit);
addEventListener("orientationchange", fit);
fit();

window.renderFrame = function (t01) {
  const t = cl(t01, 0, 1) * DUR;
  SLIDES.forEach((s, i) => {
    const last = i === SLIDES.length - 1;
    const fin = seg(t, s.start, s.start + XFADE);
    /* Fade OUT across the next slide's fade IN, not before it. Ending the
       outgoing fade where the incoming one begins leaves a frame or two of
       bare background at every boundary - which is exactly what it looked
       like. The final slide never fades: players freeze on the last frame. */
    const fout = last ? 1 : 1 - seg(t, s.start + s.dur, s.start + s.dur + XFADE);
    const vis = cl(Math.min(fin, fout));
    s.el.style.opacity = vis;
    s.el.style.transform = "translateX(" + lerp(30, 0, eo(fin)) + "px)";
    if (vis > 0.001) {
      const u = t - s.start;
      const step = BUILD / Math.max(s.parts.length, 1);
      s.parts.forEach((n, j) => {
        const p = eo(seg(u, 0.25 + j * step * 0.72, 0.25 + j * step * 0.72 + step + 0.45));
        n.style.opacity = p;
        n.style.transform = "translateY(" + (1 - p) * 26 + "px)";
      });
    }
  });
};

const isRender = location.hash !== "" || navigator.webdriver;
if (isRender) {
  const fromHash = () => { const h = parseFloat(location.hash.slice(1));
    window.renderFrame(isNaN(h) ? 0 : h); };
  addEventListener("hashchange", fromHash); fromHash();
} else {
  let t = 0, playing = true, last = performance.now();
  const draw = () => window.renderFrame(t / DUR);
  const cur = () => cl(Math.floor(t / (BUILD + HOLD)), 0, SLIDES.length - 1);
  const go = (i) => { t = cl(i, 0, SLIDES.length - 1) * (BUILD + HOLD) + 0.001;
    playing = true; draw(); };
  addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === "n") { go(cur() + 1); e.preventDefault(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp" || e.key === "p") { go(cur() - 1); e.preventDefault(); }
    else if (e.key === " ") { playing = !playing; e.preventDefault(); }
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(SLIDES.length - 1);
  });
  addEventListener("click", () => go(cur() + 1));
  (function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.1); last = now;
    if (playing) {
      t += dt;
      const rest = (cur() + 1) * (BUILD + HOLD) - HOLD * 0.45;
      if (t > rest) { t = rest; playing = false; }
      if (t >= DUR) { t = DUR - 0.001; playing = false; }
    }
    draw(); requestAnimationFrame(loop);
  })(performance.now());
}
"""

out_dir = os.path.join(HERE, "output")
os.makedirs(out_dir, exist_ok=True)
out = os.path.join(out_dir, f"{deck}-present.html")
open(out, "w", encoding="utf-8").write(TPL % dict(
    deck=html.escape(deck.strip("_").replace("-", " ") + " · deck"),
    brand=brand, deckcss=deckcss, styles="\n".join(styles),
    bodies="\n".join(bodies),
    js=JS % dict(build=BUILD, hold=HOLD, xfade=XFADE)))

# A matching cue sheet, derived from the slide starts. render-video.sh picks up
# a <name>.audio.json sitting beside the HTML and synthesizes it - no audio
# files, no licensing. Sparse on purpose: a deck gets talked over.
import json
cues = [{"type": "whoosh", "time": 0.05, "dur": 0.9, "gain": 0.08}]
for i in range(len(slides)):
    t0 = i * (BUILD + HOLD)
    if i:
        cues.append({"type": "whoosh", "time": round(t0 - 0.05, 2), "dur": 0.5, "gain": 0.05})
    for j in range(3):  # three soft ticks as the slide builds
        cues.append({"type": "tone", "time": round(t0 + 0.55 + j * 0.42, 2),
                     "freq": 587.33, "dur": 0.24, "gain": 0.05})
end = (len(slides) - 1) * (BUILD + HOLD) + BUILD
cues.append({"type": "bell", "time": round(end + 0.2, 2), "freq": 587.33, "dur": 1.5, "gain": 0.11})
cues.append({"type": "chord", "time": round(end + 0.35, 2),
             "freqs": [293.66, 440.00, 587.33], "dur": 2.2, "gain": 0.04})
json.dump({"_comment": f"Generated by present.py for the {deck} deck. Regenerated on every run.",
           "seed": 20260901, "cues": cues},
          open(os.path.join(out_dir, f"{deck}-present.audio.json"), "w"), indent=2)

secs = len(slides) * (BUILD + HOLD)
print(f"wrote output/{deck}-present.html + .audio.json")
print(f"  {len(slides)} slides · {secs:.1f}s as a walkthrough · open it, or:")
print(f"  ../posts/render-video.sh $(pwd)/output/{deck}-present.html 1920 1080 "
      f"{round(secs * 30)} 30 0 0 0")
