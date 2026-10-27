#!/usr/bin/env node
// Builds the private brand record for one store, ready for the video engine and the /for/<slug> page.
//
//   node video/make-brand.mjs <store url> --name "Sana Safinaz" [--slug sana-safinaz]
//
// Writes content/proposals/<slug>.json and prints one JSON line of quality checks.
// What it fixes on top of the plain crawl (scripts/lib/crawl-brand.mjs):
//   - best-selling products, mixed across collections, not the feed's alphabetical order
//   - a logo that is readable on white: white or inverted logos are recoloured, then embedded
//   - brand colours from the logo or the site, skipping Shopify defaults
//   - images stay on the store's CDN, so nothing heavy goes into git

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { crawlBrand } from "../scripts/lib/crawl-brand.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const argv = process.argv.slice(2);
const flag = (n) => { const i = argv.indexOf(`--${n}`); return i < 0 ? undefined : argv[i + 1]; };
const url = argv.find((a) => /^https?:\/\//.test(a));
if (!url) { console.error("usage: make-brand.mjs <url> --name <Brand>"); process.exit(1); }
const NAME = flag("name");
const slug = flag("slug") || (NAME || new URL(url).hostname).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const UA = { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36" };
const flags = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hexOf = (r, g, b) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const lumOf = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const hexRgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ""); return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null; };
const sat = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };
// colours that are theme-builder defaults, not a brand's own
const DEFAULT_COLOURS = new Set(["#667eea", "#764ba2", "#5c6ac4", "#008060", "#0070f3", "#2c6ecb", "#0b5cff", "#1773b0", "#3b82f6", "#6366f1", "#8b5cf6", "#f43f5e"]);

async function getJson(u) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(u, { headers: UA, signal: AbortSignal.timeout(25000) });
      if (r.status === 429) { await sleep(2500 * (i + 1)); continue; }
      if (!r.ok) return null;
      return await r.json();
    } catch { await sleep(800); }
  }
  return null;
}

// ---------- 1. crawl ----------
const brand = await crawlBrand(url, { log: () => {}, name: NAME, slug });
let origin = new URL(brand.url).origin;
{ // the crawler sometimes lands on a host that hides the feed: find one that answers
  const host = new URL(url).hostname.replace(/^www\./, "");
  for (const o of [...new Set([origin, new URL(url).origin, `https://www.${host}`, `https://${host}`])]) {
    const j = await getJson(`${o}/products.json?limit=1`);
    if (j?.products?.length) { origin = o; break; }
  }
  if (!(brand.collections || []).length) {
    const j = await getJson(`${origin}/collections.json?limit=250`);
    brand.collections = (j?.collections || []).map((c) => ({ title: c.title, handle: c.handle, image: null, count: c.products_count ?? 0 }));
  }
}

// ---------- 2. products: best sellers, mixed ----------
const PREFER = [/best.?sell/i, /bestseller/i, /top.?sell/i, /trending/i, /popular/i, /hot.?sell/i, /featured/i, /best/i, /new.?arrival|new-in|^new$/i];
const cols = (brand.collections || []).filter((c) => (c.count ?? 0) >= 6 && c.handle && !/gift|sample|test|kids?-?(?:acc)|error/i.test(c.handle + c.title));
const chosen = [];
for (const re of PREFER) for (const c of cols) if (re.test(c.handle + " " + c.title) && !chosen.includes(c) && chosen.length < 4) chosen.push(c);
if (chosen.length < 2) for (const c of [...cols].sort((a, b) => (b.count ?? 0) - (a.count ?? 0))) if (!chosen.includes(c) && chosen.length < 3) chosen.push(c);
const lists = [];
for (const c of chosen) {
  const j = await getJson(`${origin}/collections/${c.handle}/products.json?limit=60`);
  if (j?.products?.length) lists.push(j.products);
  await sleep(700);
}
if (!lists.length) { const j = await getJson(`${origin}/products.json?limit=120`); if (j?.products?.length) lists.push(j.products); }
const sized = (u) => { if (!u) return null; u = u.startsWith("//") ? "https:" + u : u; try { const x = new URL(u); x.searchParams.set("width", "700"); return x.href; } catch { return u; } };
const prices = lists.flat().map((p) => parseFloat(p.variants?.[0]?.price)).filter((v) => v > 0).sort((a, b) => a - b);
const median = prices.length ? prices[Math.floor(prices.length / 2)] : 0;
const picked = [], seen = new Set(), perType = {};
for (let round = 0; round < 60 && picked.length < 12; round++) {
  for (const list of lists) {
    const p = list[round];
    if (!p || picked.length >= 12) continue;
    const v = p.variants?.[0], price = parseFloat(v?.price), type = (p.product_type || "x").toLowerCase();
    if (!p.images?.length || !v?.available || !(price > 0) || seen.has(p.title) || /gift\s*card|e-?gift|sample|swatch/i.test(p.title)) continue;
    if (median && (price < median * 0.25 || price > median * 4)) continue;
    if ((perType[type] || 0) >= 3) continue;
    perType[type] = (perType[type] || 0) + 1; seen.add(p.title);
    const cmp = parseFloat(v.compare_at_price || 0);
    picked.push({
      title: p.title, handle: p.handle, type: p.product_type || "", vendor: p.vendor || NAME, price, compareAt: cmp > price ? cmp : null, available: true,
      image: sized(p.images[0].src), images: p.images.slice(0, 4).map((i) => sized(i.src)),
      options: (p.options || []).filter((o) => o.name !== "Title").slice(0, 2).map((o) => ({ name: o.name, values: o.values.slice(0, 8) })),
      description: (p.body_html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 220),
    });
  }
}
if (picked.length < 10) { // thin collections: top up from the whole catalogue
  const j = await getJson(`${origin}/products.json?limit=250`);
  for (const p of j?.products || []) {
    if (picked.length >= 12) break;
    const v = p.variants?.[0], price = parseFloat(v?.price), type = (p.product_type || "x").toLowerCase();
    if (!p.images?.length || !v?.available || !(price > 0) || seen.has(p.title) || /gift\s*card|e-?gift|sample|swatch/i.test(p.title)) continue;
    if ((perType[type] || 0) >= 3) continue;
    perType[type] = (perType[type] || 0) + 1; seen.add(p.title);
    const cmp = parseFloat(v.compare_at_price || 0);
    picked.push({ title: p.title, handle: p.handle, type: p.product_type || "", vendor: p.vendor || NAME, price, compareAt: cmp > price ? cmp : null, available: true, image: sized(p.images[0].src), images: p.images.slice(0, 4).map((i) => sized(i.src)), options: (p.options || []).filter((o) => o.name !== "Title").slice(0, 2).map((o) => ({ name: o.name, values: o.values.slice(0, 8) })), description: (p.body_html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 220) });
  }
}
const products = picked.length >= 6 ? picked : (brand.products || []).filter((p) => p.image).slice(0, 12);
if (products.length < 6) flags.push(`only ${products.length} products`);

// ---------- 3. logo ----------
const inkOf = (c) => { const rgb = hexRgb(c); return rgb && lumOf(...rgb) < 0.4 ? c : "#141414"; };
async function prepareLogo(buf, isSvg, ink) {
  let img = sharp(buf, { failOn: "none", density: isSvg ? 300 : 72 }).ensureAlpha();
  img = sharp(await img.png().toBuffer());
  let meta = await img.metadata();
  if (!meta.width || meta.width < 60) return null;
  let trimmed;
  try { trimmed = await sharp(await img.png().toBuffer()).trim({ threshold: 18 }).png().toBuffer(); } catch { trimmed = await img.png().toBuffer(); }
  const { data, info } = await sharp(trimmed).resize({ width: 400, withoutEnlargement: false }).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  if (!w || !h) return null;
  const aspect = w / h;
  if (aspect < 0.5 || aspect > 17) return null;
  let transparent = 0, opaque = 0, lumSum = 0, satSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 20) { transparent++; continue; }
    opaque++; lumSum += lumOf(data[i], data[i + 1], data[i + 2]); satSum += sat([data[i], data[i + 1], data[i + 2]]);
  }
  if (opaque < w * h * 0.004) return null; // blank
  const hasAlpha = transparent > w * h * 0.15;
  const lum = lumSum / opaque;
  const domPicked = await dominant(data, opaque);
  const corner = (x, y) => { const o = (y * w + x) * 4; return data[o + 3] < 20 ? null : lumOf(data[o], data[o + 1], data[o + 2]); };
  const corners = [corner(0, 0), corner(w - 1, 0), corner(0, h - 1), corner(w - 1, h - 1)].filter((v) => v != null);
  const cornerLum = corners.length ? corners.reduce((a, b) => a + b, 0) / corners.length : null;
  const [ir, ig, ib] = hexRgb(ink);
  const out = Buffer.alloc(data.length);
  let mode = "as-is";
  if (hasAlpha && lum > 0.72) {
    mode = "recoloured";
    for (let i = 0; i < data.length; i += 4) { out[i] = ir; out[i + 1] = ig; out[i + 2] = ib; out[i + 3] = data[i + 3]; }
  } else if (!hasAlpha && cornerLum != null && cornerLum < 0.25 && lum < 0.5) {
    mode = "inverted"; // light mark on a dark box: keep the mark only
    for (let i = 0; i < data.length; i += 4) { const l = lumOf(data[i], data[i + 1], data[i + 2]); out[i] = ir; out[i + 1] = ig; out[i + 2] = ib; out[i + 3] = Math.round(Math.max(0, Math.min(1, (l - cornerLum) * 2.2)) * 255); }
  } else if (!hasAlpha && cornerLum != null && cornerLum > 0.85) {
    mode = "white-cut"; // dark on white: make the white see-through
    for (let i = 0; i < data.length; i += 4) { const mn = Math.min(data[i], data[i + 1], data[i + 2]); out[i] = data[i]; out[i + 1] = data[i + 1]; out[i + 2] = data[i + 2]; out[i + 3] = Math.round(Math.max(0, Math.min(1, (255 - mn) / 140)) * 255); }
  } else { data.copy(out); }
  const png = await sharp(out, { raw: { width: w, height: h, channels: 4 } }).resize({ height: 96, width: 520, fit: "inside" }).png({ compressionLevel: 9 }).toBuffer();
  return { png, mode, lum, avgSat: satSum / opaque, w: w, h: h, dom: domPicked };
}
async function dominant(data, opaque) {
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const rgb = [data[i], data[i + 1], data[i + 2]];
    if (sat(rgb) < 0.4 || lumOf(...rgb) > 0.8 || lumOf(...rgb) < 0.14) continue;
    const k = hexOf(...rgb.map((v) => Math.round(v / 32) * 32));
    buckets.set(k, (buckets.get(k) || 0) + 1);
  }
  const top = [...buckets.entries()].sort((a, b) => b[1] - a[1])[0];
  return top && top[1] > opaque * 0.1 ? top[0] : null;
}
let logo = null, logoInfo = null;
const candidates = [brand.logo, ...(brand.logoCandidates || [])].filter(Boolean);
const inkGuess = "#141414"; // light logos are made for dark banners; on white pages a near-black mark is the safe match
for (const c of [...new Set(candidates)].slice(0, 8)) {
  try {
    const r = await fetch(c.startsWith("//") ? "https:" + c : c, { headers: UA, signal: AbortSignal.timeout(20000) });
    if (!r.ok) continue;
    const buf = Buffer.from(await r.arrayBuffer());
    const isSvg = /svg/.test(r.headers.get("content-type") || "") || c.split("?")[0].endsWith(".svg");
    const got = await prepareLogo(buf, isSvg, inkGuess);
    if (got) { logo = got; logoInfo = { from: c, mode: got.mode, w: got.w, h: got.h }; break; }
  } catch {}
}
if (!logo && brand.logoSvg) {
  try {
    let svg = brand.logoSvg.replace(/currentColor/g, inkGuess);
    if (!/\sfill=/.test(svg.slice(0, 200))) svg = svg.replace(/<svg\b/, `<svg fill="${inkGuess}"`);
    const got = await prepareLogo(Buffer.from(svg), true, inkGuess);
    if (got) { logo = got; logoInfo = { from: "inline-svg", mode: got.mode, w: got.w, h: got.h }; }
  } catch {}
}
if (!logo) { // logos named in the page's own HTML
  try {
    const html = await (await fetch(origin + "/", { headers: UA, signal: AbortSignal.timeout(25000) })).text();
    const urls = [];
    for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
      const tag = m[0]; if (!/logo/i.test(tag)) continue;
      const src = (/\bsrc="([^"]+)"/i.exec(tag) || /data-src="([^"]+)"/i.exec(tag) || [])[1];
      if (src && !/\.(gif)(\?|$)/i.test(src)) urls.push(src.replace(/&amp;/g, "&"));
    }
    for (const c of [...new Set(urls)].slice(0, 6)) {
      const u = c.startsWith("//") ? "https:" + c : c.startsWith("/") ? origin + c : c;
      const r = await fetch(u, { headers: UA, signal: AbortSignal.timeout(20000) }).catch(() => null);
      if (!r?.ok) continue;
      const got = await prepareLogo(Buffer.from(await r.arrayBuffer()), /svg/.test(r.headers.get("content-type") || ""), inkGuess).catch(() => null);
      if (got) { logo = got; logoInfo = { from: u, mode: got.mode, w: got.w, h: got.h }; break; }
    }
  } catch {}
}
if (!logo) { // last resort: photograph the logo as it sits in the page header
  try {
    const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));
    const exe = fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined;
    const br = await chromium.launch(exe ? { executablePath: exe } : {});
    const pg = await br.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
    await pg.goto(origin + "/", { waitUntil: "domcontentloaded", timeout: 40000 }).catch(() => {});
    await pg.waitForTimeout(3500);
    const sel = ["header [class*=logo i] img", "header a[href='/'] img", "header img[src*=logo i]", "[class*=logo i] svg", "header a[href='/'] svg", "header svg", "[class*=logo i] img", "img[alt*=logo i]", "header img"];
    for (const q of sel) {
      for (const el of (await pg.$$(q)).slice(0, 4)) {
        const bb = await el.boundingBox().catch(() => null);
        if (!bb || bb.width < 60 || bb.height < 14 || bb.width > 600 || bb.y > 400) continue;
        const buf = await el.screenshot({ omitBackground: true }).catch(() => null);
        if (!buf) continue;
        const got = await prepareLogo(buf, false, inkGuess);
        if (got) { logo = got; logoInfo = { from: "page-screenshot " + q, mode: got.mode, w: got.w, h: got.h }; break; }
      }
      if (logo) break;
    }
    await br.close();
  } catch {}
}
if (!logo) flags.push("no usable logo (name will be shown as text)");
else if (logo.w / logo.h < 1.1) flags.push("logo is square or tall");
const logoUri = logo ? `data:image/png;base64,${logo.png.toString("base64")}` : null;

// ---------- 4. colours ----------
// Primary comes from the logo when it has a colour, otherwise near-black. The site's own palette is only
// used for the accent, and only after dropping theme-builder defaults, Shop Pay purple and stock blues.
const hue = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
const okColour = (h) => {
  const rgb = hexRgb(h); if (!rgb || DEFAULT_COLOURS.has(h.toLowerCase())) return false;
  const hu = hue(rgb), s = sat(rgb), l = lumOf(...rgb);
  if (s < 0.4 || l < 0.1 || l > 0.68) return false;
  if (hu >= 245 && hu <= 285 && s > 0.6) return false; // Shop Pay / default purple
  if (hu >= 200 && hu <= 225 && s > 0.85) return false; // stock link blue
  return true;
};
const weights = new Map((brand.colors?.weights || []).map((w) => [w.hex.toLowerCase(), w.w]));
const found = [...(brand.colors?.found || [])].map((h) => h.toLowerCase()).sort((a, b) => (weights.get(b) || 0) - (weights.get(a) || 0));
const primary = logo?.dom || "#141414";
let accent = found.find((h) => okColour(h) && h !== primary.toLowerCase()) || primary;
if (accent === primary && primary === "#141414") accent = "#141414";
const onPrimary = ((rgb) => (rgb && lumOf(...rgb) < 0.6 ? "#ffffff" : "#111111"))(hexRgb(primary));
const colors = { primary, accent, background: "#ffffff", text: "#141414", onPrimary, found: brand.colors?.found || [], source: logo?.dom ? "logo" : "ink" };

// a true catalogue size from the product sitemaps when the crawl only saw a page of products
let catalogue = brand.productCount || products.length;
if (catalogue < 100) {
  try {
    const idx = await (await fetch(origin + "/sitemap.xml", { headers: UA, signal: AbortSignal.timeout(20000) })).text();
    const subs = [...idx.matchAll(/<loc>([^<]*sitemap_products[^<]*)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&")).slice(0, 12);
    let n = 0;
    for (const u of subs) { const t = await (await fetch(u, { headers: UA, signal: AbortSignal.timeout(20000) })).text(); n += (t.match(/<loc>[^<]*\/products\//g) || []).length; }
    if (n > catalogue) catalogue = n;
  } catch {}
}
if (catalogue > 5000) catalogue = 5000;

// ---------- 5. write ----------
const record = {
  slug, name: NAME || brand.name, url: brand.url, platform: "shopify", currency: brand.currency || "PKR", contact: null,
  logo: logoUri, icon: brand.icon || null, colors, fonts: brand.fonts || {},
  banners: (brand.banners || []).slice(0, 4).map((b) => (b.startsWith("//") ? "https:" + b : b)),
  collections: (brand.collections || []).slice(0, 10).map((c) => ({ ...c, image: null })),
  products, productCount: catalogue,
  features: brand.features || [], storeApps: brand.storeApps || [], crawledAt: new Date().toISOString(),
  warnings: [...(brand.warnings || []), ...flags], overrides: {},
};
const dir = path.join(ROOT, "content", "proposals"); fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(record, null, 1) + "\n");
if (logo) { const q = path.join(HERE, "work", "_qa"); fs.mkdirSync(q, { recursive: true }); fs.writeFileSync(path.join(q, `${slug}-logo.png`), logo.png); }
console.log(JSON.stringify({ slug, name: record.name, ok: flags.length === 0, flags, products: products.length, productCount: record.productCount, currency: record.currency, logo: logoInfo, colors: { primary, accent }, apps: record.storeApps, banners: record.banners.length }));
