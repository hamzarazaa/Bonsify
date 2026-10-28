#!/usr/bin/env node
// One brand, end to end: crawl -> narration -> video -> deck PDF -> storage -> brand page.
//
//   node video/job.mjs --url https://store.com --name "Brand Name" [--slug brand-name] [--contact "Ahsan"]
//
// Runs inside the engine container (Cloud Run Job) but works on any machine with Node, ffmpeg,
// Chromium (Playwright) and Python Pillow. Settings come from the environment:
//
//   ELEVENLABS_API_KEY   narration (secret)
//   VOICE_ID             cloned voice
//   BUCKET_DIR           folder of the mounted public bucket, e.g. /mnt/media. Finished videos go to videos/
//   CACHE_DIR            folder of the mounted private bucket for the narration cache, e.g. /mnt/cache
//   PUBLIC_BASE          public URL of the media bucket, e.g. https://storage.googleapis.com/bonsify-engine-media
//   GITLAB_TOKEN         project access token (api scope). If set, the brand record and deck PDF are committed to main
//   GITLAB_PROJECT       default hamzaraza/bonsify.io
//   GIT_SUBDIR           default bonsify (the app folder inside the repo)
//
// Flags: --skip-crawl (reuse the existing record), --dry (silent narration, no storage upload, no commit).

import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); if (i < 0) return d; const v = argv[i + 1]; return v == null || v.startsWith("--") ? true : v; };
const URL_ = flag("url"), NAME = flag("name");
const SLUG = flag("slug") || (NAME || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const CONTACT = flag("contact", "");
const DRY = !!flag("dry", false), SKIP_CRAWL = !!flag("skip-crawl", false);
if (!SLUG || (!SKIP_CRAWL && (!URL_ || !NAME))) { console.error('usage: node video/job.mjs --url https://store.com --name "Brand" [--slug x] [--contact "Name"]'); process.exit(1); }

const BUCKET_DIR = process.env.BUCKET_DIR || "";
const PUBLIC_BASE = (process.env.PUBLIC_BASE || "").replace(/\/$/, "");
const PORT = process.env.APP_PORT || "3100", APP = `http://localhost:${PORT}`;
const t0 = Date.now();
const log = (m) => console.log(`[${String(Math.round((Date.now() - t0) / 1000)).padStart(4)}s] ${m}`);
const recFile = path.join(ROOT, "content", "proposals", `${SLUG}.json`);
const outDir = path.join(ROOT, "video", "out", "job");
fs.mkdirSync(outDir, { recursive: true });

// narration cache lives in the bucket so a line is only ever paid for once
const CACHE_DIR = process.env.CACHE_DIR || (BUCKET_DIR && path.join(BUCKET_DIR, "voice-cache"));
if (CACHE_DIR) {
  const shared = CACHE_DIR;
  fs.mkdirSync(shared, { recursive: true });
  const local = path.join(HERE, "cache");
  fs.rmSync(local, { recursive: true, force: true });
  fs.symlinkSync(shared, local);
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, ...(opts.env || {}) }, stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (d) => { out += d; if (opts.echo) process.stdout.write(d); });
    p.stderr.on("data", (d) => { err += d; if (opts.echo) process.stderr.write(d); });
    p.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} ${args.join(" ")} exited ${code}: ${(err || out).trim().split("\n").slice(-4).join(" | ")}`))));
  });
}

// Everything the run needs, checked in seconds, before any minutes are spent. A run either passes this or stops here.
async function preflight() {
  const problems = [];
  const need = async (name, fn) => { try { await fn(); } catch (e) { problems.push(`${name}: ${String(e.message || e).split("\n")[0].slice(0, 200)}`); } };
  await need("ffmpeg", async () => { await run("ffmpeg", ["-version"]); await run("ffprobe", ["-version"]); });
  await need("python Pillow (deck PDF)", async () => { await run("python3", ["-c", "import PIL"]); });
  await need("Chromium", async () => {
    await run("node", ["-e", `const {createRequire}=require("module");const r=createRequire(process.cwd()+"/");let pw;for(const s of ["playwright","/opt/node22/lib/node_modules/playwright"]){try{pw=r(s);break}catch{}}
      if(!pw)throw new Error("playwright not installed");(async()=>{const b=await pw.chromium.launch();const p=await b.newPage();await p.setContent("<p>ok</p>");await b.close()})().catch(e=>{console.error(e.message);process.exit(1)})`]);
  });
  await need("intro/outro assets", async () => {
    const A = path.join(ROOT, "video", "assets");
    for (const n of ["intro", "outro"]) if (!["mp4", "mov", "webm"].some((e) => fs.existsSync(path.join(A, `${n}.${e}`)))) throw new Error(`video/assets/${n}.mp4 is missing from the image`);
    if (!fs.existsSync(path.join(A, "voice", "voice.json"))) throw new Error("video/assets/voice/voice.json is missing");
  });
  if (!DRY) {
    await need("ELEVENLABS_API_KEY", async () => { if (!process.env.ELEVENLABS_API_KEY) throw new Error("not set"); });
    await need("storage bucket (media)", async () => { if (!BUCKET_DIR || !PUBLIC_BASE) throw new Error("BUCKET_DIR and PUBLIC_BASE must be set"); const f = path.join(BUCKET_DIR, ".preflight"); fs.mkdirSync(BUCKET_DIR, { recursive: true }); fs.writeFileSync(f, String(Date.now())); fs.rmSync(f); });
    await need("narration cache", async () => { if (!CACHE_DIR) throw new Error("CACHE_DIR not set"); const f = path.join(CACHE_DIR, ".preflight"); fs.mkdirSync(CACHE_DIR, { recursive: true }); fs.writeFileSync(f, "1"); fs.rmSync(f); });
    await need("GitLab token", async () => {
      if (!process.env.GITLAB_TOKEN) throw new Error("not set");
      const project = encodeURIComponent(process.env.GITLAB_PROJECT || "hamzaraza/bonsify.io");
      const r = await fetch(`https://gitlab.com/api/v4/projects/${project}`, { headers: { "PRIVATE-TOKEN": process.env.GITLAB_TOKEN }, signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error(`GitLab answered ${r.status}`);
      const j = await r.json();
      const lvl = Math.max(j.permissions?.project_access?.access_level || 0, j.permissions?.group_access?.access_level || 0);
      if (lvl < 30) throw new Error(`token role too low (${lvl}), needs Developer or Maintainer`);
    });
  }
  if (problems.length) throw new Error(`preflight failed: ${problems.join(" | ")}`);
  log("preflight passed");
}

let server;
async function startApp() {
  // dev server: new brand files are picked up without a rebuild
  server = spawn("npx", ["next", "dev", "-p", PORT], {
    cwd: ROOT, stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_SHOW_BACHAPARTY: "true", NEXT_PUBLIC_SHOW_HIGHFY: "true", NEXT_PUBLIC_SHOW_CREEDVINTAGE: "true", REC_ROUTE: "1", NEXT_PUBLIC_LAB: "1" },
  });
  server.stderr.on("data", () => {});
  server.stdout.on("data", () => {});
  for (let i = 0; i < 90; i++) {
    try { const r = await fetch(`${APP}/`); if (r.status < 500) return; } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("app did not start");
}
async function warm() {
  // first request to each route compiles it; do that now so the recording does not wait on it
  await Promise.all([`/for/${SLUG}`, `/try/${SLUG}`, `/rec/${SLUG}`, `/for/${SLUG}?tab=deck&record=1`].map(async (p) => {
    const r = await fetch(`${APP}${p}`, { signal: AbortSignal.timeout(240000) });
    if (!r.ok) throw new Error(`${p} returned ${r.status}`);
  }));
}

async function gitlabCommit(files) {
  const token = process.env.GITLAB_TOKEN;
  const project = encodeURIComponent(process.env.GITLAB_PROJECT || "hamzaraza/bonsify.io");
  const api = `https://gitlab.com/api/v4/projects/${project}/repository`;
  const headers = { "PRIVATE-TOKEN": token, "Content-Type": "application/json" };
  const actions = [];
  for (const f of files) {
    const r = await fetch(`${api}/files/${encodeURIComponent(f.path)}?ref=main`, { method: "HEAD", headers });
    actions.push({ action: r.ok ? "update" : "create", file_path: f.path, content: f.buf.toString("base64"), encoding: "base64" });
  }
  const res = await fetch(`${api}/commits`, { method: "POST", headers, body: JSON.stringify({ branch: "main", commit_message: `Add ${NAME || SLUG}: demo page, video and deck (engine)`, actions }) });
  const body = await res.json();
  if (!res.ok) throw new Error(`GitLab commit failed: ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  return body.web_url || body.id;
}

try {
  await preflight();
  if (flag("check", false)) { log("check only, stopping here"); process.exit(0); }
  if (!SKIP_CRAWL) {
    log(`crawling ${URL_}`);
    const line = (await run("node", ["video/make-brand.mjs", URL_, "--name", NAME, "--slug", SLUG])).trim().split("\n").pop();
    log(`brand record: ${line.slice(0, 160)}`);
  }
  if (!fs.existsSync(recFile)) throw new Error(`no brand record at ${recFile}`);
  if (CONTACT) { const j = JSON.parse(fs.readFileSync(recFile, "utf8")); j.contact = CONTACT; fs.writeFileSync(recFile, JSON.stringify(j, null, 1) + "\n"); }

  log("starting app");
  await startApp();
  await warm();
  log("making the deck PDF first, so a problem shows up in seconds");
  const pdf = path.join(outDir, "decks", `${SLUG}-deck.pdf`);
  let pdfOk = false;
  for (let attempt = 1; attempt <= 2 && !pdfOk; attempt++) {
    let out = "";
    try { out = await run("node", ["video/make-deck-pdfs.mjs", SLUG], { env: { ORIGIN: APP, OUT: path.join(outDir, "decks"), FORCE: "1", PAR: "1" } }); } catch (e) { out = e.message; }
    pdfOk = fs.existsSync(pdf);
    if (!pdfOk) log(`deck PDF attempt ${attempt} failed: ${out.trim().split("\n").slice(-3).join(" | ").slice(0, 500)}`);
  }

  if (!pdfOk) throw new Error("deck PDF could not be made, stopping before the render");
  log("deck PDF ok, rendering video");

  const engineArgs = ["video/engine2.mjs", SLUG, "--out", "video/out/job", "--base", APP, ...(DRY ? ["--dry"] : [])];
  await run("node", engineArgs, { env: { VOICE_ID: process.env.VOICE_ID || "qREDZhi8J1uvY1jmr1Z8" }, echo: false });
  log("video rendered");

  const files = { mp4: path.join(outDir, `${SLUG}.mp4`), poster: path.join(outDir, `${SLUG}-poster.jpg`), vtt: path.join(outDir, `${SLUG}.vtt`) };
  for (const f of Object.values(files)) if (!fs.existsSync(f)) throw new Error(`missing output ${f}`);

  let video;
  if (BUCKET_DIR && !DRY) {
    const dest = path.join(BUCKET_DIR, "videos");
    fs.mkdirSync(dest, { recursive: true });
    for (const f of Object.values(files)) fs.copyFileSync(f, path.join(dest, path.basename(f)));
    if (pdfOk) fs.copyFileSync(pdf, path.join(dest, `${SLUG}-deck.pdf`));
    video = { ready: true, src: `${PUBLIC_BASE}/videos/${SLUG}.mp4`, poster: `${PUBLIC_BASE}/videos/${SLUG}-poster.jpg`, captions: `${PUBLIC_BASE}/videos/${SLUG}.vtt` };
    log("uploaded to bucket");
  } else {
    video = { ready: true, src: `/demo/${SLUG}.mp4`, poster: `/demo/${SLUG}-poster.jpg`, captions: `/demo/${SLUG}.vtt` };
  }
  const rec = JSON.parse(fs.readFileSync(recFile, "utf8"));
  rec.video = video;
  fs.writeFileSync(recFile, JSON.stringify(rec, null, 1) + "\n");

  let commit = null;
  if (process.env.GITLAB_TOKEN && !DRY) {
    const sub = (process.env.GIT_SUBDIR || "bonsify").replace(/\/$/, "");
    commit = await gitlabCommit([
      { path: `${sub}/content/proposals/${SLUG}.json`, buf: fs.readFileSync(recFile) },
      ...(pdfOk ? [{ path: `${sub}/public/decks/${SLUG}-deck.pdf`, buf: fs.readFileSync(pdf) }] : []),
    ]);
    log(`committed to GitLab: ${commit}`);
  }

  const result = { ok: true, slug: SLUG, name: NAME, page: `https://bonsify.io/for/${SLUG}`, video: video.src, deckPdf: pdfOk, seconds: Math.round((Date.now() - t0) / 1000), committed: !!commit };
  fs.writeFileSync(path.join(outDir, `${SLUG}.result.json`), JSON.stringify(result, null, 1));
  if (BUCKET_DIR && !DRY) { fs.mkdirSync(path.join(BUCKET_DIR, "results"), { recursive: true }); fs.writeFileSync(path.join(BUCKET_DIR, "results", `${SLUG}.json`), JSON.stringify(result, null, 1)); }
  log(`DONE ${JSON.stringify(result)}`);
} catch (e) {
  console.error(`FAILED: ${e.message}`);
  process.exitCode = 1;
} finally {
  try { server?.kill("SIGTERM"); } catch {}
  spawnSync("pkill", ["-f", "next-server"]);
  setTimeout(() => process.exit(process.exitCode || 0), 500);
}
