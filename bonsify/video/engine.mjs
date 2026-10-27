#!/usr/bin/env node
// Video engine: a personalised app walkthrough in a cloned voice, no avatar.
//
//   node video/engine.mjs <slug> [--dry] [--provider eleven|openrouter]
//                         [--base http://localhost:3100] [--out video/out]
//
// Steps: (1) write the narration from the brand file, (2) speak each scene with
// the cloned voice (cached on disk, so re-runs only pay for lines that changed),
// (3) record the live app for exactly as long as each scene is spoken,
// (4) lay it out on a branded 1920x1080 frame with captions, (5) join the
// pre-recorded intro and outro around it.
//
// Needs: node 20+, ffmpeg, Playwright with Chromium, and the app running with
// REC_ROUTE=1 (see video/README.md). --dry swaps the voice for silence so the
// whole pipeline can be checked without spending anything.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { scenesFor } from "./script.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const require = createRequire(import.meta.url);

// ---------- options ----------
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); if (i < 0) return d; const v = argv[i + 1]; return v == null || v.startsWith("--") ? true : v; };
const slug = argv[0] && !argv[0].startsWith("--") ? argv[0] : "";
if (!slug) { console.error("usage: node video/engine.mjs <slug> [--dry]"); process.exit(1); }
const DRY = !!flag("dry", false);
const PROVIDER = flag("provider", process.env.TTS_PROVIDER || "eleven");
const BASE = flag("base", "http://localhost:3100");
const OUT = path.resolve(ROOT, flag("out", "video/out"));
const MODEL = process.env.TTS_MODEL || (PROVIDER === "openrouter" ? "elevenlabs/eleven-v4-turbo" : "eleven_v4");
const VOICE = process.env.VOICE_ID || "";
const PAD = 0.45; // seconds of air after each scene
const W = path.join(HERE, "work", slug);
const CACHE = path.join(HERE, "cache");
fs.mkdirSync(W, { recursive: true }); fs.mkdirSync(CACHE, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });

const sh = (cmd, args) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] }).toString();
const ff = (...a) => sh("ffmpeg", ["-loglevel", "error", "-y", ...a]);
const dur = (f) => parseFloat(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]));
const hasAudio = (f) => sh("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", f]).trim() !== "";
const sha = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);

// ---------- brand ----------
const brandFile = path.join(ROOT, "content", "lab", `${slug}.json`);
if (!fs.existsSync(brandFile)) { console.error(`No brand file at ${brandFile}`); process.exit(1); }
const brand = JSON.parse(fs.readFileSync(brandFile, "utf8"));
const scenes = scenesFor(brand);
const sentences = (t) => t.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) || [t];

// ---------- 1. voice ----------
async function speak(text) {
  const out = path.join(CACHE, `${sha([DRY, PROVIDER, MODEL, VOICE, text].join("|"))}.mp3`);
  if (fs.existsSync(out)) return { file: out, cached: true };
  if (DRY) {
    const secs = Math.max(2, text.length / 14); // about 14 characters a second
    ff("-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", secs.toFixed(2), "-c:a", "libmp3lame", out);
    return { file: out, cached: false };
  }
  if (!VOICE) throw new Error("Set VOICE_ID to the cloned voice's ID.");
  let res;
  if (PROVIDER === "openrouter") {
    // OpenRouter's speech endpoint. A cloned voice lives in your ElevenLabs
    // account, so the ElevenLabs key has to be added to OpenRouter as BYOK.
    res = await fetch("https://openrouter.ai/api/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, input: text, voice: VOICE, response_format: "mp3" }),
    });
  } else {
    res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: MODEL, voice_settings: { stability: 0.5, similarity_boost: 0.8 } }),
    });
  }
  if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  return { file: out, cached: false };
}

let chars = 0, billed = 0;
for (const s of scenes) {
  const r = await speak(s.say);
  s.audio = r.file; s.len = dur(r.file) + PAD;
  chars += s.say.length; if (!r.cached) billed += s.say.length;
}
console.log(`voice: ${scenes.length} scenes, ${chars} characters, ${billed} newly billed (${DRY ? "dry run" : MODEL})`);
const total = scenes.reduce((a, s) => a + s.len, 0);
console.log(`demo length ${total.toFixed(1)}s`);

// ---------- 2. record the app ----------
async function loadPlaywright() {
  for (const spec of ["playwright", "/opt/node22/lib/node_modules/playwright"]) { try { return require(spec); } catch {} }
  throw new Error("Playwright not found. Run: npm i -D playwright");
}
const { chromium } = await loadPlaywright();
const exe = process.env.CHROMIUM_PATH || (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(`${BASE}/rec/${slug}`, { waitUntil: "networkidle", timeout: 60000 });
await page.addStyleTag({ content: "nextjs-portal,[data-nextjs-toast]{display:none!important}" });
await page.waitForFunction(() => window.__app?.current, null, { timeout: 15000 });
await page.waitForTimeout(600);
const A = (f, ...a) => page.evaluate(([f, a]) => window.__app.current[f](...a), [f, a]);
const act = async ([fn, ...args]) => {
  if (fn === "click") return page.getByRole("button", { name: new RegExp(args[0], "i") }).first().click();
  return A(fn, ...args);
};

const cdp = await ctx.newCDPSession(page);
async function record(scene, i) {
  const dir = path.join(W, `fr_${i}`); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
  const frames = [];
  const onFrame = async (f) => {
    frames.push(Date.now());
    fs.writeFileSync(path.join(dir, `${String(frames.length - 1).padStart(5, "0")}.jpg`), Buffer.from(f.data, "base64"));
    try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch {}
  };
  cdp.on("Page.screencastFrame", onFrame);
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
  const T0 = Date.now();
  const at = async (s, fn) => { const w = s * 1000 - (Date.now() - T0); if (w > 0) await page.waitForTimeout(w); await fn(); };
  for (const step of scene.app) await at(step.at * scene.len, () => act(step.do));
  await at(scene.len, async () => {});
  await cdp.send("Page.stopScreencast"); cdp.off("Page.screencastFrame", onFrame);
  if (!frames.length) throw new Error(`no frames for scene ${scene.id}`);
  let list = "ffconcat version 1.0\n";
  frames.forEach((t, k) => {
    const end = k + 1 < frames.length ? frames[k + 1] : T0 + scene.len * 1000;
    list += `file fr_${i}/${String(k).padStart(5, "0")}.jpg\nduration ${Math.max(0.001, (end - Math.max(t, T0)) / 1000).toFixed(4)}\n`;
  });
  list += `file fr_${i}/${String(frames.length - 1).padStart(5, "0")}.jpg\n`; // concat ignores the last duration unless the file repeats
  fs.writeFileSync(path.join(W, `clip_${i}.ffconcat`), list);
  ff("-f", "concat", "-safe", "0", "-i", path.join(W, `clip_${i}.ffconcat`), "-vf", "fps=30,scale=400:866,format=yuv420p", "-t", scene.len.toFixed(3), "-c:v", "libx264", "-crf", "18", path.join(W, `clip_${i}.mp4`));
  fs.rmSync(dir, { recursive: true, force: true });
}
for (let i = 0; i < scenes.length; i++) { await record(scenes[i], i); process.stdout.write(`recorded ${scenes[i].id}\n`); }
await ctx.close();

// ---------- 3. frame, captions, bezel ----------
const font = (n) => `file://${path.join(HERE, "assets", "fonts", n)}`;
const col = { green: brand.colors?.primary || "#2F6B4F", accent: brand.colors?.accent || "#A85A36" };
const css = `
@font-face{font-family:Fraunces;src:url(${font("fraunces-latin-wght-normal.woff2")});font-weight:100 900}
@font-face{font-family:Inter;src:url(${font("inter-latin-wght-normal.woff2")});font-weight:100 900}
*{box-sizing:border-box;margin:0}body{width:1920px;height:1080px;position:relative;overflow:hidden;font-family:Inter,sans-serif;color:#1B2420}`;
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const frameHtml = (sc, si, text) => `<style>${css}
body{background:linear-gradient(160deg,#F6F1E6,#ECE5D5)}
.brand{position:absolute;left:120px;top:84px;font:600 34px Fraunces;color:#1F4A37}.for{position:absolute;left:120px;top:136px;font-size:24px;opacity:.6}
.t{position:absolute;left:120px;top:300px;width:1000px;font:600 92px/1.04 Fraunces;color:#1F4A37}
.c{position:absolute;left:120px;top:560px;width:960px;font:400 42px/1.4 Inter;color:#1B2420}
.bar{position:absolute;left:120px;bottom:90px;display:flex;gap:10px}.bar i{width:46px;height:8px;border-radius:4px;background:#1F4A37;opacity:.18}.bar i.on{opacity:1;background:${col.accent}}.bar i.done{opacity:.55}
.ring{position:absolute;left:1000px;top:140px;width:920px;height:800px;border-radius:50%;background:#fff;opacity:.55}</style>
<div class=ring></div><div class=brand>Bonsify</div><div class=for>Made for ${esc(brand.name)}</div>
<div class=t>${esc(sc.title)}</div><div class=c>${esc(text)}</div>
<div class=bar>${scenes.map((s, k) => `<i class="${k < si ? "done" : k === si ? "on" : ""}"></i>`).join("")}</div>`;
const bezelHtml = `<style>*{margin:0}body{width:1920px;height:1080px;background:transparent}
.b{position:absolute;left:1248px;top:95px;width:424px;height:890px;border:12px solid #111;border-radius:58px;box-shadow:0 30px 60px rgba(0,0,0,.28)}
.n{position:absolute;left:1460px;top:116px;width:96px;height:26px;margin-left:-48px;border-radius:14px;background:#111}</style><div class=b></div><div class=n></div>`;
const lowerHtml = `<style>${css}body{background:transparent}.l{position:absolute;left:96px;bottom:110px;padding:20px 34px;border-radius:40px;background:rgba(246,241,230,.94);font:600 34px Inter;color:#1F4A37;box-shadow:0 10px 30px rgba(0,0,0,.2)}.l b{color:${col.accent}}</style><div class=l>Made for <b>${esc(brand.name)}</b></div>`;

const stageHtml = `<style>${css}body{background:linear-gradient(160deg,#F6F1E6,#ECE5D5)}
.ring{position:absolute;left:920px;top:140px;width:920px;height:800px;border-radius:50%;background:#fff;opacity:.55}
.brand{position:absolute;left:900px;top:300px;font:600 46px Fraunces;color:#1F4A37}.t{position:absolute;left:900px;top:380px;width:900px;font:600 96px/1.04 Fraunces;color:#1F4A37}
.s{position:absolute;left:900px;top:700px;width:860px;font:400 40px/1.4 Inter;opacity:.7}</style>
<div class=ring></div><div class=brand>Bonsify</div><div class=t>${esc(brand.name)}, as a mobile app</div><div class=s>A walkthrough built on your real products.</div>`;
const fp = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const shot = async (html, file, transparent) => { await fp.setContent(html, { waitUntil: "load" }); await fp.evaluate(() => document.fonts.ready); await fp.screenshot({ path: file, omitBackground: !!transparent }); };
await shot(bezelHtml, path.join(W, "bezel.png"), true);
await shot(lowerHtml, path.join(W, "lower.png"), true);
await shot(stageHtml, path.join(W, "stage.png"));
let bg = "ffconcat version 1.0\n", last = "", t = 0; const vtt = [];
scenes.forEach((sc, si) => {
  const ss = sentences(sc.say), w = ss.map((s) => s.length), sum = w.reduce((a, b) => a + b, 0);
  sc.start = t; let acc = 0;
  ss.forEach((s, k) => {
    const d = k === ss.length - 1 ? sc.len - acc : (sc.len - PAD) * (w[k] / sum);
    acc += d;
    last = path.join(W, `bg_${si}_${k}.png`);
    sc._shots = sc._shots || [];
    sc._shots.push({ file: last, d, text: s, at: t });
    t += d;
  });
});
for (const sc of scenes) for (const [k, s] of sc._shots.entries()) { await shot(frameHtml(sc, scenes.indexOf(sc), s.text), s.file); bg += `file ${s.file}\nduration ${s.d.toFixed(3)}\n`; }
bg += `file ${last}\n`;
fs.writeFileSync(path.join(W, "bg.ffconcat"), bg);
await fp.close(); await browser.close();

// ---------- 4. the demo body ----------
const clips = scenes.map((_, i) => `file clip_${i}.mp4`).join("\n");
fs.writeFileSync(path.join(W, "clips.ffconcat"), `ffconcat version 1.0\n${clips}\n`);
const aud = scenes.map((s, i) => { const f = path.join(W, `aud_${i}.wav`); ff("-i", s.audio, "-af", `aresample=48000,apad=whole_dur=${s.len.toFixed(3)}`, "-ac", "2", "-t", s.len.toFixed(3), f); return `file aud_${i}.wav`; }).join("\n");
fs.writeFileSync(path.join(W, "aud.ffconcat"), `ffconcat version 1.0\n${aud}\n`);
const body = path.join(W, "body.mp4");
ff("-f", "concat", "-safe", "0", "-i", path.join(W, "bg.ffconcat"), "-f", "concat", "-safe", "0", "-i", path.join(W, "clips.ffconcat"),
  "-i", path.join(W, "bezel.png"), "-f", "concat", "-safe", "0", "-i", path.join(W, "aud.ffconcat"),
  "-filter_complex", `[0:v]fps=30,format=yuv420p[bg];[1:v]fps=30,format=yuv420p[ph];[bg][ph]overlay=1260:107[o];[o][2:v]overlay=0:0,fade=t=in:d=0.3,fade=t=out:st=${(total - 0.3).toFixed(2)}:d=0.3,format=yuv420p[v];[3:a]loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:d=0.1,afade=t=out:st=${(total - 0.25).toFixed(2)}:d=0.25[a]`,
  "-map", "[v]", "-map", "[a]", "-t", total.toFixed(3), "-r", "30", "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-c:a", "aac", "-b:a", "160k", body);

// ---------- 5. intro and outro ----------
const isPortrait = (f) => { const [w, h] = sh("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", f]).trim().split(",").map(Number); return h > w; };
const norm = (src, dst, lower) => {
  const silent = !hasAudio(src), d = dur(src), portrait = isPortrait(src);
  const args = ["-i", src];
  let n = 1, stageIdx = -1, lowerIdx = -1, silIdx = -1;
  if (portrait) { args.push("-loop", "1", "-t", d.toFixed(2), "-i", path.join(W, "stage.png")); stageIdx = n++; }
  if (lower) { args.push("-i", path.join(W, "lower.png")); lowerIdx = n++; }
  if (silent) { args.push("-f", "lavfi", "-t", d.toFixed(2), "-i", "anullsrc=r=48000:cl=stereo"); silIdx = n++; }
  let f = portrait
    ? `[0:v]scale=-2:1080,fps=30,setsar=1[av];[${stageIdx}:v]fps=30,setsar=1[sg];[sg][av]overlay=190:0,format=yuv420p[b]`
    : `[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#F6F1E6,fps=30,setsar=1,format=yuv420p[b]`;
  f += lower ? `;[b][${lowerIdx}:v]overlay=0:0:enable='between(t,1.2,${Math.min(6, d - 0.5).toFixed(1)})'[v]` : ";[b]null[v]";
  const aIn = silent ? `[${silIdx}:a]` : "[0:a]";
  ff(...args, "-filter_complex", `${f};${aIn}aresample=48000,loudnorm=I=-16:TP=-1.5:LRA=11[a]`, "-map", "[v]", "-map", "[a]", "-ac", "2", "-t", d.toFixed(2), "-c:v", "libx264", "-crf", "20", "-c:a", "aac", "-b:a", "160k", dst);
  return dst;
};
const parts = [];
const intro = ["mp4", "mov", "webm"].map((e) => path.join(HERE, "assets", `intro.${e}`)).find(fs.existsSync);
const outro = ["mp4", "mov", "webm"].map((e) => path.join(HERE, "assets", `outro.${e}`)).find(fs.existsSync);
let offset = 0;
if (intro) { parts.push(norm(intro, path.join(W, "intro_n.mp4"), true)); offset = dur(parts[0]) - 0.6; } else console.log("no video/assets/intro.mp4, skipping the intro");
const bodyN = path.join(W, "body_n.mp4"); fs.copyFileSync(body, bodyN); parts.push(bodyN);
if (outro) parts.push(norm(outro, path.join(W, "outro_n.mp4"), false)); else console.log("no video/assets/outro.mp4, skipping the outro");
const final = path.join(OUT, `${slug}.mp4`);
const XF = 0.6; // the avatar fades out into the demo (and back in for the outro); the same cloned voice carries across
if (parts.length === 1) fs.copyFileSync(bodyN, final);
else {
  const ds = parts.map(dur); let vf = "[0:v]null[v0]", af = "[0:a]anull[a0]", acc = ds[0];
  for (let i = 1; i < parts.length; i++) {
    vf += `;[v${i - 1}][${i}:v]xfade=transition=fade:duration=${XF}:offset=${(acc - XF).toFixed(3)}[v${i}]`;
    af += `;[a${i - 1}][${i}:a]acrossfade=d=${XF}[a${i}]`;
    acc += ds[i] - XF;
  }
  ff(...parts.flatMap((p) => ["-i", p]), "-filter_complex", `${vf};${af}`, "-map", `[v${parts.length - 1}]`, "-map", `[a${parts.length - 1}]`,
    "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", final);
}

// captions and poster
const ts = (x) => { const h = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), s = (x % 60).toFixed(3).padStart(6, "0"); return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${s}`; };
let v = "WEBVTT\n\n"; let n = 1;
for (const sc of scenes) for (const s of sc._shots) v += `${n++}\n${ts(offset + s.at)} --> ${ts(offset + s.at + s.d)}\n${s.text}\n\n`;
fs.writeFileSync(path.join(OUT, `${slug}.vtt`), v);
ff("-ss", (offset + 2).toFixed(1), "-i", final, "-frames:v", "1", "-q:v", "3", path.join(OUT, `${slug}-poster.jpg`));
console.log(`done: ${final} (${dur(final).toFixed(1)}s)`);
console.log(`voice cost at $40 per million characters: $${((billed / 1e6) * 40).toFixed(3)} this run`);
