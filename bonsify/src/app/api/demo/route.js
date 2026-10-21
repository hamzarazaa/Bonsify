import { buildRemoteBrand } from "../../../../scripts/lib/brand-record.mjs";
import { trimBrand } from "@/lib/lab";

// Public "type your store" demo on the lab site. It reads a store's public
// pages and returns a small brand record the phone can draw. Nothing is saved.
// Off unless the lab site (NEXT_PUBLIC_LAB=1) is running, so the main site
// never exposes it. Abuse limits: Turnstile check, per-visitor and overall
// caps (best effort on serverless, since memory is per instance).
export const maxDuration = 60;

const ON = process.env.NEXT_PUBLIC_LAB === "1" || process.env.LAB_DEMO === "1";
const TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

const hits = new Map(); // ip -> [timestamps]
const all = [];
const WINDOW = 10 * 60 * 1000;
const PER_IP = 4;
const OVERALL = 80; // per hour per instance

function limited(ip) {
  const now = Date.now();
  while (all.length && now - all[0] > 3600_000) all.shift();
  if (all.length >= OVERALL) return true;
  const mine = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  if (mine.length >= PER_IP) {
    hits.set(ip, mine);
    return true;
  }
  mine.push(now);
  hits.set(ip, mine);
  all.push(now);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW)) hits.delete(k);
  return false;
}

// Crawled stores are kept for a day, keyed by host. A repeat demo of the same
// store is instant and costs no crawl. Per instance, best effort on serverless.
const cache = new Map(); // host -> { at, brand }
const DAY = 24 * 3600_000;
const CACHE_MAX = 200;
const hostKey = (url) => new URL(url).hostname.toLowerCase().replace(/^www\./, "");
function cached(host) {
  const c = cache.get(host);
  if (!c) return null;
  if (Date.now() - c.at > DAY) {
    cache.delete(host);
    return null;
  }
  return c.brand;
}
function remember(host, brand) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(host, { at: Date.now(), brand });
}

function safeUrl(input) {
  try {
    const u = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    if (!/^https?:$/.test(u.protocol)) return null;
    const h = u.hostname.toLowerCase();
    if (!h.includes(".") || /^\d+(\.\d+){3}$/.test(h) || h.includes(":") || /(^|\.)(local|localhost|internal|lan|home|corp)$/.test(h)) return null;
    return u.href;
  } catch {
    return null;
  }
}

// Phones that scan the demo's QR code load the store from the same one-day
// cache, so no second crawl or check is needed.
export async function GET(request) {
  if (!ON) return Response.json({ error: "Not found." }, { status: 404 });
  const host = String(new URL(request.url).searchParams.get("host") || "").toLowerCase().replace(/^www\./, "").slice(0, 120);
  const hit = host ? cached(host) : null;
  if (!hit) return Response.json({ error: "expired" }, { status: 404 });
  return Response.json({ brand: hit });
}

export async function POST(request) {
  if (!ON) return Response.json({ error: "Not found." }, { status: 404 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a store address." }, { status: 400 });
  }
  const url = safeUrl(String(body?.url || "").trim().slice(0, 200));
  if (!url) return Response.json({ error: "That does not look like a store address. Try something like yourstore.com." }, { status: 400 });

  const ip = (request.headers.get("x-forwarded-for") || "anon").split(",")[0].trim();
  if (!body?.token) return Response.json({ error: "Please complete the check first." }, { status: 400 });
  try {
    const form = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY || TEST_SECRET_KEY, response: body.token });
    if (ip !== "anon") form.set("remoteip", ip);
    const v = await (await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form })).json();
    if (!v.success) return Response.json({ error: "Check failed. Refresh and try again." }, { status: 400 });
  } catch {
    return Response.json({ error: "Could not run the check. Try again." }, { status: 502 });
  }
  const host = hostKey(url);
  const hit = cached(host);
  if (hit) return Response.json({ brand: hit, cached: true });
  if (limited(ip)) return Response.json({ error: "That is a lot of stores. Give it a few minutes, or book a call and we will show yours." }, { status: 429 });

  try {
    const b = await buildRemoteBrand(url, { palette: false });
    const brand = trimBrand({ ...b, slug: "yours" }, 28, 8);
    if (brand.products.length < 2) throw new Error("That store does not look like a Shopify store, or it hides its catalogue. We can still build it, book a call and we will show you.");
    remember(host, brand);
    return Response.json({ brand });
  } catch (e) {
    const m = String(e.message || "");
    return Response.json(
      { error: /429|403|blocks/.test(m) ? "That store blocks automated visits. We can still build it, book a call and we will show you." : m || "Could not read that store." },
      { status: 422 }
    );
  }
}
