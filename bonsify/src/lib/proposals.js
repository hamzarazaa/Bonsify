import fs from "fs";
import path from "path";

// One JSON file per prospect, written by `npm run add-brand -- <store url>`
// (scripts/add-brand.mjs). Kept inside the app folder, not ../source, so
// Vercel always has it at build time.
const DIR = path.join(process.cwd(), "content", "proposals");

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

// Hand fixes live under "overrides" in each brand file and win over the
// crawled values, so a re-crawl never undoes them.
function deepMerge(base, extra) {
  if (!isPlainObject(extra)) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(extra)) {
    out[k] = isPlainObject(v) && isPlainObject(base[k]) ? deepMerge(base[k], v) : v;
  }
  return out;
}

// The /admin form offers flat fields; map them onto the record's shape.
function normaliseOverrides(o) {
  if (!isPlainObject(o)) return {};
  const { primary, name, ...rest } = o;
  const out = { ...rest };
  if (name) out.name = name;
  if (primary && /^#[0-9a-f]{6}$/i.test(primary)) out.colors = { primary };
  return out;
}

export function getProposalSlugs() {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function getProposal(slug) {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const file = path.join(DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  let raw = JSON.parse(fs.readFileSync(file, "utf8"));
  // Records made in /admin keep the fetched store data as one JSON string
  // (brandJson) beside the hand-edited fields; CLI records are flat.
  if (typeof raw.brandJson === "string" && raw.brandJson.trim()) {
    const fetched = JSON.parse(raw.brandJson);
    raw = {
      ...fetched,
      slug,
      name: fetched.name || raw.name,
      contact: raw.contact || fetched.contact || null,
      overrides: normaliseOverrides(raw.overrides),
    };
  }
  const { overrides, warnings, ...data } = raw;
  const merged = deepMerge(data, overrides);
  // Videos live at <base>/<slug>.mp4. The base (content/settings/video.json) is /demo until the
  // files are on a CDN, then one edit moves every page.
  let video = null;
  if (merged.video && merged.video.ready !== false) {
    let base = "/demo";
    try { base = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "settings", "video.json"), "utf8")).base || base; } catch {}
    base = base.replace(/\/$/, "");
    video = { src: merged.video.src || `${base}/${slug}.mp4`, poster: merged.video.poster || `${base}/${slug}-poster.jpg`, captions: merged.video.captions || null };
  }
  return {
    ...merged,
    video,
    deckPdf: fs.existsSync(path.join(process.cwd(), "public", "decks", `${slug}-deck.pdf`)) ? `/decks/${slug}-deck.pdf` : null,
    domain: new URL(merged.url).hostname.replace(/^www\./, ""),
    products: (merged.products || []).filter((p) => p.image),
    collections: merged.collections || [],
    banners: merged.banners || [],
    features: merged.features || [],
    storeApps: merged.storeApps || [],
  };
}
