// Picks the products and banners worth showing in a generated app. Runs in the
// browser: the store's image CDN lets canvas read pixels, and doing it here
// keeps the server free of native image libraries.
//
// 1. Visual duplicates: a small perceptual hash (dHash) plus an average colour
//    per image. Two products whose photos hash within a few bits and whose
//    colours match are the same item in different sizes or shades.
// 2. People: a skin-tone check (YCbCr) on a downsized copy. It is a heuristic,
//    not face detection, so it is only used to prefer photos, never to hide
//    a product outright.

const W = 36;
const H = 36;

const small = (u) => {
  try {
    const x = new URL(u);
    if (x.hostname.includes("shopify")) {
      x.searchParams.set("width", "160");
      return x.href;
    }
    if (x.searchParams.has("width")) {
      x.searchParams.set("width", "160");
      return x.href;
    }
  } catch {}
  return u;
};

function load(url, ms = 5000) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const t = setTimeout(() => resolve(null), ms);
    img.onload = () => {
      clearTimeout(t);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(t);
      resolve(null);
    };
    img.src = small(url);
  });
}

function pixels(img) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, 0, 0, W, H);
  try {
    return g.getImageData(0, 0, W, H).data;
  } catch {
    return null; // tainted canvas: the CDN did not allow reading pixels
  }
}

function analyse(img) {
  const d = pixels(img);
  if (!d) return null;
  // dHash: compare each pixel with its right neighbour on a 9x8 grid.
  const gray = new Float32Array(W * H);
  let r = 0;
  let g = 0;
  let b = 0;
  let white = 0;
  for (let i = 0; i < W * H; i++) {
    const R = d[i * 4];
    const G = d[i * 4 + 1];
    const B = d[i * 4 + 2];
    gray[i] = 0.299 * R + 0.587 * G + 0.114 * B;
    r += R;
    g += G;
    b += B;
    if (R > 235 && G > 235 && B > 235) white++;
  }
  const bits = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const a = gray[Math.floor(((y + 0.5) * H) / 8) * W + Math.floor(((x + 0.5) * W) / 9)];
      const c = gray[Math.floor(((y + 0.5) * H) / 8) * W + Math.floor(((x + 1.5) * W) / 9)];
      bits.push(a > c ? 1 : 0);
    }
  }
  // Skin: share of skin-toned pixels, and how tightly they cluster.
  let skin = 0;
  let minX = W;
  let maxX = 0;
  let minY = H;
  let maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const R = d[i];
      const G = d[i + 1];
      const B = d[i + 2];
      const Y = 0.299 * R + 0.587 * G + 0.114 * B;
      const Cb = 128 - 0.168736 * R - 0.331264 * G + 0.5 * B;
      const Cr = 128 + 0.5 * R - 0.418688 * G - 0.081312 * B;
      if (Y > 50 && Cb >= 77 && Cb <= 127 && Cr >= 136 && Cr <= 173 && R > G && R > B) {
        skin++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const n = W * H;
  const frac = skin / n;
  const box = skin ? ((maxX - minX + 1) * (maxY - minY + 1)) / n : 0;
  const dense = skin && box ? skin / (box * n) : 0; // how filled the skin box is
  // A person shows as a decent patch of skin that is not the whole picture.
  // Pale packshots (cream, peach, nude) fill most of the frame, so cap it.
  const person = frac >= 0.035 && frac <= 0.42 && dense > 0.3 ? Math.min(1, frac * 6) : 0;
  return { bits, avg: [r / n, g / n, b / n], white: white / n, person };
}

const ham = (a, b) => a.reduce((n, v, i) => n + (v !== b[i] ? 1 : 0), 0);
const cdist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// "Serum - 30ml", "Serum | Pink", "Serum (Pack of 2)" -> "serum"
const stem = (t) =>
  (t || "")
    .toLowerCase()
    .split(/\s[-|:–—]\s|\(|,/)[0]
    .replace(/\b(pack of \d+|set of \d+|\d+\s?(ml|g|oz|pcs|pc|pack|kg|l))\b/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

async function look(u) {
  const img = await load(u);
  if (!img) return null;
  try {
    return analyse(img);
  } catch {
    return null;
  }
}

async function inBatches(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}

/**
 * brand: a trimmed brand with up to ~28 candidate products and ~6 banners.
 * Returns the same shape with at most `keep` products and 3 banners, no
 * near-duplicates, and photos with people first where they exist.
 */
export async function curateBrand(brand, { keep = 12 } = {}) {
  const cand = brand.products || [];
  if (cand.length < 3 || typeof document === "undefined") return brand;

  // Analyse each product's photos (main plus up to two more).
  const scored = await inBatches(cand, 8, async (p) => {
    const urls = [p.image, ...(p.images || []).filter((u) => u !== p.image)].slice(0, 3);
    const infos = await Promise.all(urls.map(async (u) => ({ u, a: await look(u) })));
    return { p, infos: infos.filter((x) => x.a) };
  });

  const kept = [];
  const types = new Map();
  const rank = scored
    .map((s) => {
      const best = s.infos.slice().sort((a, b) => b.a.person - a.a.person)[0];
      return { ...s, best, person: best?.a.person || 0 };
    })
    // Photos with people first, then the store's own order.
    .map((s, i) => ({ ...s, order: i - s.person * 14 }))
    .sort((a, b) => a.order - b.order);

  for (const s of rank) {
    const main = s.infos[0]?.a;
    const st = stem(s.p.title);
    const dup = kept.some((k) => {
      if (st && st === k.st) return true;
      const km = k.infos[0]?.a;
      if (!main || !km) return false;
      return ham(main.bits, km.bits) <= 9 && cdist(main.avg, km.avg) < 40;
    });
    if (dup) continue;
    const t = (s.p.type || "").toLowerCase();
    if (t && (types.get(t) || 0) >= 3) continue; // keep the range varied
    kept.push({ ...s, st });
    types.set(t, (types.get(t) || 0) + 1);
    if (kept.length >= keep) break;
  }

  // Too few survived the filters: top up from the rest in store order.
  if (kept.length < Math.min(6, cand.length)) {
    const have = new Set(kept.map((k) => k.p));
    for (const s of rank) {
      if (have.has(s.p) || kept.length >= 6) continue;
      kept.push({ ...s, st: stem(s.p.title) });
    }
  }

  const products = kept.map((k) => {
    const p = { ...k.p };
    // Lead with the photo that shows a person when there is one.
    if (k.best && k.best.a.person > 0.2 && k.best.u && k.best.u !== p.image) {
      p.images = [k.best.u, ...(p.images || []).filter((u) => u !== k.best.u)].slice(0, 4);
      p.image = k.best.u;
    }
    p.person = (k.best?.a.person || 0) > 0.2;
    return p;
  });

  // Banners: people first, plain white or tiny images last.
  const banners = brand.banners || [];
  let outBanners = banners.slice(0, 3);
  if (banners.length > 1) {
    const sb = await inBatches(banners.slice(0, 8), 8, async (u) => {
      return { u, a: await look(u) };
    });
    outBanners = sb
      .map((x, i) => ({ ...x, order: i - (x.a?.person || 0) * 6 + (x.a && x.a.white > 0.7 ? 6 : 0) }))
      .sort((a, b) => a.order - b.order)
      .map((x) => x.u)
      .slice(0, 3);
  }

  return { ...brand, products, banners: outBanners };
}
