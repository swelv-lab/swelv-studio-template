// Fast frame renderer: one persistent Chrome renders every timeline frame.
//
// The old path launched a fresh headless Chrome per frame (~1s each) — fine for a
// still, painful for a 300-frame video. This opens the page ONCE (fonts load once)
// and calls window.renderFrame(t) + screenshot per frame, so hundreds of frames
// take seconds. render-video.sh uses this when node + puppeteer-core are present,
// and falls back to the per-frame Chrome launch otherwise.
//
//   node render-frames.js <htmlAbsPath> <w> <h> <frames> <outDir> [chromePath]
//
// <w>/<h> are CSS pixels — the size the page lays itself out at. Frames are
// rasterised at RENDER_SCALE times that, which leaves the layout identical and
// only makes the pixel grid under it finer. Accepts a decimal or an exact
// fraction ("4/3"); prefer the fraction so the target lands on a whole pixel.
//
// Leave it unset. 1x is the right answer for almost every video — see the
// "Master size" section of the new-video skill for the one exception, and for
// why rendering video at 2x is a mistake rather than a quality setting.
//
// Writes <outDir>/f-0000.png … at t = k / (frames-1).  Needs `npm install` first.

const path = require("path");
const puppeteer = require("puppeteer-core");

(async () => {
  const [htmlAbs, wS, hS, framesS, outDir, chromePath] = process.argv.slice(2);
  const w = parseInt(wS, 10);
  const h = parseInt(hS, 10);
  const frames = parseInt(framesS, 10);
  const exe = chromePath || "/usr/bin/google-chrome-stable";
  // "4/3" or "1.5" or unset.
  const rawScale = process.env.RENDER_SCALE;
  const scale = !rawScale
    ? 1
    : rawScale.includes("/")
      ? rawScale.split("/").reduce((a, b) => Number(a) / Number(b))
      : Number(rawScale);
  if (!Number.isFinite(scale) || scale <= 0) throw new Error(`bad RENDER_SCALE: ${rawScale}`);

  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-color-profile=srgb",
    ],
    defaultViewport: { width: w, height: h, deviceScaleFactor: scale },
  });

  try {
    const page = await browser.newPage();
    await page.goto("file://" + htmlAbs + "#0", { waitUntil: "networkidle0" });
    // Make sure the Fontshare fonts are ready before the first shot.
    try {
      await page.evaluate(() => document.fonts && document.fonts.ready);
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 400));

    const last = frames - 1;
    for (let k = 0; k < frames; k++) {
      const t = last > 0 ? k / last : 0;
      await page.evaluate((tt) => window.renderFrame(tt), t);
      const n = String(k).padStart(4, "0");
      await page.screenshot({
        path: path.join(outDir, "f-" + n + ".png"),
        clip: { x: 0, y: 0, width: w, height: h },
      });
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
