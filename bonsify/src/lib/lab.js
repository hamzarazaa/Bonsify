import fs from "fs";
import path from "path";
import { getProposal } from "@/lib/proposals";

// The lab home page needs a few ready-made stores for its brand switcher.
// Highfy comes from the proposal files; the others are saved crawls in
// content/lab (made once with scripts, not at request time).
const DIR = path.join(process.cwd(), "content", "lab");

// What the page and phone need, trimmed so the first load stays small.
export function trimBrand(b, maxProducts = 8, maxBanners = 3) {
  const products = (b.products || [])
    .filter((p) => p.image && !/gift\s*card|e-?gift/i.test(p.title || ""))
    .slice(0, maxProducts)
    .map((p) => ({
      handle: p.handle,
      title: p.title,
      price: p.price,
      compareAt: p.compareAt,
      image: p.image,
      images: (p.images || []).slice(0, 4),
      type: p.type,
      vendor: p.vendor,
      available: p.available,
      options: (p.options || []).slice(0, 2),
      description: (p.description || "").slice(0, 260),
    }));
  const wide = (u) => (u || "").replace(/([?&])w=\d+/, "$1w=1080");
  return {
    slug: b.slug,
    name: b.name,
    domain: b.domain || new URL(b.url).hostname.replace(/^www\./, ""),
    url: b.url,
    currency: b.currency,
    logo: b.logo,
    icon: b.icon,
    colors: b.colors,
    fonts: b.fonts || {},
    banners: (b.banners || []).slice(0, maxBanners).map(wide),
    collections: (b.collections || []).slice(0, 8),
    products,
    productCount: b.productCount,
    features: b.features || [],
  };
}

// Brands whose logo is plain black get a hand-picked accent so the page has
// something to change colour with. Names and stores are real; the colour pick
// is only used on this demo page.
const COLOUR_FIX = {
  colourpop: { primary: "#ff1d7c", accent: "#ff849e", onPrimary: "#ffffff" },
  gymshark: { primary: "#181818", accent: "#bf2e35", onPrimary: "#ffffff" },
};

export function getLabBrands() {
  const out = [];
  const highfy = getProposal("highfy");
  if (highfy) out.push(trimBrand({ ...highfy, slug: "highfy" }));
  if (fs.existsSync(DIR)) {
    for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort()) {
      const slug = f.replace(/\.json$/, "");
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
        const b = trimBrand({ ...raw, slug });
        if (COLOUR_FIX[slug]) b.colors = { ...b.colors, ...COLOUR_FIX[slug] };
        if (b.products.length >= 4) out.push(b);
      } catch {}
    }
  }
  return out;
}
