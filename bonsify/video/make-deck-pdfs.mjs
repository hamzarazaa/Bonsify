#!/usr/bin/env node
// Renders each brand's pitch deck (the 8 slides of the Proposal tab) to a PDF, one slide per page.
//
//   (app running on :3100)   node video/make-deck-pdfs.mjs [slug ...]
//
// Output: video/out/decks/<slug>-deck.pdf. Upload them with the videos:
//   node video/upload-blob.mjs video/out/decks
// The pages link to <blob base>/<slug>-deck.pdf. Slides are captured as 1920x1080 images, so the PDF
// looks exactly like the live deck. Needs Playwright and Python Pillow.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "video", "out", "decks");
const WORK = path.join(ROOT, "video", "work", "_deck");
// Default is the live site: the deck shows the shipped-apps slide only when the public showcase assets exist.
const ORIGIN = process.env.ORIGIN || "https://bonsify.io";
const IDS = ["cover", "today", "why", "plan", "apps", "work", "process", "next"];
fs.mkdirSync(OUT, { recursive: true });

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
let pw;
for (const spec of ["playwright", "/opt/node22/lib/node_modules/playwright"]) { try { pw = require(spec); break; } catch {} }
if (!pw) throw new Error("Playwright not found. Run: npm i -D playwright");
const { chromium } = pw;
const all = fs.readdirSync(path.join(ROOT, "content", "proposals")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : all.filter((s) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, "content", "proposals", s + ".json"), "utf8")).video?.ready; } catch { return false; } });

const browser = await chromium.launch();
const queue = [...slugs];
let done = 0;
async function worker() {
  const ctx = await browser.newContext({ viewport: { width: 2000, height: 1250 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  while (queue.length) {
    const slug = queue.shift();
    const pdf = path.join(OUT, `${slug}-deck.pdf`);
    if (fs.existsSync(pdf) && !process.env.FORCE) { console.log(`skip ${slug}`); continue; }
    const dir = path.join(WORK, slug);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    try {
      await page.goto(`${ORIGIN}/for/${slug}?tab=deck&record=1`, { waitUntil: "load", timeout: 60000 });
      await page.waitForSelector("[id^=slide-]", { timeout: 30000 });
      await page.addStyleTag({ content: "[id^=slide-]{border-radius:0!important;box-shadow:none!important}" });
      for (let n = 0; n < IDS.length; n++) {
        await page.evaluate((k) => window.__proposal.slide(k), IDS[n]);
        await page.waitForSelector(`#slide-${IDS[n]}`, { timeout: 15000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(900);
        const el = await page.$(`#slide-${IDS[n]}`);
        await el.screenshot({ path: path.join(dir, `${String(n + 1).padStart(2, "0")}.jpg`), type: "jpeg", quality: 90 });
      }
      execFileSync("python3", ["-c", "import sys,glob\nfrom PIL import Image\nf=sorted(glob.glob(sys.argv[1]+'/*.jpg'))\nims=[Image.open(x).convert('RGB') for x in f]\nims[0].save(sys.argv[2],save_all=True,append_images=ims[1:],resolution=144.0)", dir, pdf]);
      console.log(`${++done}/${slugs.length} ${slug} (${(fs.statSync(pdf).size / 1e6).toFixed(1)} MB)`);
    } catch (e) { console.log(`FAIL ${slug}: ${e.message.split("\n")[0]}`); }
  }
  await ctx.close();
}
await Promise.all(Array.from({ length: Number(process.env.PAR || 2) }, worker));
await browser.close();
console.log(`Done. PDFs in ${OUT}`);
