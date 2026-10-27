#!/usr/bin/env node
// Batch runner for many brands. Stages, each safe to re-run:
//
//   node video/batch.mjs brands  [--from 1 --to 50] [--par 4]   make brand records (video/make-brand.mjs)
//   node video/batch.mjs voice   [--from 1 --to 50]             list the narration lines still missing from the cache
//   node video/batch.mjs render  [--from 1 --to 50] [--par 2]   render every brand whose voice is fully cached
//   node video/batch.mjs publish [--from 1 --to 50]             mark rendered brands ready, write the sheet CSV
//
// Lists are in video/batch/brands.csv (#,Brand,URL,Platform). State is in video/batch/state.json.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { beatsFor } from "./script2.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const BATCH = path.join(HERE, "batch");
const STATE = path.join(BATCH, "state.json");
const [cmd, ...rest] = process.argv.slice(2);
const flag = (n, d) => { const i = rest.indexOf(`--${n}`); return i < 0 ? d : rest[i + 1]; };
const FROM = +flag("from", 1), TO = +flag("to", 50), PAR = +flag("par", cmd === "render" ? 2 : 4);
const VOICE = process.env.VOICE_ID || "qREDZhi8J1uvY1jmr1Z8", MODEL = process.env.TTS_MODEL || "eleven_v4";
const BASE_URL = process.env.SITE_URL || "https://bonsify.io";

const rows = fs.readFileSync(path.join(BATCH, "brands.csv"), "utf8").trim().split(/\r?\n/).slice(1).map((l) => {
  const [n, name, url, platform] = l.split(",");
  const slug = name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return { n: +n, name, url, platform, slug };
}).filter((r) => r.n >= FROM && r.n <= TO);
const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : {};
const save = () => fs.writeFileSync(STATE, JSON.stringify(state, null, 1));
const sha = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);
const recFile = (slug) => path.join(ROOT, "content", "proposals", `${slug}.json`);
const audioFile = (text) => path.join(HERE, "cache", `${sha([false, "eleven", MODEL, VOICE, text].join("|"))}.mp3`);

async function pool(items, par, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: par }, async () => { while (i < items.length) { const it = items[i++]; try { await fn(it); } catch (e) { console.log(`! ${it.slug}: ${e.message}`); } } }));
}
const run = (args, env = {}) => new Promise((res) => {
  const p = spawn("node", args, { cwd: ROOT, env: { ...process.env, ...env } });
  let out = "", err = ""; p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (err += d));
  p.on("close", (code) => res({ code, out, err }));
});

if (cmd === "brands") {
  await pool(rows, PAR, async (r) => {
    if (state[r.slug]?.brand?.ok && fs.existsSync(recFile(r.slug)) && !rest.includes("--force")) return;
    const { code, out, err } = await run(["video/make-brand.mjs", r.url, "--name", r.name, "--slug", r.slug]);
    const line = out.trim().split("\n").pop();
    let info; try { info = JSON.parse(line); } catch { info = { ok: false, flags: [`crawl failed: ${(err || out).trim().split("\n").pop()?.slice(0, 160)}`] }; }
    state[r.slug] = { ...(state[r.slug] || {}), n: r.n, name: r.name, url: r.url, brand: info }; save();
    console.log(`${String(r.n).padStart(3)} ${r.slug.padEnd(24)} ${info.ok ? "ok " : "FLAG"} ${info.flags?.join("; ") || ""} p=${info.products} logo=${info.logo?.mode}`);
  });
}

if (cmd === "voice") {
  const need = new Map(); let chars = 0;
  for (const r of rows) {
    if (!fs.existsSync(recFile(r.slug))) continue;
    const b = beatsFor(JSON.parse(fs.readFileSync(recFile(r.slug), "utf8")));
    for (const beat of b) if (!fs.existsSync(audioFile(beat.say))) {
      const f = path.basename(audioFile(beat.say));
      if (!need.has(f)) { need.set(f, { file: f, text: beat.say, brands: [] }); chars += beat.say.length; }
      need.get(f).brands.push(r.slug);
    }
  }
  const list = [...need.values()];
  fs.writeFileSync(path.join(BATCH, "voice-todo.json"), JSON.stringify(list, null, 1));
  console.log(`${list.length} lines to generate, ${chars} characters (about ${chars} credits)`);
}

if (cmd === "render") {
  const todo = rows.filter((r) => fs.existsSync(recFile(r.slug)) && !fs.existsSync(path.join(ROOT, "video", "out", "final", `${r.slug}.mp4`)));
  const ready = todo.filter((r) => beatsFor(JSON.parse(fs.readFileSync(recFile(r.slug), "utf8"))).every((b) => fs.existsSync(audioFile(b.say))));
  console.log(`${ready.length} of ${todo.length} brands have all their voice lines`);
  fs.mkdirSync(path.join(ROOT, "video", "out", "final"), { recursive: true });
  await pool(ready, PAR, async (r) => {
    const t0 = Date.now();
    const { code, out, err } = await run(["video/engine2.mjs", r.slug, "--out", "video/out/tmp"], { VOICE_ID: VOICE, TTS_MODEL: MODEL });
    const mp4 = path.join(ROOT, "video", "out", "tmp", `${r.slug}.mp4`);
    if (code !== 0 || !fs.existsSync(mp4)) { state[r.slug] = { ...(state[r.slug] || {}), render: { ok: false, error: (err || out).trim().split("\n").slice(-2).join(" ").slice(0, 200) } }; save(); console.log(`FAIL ${r.slug}`); return; }
    for (const ext of ["mp4", "vtt"]) fs.renameSync(path.join(ROOT, "video", "out", "tmp", `${r.slug}.${ext}`), path.join(ROOT, "video", "out", "final", `${r.slug}.${ext}`));
    fs.renameSync(path.join(ROOT, "video", "out", "tmp", `${r.slug}-poster.jpg`), path.join(ROOT, "video", "out", "final", `${r.slug}-poster.jpg`));
    // a contact sheet to eyeball: intro, the store today, the app, the outro
    const fin = path.join(ROOT, "video", "out", "final", `${r.slug}.mp4`);
    const d = parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", fin]).toString());
    const qa = path.join(HERE, "work", "_qa"); fs.mkdirSync(qa, { recursive: true });
    try {
      const ts = [5, 32, Math.round(d * 0.55), Math.round(d - 6)], fr = ts.map((t, i) => path.join(qa, `${r.slug}_${i}.jpg`));
      ts.forEach((t, i) => execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", String(t), "-i", fin, "-frames:v", "1", "-vf", "scale=640:-1", fr[i]]));
      execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...fr.flatMap((f) => ["-i", f]), "-filter_complex", "[0][1]hstack[a];[2][3]hstack[b];[a][b]vstack", "-frames:v", "1", path.join(qa, `${r.slug}.jpg`)]);
      fr.forEach((f) => fs.rmSync(f, { force: true }));
    } catch {}
    state[r.slug] = { ...(state[r.slug] || {}), render: { ok: true, seconds: Math.round(d), took: Math.round((Date.now() - t0) / 1000), mb: +(fs.statSync(fin).size / 1e6).toFixed(1) } }; save();
    console.log(`done ${r.slug} ${Math.round(d)}s video, ${Math.round((Date.now() - t0) / 1000)}s to render`);
  });
}

if (cmd === "publish") {
  const out = ["Brand,Store URL,Demo page URL"]; let n = 0;
  for (const r of rows) {
    const mp4 = path.join(ROOT, "video", "out", "final", `${r.slug}.mp4`);
    if (!fs.existsSync(mp4) || !fs.existsSync(recFile(r.slug))) continue;
    const j = JSON.parse(fs.readFileSync(recFile(r.slug), "utf8"));
    j.video = { ready: true }; fs.writeFileSync(recFile(r.slug), JSON.stringify(j, null, 1) + "\n");
    out.push(`"${r.name}",${r.url},${BASE_URL}/for/${r.slug}`); n++;
  }
  fs.writeFileSync(path.join(BATCH, "sheet.csv"), out.join("\n") + "\n");
  console.log(`${n} pages marked ready, sheet at video/batch/sheet.csv`);
}
