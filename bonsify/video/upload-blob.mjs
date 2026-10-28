#!/usr/bin/env node
// Uploads the finished videos to Vercel Blob and points the pages at them.
//
//   npm i -D @vercel/blob
//   BLOB_READ_WRITE_TOKEN=... node video/upload-blob.mjs [folder]      (default folder: video/out/final)
//
// Creates a Blob store in Vercel (Storage > Create > Blob, public), copy its read/write token.
// Files go to videos/<name> with fixed names (no random suffix), so re-running replaces them.
// At the end it writes the public base URL into content/settings/video.json; commit that one file
// and every /for/<brand> page plays from the CDN. Nothing large goes into git.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const dir = path.resolve(ROOT, process.argv[2] || "video/out/final");
if (!process.env.BLOB_READ_WRITE_TOKEN) { console.error("Set BLOB_READ_WRITE_TOKEN first."); process.exit(1); }
const { put } = await import("@vercel/blob");

const files = fs.readdirSync(dir).filter((f) => /\.(mp4|jpg|vtt)$/.test(f));
let base = null, done = 0;
const type = { mp4: "video/mp4", jpg: "image/jpeg", vtt: "text/vtt" };
const queue = [...files];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const f = queue.shift();
    const res = await put(`videos/${f}`, fs.readFileSync(path.join(dir, f)), { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: type[f.split(".").pop()], cacheControlMaxAge: 31536000 });
    base ||= res.url.slice(0, res.url.lastIndexOf("/"));
    console.log(`${++done}/${files.length} ${f}`);
  }
}));
fs.mkdirSync(path.join(ROOT, "content", "settings"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "content", "settings", "video.json"), JSON.stringify({ base }, null, 2) + "\n");
console.log(`\nDone. Base URL: ${base}\ncontent/settings/video.json updated: commit it and deploy.`);
