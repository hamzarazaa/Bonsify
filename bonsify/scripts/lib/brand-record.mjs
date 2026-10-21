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
      x.searchParams.set('width', String(w));
      return x.href;
    } catch {}
  }
  return u;
};

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

  let logo = brand.logo ? sized(brand.logo, 600) : null;
  let logoBuf = null;
  if (logo) {
    try {
      const r = await fetch(logo, { headers: { 'user-agent': 'Mozilla/5.0 BonsifyProposalBot' } });
      if (r.ok) logoBuf = Buffer.from(await r.arrayBuffer());
    } catch {}
  } else if (brand.logoSvg) {
    logoBuf = Buffer.from(brand.logoSvg);
    logo = 'data:image/svg+xml;utf8,' + encodeURIComponent(brand.logoSvg.replace(/currentColor/g, '#141414'));
  }
  if (!logo && brand.icon) logo = sized(brand.icon, 600);

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
    crawledAt: brand.crawledAt,
    warnings: brand.warnings,
  };
}
