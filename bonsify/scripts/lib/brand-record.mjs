// Builds a proposal record from a live store WITHOUT saving any files, for use
// in the /admin "Fetch from store" button (src/app/api/crawl/route.js). Images
// stay as links to the store's own CDN, so nothing is written to disk or git.
// The CLI (scripts/add-brand.mjs) does the same job but also downloads the images.
import { crawlBrand, rgbToHex, hexToRgb, rgbToHsl, contrast } from './crawl-brand.mjs';

const sized = (u, w) => {
  if (!u) return u;
  if (/cdn\.shopify\.com|\/cdn\/shop\//.test(u)) {
    try {
      const x = new URL(u);
      x.searchParams.delete('height');
      x.searchParams.delete('crop');
      x.searchParams.set('width', String(w));
      return x.href;
    } catch {}
  }
  return u;
};


const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Fetch an image; one retry on a network error, timeout or 5xx/429. A 404 or a
// non-image answer moves straight on to the next candidate.
async function tryImage(url, referer) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'image/*,*/*;q=0.8', referer }, redirect: 'follow', signal: ctrl.signal });
      if (r.ok) {
        const type = (r.headers.get('content-type') || '').toLowerCase();
        const buf = Buffer.from(await r.arrayBuffer());
        if ((type.startsWith('image/') || /\.(png|jpe?g|webp|svg|ico|gif)(\?|$)/i.test(url)) && buf.length > 200) return buf;
        return null;
      }
      if (r.status < 429 || (r.status > 429 && r.status < 500)) return null;
    } catch {}
    finally {
      clearTimeout(t);
    }
    await wait(500 + attempt * 500);
  }
  return null;
}

async function resolveLogo(brand) {
  let origin = null;
  try {
    origin = new URL(brand.url).origin;
  } catch {}
  const host = origin ? new URL(origin).hostname : null;
  const list = [
    brand.logo && sized(brand.logo, 600),
    ...(brand.logoCandidates || []).map((u) => sized(u, 600)),
    brand.icon && sized(brand.icon, 600),
    origin && `${origin}/apple-touch-icon.png`,
    host && `https://www.google.com/s2/favicons?domain=${host}&sz=256`,
    origin && `${origin}/favicon.ico`,
  ].filter(Boolean);
  const seen = new Set();
  const started = Date.now();
  for (const u of list) {
    if (seen.has(u)) continue;
    seen.add(u);
    if (Date.now() - started > 20000) break;
    const buf = await tryImage(u, origin || undefined);
    if (buf) return { logo: u, buf };
  }
  return { logo: null, buf: null };
}

// sharp is loaded on demand: if the host cannot load its native library, the
// crawl still works and colours come from the store's theme instead.
async function logoPalette(buf) {
  try {
    const sharp = (await import('sharp')).default;
    const { data } = await sharp(buf, { failOn: 'none' }).resize(64, 64, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const buckets = new Map();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 200) continue;
      const rgb = [data[i], data[i + 1], data[i + 2]].map((v) => Math.min(255, Math.round(v / 24) * 24));
      const k = rgbToHex(rgb);
      buckets.set(k, (buckets.get(k) || 0) + 1);
    }
    return [...buckets.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 8);
  } catch {
    return [];
  }
}

export async function buildRemoteBrand(url, opts = {}) {
  const brand = await crawlBrand(url, { name: opts.name, slug: opts.slug });

  // The logo is checked, not trusted: stores block hotlinking, move files and
  // serve odd formats. Each candidate gets a retry, then the next one is tried.
  let { logo, buf: logoBuf } = await resolveLogo(brand);
  if (!logo && brand.logoSvg) {
    logoBuf = Buffer.from(brand.logoSvg);
    logo = 'data:image/svg+xml;utf8,' + encodeURIComponent(brand.logoSvg.replace(/currentColor/g, '#141414'));
  }

  // Same rules as the CLI: the logo's colours win over theme CSS.
  const hue = (h) => rgbToHsl(hexToRgb(h))[0];
  const hueGap = (a, b) => {
    const d = Math.abs(hue(a) - hue(b));
    return Math.min(d, 360 - d);
  };
  const chromatic = (h) => {
    const [, s, l] = rgbToHsl(hexToRgb(h));
    return s > 0.3 && l > 0.15 && l < 0.85;
  };
  const logoAll = logoBuf && opts.palette !== false && !process.env.VERCEL ? await logoPalette(logoBuf) : [];
  const logoColors = logoAll.filter(chromatic);
  const cssColors = brand.colors.found || [];
  const strongCss = (brand.colors.weights || []).filter((c) => c.w >= 12).map((c) => c.hex);
  const colors = { ...brand.colors };
  if (logoAll.length && logoColors.length === 0) {
    const dark = logoAll.find((h) => rgbToHsl(hexToRgb(h))[2] < 0.35);
    colors.primary = dark && dark !== '#000000' ? dark : '#141414';
    colors.accent = strongCss[0] || null;
    colors.source = 'logo (monochrome)';
  } else if (logoColors.length) {
    const primary = logoColors[0];
    colors.primary = primary;
    colors.accent = logoColors.find((h) => hueGap(h, primary) > 35) || cssColors.find((h) => hueGap(h, primary) > 35) || null;
    colors.source = 'logo';
  } else if (cssColors.length) {
    colors.source = 'css';
  } else {
    colors.source = 'none';
    brand.warnings.push('No brand colour found; set one under "Hand fixes" in the editor.');
  }
  const onPrimary = colors.primary && contrast(hexToRgb(colors.primary), [255, 255, 255]) >= 3 ? '#ffffff' : '#141414';

  const products = brand.products
    .filter((p) => p.image)
    .map((p) => ({ ...p, image: sized(p.image, 700), images: (p.images || []).slice(0, 3).map((i) => sized(i, 700)) }));

  return {
    slug: brand.slug,
    name: brand.name,
    url: brand.url,
    platform: brand.platform,
    currency: brand.currency,
    logo,
    icon: brand.icon ? sized(brand.icon, 256) : null,
    colors: { ...colors, onPrimary },
    fonts: brand.fonts,
    banners: brand.banners.map((b) => sized(b, 1200)),
    collections: brand.collections.map((c) => ({ ...c, image: sized(c.image, 300) })),
    products,
    productCount: brand.productCount,
    features: brand.features,
    storeApps: brand.storeApps || [],
    crawledAt: brand.crawledAt,
    warnings: brand.warnings,
  };
}
