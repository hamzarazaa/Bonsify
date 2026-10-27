#!/usr/bin/env node
// Writes a one-file progress page (status per brand plus the QA contact sheet of each finished video).
//   node video/progress.mjs [out.html]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, "..");
const out = process.argv[2] || path.join(HERE, "batch", "progress.html");
const rows = fs.readFileSync(path.join(HERE, "batch", "brands.csv"), "utf8").trim().split(/\r?\n/).slice(1).map((l) => { const [n, name, url] = l.split(","); return { n: +n, name, url, slug: name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }; }).filter((r) => r.n <= 53);
const state = JSON.parse(fs.readFileSync(path.join(HERE, "batch", "state.json"), "utf8"));
let ps = ""; try { ps = execFileSync("pgrep", ["-af", "engine2.mjs"]).toString(); } catch {}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const tmp = path.join(HERE, "work", "_qa", "_thumb.jpg");
let done = 0, active = 0, cards = [];
for (const r of rows) {
  const mp4 = path.join(HERE, "out", "final", `${r.slug}.mp4`), sheet = path.join(HERE, "work", "_qa", `${r.slug}.jpg`);
  const hasRec = fs.existsSync(path.join(ROOT, "content", "proposals", `${r.slug}.json`));
  let st = "waiting", img = "", info = "";
  if (!hasRec) st = "skipped";
  else if (fs.existsSync(mp4)) { st = "done"; done++; const s = state[r.slug]?.render; info = s ? `${s.seconds}s video, ${s.mb} MB` : ""; if (fs.existsSync(sheet)) { try { execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", sheet, "-vf", "scale=560:-1", "-q:v", "6", tmp]); img = "data:image/jpeg;base64," + fs.readFileSync(tmp).toString("base64"); } catch {} } }
  else if (new RegExp(`engine2\\.mjs ${r.slug} `).test(ps + " ")) { st = "rendering"; active++; }
  else if (state[r.slug]?.render?.ok === false) { st = "failed"; info = state[r.slug].render.error || ""; }
  cards.push({ ...r, st, img, info });
}
const when = new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" });
const html = `<title>Bonsify Video Batch</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* layout: a status bar, then a grid of brand rows, finished videos show their four-frame contact sheet */
:root{--bg:#f6f6f3;--panel:#fff;--fg:#17181a;--mute:#6b6f76;--line:#dcdcd6;--ok:#17803d;--run:#b45309;--bad:#b42318;--wait:#8a8f98;--accent:#1f5f4a;--bar:#e4e4de}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#121413;--panel:#1b1d1c;--fg:#ecede9;--mute:#9a9f98;--line:#2c2f2d;--ok:#4cc27a;--run:#e9a23b;--bad:#f07167;--wait:#767b76;--accent:#5bbf9c;--bar:#2a2d2b;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#121413;--panel:#1b1d1c;--fg:#ecede9;--mute:#9a9f98;--line:#2c2f2d;--ok:#4cc27a;--run:#e9a23b;--bad:#f07167;--wait:#767b76;--accent:#5bbf9c;--bar:#2a2d2b;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font-family:"IBM Plex Sans",system-ui,sans-serif;padding-block:24px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));margin:0}
.w{max-width:1100px;margin:0 auto}
h1{font-size:22px;margin:0 0 4px;letter-spacing:-.01em}
.sub{color:var(--mute);margin:0 0 16px}
.bar{height:10px;background:var(--bar);border-radius:5px;overflow:hidden;margin:12px 0 6px}
.bar i{display:block;height:100%;background:var(--accent)}
.stats{display:flex;flex-wrap:wrap;gap:6px 18px;font-variant-numeric:tabular-nums;color:var(--mute);margin-bottom:20px}
.stats b{color:var(--fg)}
.list{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.c{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:12px;min-width:0;display:flex;flex-direction:column;gap:8px}
.t{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.t strong{overflow-wrap:anywhere}
.pill{font-size:11px;text-transform:uppercase;letter-spacing:.06em;font-weight:600;white-space:nowrap}
.done{color:var(--ok)}.rendering{color:var(--run)}.failed{color:var(--bad)}.waiting,.skipped{color:var(--wait)}
.u{font-size:12px;color:var(--mute);overflow-wrap:anywhere}
.c img{border-radius:3px;display:block;width:100%}
.ph{aspect-ratio:16/9;border:1px dashed var(--line);border-radius:3px;display:grid;place-items:center;color:var(--wait);font-size:12px}
</style>
<div class="w">
<h1>Bonsify video batch</h1>
<p class="sub">Updated ${esc(when)} (Karachi). Each demo page goes live at bonsify.io/for/&lt;slug&gt; once deployed.</p>
<div class="bar"><i style="width:${(done / rows.length * 100).toFixed(1)}%"></i></div>
<div class="stats"><span><b>${done}</b> of ${rows.length} rendered</span><span><b>${active}</b> rendering now</span><span><b>${cards.filter((c) => c.st === "waiting").length}</b> waiting</span><span><b>${cards.filter((c) => c.st === "failed").length}</b> failed</span></div>
<div class="list">
${cards.map((c) => `<div class="c"><div class="t"><strong>${esc(c.name)}</strong><span class="pill ${c.st}">${c.st}</span></div>${c.img ? `<img alt="Frames from the ${esc(c.name)} video" src="${c.img}">` : `<div class="ph">${c.st === "rendering" ? "recording now" : c.st === "failed" ? "see log" : "not started"}</div>`}<div class="u">bonsify.io/for/${esc(c.slug)}${c.info ? ` · ${esc(c.info)}` : ""}</div></div>`).join("\n")}
</div></div>`;
fs.writeFileSync(out, html); console.log(out, `${done}/${rows.length}`, (html.length / 1e6).toFixed(1) + "MB");
