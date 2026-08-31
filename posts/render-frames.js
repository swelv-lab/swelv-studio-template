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
// Writes <outDir>/f-0000.png … at t = k / (frames-1).  Needs `npm install` first.

const path = require("path");
const puppeteer = require("puppeteer-core");

(async () => {
  const [htmlAbs, wS, hS, framesS, outDir, chromePath] = process.argv.slice(2);
  const w = parseInt(wS, 10);
  const h = parseInt(hS, 10);
  const frames = parseInt(framesS, 10);
  const exe = chromePath || "/usr/bin/google-chrome-stable";

  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-color-profile=srgb",
    ],
    defaultViewport: { width: w, height: h, deviceScaleFactor: 1 },
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
