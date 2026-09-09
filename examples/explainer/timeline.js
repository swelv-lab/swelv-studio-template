/* ===========================================================================
   The explainer timeline.

   One rule governs this whole file: renderFrame(t) is a PURE FUNCTION OF t.
   No Date.now(), no requestAnimationFrame, no CSS transitions, no randomness.
   The renderer screenshots t = 0 .. 1 across DUR seconds, so any impurity shows
   up as a frame that will not reproduce.

   Timings come from timings.js, which build.py generates from the measured
   narration. Change a word in script.json, re-run voice.py and build.py, and
   every animation below re-anchors itself.
   ========================================================================= */

const L = T.lines;
const SIGNOFF = 4.6; // the branded hold after the last word
const DUR = T.total + SIGNOFF;

/* -- easing ---------------------------------------------------------------- */
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => cl((t - a) / (b - a || 1e-6)); // 0..1 between two times
const eo = (x) => 1 - Math.pow(1 - x, 4); // easeOutQuart - the house rise
const eio = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const lerp = (a, b, p) => a + (b - a) * p;
/* a rise: fades up and settles. Every entrance in this video is this one move. */
const rise = (el, p, dy = 26) => {
  el.style.opacity = p;
  el.style.transform = `translateY(${(1 - eo(p)) * dy}px)`;
};

/* -- DOM helpers ----------------------------------------------------------- */
const E = (tag, cls, css, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (css) Object.assign(e.style, css);
  if (html != null) e.innerHTML = html;
  return e;
};
const scenesEl = document.getElementById("scenes");
const scenes = [];
function scene(id, from, to, chapter, build, draw) {
  const el = E("div", "scene");
  scenesEl.appendChild(el);
  const s = { id, from, to, chapter, el, draw, refs: {} };
  s.refs = build(el, s) || {};
  scenes.push(s);
  return s;
}

/* ===========================================================================
   1 · HOOK - the title, then the terminal it lives in
   ========================================================================= */
scene("hook", 0, L.brand1.start - 0.3, "What this is",
  (el, s) => {
    const t1 = E("div", "big", {}, 'A content studio<br>in your <span class="o">terminal</span>.');
    const t2 = E("div", "lede", {}, "You use it by talking to it.");
    el.append(t1, t2);
    return { t1, t2 };
  },
  (r, t) => {
    rise(r.t1, seg(t, 0.25, 1.15), 40);
    rise(r.t2, seg(t, 0.95, 1.75), 24);
    // a small settle: the title lifts as the sub arrives, so the pair reads as one move
    const s = 1 - 0.06 * eio(seg(t, 3.9, 4.9));
    r.t1.style.transform += ` scale(${s})`;
  });

/* ===========================================================================
   2 · BRAND - the interview, then one file, then everything wearing it
   ========================================================================= */
scene("brand", L.brand1.start - 0.3, L.ask.start - 0.3, "Your brand, once",
  (el) => {
    const term = E("div", "term");
    const bar = E("div", "bar", {}, "<i></i><i></i><i></i><span>/setup-brand</span>");
    const body = E("div", "body");
    const qa = [
      ['<span class="p">?</span>  What is your background colour', "#0a0e27"],
      ['<span class="p">?</span>  And your one accent', "#ff5100"],
      ['<span class="p">?</span>  How should the writing sound', "Precise. Never salesy."],
    ];
    const lines = qa.map(([q, a]) => {
      const wrap = E("div", "", { opacity: 0 });
      wrap.append(E("div", "ln ai", {}, q), E("div", "ln you", {}, "&nbsp;&nbsp;&nbsp;" + a));
      body.appendChild(wrap);
      return wrap;
    });
    term.append(bar, body);

    const file = E("div", "card", {
      position: "absolute", width: "780px", padding: "8px 38px", opacity: 0,
    });
    const head = E("div", "mono", {
      fontSize: "20px", color: "var(--faint)", letterSpacing: ".14em",
      textTransform: "uppercase", padding: "22px 0 8px",
    }, "brand-kit / brand.css");
    file.appendChild(head);
    const toks = [
      ["--bg", "#0a0e27", "#0a0e27"],
      ["--accent", "#ff5100", "#ff5100"],
      ["--sans", "Satoshi", null],
    ].map(([k, v, sw]) => {
      const row = E("div", "tokrow", { opacity: 0 });
      row.append(
        E("span", "k", {}, k),
        E("span", "v", {}, v),
        E("span", "sw", { background: sw || "transparent", borderColor: sw ? "var(--line)" : "transparent" })
      );
      file.appendChild(row);
      return row;
    });

    // the surfaces that inherit it
    const strip = E("div", "row", { position: "absolute", gap: "34px", opacity: 0 });
    const tiles = ["post", "slide", "card", "video"].map((name) => {
      const tile = E("div", "tile", { width: "244px", height: "305px" });
      tile.append(
        E("i", "tl", { width: "94px", background: "var(--line)" }),
        E("i", "tb", { top: "54px", width: "178px" }),
        E("i", "tb", { top: "80px", width: "138px" }),
        E("i", "tb", { top: "106px", width: "158px" }),
        E("span", "tcap", {}, name)
      );
      strip.appendChild(tile);
      return tile;
    });
    const el2 = E("div", "", { position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" });
    el2.append(term, file, strip);
    el.appendChild(el2);
    return { term, lines, file, toks, strip, tiles };
  },
  (r, t) => {
    const A = L.brand1.start, B = L.brand2.start;
    // the interview
    const out = eio(seg(t, B + 0.4, B + 1.1));
    r.term.style.opacity = eo(seg(t, A - 0.2, A + 0.4)) * (1 - out);
    r.term.style.transform = `translateY(${(1 - eo(seg(t, A - 0.2, A + 0.4))) * 30}px) scale(${1 - 0.08 * out})`;
    r.lines.forEach((ln, i) => {
      const p = eo(seg(t, A + 0.5 + i * 1.35, A + 1.2 + i * 1.35));
      ln.style.opacity = p;
      ln.style.transform = `translateY(${(1 - p) * 16}px)`;
    });
    // the file it writes
    const fin = eo(seg(t, B + 0.6, B + 1.3));
    r.file.style.opacity = fin;
    r.file.style.transform = `translateY(${lerp(40, 0, fin)}px)`;
    r.toks.forEach((row, i) => {
      const p = eo(seg(t, B + 1.0 + i * 0.42, B + 1.5 + i * 0.42));
      row.style.opacity = p;
      row.style.transform = `translateX(${(1 - p) * -18}px)`;
    });
    // and everything that inherits it
    const sin = seg(t, B + 3.0, B + 3.6);
    r.file.style.opacity = fin * (1 - eio(sin));
    r.strip.style.opacity = eo(sin);
    r.tiles.forEach((tile, i) => {
      const p = eo(seg(t, B + 3.1 + i * 0.16, B + 3.7 + i * 0.16));
      tile.style.transform = `translateY(${(1 - p) * 26}px)`;
      tile.style.opacity = p;
      // the accent arrives on each tile as it lands
      const c = seg(t, B + 3.5 + i * 0.16, B + 3.9 + i * 0.16);
      tile.querySelector(".tl").style.background = c > 0.5 ? "var(--accent)" : "var(--line)";
      tile.style.borderColor = c > 0.5 ? "var(--accent-line)" : "var(--line)";
    });
  });

/* ===========================================================================
   3 · ASK - you type a sentence, three slides come back
   ========================================================================= */
scene("ask", L.ask.start - 0.3, L.iterate.start - 0.25, "Just ask",
  (el) => {
    const prompt = E("div", "card", { padding: "26px 34px", width: "1200px", marginBottom: "62px" });
    const txt = E("div", "ln you", { fontSize: "32px", lineHeight: "1.4" },
      '<span class="p">&rsaquo;</span>  ');
    prompt.appendChild(txt);
    const row = E("div", "row", { gap: "34px" });
    const slides = [0, 1, 2].map((i) => {
      const sl = E("div", "card slide");
      sl.append(
        E("i", "tl", { top: "28px", left: "28px", width: "78px" }),
        E("i", "tb", { top: "78px", left: "28px", width: "0px", height: "16px", background: "var(--fg)" }),
        E("i", "tb", { top: "110px", left: "28px", width: "0px", height: "16px", background: "var(--fg)" }),
        E("i", "tb", { top: "160px", left: "28px", width: "0px" }),
        E("i", "tb", { top: "182px", left: "28px", width: "0px" }),
        E("div", "card", { position: "absolute", left: "28px", right: "28px", bottom: "32px", height: "0px", background: "var(--panel-2)", overflow: "hidden" })
      );
      row.appendChild(sl);
      return sl;
    });
    el.append(prompt, row);
    return { prompt, txt, row, slides };
  },
  (r, t) => {
    const A = L.ask.start, C = L.carousel.start;
    rise(r.prompt, eo(seg(t, A - 0.2, A + 0.35)), 22);
    // deterministic typing: characters revealed as a function of t
    const msg = "make a carousel about the new pricing";
    const n = Math.floor(cl(seg(t, A + 0.35, A + 2.5)) * msg.length);
    const caret = t % 1 < 0.55 ? '<span class="cursor">&#9614;</span>' : "";
    r.txt.innerHTML = '<span class="p">&rsaquo;</span>  ' + msg.slice(0, n) + (n < msg.length ? caret : "");
    // slides build: frame, then headline bars, then the panel
    r.slides.forEach((sl, i) => {
      const a = C + 0.5 + i * 0.55;
      const p = eo(seg(t, a, a + 0.55));
      sl.style.opacity = p;
      sl.style.transform = `translateY(${(1 - p) * 34}px) scale(${lerp(0.94, 1, p)})`;
      const bars = sl.querySelectorAll(".tb");
      const w = [208, 164, 236, 186];
      bars.forEach((b, j) => {
        b.style.width = eo(seg(t, a + 0.35 + j * 0.13, a + 0.75 + j * 0.13)) * w[j] + "px";
      });
      const panel = sl.querySelector("div.card");
      panel.style.height = eo(seg(t, a + 1.0, a + 1.45)) * 108 + "px";
      sl.querySelector(".tl").style.background =
        seg(t, a + 0.3, a + 0.5) > 0.5 ? "var(--accent)" : "var(--line)";
    });
  });

/* ===========================================================================
   4 · ITERATE - change one, it re-renders
   ========================================================================= */
scene("iterate", L.iterate.start - 0.25, L.deck.start - 0.25, "Change anything",
  (el) => {
    const say = E("div", "card", { padding: "24px 32px", width: "1000px", marginBottom: "56px" });
    say.appendChild(E("div", "ln you", { fontSize: "29px" },
      '<span class="p">&rsaquo;</span>  make slide two about the free tier'));
    const row = E("div", "row", { gap: "34px" });
    const slides = [0, 1, 2].map((i) => {
      const sl = E("div", "card slide");
      sl.append(
        E("i", "tl", { top: "28px", left: "28px", width: "78px" }),
        E("i", "tb", { top: "78px", left: "28px", width: "208px", height: "16px", background: "var(--fg)" }),
        E("i", "tb", { top: "110px", left: "28px", width: "164px", height: "16px", background: "var(--fg)" }),
        E("i", "tb", { top: "160px", left: "28px", width: "236px" }),
        E("div", "card", { position: "absolute", left: "28px", right: "28px", bottom: "32px", height: "108px", background: "var(--panel-2)" })
      );
      row.appendChild(sl);
      return sl;
    });
    const chip = E("div", "pill on", { marginTop: "44px", opacity: 0 }, "re-rendered in 2.1s");
    el.append(say, row, chip);
    return { say, slides, chip };
  },
  (r, t) => {
    const A = L.iterate.start;
    rise(r.say, eo(seg(t, A - 0.15, A + 0.4)), 20);
    r.slides.forEach((sl, i) => { sl.style.opacity = 1; });
    const sel = r.slides[1];
    // slide two gets picked, blanks, and comes back different
    const pick = seg(t, A + 1.0, A + 1.35);
    sel.classList.toggle("sel", pick > 0.5);
    const blank = seg(t, A + 1.6, A + 2.0);
    const back = seg(t, A + 2.2, A + 2.9);
    const bars = sel.querySelectorAll(".tb");
    const before = [208, 164, 236], after = [244, 128, 186];
    bars.forEach((b, j) => {
      const w = blank < 1 ? lerp(before[j], 0, eio(blank)) : lerp(0, after[j], eo(back));
      b.style.width = w + "px";
    });
    sel.querySelector("div.card").style.opacity = 1 - eio(blank) + eo(back);
    // a render sweep across the selected slide
    const sw = seg(t, A + 2.15, A + 2.75);
    sel.style.background = sw > 0 && sw < 1
      ? `linear-gradient(100deg, var(--panel) ${sw * 100 - 18}%, var(--accent-soft) ${sw * 100}%, var(--panel) ${sw * 100 + 18}%)`
      : "var(--panel)";
    rise(r.chip, eo(seg(t, A + 2.9, A + 3.3)), 14);
  });

/* ===========================================================================
   5 · DECK - seven slides, one PDF
   ========================================================================= */
scene("deck", L.deck.start - 0.25, L.video1.start - 0.25, "Decks",
  (el) => {
    const holder = E("div", "", { position: "relative", width: "1180px", height: "460px" });
    const slides = [];
    for (let i = 0; i < 7; i++) {
      const sl = E("div", "card", {
        position: "absolute", left: "50%", top: "90px", width: "304px", height: "172px",
        marginLeft: "-152px", transformOrigin: "50% 120%",
      });
      sl.append(
        E("i", "tl", { top: "20px", left: "20px", width: "50px" }),
        E("i", "tb", { top: "48px", left: "20px", width: "158px", height: "11px", background: "var(--fg)" }),
        E("i", "tb", { top: "70px", left: "20px", width: "112px" })
      );
      holder.appendChild(sl);
      slides.push(sl);
    }
    const pdf = E("div", "card", {
      position: "absolute", left: "50%", top: "110px", marginLeft: "-190px",
      width: "380px", height: "252px", opacity: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: "14px", borderColor: "var(--accent-line)",
      background: "var(--accent-soft)",
    });
    pdf.append(
      E("div", "mono", { fontSize: "58px", color: "var(--accent)", fontWeight: "700" }, "PDF"),
      E("div", "mono", { fontSize: "16px", color: "var(--muted)", letterSpacing: ".1em" }, "deck.pdf &middot; 7 slides")
    );
    holder.appendChild(pdf);
    el.appendChild(holder);
    return { slides, pdf };
  },
  (r, t) => {
    const A = L.deck.start;
    const fan = eo(seg(t, A + 0.2, A + 1.5));
    const collapse = eio(seg(t, A + 2.5, A + 3.4));
    r.slides.forEach((sl, i) => {
      const k = i - 3; // -3 .. 3
      const ang = k * 5.5 * fan * (1 - collapse);
      const x = k * 218 * fan * (1 - collapse);
      const p = eo(seg(t, A + 0.2 + i * 0.09, A + 0.8 + i * 0.09));
      sl.style.opacity = p * (1 - collapse * 0.85);
      sl.style.transform =
        `translateX(${x}px) translateY(${(1 - p) * 26}px) rotate(${ang}deg) scale(${lerp(0.9, 1, p) * (1 - 0.1 * collapse)})`;
      sl.style.zIndex = 10 - Math.abs(k);
    });
    rise(r.pdf, eo(seg(t, A + 3.1, A + 3.8)), 22);
  });

/* ===========================================================================
   6 · VIDEO - frames, then sound, from files
   ========================================================================= */
scene("video", L.video1.start - 0.25, L.essay.start - 0.25, "Video",
  (el) => {
    const title = E("div", "mono", {
      fontSize: "17px", letterSpacing: ".2em", textTransform: "uppercase",
      color: "var(--faint)", marginBottom: "26px",
    }, "every frame is one screenshot");
    const strip = E("div", "", { display: "flex", gap: "10px" });
    strip.id = "strip";
    const frames = [];
    for (let i = 0; i < 9; i++) {
      const fr = E("div", "fr");
      fr.appendChild(E("b", "", { width: "22px", height: "22px", left: "20px", top: "48px" }));
      strip.appendChild(fr);
      frames.push(fr);
    }
    const cueTitle = E("div", "mono", {
      fontSize: "17px", letterSpacing: ".2em", textTransform: "uppercase",
      color: "var(--faint)", margin: "46px 0 22px",
    }, "sound comes from a json file");
    const bottom = E("div", "", { display: "flex", alignItems: "flex-end", gap: "54px" });
    const cues = E("div", "card", { padding: "18px 26px", width: "430px" });
    const cueLines = [
      '{ "type": "whoosh", "t": 0.02 }',
      '{ "type": "tone",   "t": 0.31 }',
      '{ "type": "bell",   "t": 0.86 }',
    ].map((c) => {
      const d = E("div", "ln", { fontSize: "18px", lineHeight: "2.0", opacity: 0 }, c);
      cues.appendChild(d);
      return d;
    });
    const wave = E("div", "", { display: "flex", alignItems: "flex-end", gap: "5px", height: "96px" });
    wave.id = "wave";
    const bars = [];
    for (let i = 0; i < 34; i++) { const b = E("i"); wave.appendChild(b); bars.push(b); }
    bottom.append(cues, wave);
    el.append(title, strip, cueTitle, bottom);
    return { title, strip, frames, cueTitle, cues, cueLines, wave, bars };
  },
  (r, t) => {
    const A = L.video1.start, B = L.video2.start;
    rise(r.title, eo(seg(t, A - 0.1, A + 0.4)), 16);
    r.frames.forEach((fr, i) => {
      const p = eo(seg(t, A + 0.3 + i * 0.1, A + 0.8 + i * 0.1));
      fr.style.opacity = p;
      fr.style.transform = `translateY(${(1 - p) * 22}px)`;
      // the dot inside each frame steps along - the same motion, sampled
      const dot = fr.querySelector("b");
      const q = i / 8;
      dot.style.left = lerp(18, 78, q) + "px";
      dot.style.top = lerp(70, 24, q) + "px";
      dot.style.opacity = p;
    });
    // a playhead runs the strip
    const ph = seg(t, B + 0.6, B + 3.2);
    r.frames.forEach((fr, i) => {
      const hot = Math.abs(ph * 8 - i) < 0.6 ? 1 : 0;
      fr.style.borderColor = hot ? "var(--accent)" : "var(--line)";
    });
    rise(r.cueTitle, eo(seg(t, B + 2.6, B + 3.1)), 16);
    r.cueLines.forEach((c, i) => {
      const p = eo(seg(t, B + 3.0 + i * 0.4, B + 3.5 + i * 0.4));
      c.style.opacity = p;
      c.style.transform = `translateX(${(1 - p) * -14}px)`;
    });
    rise(r.cues, eo(seg(t, B + 2.8, B + 3.3)), 18);
    const wp = seg(t, B + 3.4, B + 6.2);
    r.wave.style.opacity = eo(seg(t, B + 3.3, B + 3.8));
    r.bars.forEach((b, i) => {
      const on = cl(wp * 34 - i);
      // a fixed, readable envelope - deterministic, no randomness anywhere
      const shape = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.31));
      b.style.height = 4 + on * shape * 88 + "px";
      b.style.opacity = 0.35 + 0.65 * on;
    });
  });

/* ===========================================================================
   7 · ESSAY - one file in, the whole kit out
   ========================================================================= */
scene("essay", L.essay.start - 0.25, L.calendar.start - 0.25, "Long-form",
  (el) => {
    const wrap = E("div", "", { display: "flex", alignItems: "center", gap: "56px" });
    const md = E("div", "card", { width: "372px", height: "470px", position: "relative", padding: "32px" });
    md.appendChild(E("div", "mono", { fontSize: "15px", color: "var(--accent)", letterSpacing: ".12em" }, "post.md"));
    for (let i = 0; i < 9; i++) {
      md.appendChild(E("i", "tb", {
        position: "relative", display: "block", marginTop: i === 0 ? "26px" : "13px",
        left: "0", width: [200, 168, 214, 140, 196, 178, 150, 206, 120][i] + "px",
      }));
    }
    const arrow = E("div", "", { fontSize: "40px", color: "var(--faint)", opacity: 0 }, "&rarr;");
    const outs = E("div", "", { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px" });
    const labels = ["article page", "hero image", "share card", "caption"];
    const cards = labels.map((lab) => {
      const c = E("div", "card", {
        width: "330px", height: "218px", position: "relative", opacity: 0,
        display: "flex", alignItems: "flex-end", padding: "18px",
      });
      c.append(
        E("i", "tl", { top: "18px", left: "18px", width: "50px" }),
        E("i", "tb", { top: "44px", left: "18px", width: "150px", height: "11px", background: "var(--fg)" }),
        E("i", "tb", { top: "66px", left: "18px", width: "108px" }),
        E("div", "mono", { fontSize: "13px", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--faint)" }, lab)
      );
      outs.appendChild(c);
      return c;
    });
    wrap.append(md, arrow, outs);
    el.appendChild(wrap);
    return { md, arrow, cards };
  },
  (r, t) => {
    const A = L.essay.start;
    rise(r.md, eo(seg(t, A - 0.1, A + 0.5)), 26);
    r.arrow.style.opacity = eo(seg(t, A + 0.7, A + 1.1));
    r.cards.forEach((c, i) => {
      const p = eo(seg(t, A + 1.1 + i * 0.5, A + 1.75 + i * 0.5));
      c.style.opacity = p;
      c.style.transform = `translateY(${(1 - p) * 26}px) scale(${lerp(0.93, 1, p)})`;
      c.style.borderColor = p > 0.8 ? "var(--accent-line)" : "var(--line)";
    });
  });

/* ===========================================================================
   8 · CALENDAR - say it shipped, the board updates
   ========================================================================= */
scene("calendar", L.calendar.start - 0.25, L.agnostic.start - 0.25, "The calendar",
  (el) => {
    const say = E("div", "card", { padding: "18px 26px", width: "620px", marginBottom: "38px" });
    say.appendChild(E("div", "ln you", { fontSize: "23px" }, '<span class="p">&rsaquo;</span>  the pricing carousel went out'));
    const board = E("div", "card", { width: "1080px", padding: "12px 12px 22px" });
    const items = [
      ["Pricing carousel", "Mon"], ["Founder note", "Tue"],
      ["Product video", "Wed"], ["Glossary card", "Thu"], ["Long read", "Fri"],
    ];
    const rows = items.map(([txt, day]) => {
      const row = E("div", "crow");
      const box = E("div", "box");
      box.appendChild(E("div", "tick", {}, "&#10003;"));
      row.append(box, E("div", "t", {}, txt), E("div", "d", {}, day));
      board.appendChild(row);
      return row;
    });
    const barWrap = E("div", "", { width: "1040px", height: "6px", background: "var(--line-soft)", borderRadius: "3px", margin: "26px auto 0", overflow: "hidden" });
    const bar = E("i", "", { display: "block", height: "100%", width: "0", background: "var(--accent)" });
    barWrap.appendChild(bar);
    const count = E("div", "mono", { fontSize: "20px", color: "var(--muted)", marginTop: "18px", letterSpacing: ".1em" }, "0 / 5 shipped");
    el.append(say, board, barWrap, count);
    return { say, board, rows, bar, count };
  },
  (r, t) => {
    const A = L.calendar.start;
    rise(r.say, eo(seg(t, A - 0.15, A + 0.4)), 20);
    rise(r.board, eo(seg(t, A + 0.2, A + 0.8)), 24);
    let done = 0;
    r.rows.forEach((row, i) => {
      const p = seg(t, A + 1.1 + i * 0.42, A + 1.45 + i * 0.42);
      const box = row.querySelector(".box");
      const on = p > 0.5;
      if (on) done++;
      box.style.background = on ? "var(--accent)" : "transparent";
      box.style.borderColor = on ? "var(--accent)" : "var(--line)";
      box.style.transform = `scale(${1 + 0.22 * Math.sin(Math.PI * cl(p))})`;
      box.querySelector(".tick").style.opacity = on ? 1 : 0;
      const label = row.querySelector(".t");
      label.style.textDecoration = on ? "line-through" : "none";
      label.style.color = on ? "var(--faint)" : "var(--muted)";
    });
    r.bar.style.width = (done / 5) * 100 + "%";
    r.count.textContent = done + " / 5 shipped";
    r.count.style.opacity = eo(seg(t, A + 0.9, A + 1.3));
  });

/* ===========================================================================
   9 · AGENT AGNOSTIC - it is files, so bring your own model
   ========================================================================= */
scene("agnostic", L.agnostic.start - 0.25, L.hour.start - 0.25, "Bring your own model",
  (el) => {
    const chips = E("div", "row", { gap: "20px", marginBottom: "56px" });
    const models = ["Claude", "GPT", "Gemini", "Llama", "whatever is next"].map((m) => {
      const c = E("div", "pill", { opacity: 0, fontSize: "19px" }, m);
      chips.appendChild(c);
      return c;
    });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 900 130");
    Object.assign(svg.style, { width: "900px", height: "130px", display: "block" });
    const paths = [];
    for (let i = 0; i < 5; i++) {
      const x = 90 + i * 180;
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", `M ${x} 4 C ${x} 70, 450 60, 450 124`);
      p.setAttribute("stroke", "var(--accent)");
      p.setAttribute("stroke-width", "2");
      p.setAttribute("fill", "none");
      svg.appendChild(p);
      paths.push(p);
    }
    const folder = E("div", "card", {
      padding: "26px 40px", borderColor: "var(--accent-line)", background: "var(--accent-soft)",
      display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", opacity: 0,
    });
    folder.append(
      E("div", "mono", { fontSize: "26px", color: "var(--accent)" }, ".claude / skills"),
      E("div", "mono", { fontSize: "16px", color: "var(--muted)", letterSpacing: ".08em" }, "plain markdown instructions")
    );
    const note = E("div", "lede", { marginTop: "40px", opacity: 0 }, "No lock-in. It is a folder of files, in your git repo.");
    el.append(chips, svg, folder, note);
    return { models, paths, folder, note, svg };
  },
  (r, t) => {
    const A = L.agnostic.start;
    r.models.forEach((c, i) => {
      const p = eo(seg(t, A + 0.2 + i * 0.28, A + 0.75 + i * 0.28));
      c.style.opacity = p;
      c.style.transform = `translateY(${(1 - p) * -22}px)`;
      if (i === 4) c.classList.toggle("on", p > 0.9);
    });
    r.paths.forEach((p, i) => {
      const len = 150;
      const d = eo(seg(t, A + 1.5 + i * 0.16, A + 2.3 + i * 0.16));
      p.setAttribute("stroke-dasharray", len);
      p.setAttribute("stroke-dashoffset", (1 - d) * len);
      p.setAttribute("opacity", 0.25 + 0.55 * d);
    });
    r.svg.style.opacity = eo(seg(t, A + 1.4, A + 1.8));
    rise(r.folder, eo(seg(t, A + 2.4, A + 3.0)), 22);
    rise(r.note, eo(seg(t, A + 4.6, A + 5.2)), 18);
  });

/* ===========================================================================
   10 · THE HOUR - a Monday, and the week that comes out of it
   ========================================================================= */
scene("hour", L.hour.start - 0.25, L.close.start - 0.25, "The point",
  (el) => {
    const wrap = E("div", "", { display: "flex", alignItems: "center", gap: "80px" });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    Object.assign(svg.style, { width: "268px", height: "268px" });
    const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ring.setAttribute("cx", 50); ring.setAttribute("cy", 50); ring.setAttribute("r", 44);
    ring.setAttribute("stroke", "var(--line)"); ring.setAttribute("stroke-width", 6); ring.setAttribute("fill", "none");
    const arc = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    arc.setAttribute("cx", 50); arc.setAttribute("cy", 50); arc.setAttribute("r", 44);
    arc.setAttribute("stroke", "var(--accent)"); arc.setAttribute("stroke-width", 6);
    arc.setAttribute("fill", "none"); arc.setAttribute("stroke-linecap", "round");
    arc.setAttribute("transform", "rotate(-90 50 50)");
    svg.append(ring, arc);
    const left = E("div", "", { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" });
    const lab = E("div", "mono", { fontSize: "17px", letterSpacing: ".18em", textTransform: "uppercase", color: "var(--faint)" }, "one hour, monday");
    left.append(svg, lab);
    const week = E("div", "", { display: "flex", gap: "18px" });
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => {
      const c = E("div", "card", { width: "190px", height: "248px", position: "relative", opacity: 0 });
      c.append(
        E("i", "tl", { top: "20px", left: "18px", width: "56px" }),
        E("i", "tb", { top: "54px", left: "18px", width: "142px", height: "13px", background: "var(--fg)" }),
        E("i", "tb", { top: "78px", left: "18px", width: "108px" }),
        E("span", "tcap", { bottom: "12px", color: "var(--muted)" }, d)
      );
      week.appendChild(c);
      return c;
    });
    wrap.append(left, week);
    el.appendChild(wrap);
    return { arc, left, days, lab };
  },
  (r, t) => {
    const A = L.hour.start;
    rise(r.left, eo(seg(t, A - 0.15, A + 0.4)), 20);
    const C = 2 * Math.PI * 44;
    const sweep = eio(seg(t, A + 0.2, A + 2.0));
    r.arc.setAttribute("stroke-dasharray", C);
    r.arc.setAttribute("stroke-dashoffset", C * (1 - sweep));
    r.days.forEach((c, i) => {
      const p = eo(seg(t, A + 0.7 + i * 0.24, A + 1.25 + i * 0.24));
      c.style.opacity = p;
      c.style.transform = `translateY(${(1 - p) * 30}px) scale(${lerp(0.92, 1, p)})`;
      c.style.borderColor = p > 0.85 ? "var(--accent-line)" : "var(--line)";
    });
  });

/* ===========================================================================
   11 · CLOSE
   ========================================================================= */
scene("close", L.close.start - 0.25, T.total + 0.25, "Open source",
  (el) => {
    const t1 = E("div", "big", {}, 'Open source.<br>Yours in <span class="o">five minutes</span>.');
    const chips = E("div", "row", { gap: "16px", marginTop: "40px" });
    ["MIT licensed", "no account", "nothing hosted"].map((c) =>
      chips.appendChild(E("div", "pill", { opacity: 0 }, c)));
    el.append(t1, chips);
    return { t1, chips: [...chips.children] };
  },
  (r, t) => {
    const A = L.close.start;
    rise(r.t1, eo(seg(t, A - 0.2, A + 0.5)), 34);
    r.chips.forEach((c, i) => {
      const p = eo(seg(t, A + 0.8 + i * 0.22, A + 1.3 + i * 0.22));
      c.style.opacity = p;
      c.style.transform = `translateY(${(1 - p) * 18}px)`;
    });
  });

/* ===========================================================================
   12 · SIGN-OFF - the mark lands, and the frame is held.
   Feeds freeze on the last frame, so it has to be the full brand, fully
   visible. Nothing goes after this.
   ========================================================================= */
scene("signoff", T.total + 0.25, DUR + 1, "",
  (el) => {
    const lock = E("div", "logo-lockup", { fontSize: "152px", opacity: 0 });
    lock.appendChild(E("span", "wordmark", {}, "swel"));
    const wrap = E("div", "", { display: "flex", flexDirection: "column", alignItems: "center", gap: "34px" });
    const motto = E("div", "", {
      fontFamily: "var(--sans)", fontWeight: "700", fontSize: "46px",
      letterSpacing: "-0.02em", opacity: 0,
    }, '<span style="color:var(--accent)">Content infrastructure</span> <span style="color:var(--fg)">in motion.</span>');
    const url = E("div", "mono", { fontSize: "26px", color: "var(--muted)", letterSpacing: ".08em", opacity: 0 }, "github.com/swelv-lab/studio");
    wrap.append(lock, motto, url);
    el.appendChild(wrap);
    return { lock, motto, url };
  },
  (r, t) => {
    const A = T.total + 0.3;
    // the mark drops in rather than drawing itself
    const d = eo(seg(t, A, A + 0.7));
    r.lock.style.opacity = d;
    r.lock.style.transform = `translateY(${(1 - d) * -46}px)`;
    rise(r.motto, eo(seg(t, A + 0.75, A + 1.35)), 20);
    rise(r.url, eo(seg(t, A + 1.25, A + 1.8)), 16);
  });

/* ===========================================================================
   The frame
   ========================================================================= */
const subEl = document.getElementById("sub");
const chapEl = document.getElementById("chapter");
const progEl = document.querySelector("#prog i");
const lineList = Object.entries(L);

window.renderFrame = function (t01) {
  const t = cl(t01, 0, 1) * DUR;

  // scenes cross-fade; only the active pair is painted
  let chapter = "";
  scenes.forEach((s) => {
    const fin = seg(t, s.from, s.from + 0.4);
    const fout = 1 - seg(t, s.to - 0.32, s.to);
    const vis = cl(Math.min(fin, fout));
    s.el.style.opacity = vis;
    s.el.style.transform = `scale(${lerp(0.985, 1, eo(vis))})`;
    s.el.style.pointerEvents = "none";
    if (vis > 0.5 && s.chapter) chapter = s.chapter;
    if (vis > 0.001) s.draw(s.refs, t);
  });

  chapEl.textContent = chapter;
  chapEl.style.opacity = chapter ? 1 : 0;

  // subtitles: the line being spoken, faded at its edges
  let sub = "", a = 0;
  for (const [id, ln] of lineList) {
    if (t >= ln.start - 0.25 && t <= ln.end + 0.35) {
      sub = ln.text;
      a = Math.min(seg(t, ln.start - 0.25, ln.start + 0.05), 1 - seg(t, ln.end + 0.1, ln.end + 0.35));
    }
  }
  subEl.textContent = sub;
  subEl.style.opacity = cl(a);

  progEl.style.width = (t / DUR) * 100 + "%";
};

// the no-node fallback path drives the page by URL hash
function fromHash() {
  const h = parseFloat(location.hash.slice(1));
  window.renderFrame(isNaN(h) ? 0 : h);
}
addEventListener("hashchange", fromHash);
fromHash();
