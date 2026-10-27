#!/usr/bin/env node
// Video engine: a personalised app walkthrough in a cloned voice, no avatar.
//
//   node video/engine2.mjs <slug> [--dry] [--provider eleven|openrouter]
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
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { beatsFor, introStates, outroStates, sentences } from "./script2.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const require = createRequire(import.meta.url);

// ---------- options ----------
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); if (i < 0) return d; const v = argv[i + 1]; return v == null || v.startsWith("--") ? true : v; };
const slug = argv[0] && !argv[0].startsWith("--") ? argv[0] : "";
if (!slug) { console.error("usage: node video/engine2.mjs <slug> [--dry]"); process.exit(1); }
const DRY = !!flag("dry", false);
const PROVIDER = flag("provider", process.env.TTS_PROVIDER || "eleven");
const BASE = flag("base", "http://localhost:3100");
const OUT = path.resolve(ROOT, flag("out", "video/out"));
const MODEL = process.env.TTS_MODEL || (PROVIDER === "openrouter" ? "elevenlabs/eleven-v4-turbo" : "eleven_v4");
const VOICE = process.env.VOICE_ID || "";
const PAD = 0.35; // seconds of air after each scene
const W = path.join(HERE, "work", slug);
const CACHE = path.join(HERE, "cache");
fs.mkdirSync(W, { recursive: true }); fs.mkdirSync(CACHE, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });

const sh = (cmd, args) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] }).toString();
const ff = (...a) => sh("ffmpeg", ["-loglevel", "error", "-y", ...a]);
const dur = (f) => parseFloat(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]));
// ffmpeg writes its measurements to stderr, so these read that
const probeErr = (args) => spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8", maxBuffer: 1 << 26 }).stderr || "";
const lufs = (f) => { const m = /"input_i"\s*:\s*"(-?[\d.]+|-inf)"/.exec(probeErr(["-i", f, "-af", "loudnorm=I=-16:print_format=json", "-f", "null", "-"])); const v = m ? parseFloat(m[1]) : NaN; return Number.isFinite(v) ? v : null; };
const hasAudio = (f) => sh("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", f]).trim() !== "";
const sha = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);

// ---------- brand ----------
const labFile = path.join(ROOT, "content", "lab", `${slug}.json`);
const brandFile = fs.existsSync(labFile) ? labFile : path.join(ROOT, "content", "proposals", `${slug}.json`);
if (!fs.existsSync(brandFile)) { console.error(`No brand file at ${brandFile}`); process.exit(1); }
const brand = JSON.parse(fs.readFileSync(brandFile, "utf8"));
const beats = beatsFor(brand);
const TRY_URL = flag("try-url", `https://bonsify.io/try/${slug}`);
const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const hex = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ""); return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : [17, 17, 17]; };
const mix = (h, t, base = [255, 255, 255]) => { const c = hex(h); return `rgb(${c.map((v, i) => Math.round(v * (1 - t) + base[i] * t)).join(",")})`; };
const PRIMARY = brand.colors?.primary || "#111111", ACCENT = brand.colors?.accent || PRIMARY;
// readable accent: if the accent is too light for text on a pale background, fall back to the primary
const lum = (h) => { const [r, g, b] = hex(h).map((v) => v / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const INK = lum(PRIMARY) < 0.5 ? PRIMARY : "#111111";
const HI = lum(ACCENT) < 0.62 ? ACCENT : INK;
const GLOW = brand.colors?.glow || HI; // tint for the background blobs and the disc behind the phone

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
for (const b of beats) {
  const r = await speak(b.say);
  b.audio = r.file; b.len = dur(r.file) + PAD;
  chars += b.say.length; if (!r.cached) billed += b.say.length;
}
console.log(`voice: ${beats.length} beats, ${chars} characters, ${billed} newly billed (${DRY ? "dry run" : MODEL})`);
// Where each sentence really starts in the audio. The panel text and the phone actions follow these,
// so what is on screen matches what is being said (character counts only guess at it).
function sentenceStarts(b) {
  const n = b.sents.length, speech = b.len - PAD;
  const w = b.sents.map((x) => x.length), sum = w.reduce((a, c) => a + c, 0);
  const guess = [0]; let acc = 0; for (let k = 0; k < n - 1; k++) { acc += (speech * w[k]) / sum; guess.push(acc); }
  if (n < 2) return { real: guess, guess };
  const err = probeErr(["-i", b.audio, "-af", "silencedetect=noise=-36dB:d=0.16", "-f", "null", "-"]);
  const sil = []; let st = null;
  for (const m of err.matchAll(/silence_(start|end): (-?[\d.]+)/g)) { if (m[1] === "start") st = parseFloat(m[2]); else if (st != null) { sil.push([st, parseFloat(m[2])]); st = null; } }
  const d = dur(b.audio), inner = sil.filter(([a, e]) => a > 0.25 && e < d - 0.05);
  // for each expected boundary take the nearest pause, and only trust it when it is close to the guess
  const real = [0], used = new Set();
  for (let k = 1; k < n; k++) {
    let best = -1, bd = 1e9;
    inner.forEach(([a, e], i) => { const dd = Math.abs((a + e) / 2 - guess[k]); if (!used.has(i) && dd < bd) { bd = dd; best = i; } });
    if (best < 0 || bd > Math.max(1.2, speech * 0.22)) return { real: guess, guess };
    used.add(best); real.push(Math.max(real[k - 1] + 0.4, inner[best][1] - 0.12));
  }
  return { real, guess };
}
for (const b of beats) { const { real, guess } = sentenceStarts(b); b.starts = real; b.guess = guess; b.warp = (t) => { // guessed timeline -> real timeline, piece by piece
  const P = [...guess, b.len], R = [...real, b.len]; t = Math.min(Math.max(t, 0), b.len);
  for (let i = 1; i < P.length; i++) if (t <= P[i]) return R[i - 1] + ((t - P[i - 1]) / (P[i] - P[i - 1] || 1)) * (R[i] - R[i - 1]);
  return t; }; }
const total = beats.reduce((a, s) => a + s.len, 0);
console.log(`demo length ${total.toFixed(1)}s`);

// ---------- 2. record the phone ----------
async function loadPlaywright() {
  for (const spec of ["playwright", "/opt/node22/lib/node_modules/playwright"]) { try { return require(spec); } catch {} }
  throw new Error("Playwright not found. Run: npm i -D playwright");
}
const { chromium } = await loadPlaywright();
const exe = process.env.CHROMIUM_PATH || (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const BAR = 64; // height of the phone browser bar on the "today" scene
async function openApp() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: IPHONE });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/rec/${slug}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.addStyleTag({ content: "nextjs-portal,[data-nextjs-toast]{display:none!important}*{scrollbar-width:none!important}::-webkit-scrollbar{display:none!important;width:0!important}html,body{overflow-x:hidden!important}" });
  await page.waitForFunction(() => window.__app?.current, null, { timeout: 15000 });
  await page.waitForTimeout(600);
  return { ctx, page, mode: "app" };
}
async function openSite() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 - BAR }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: IPHONE });
  const page = await ctx.newPage();
  try { await page.goto(brand.url, { waitUntil: "domcontentloaded", timeout: 45000 }); } catch (e) { console.log("site load:", e.message.slice(0, 80)); }
  await page.waitForTimeout(3500);
  // some stores paint late or blank: wait for real content, reload once if it never shows
  const painted = () => page.evaluate(() => (document.body?.innerText || "").trim().length > 150 && document.images.length > 2).catch(() => false);
  for (let t = 0; t < 2 && !(await painted()); t++) {
    for (let k = 0; k < 10 && !(await painted()); k++) await page.waitForTimeout(1500);
    if (!(await painted()) && t === 0) { try { await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 }); } catch {} await page.waitForTimeout(3500); }
  }
  // splash-only home pages: show the biggest collection instead
  if (!(await painted())) {
    const col = [...(brand.collections || [])].filter((c) => c.count >= 12 && !/^(all|frontpage)$/i.test(c.handle)).sort((a, b) => b.count - a.count)[0];
    if (col) { try { await page.goto(new URL(`/collections/${col.handle}`, page.url()).href, { waitUntil: "domcontentloaded", timeout: 45000 }); } catch {} await page.waitForTimeout(4000); console.log("site fallback to collection", col.handle); }
  }
  // popups, cookie bars and chat bubbles hide the store, so take them off the recording
  const clean = async () => page.evaluate(() => {
    const kill = (el) => { el.style.setProperty("display", "none", "important"); };
    document.querySelectorAll("dialog,[role=dialog],[aria-modal=true],[class*=cookie i],[id*=cookie i],[class*=consent i],[class*=popup i],[class*=modal i]:not(html):not(body),[class*=klaviyo],[class*=privy],[id*=shopify-pc__banner]").forEach((el) => { const r = el.getBoundingClientRect(); if (r.width > 120 && r.height > 40) kill(el); });
    // sticky bars along the bottom (notification prompts, cookie strips) cover the store
    document.querySelectorAll("body *").forEach((el) => { const cs = getComputedStyle(el); if (cs.position !== "fixed") return; const r = el.getBoundingClientRect(); if (r.width > 300 && r.height < 240 && r.bottom >= innerHeight - 6) kill(el); });
    document.querySelectorAll("div,section,aside,p,span").forEach((el) => { if (el.children.length > 12 || !/allow me|no thanks/i.test(el.textContent || "") || (el.textContent || "").length > 220) return; let n = el; while (n && n !== document.body) { const pos = getComputedStyle(n).position; if (pos === "fixed" || pos === "sticky" || pos === "absolute") { kill(n); return; } n = n.parentElement; } kill(el); });
    // full-screen overlays: preloaders, dimmed backdrops, newsletter or language pickers, open menus
    document.querySelectorAll("body *").forEach((el) => { const cs = getComputedStyle(el); if (cs.position !== "fixed" && cs.position !== "absolute") return; const r = el.getBoundingClientRect(); if (r.width * r.height > innerWidth * innerHeight * 0.22 && (cs.position === "fixed" || parseInt(cs.zIndex || "0", 10) >= 50) && !/^(header|nav)$/i.test(el.tagName) && r.top < 80) kill(el); });
    document.querySelectorAll("[class*=overlay i],[class*=backdrop i],[class*=newsletter i],[class*=subscribe i],[class*=preloader i],[class*=loader i],[id*=preloader i]").forEach((el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if ((cs.position === "fixed" || cs.position === "absolute") && r.width > 200 && r.height > 80) kill(el); });
    document.body.style.setProperty("overflow", "auto", "important");
    document.body.style.setProperty("position", "static", "important");
    document.body.style.setProperty("opacity", "1", "important");
    document.documentElement.style.setProperty("overflow", "auto", "important");
  }).catch(() => {});
  await clean(); await page.waitForTimeout(500); await clean();
  return { ctx, page, mode: "site", clean };
}
let appS = null, siteS = null;
const doStep = async (S, [fn, ...args]) => {
  if (S.mode === "site") {
    if (fn === "scrollBy") { await S.page.evaluate((px) => window.scrollBy({ top: px, behavior: "smooth" }), args[0]); S.clean && S.clean(); }
    return;
  }
  if (fn === "click") return S.page.getByRole("button", { name: new RegExp(args[0], "i") }).first().click().catch(() => {});
  return S.page.evaluate(([f, a]) => window.__app.current[f](...a), [fn, args]);
};

async function record(beat, i) {
  const S = beat.phone.mode === "site" ? (siteS ||= await openSite()) : (appS ||= await openApp());
  const { page, ctx } = S;
  const dir = path.join(W, `fr_${i}`); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  const onFrame = async (f) => {
    frames.push((f.metadata?.timestamp ? f.metadata.timestamp * 1000 : Date.now()));
    fs.writeFileSync(path.join(dir, `${String(frames.length - 1).padStart(5, "0")}.jpg`), Buffer.from(f.data, "base64"));
    try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch {}
  };
  cdp.on("Page.screencastFrame", onFrame);
  const h = beat.phone.mode === "site" ? (844 - BAR) * 2 : 1688;
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 780, maxHeight: h, everyNthFrame: 1 });
  const T0 = Date.now();
  const tick = S.clean ? setInterval(() => S.clean(), 700) : null;
  const at = async (s, fn) => { const w = s * 1000 - (Date.now() - T0); if (w > 0) await page.waitForTimeout(w); await fn(); };
  for (const step of beat.phone.steps) await at(beat.warp(step.at * beat.len), () => doStep(S, step.do));
  await at(beat.len, async () => {});
  if (tick) clearInterval(tick);
  await cdp.send("Page.stopScreencast"); cdp.off("Page.screencastFrame", onFrame);
  if (!frames.length) throw new Error(`no frames for beat ${beat.id}`);
  let list = "ffconcat version 1.0\n";
  frames.forEach((t, k) => {
    const end = k + 1 < frames.length ? frames[k + 1] : T0 + beat.len * 1000;
    list += `file fr_${i}/${String(k).padStart(5, "0")}.jpg\nduration ${Math.max(0.001, (end - (k === 0 ? T0 : Math.max(t, T0))) / 1000).toFixed(4)}\n`;
  });
  list += `file fr_${i}/${String(frames.length - 1).padStart(5, "0")}.jpg\n`;
  fs.writeFileSync(path.join(W, `clip_${i}.ffconcat`), list);
  const raw = path.join(W, `raw_${i}.mp4`);
  const vf = beat.phone.mode === "site" ? `fps=30,scale=400:${866 - BAR},format=yuv420p` : "fps=30,scale=400:866,format=yuv420p";
  ff("-f", "concat", "-safe", "0", "-i", path.join(W, `clip_${i}.ffconcat`), "-vf", vf, "-t", beat.len.toFixed(3), "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", raw);
  fs.rmSync(dir, { recursive: true, force: true });
  return raw;
}
const raws = [];
for (let i = 0; i < beats.length; i++) { raws.push(await record(beats[i], i)); process.stdout.write(`recorded ${beats[i].id}\n`); }
if (appS) await appS.ctx.close(); if (siteS) await siteS.ctx.close();

// ---------- 3. frames: panels, bezel, avatar stage ----------
const font = (n) => `file://${path.join(HERE, "assets", "fonts", n)}`;
const dataUri = (f) => `data:image/png;base64,${fs.readFileSync(f).toString("base64")}`;
const BON_LOGO = dataUri(path.join(HERE, "assets", "bonsify-logo.png"));
const BONG = "#2d6b4f"; // the green of the Bonsify bag
const css = `
@font-face{font-family:Inter;src:url(${font("inter-latin-wght-normal.woff2")});font-weight:100 900}
@font-face{font-family:Fraunces;src:url(${font("fraunces-latin-wght-normal.woff2")});font-weight:100 900}
*{box-sizing:border-box;margin:0}body{width:1920px;height:1080px;position:relative;overflow:hidden;font-family:Inter,sans-serif;color:#141414}
.bg{position:absolute;inset:0;background:
 radial-gradient(900px 700px at 100% 0%,${mix(GLOW, 0.7)},transparent 70%),
 radial-gradient(800px 700px at 0% 100%,${mix(GLOW, 0.82)},transparent 70%),
 radial-gradient(500px 400px at 52% 50%,${mix(GLOW, 0.88)},transparent 70%),
 ${mix(GLOW, 0.95)}}
.dots{position:absolute;inset:0;background-image:radial-gradient(${mix(PRIMARY, 0.8)} 2px,transparent 2.5px);background-size:36px 36px;opacity:.55;-webkit-mask-image:linear-gradient(100deg,transparent 0,#000 40%,#000 100%);mask-image:linear-gradient(100deg,transparent 0,#000 40%,#000 100%)}
.disc{position:absolute;left:1460px;top:540px;width:860px;height:860px;margin:-430px 0 0 -430px;border-radius:50%;background:${mix(GLOW, 0.78)}}
.disc2{position:absolute;left:1460px;top:540px;width:1060px;height:1060px;margin:-530px 0 0 -530px;border-radius:50%;border:3px solid ${mix(GLOW, 0.55)}}
.top{position:absolute;left:96px;top:48px;display:flex;align-items:center;gap:22px;padding:12px 30px 12px 20px;border-radius:26px;background:#fff;box-shadow:0 10px 34px rgba(0,0,0,.1)}
.top .b{height:76px;width:auto;display:block}.top .x{font:300 36px Inter;color:#9a9a9a}.top .bl{height:44px;max-width:230px;object-fit:contain;display:block}.top .bn{font:800 32px Inter}
.kick{display:inline-block;padding:10px 20px;border-radius:999px;font:800 17px Inter;letter-spacing:.16em;text-transform:uppercase;color:#fff;background:${HI}}
.h{font-family:Fraunces,serif;font-weight:600;letter-spacing:-.02em}`;
const brandMark = brand.logo ? `<img class=bl src="${esc(brand.logo)}">` : `<span class=bn>${esc(brand.name)}</span>`;
const topBar = `<div class=top><img class=b src="${BON_LOGO}"><span class=x>×</span>${brandMark}</div>`;
const decor = `<div class=bg></div><div class=dots></div>`;

const panelItems = (beat, st) => {
  const p = beat.panel, n = st.show ?? 0;
  if (p.type === "checks") return `<div style="margin-top:34px;display:flex;flex-direction:column;gap:18px">${p.items.slice(0, n).map((it) => `<div style="display:flex;align-items:center;gap:18px;font:600 34px Inter"><span style="width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:#fff;font:800 26px Inter;background:${it.ok ? "#1f9d55" : "#d64545"}">${it.ok ? "✓" : "✕"}</span>${esc(it.t)}</div>`).join("")}</div>`;
  if (p.type === "chips") return `<div style="margin-top:36px;display:flex;flex-wrap:wrap;gap:14px;max-width:900px">${p.items.slice(0, n).map((it) => `<span style="display:inline-flex;align-items:center;gap:12px;padding:14px 22px;border-radius:999px;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.08);font:700 24px Inter">${it.sw ? `<i style="width:26px;height:26px;border-radius:50%;background:${it.sw};border:2px solid rgba(0,0,0,.12)"></i>` : ""}${esc(it.t)}</span>`).join("")}</div>`;
  if (p.type === "rows") return `<div style="margin-top:34px;display:flex;flex-direction:column;gap:14px;width:1000px">${p.items.map((it, i) => { const on = st.active === i; return `<div style="display:flex;align-items:center;justify-content:space-between;gap:30px;padding:20px 28px;border-radius:18px;background:#fff;border:3px solid ${on ? HI : "transparent"};box-shadow:${on ? "0 14px 34px rgba(0,0,0,.14)" : "0 2px 8px rgba(0,0,0,.06)"};opacity:${n === 0 ? 0 : on || st.active < 0 ? 1 : 0.4}"><div style="font:800 30px Inter;min-width:300px">${esc(it.name)}</div><div style="font:500 24px Inter;color:#555;text-align:right">${esc(it.t)}</div></div>`; }).join("")}</div>`;
  if (p.type === "steps") return `<div style="margin-top:40px;display:flex;gap:22px;width:1040px">${p.items.map((it, i) => { const on = st.active === i; return `<div style="flex:1;padding:26px;border-radius:20px;background:#fff;box-shadow:${on ? "0 16px 38px rgba(0,0,0,.16)" : "0 2px 8px rgba(0,0,0,.06)"};opacity:${st.active < 0 || on ? 1 : 0.4};border:3px solid ${on ? HI : "transparent"}"><div style="width:44px;height:44px;border-radius:50%;background:#141414;color:#fff;display:grid;place-items:center;font:800 22px Inter;margin-bottom:16px">${i + 1}</div><div style="font:800 28px/1.15 Inter;margin-bottom:10px">${esc(it.t)}</div><div style="font:500 20px/1.4 Inter;color:#555">${esc(it.d)}</div></div>`; }).join("")}</div>`;
  return "";
};
const frameHtml = (beat, si) => {
  const st = beat.states[si], ti = beat.titlesBy[si];
  const sub = beat.subs ? beat.subs[Math.min(si, beat.subs.length - 1)] ?? "" : "";
  return `<style>${css}</style>${decor}<div class=disc></div><div class=disc2></div>${topBar}
<div style="position:absolute;left:96px;top:190px;width:1040px;height:760px;display:flex;flex-direction:column;justify-content:center">
<div><span class=kick>${esc(beat.kicker)}</span></div>
<div class=h style="font-size:82px;line-height:1.05;margin-top:26px;color:#141414">${esc(beat.titles[ti])}</div>
${sub ? `<div style="font:500 34px/1.35 Inter;color:#4a4a4a;margin-top:22px;max-width:900px">${esc(sub)}</div>` : ""}
${panelItems(beat, st)}</div>
<div style="position:absolute;left:96px;bottom:64px;display:flex;gap:10px">${beats.map((b, k) => `<i style="width:46px;height:8px;border-radius:4px;background:${k === beats.indexOf(beat) ? HI : "#141414"};opacity:${k === beats.indexOf(beat) ? 1 : k < beats.indexOf(beat) ? 0.45 : 0.15}"></i>`).join("")}</div>`;
};
const bezelHtml = `<style>*{margin:0}body{width:1920px;height:1080px;background:transparent}
.b{box-sizing:border-box;position:absolute;left:1248px;top:95px;width:424px;height:890px;border:12px solid #111;border-radius:58px;box-shadow:0 30px 60px rgba(0,0,0,.28)}
.n{position:absolute;left:1460px;top:116px;width:96px;height:26px;margin-left:-48px;border-radius:14px;background:#111}</style><div class=b></div><div class=n></div>`;
const barHtml = `<style>${css}body{width:400px;height:${BAR}px;background:#f4f4f5}</style>
<div style="position:absolute;left:26px;top:10px;font:700 14px Inter">9:41</div>
<div style="position:absolute;right:24px;top:12px;width:26px;height:12px;border:2px solid #222;border-radius:4px"><i style="display:block;width:70%;height:100%;background:#222"></i></div>
<div style="position:absolute;left:18px;right:18px;top:28px;height:30px;border-radius:12px;background:#e4e4e7;display:flex;align-items:center;justify-content:center;gap:8px;font:600 15px Inter;color:#222">🔒 ${esc(new URL(brand.url).host.replace(/^www\./, ""))}</div>`;

// avatar ring and mask
const AV = 420;
const ringHtml = `<style>*{margin:0}body{width:${AV + 60}px;height:${AV + 60}px;background:transparent}.r{position:absolute;left:30px;top:30px;width:${AV}px;height:${AV}px;border-radius:50%;box-shadow:0 0 0 8px #fff,0 22px 50px rgba(0,0,0,.3)}</style><div class=r></div>`;
const maskHtml = `<style>*{margin:0}body{width:${AV}px;height:${AV}px;background:#000}.m{width:${AV}px;height:${AV}px;border-radius:50%;background:#fff}</style><div class=m></div>`;

// intro / outro stage states
let qrData = "";
try { qrData = await require("qrcode").toDataURL(TRY_URL, { margin: 1, width: 360, color: { dark: "#141414", light: "#ffffff" } }); } catch (e) { console.log("no qrcode module, outro will skip the code"); }
const stageHtml = (s, kind) => `<style>${css}</style>${decor}${topBar}
<div style="position:absolute;left:0;right:0;top:${s.qr ? 150 : 200}px;text-align:center">
<div><span class=kick>${esc(s.kicker)}</span></div>
<div class=h style="font-size:${s.title.length > 34 ? 74 : 92}px;line-height:1.06;margin:28px auto 0;max-width:1300px">${esc(s.title)}</div>
${s.sub ? `<div style="font:500 36px Inter;color:#4a4a4a;margin-top:20px">${esc(s.sub)}</div>` : ""}
${s.qr && qrData ? `<div style="margin-top:36px"><div style="display:inline-block;background:#fff;padding:20px;border-radius:26px;box-shadow:0 14px 40px rgba(0,0,0,.16)"><img src="${qrData}" style="width:300px;height:300px;display:block"></div></div>` : ""}
${s.cta ? `<div style="margin-top:30px"><span style="display:inline-block;padding:20px 44px;border-radius:999px;background:${PRIMARY};color:${lum(PRIMARY) < 0.55 ? "#fff" : "#111"};font:800 32px Inter">Get your app now</span></div>` : ""}
</div>`;

const fp = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const shot = async (html, file, transparent, size) => { if (size) await fp.setViewportSize(size); await fp.setContent(html, { waitUntil: "load" }); await fp.evaluate(() => document.fonts.ready); await fp.screenshot({ path: file, omitBackground: !!transparent }); if (size) await fp.setViewportSize({ width: 1920, height: 1080 }); };
await shot(bezelHtml, path.join(W, "bezel.png"), true);
await shot(barHtml, path.join(W, "bar.png"), false, { width: 400, height: BAR });
await shot(ringHtml, path.join(W, "ring.png"), true, { width: AV + 60, height: AV + 60 });
await shot(maskHtml, path.join(W, "mask.png"), false, { width: AV, height: AV });

let bg = "ffconcat version 1.0\n", last = "", t = 0; const vtt = [];
beats.forEach((sc, si) => {
  const ss = sc.sents;
  sc.start = t; sc._shots = [];
  ss.forEach((s, k) => {
    const d = (k === ss.length - 1 ? sc.len : sc.starts[k + 1]) - sc.starts[k];
    last = path.join(W, `bg_${si}_${k}.png`);
    sc._shots.push({ file: last, d, text: s, at: t, k });
    t += d;
  });
});
for (const sc of beats) for (const s of sc._shots) { await shot(frameHtml(sc, s.k), s.file); bg += `file ${s.file}\nduration ${s.d.toFixed(3)}\n`; }
bg += `file ${last}\n`;
fs.writeFileSync(path.join(W, "bg.ffconcat"), bg);

// ---------- 4. the demo body ----------
// each clip gets its own bezel position; the "today" scenes get the browser bar on top
const clipFiles = beats.map((b, i) => {
  if (b.phone.mode !== "site") return raws[i];
  const out = path.join(W, `clipb_${i}.mp4`);
  ff("-i", raws[i], "-i", path.join(W, "bar.png"), "-filter_complex", `[0:v]pad=400:866:0:${BAR}:color=white[a];[a][1:v]overlay=0:0,format=yuv420p`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", out);
  return out;
});
fs.writeFileSync(path.join(W, "clips.ffconcat"), `ffconcat version 1.0\n${clipFiles.map((f) => `file ${path.basename(f)}`).join("\n")}\n`);
const aud = beats.map((s, i) => { const f = path.join(W, `aud_${i}.wav`); ff("-i", s.audio, "-af", `aresample=48000,apad=whole_dur=${s.len.toFixed(3)}`, "-ac", "2", "-t", s.len.toFixed(3), f); return `file aud_${i}.wav`; }).join("\n");
fs.writeFileSync(path.join(W, "aud.ffconcat"), `ffconcat version 1.0\n${aud}\n`);
const body = path.join(W, "body.mp4");
ff("-f", "concat", "-safe", "0", "-i", path.join(W, "bg.ffconcat"), "-f", "concat", "-safe", "0", "-i", path.join(W, "clips.ffconcat"),
  "-i", path.join(W, "bezel.png"), "-f", "concat", "-safe", "0", "-i", path.join(W, "aud.ffconcat"),
  "-filter_complex", `[0:v]fps=30,format=yuv420p[bg];[1:v]fps=30,format=yuv420p[ph];[bg][ph]overlay=1260:107[o];[o][2:v]overlay=0:0,fade=t=in:d=0.3,fade=t=out:st=${(total - 0.3).toFixed(2)}:d=0.3,format=yuv420p[v];[3:a]loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:d=0.1,afade=t=out:st=${(total - 0.25).toFixed(2)}:d=0.25[a]`,
  "-map", "[v]", "-map", "[a]", "-t", total.toFixed(3), "-r", "30", "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-c:a", "aac", "-b:a", "160k", body);

// ---------- 5. intro and outro: avatar in a circle, audio cleaned ----------
const RN = path.join(HERE, "assets", "rnnoise-bd.rnnn");
// Speech clean-up: high-pass, RNN noise suppression, FFT denoise, a soft gate for room tails, and a whisper of room tone so silence is not dead.
const cleanChain = `highpass=f=90,${fs.existsSync(RN) ? `arnndn=m=${RN}:mix=1,` : ""}afftdn=nr=14:nf=-45:tn=1,agate=threshold=0.015:ratio=3:attack=6:release=220:range=0.08,lowpass=f=12000`;
const crops = { intro: { x: 120, y: 240 }, outro: { x: 120, y: 300 } };
const find = (n) => ["mp4", "mov", "webm"].map((e) => path.join(HERE, "assets", `${n}.${e}`)).find(fs.existsSync);
async function avatarPart(name, states) {
  const src = find(name); if (!src) { console.log(`no video/assets/${name}.mp4, skipping`); return null; }
  const d = dur(src), cr = crops[name];
  // stage states
  let sc = "ffconcat version 1.0\n", lastF = "";
  for (let i = 0; i < states.length; i++) {
    const f = path.join(W, `${name}_st${i}.png`); await shot(stageHtml(states[i]), f);
    const end = i + 1 < states.length ? states[i + 1].t : d;
    sc += `file ${f}\nduration ${(end - states[i].t).toFixed(3)}\n`; lastF = f;
  }
  sc += `file ${lastF}\n`;
  fs.writeFileSync(path.join(W, `${name}_stage.ffconcat`), sc);
  const out = path.join(W, `${name}_n.mp4`);
  // Shujaat's lines in the cloned voice (video/assets/voice, made once and reused for every brand),
  // each trimmed of silence and stretched a touch to land on the sentence it replaces in the recording.
  const VD = path.join(HERE, "assets", "voice"); const vj = path.join(VD, "voice.json");
  const lines = fs.existsSync(vj) ? (JSON.parse(fs.readFileSync(vj, "utf8"))[name] || []).filter((l) => fs.existsSync(path.join(VD, l.file))) : [];
  const lineIn = [], lineF = [];
  lines.forEach((l, k) => {
    const w = path.join(W, `${name}_line${k}.wav`);
    ff("-i", path.join(VD, l.file), "-af", "aresample=48000,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.04,areverse", "-ac", "1", w);
    const span = l.end - l.start, ratio = Math.min(1.25, Math.max(0.85, dur(w) / span));
    lineIn.push("-i", w);
    lineF.push(`[${5 + k}:a]atempo=${ratio.toFixed(4)},adelay=${Math.round(l.start * 1000)}:all=1[l${k}]`);
  });
  const hasA = lines.length === 0 && hasAudio(src);
  const mixIn = lines.map((_, k) => `[l${k}]`).join("");
  // levels and room tone are set once over the whole film (see the final join), not per part
  const aF = lines.length
    ? `${lineF.join(";")};${mixIn}amix=inputs=${lines.length}:duration=longest:normalize=0,apad=whole_dur=${d.toFixed(3)}[a]`
    : hasA ? `[0:a]aresample=48000,${cleanChain},apad=whole_dur=${d.toFixed(3)}[a]` : `anullsrc=r=48000:cl=stereo,atrim=0:${d.toFixed(3)}[a]`;
  ff("-i", src, "-f", "concat", "-safe", "0", "-i", path.join(W, `${name}_stage.ffconcat`), "-i", path.join(W, "ring.png"), "-i", path.join(W, "mask.png"),
    "-f", "lavfi", "-t", d.toFixed(2), "-i", "anoisesrc=color=pink:amplitude=0.0007:sample_rate=48000", ...lineIn,
    "-filter_complex", `[0:v]crop=760:760:${cr.x}:${cr.y},scale=${AV}:${AV},fps=30,format=yuva420p[sq];[3:v]format=gray[m];[sq][m]alphamerge[c];[1:v]fps=30,format=yuv420p[sg];[sg][2:v]overlay=66:${1080 - AV - 80 - 30}[s1];[s1][c]overlay=96:${1080 - AV - 80}[v];${aF}`,
    "-map", "[v]", "-map", "[a]", "-ac", "2", "-t", d.toFixed(2), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "160k", out);
  return out;
}
const parts = [];
const iP = await avatarPart("intro", introStates(brand)); let offset = 0;
if (iP) { parts.push(iP); offset = dur(iP) - 0.7; }
const bodyN = path.join(W, "body_n.mp4"); fs.copyFileSync(body, bodyN); parts.push(bodyN);
const oP = await avatarPart("outro", outroStates()); if (oP) parts.push(oP);
await fp.close(); await browser.close();

const final = path.join(OUT, `${slug}.mp4`);
const XF = 0.7; // the pictures dissolve over this long
const TARGET = -16; // LUFS for the speech of every part, so the voice stays at one level from intro to outro
if (parts.length === 1) fs.copyFileSync(bodyN, final);
else {
  const ds = parts.map(dur); let vf = "[0:v]null[v0]", acc = ds[0]; const starts = [0];
  for (let i = 1; i < parts.length; i++) {
    vf += `;[v${i - 1}][${i}:v]xfade=transition=fade:duration=${XF}:offset=${(acc - XF).toFixed(3)}[v${i}]`;
    starts.push(acc - XF); acc += ds[i] - XF;
  }
  // Audio is not crossfaded (two takes fading across each other dips, then swells). Each part keeps its own
  // timeline on one track, gain-matched by measured loudness, with one continuous room tone under all of it.
  let af = ""; const labels = [];
  parts.forEach((p, i) => {
    const wav = path.join(W, `join_${i}.wav`); ff("-i", p, "-vn", "-ac", "2", "-ar", "48000", wav);
    const L = lufs(wav), g = L == null ? 0 : Math.max(-12, Math.min(12, TARGET - L));
    console.log(`part ${i}: ${L == null ? "silent" : L.toFixed(1) + " LUFS"}, gain ${g.toFixed(1)} dB`);
    af += `${i ? ";" : ""}[${i + parts.length}:a]volume=${g.toFixed(2)}dB,afade=t=in:d=0.04,afade=t=out:st=${(ds[i] - 0.06).toFixed(3)}:d=0.06,adelay=${Math.round(starts[i] * 1000)}:all=1[p${i}]`;
    labels.push(`[p${i}]`);
  });
  af += `;anoisesrc=color=pink:amplitude=0.0007:sample_rate=48000:duration=${acc.toFixed(2)},aformat=channel_layouts=stereo[rt];${labels.join("")}[rt]amix=inputs=${parts.length + 1}:duration=longest:normalize=0,alimiter=limit=0.89:level=false[a]`;
  ff(...parts.flatMap((p) => ["-i", p]), ...parts.flatMap((p, i) => ["-i", path.join(W, `join_${i}.wav`)]), "-filter_complex", `${vf};${af}`, "-map", `[v${parts.length - 1}]`, "-map", "[a]", "-t", acc.toFixed(3),
    "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", final);
}

// captions and poster
const ts = (x) => { const h = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), s = (x % 60).toFixed(3).padStart(6, "0"); return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${s}`; };
let v = "WEBVTT\n\n"; let n = 1;
for (const sc of beats) for (const s of sc._shots) v += `${n++}\n${ts(offset + s.at)} --> ${ts(offset + s.at + s.d)}\n${s.text}\n\n`;
fs.writeFileSync(path.join(OUT, `${slug}.vtt`), v);
ff("-ss", (offset + 3).toFixed(1), "-i", final, "-frames:v", "1", "-q:v", "3", path.join(OUT, `${slug}-poster.jpg`));
console.log(`done: ${final} (${dur(final).toFixed(1)}s)`);
console.log(`voice cost at $40 per million characters: $${((billed / 1e6) * 40).toFixed(3)} this run`);
