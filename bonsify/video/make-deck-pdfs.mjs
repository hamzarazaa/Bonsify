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
const PHONE = process.env.PHONE || "+92 313 5988352";
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
      await page.addStyleTag({ content: "[id^=slide-]{border-radius:0!important;box-shadow:none!important} [class*=docHead]{grid-template-columns:1.4fr 1.4fr 1fr!important}" });
      for (let n = 0; n < IDS.length; n++) {
        await page.evaluate((k) => window.__proposal.slide(k), IDS[n]);
        await page.waitForSelector(`#slide-${IDS[n]}`, { timeout: 15000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(900);
        // The live deck may still show an older number; the PDF always carries the current one.
        await page.evaluate((ph) => { for (const sp of document.querySelectorAll("#slide-next span")) if (/^\+\d[\d ()-]{7,}$/.test(sp.textContent.trim())) sp.textContent = ph; }, PHONE);
        // The reference number is no longer shown on the cover.
        await page.evaluate(() => { for (const sp of document.querySelectorAll("#slide-cover span")) if (/^Ref\s/.test(sp.textContent.trim())) sp.remove(); });
        const el = await page.$(`#slide-${IDS[n]}`);
        await el.screenshot({ path: path.join(dir, `${String(n + 1).padStart(2, "0")}.jpg`), type: "jpeg", quality: 90 });
        // Bonsify footer: the site header's own "Bonsify for <brand>" lockup, so a downloaded PDF is clearly ours.
        const box = await el.boundingBox();
        await page.evaluate(({ w, x, n, total, phone }) => {
          const lock = document.querySelector("header a");
          const f = document.createElement("div");
          f.id = "pdf-foot";
          f.style.cssText = `position:fixed;left:${x}px;bottom:0;width:${w}px;height:${Math.round(w * 0.045)}px;box-sizing:border-box;padding:0 ${Math.round(w * 0.016)}px;display:flex;align-items:center;justify-content:space-between;background:#14110f;color:#ede6d8;font:600 ${Math.round(w * 0.0085)}px/1 Inter,system-ui,sans-serif;z-index:99999`;
          const left = document.createElement("div");
          left.style.cssText = "display:flex;align-items:center;transform:scale(1.4);transform-origin:left center;pointer-events:none";
          if (lock) { const c = lock.cloneNode(true); c.removeAttribute("href"); left.appendChild(c); }
          const right = document.createElement("div");
          right.style.cssText = "display:flex;gap:2.2em;opacity:.85;white-space:nowrap";
          right.innerHTML = `<span>bonsify.io</span><span>hello@bonsify.io</span><span>${phone}</span><span style="opacity:.6">${n} / ${total}</span>`;
          f.append(left, right);
          document.body.appendChild(f);
        }, { w: Math.round(box.width), x: Math.round(box.x), n: n + 1, total: IDS.length, phone: PHONE });
        const foot = await page.$("#pdf-foot");
        await foot.screenshot({ path: path.join(dir, `${String(n + 1).padStart(2, "0")}-f.jpg`), type: "jpeg", quality: 90 });
        await page.evaluate(() => document.getElementById("pdf-foot")?.remove());
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
