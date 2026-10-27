import fs from "fs";
import path from "path";
import { trimBrand, getLabBrands } from "@/lib/lab";
import { getProposal } from "@/lib/proposals";

// Personal pitch pages at /demo/<slug>: the video, the "Get your app now"
// button and the live app for one store. One JSON file per page in
// content/demo, edited in /admin under "Brand video pages".
//
// The store (logo, colours, products) is found in this order:
//   1. the "brandJson" field of the page itself (the Fetch from store button in /admin)
//   2. a saved crawl in content/lab/<slug>.json (made with the add-brand script)
//   3. a proposal with the same slug in content/proposals
const DIR = path.join(process.cwd(), "content", "demo");

const DEFAULT_HEADLINE = "You asked what an app could look like. We built it.";
const text = (v) => (typeof v === "string" ? v.trim() : "");

function readFile(slug) {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const file = path.join(DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function brandFor(slug, raw) {
  if (text(raw.brandJson)) {
    try {
      const b = JSON.parse(raw.brandJson);
      if (b?.url) return trimBrand({ ...b, slug, products: (b.products || []).filter((p) => p.image) });
    } catch {}
  }
  const lab = getLabBrands({ all: true }).find((b) => b.slug === slug);
  if (lab) return lab;
  const prop = getProposal(slug);
  return prop ? trimBrand({ ...prop, slug }) : null;
}

// Only pages that are switched on, have a video and have store data get built.
export function getDemo(slug) {
  const raw = readFile(slug);
  if (!raw || raw.published !== true) return null;
  const src = text(raw.video?.src);
  if (!src) return null;
  const brand = brandFor(slug, raw);
  if (!brand) return null;
  const who = text(raw.brandName) || brand.name;
  return {
    slug,
    brand: raw.brandName ? { ...brand, name: who } : brand,
    video: {
      src,
      poster: text(raw.video?.poster) || undefined,
      captions: text(raw.video?.captions) || undefined,
      who,
      contact: text(raw.contact) || who,
      headline: text(raw.headline) || DEFAULT_HEADLINE,
    },
  };
}

export function getDemoSlugs() {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((s) => getDemo(s));
}
