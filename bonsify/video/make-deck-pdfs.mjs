#!/usr/bin/env node
// Renders each brand's pitch deck (the 8 slides of the Proposal tab) to a PDF, one slide per page.
//
//   node video/make-deck-pdfs.mjs [slug ...]      (FORCE=1 to redo existing)
//
// Output: public/decks/<slug>-deck.pdf. Commit them; the pages show a Download PDF link when the file exists. Slides are captured as 1920x1080 images, so the PDF
// looks exactly like the live deck. Needs Playwright and Python Pillow.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.env.OUT || path.join(ROOT, "public", "decks");
const WORK = path.join(ROOT, "video", "work", "_deck");
// Render against the built app (start it with NEXT_PUBLIC_SHOW_BACHAPARTY/HIGHFY/CREEDVINTAGE=true so the shipped-apps slide has content).
const ORIGIN = process.env.ORIGIN || "http://localhost:3100";
const IDS = ["cover", "today", "why", "plan", "try", "apps", "work", "process", "next"];
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
      // the slide hook is attached after the page hydrates, which can be slow on a cold dev server
      await page.waitForFunction(() => window.__proposal && typeof window.__proposal.slide === "function", null, { timeout: 90000 });
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
      execFileSync("python3", [path.join(ROOT, "video", "pdf-assemble.py"), dir, pdf]);
      console.log(`${++done}/${slugs.length} ${slug} (${(fs.statSync(pdf).size / 1e6).toFixed(1)} MB)`);
    } catch (e) { console.log(`FAIL ${slug}: ${e.message.split("\n")[0]}`); }
  }
  await ctx.close();
}
await Promise.all(Array.from({ length: Number(process.env.PAR || 2) }, worker));
await browser.close();
console.log(`Done. PDFs in ${OUT}`);
