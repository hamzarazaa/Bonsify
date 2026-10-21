#!/usr/bin/env node
// Usage:
//   npm run add-brand -- https://store.com [--name "Brand"] [--slug brand] [--contact "Ali"]
//
// Crawls the store, saves logo / product / banner images to public/proposals/<slug>/,
// and writes content/proposals/<slug>.json. Anything you put under "overrides" in that
// JSON file is kept when you re-run the crawl, so hand fixes are never lost.
// The page is then live at /for/<slug> after the next deploy.

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { crawlBrand, rgbToHex, hexToRgb, rgbToHsl, contrast } from './lib/crawl-brand.mjs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const flag = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const url = args.find((a) => /^(https?:\/\/)?[\w-]+(\.[\w-]+)+/.test(a) && !a.startsWith('--'));
if (!url) {
  console.error('Give a store URL, e.g. npm run add-brand -- https://www.highfy.pk --name Highfy');
  process.exit(1);
}

const log = (...m) => console.log('  ', ...m);

async function download(src, dest, width) {
  if (!src) return null;
  try {
    let u = src;
    // Ask Shopify's CDN for a sensible size instead of the original upload.
    if (/cdn\.shopify\.com|\/cdn\/shop\//.test(u) && width) {
      const x = new URL(u);
      x.searchParams.set('width', String(width));
      u = x.href;
    }
    const res = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 BonsifyProposalBot' } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const isSvg = /svg/.test(res.headers.get('content-type') || '') || u.split('?')[0].endsWith('.svg');
    if (isSvg) {
      await fs.writeFile(dest.replace(/\.\w+$/, '.svg'), buf);
      return dest.replace(/\.\w+$/, '.svg');
    }
    let img = sharp(buf, { failOn: 'none' });
    if (width) img = img.resize({ width, withoutEnlargement: true });
    await img.webp({ quality: 82 }).toFile(dest);
    return dest;
  } catch (e) {
    log(`! could not save ${src}: ${e.message}`);
    return null;
  }
}

async function isBlank(file) {
  try {
    const { data } = await sharp(file).resize(64, 64, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let solid = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 40) solid++;
    return solid < (data.length / 4) * 0.01;
  } catch {
    return false;
  }
}

async function dominantColors(file) {
  // Most common colours in the logo, bucketed so near-identical shades merge.
  try {
    const { data } = await sharp(file).resize(64, 64, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const buckets = new Map();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 200) continue;
      const rgb = [data[i], data[i + 1], data[i + 2]].map((v) => Math.round(v / 24) * 24);
      const k = rgbToHex(rgb.map((v) => Math.min(255, v)));
      buckets.set(k, (buckets.get(k) || 0) + 1);
    }
    return [...buckets.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 8);
  } catch {
    return [];
  }
}

const rel = (abs) => (abs ? '/' + path.relative(path.join(ROOT, 'public'), abs).split(path.sep).join('/') : null);

console.log(`Crawling ${url} ...`);
let brand;
try {
  brand = await crawlBrand(url, { log, name: flag('name'), slug: flag('slug') });
} catch (e) {
  console.error(`\nStopped: ${e.message}`);
  process.exit(1);
}
const slug = brand.slug;
const outDir = path.join(ROOT, 'public', 'proposals', slug);
const jsonPath = path.join(ROOT, 'content', 'proposals', `${slug}.json`);
await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(path.dirname(jsonPath), { recursive: true });

let existing = null;
try {
  existing = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
} catch {}

// If a feed failed this time (rate limit), keep the catalogue from the last good crawl.
const keepOld = (key) => existing && existing[key]?.length && brand[key].length === 0;

log('Saving images ...');
let logoFile = null;
if (brand.logo) logoFile = await download(brand.logo, path.join(outDir, 'logo.webp'), 600);
if (!logoFile && brand.logoSvg) {
  logoFile = path.join(outDir, 'logo.svg');
  let svg = brand.logoSvg;
  await fs.writeFile(logoFile, svg);
  // Inline logos are often coloured by the site's CSS (fill: currentColor or
  // fill="none" on the root). Standalone they render blank, so give them an
  // explicit dark fill when nothing shows.
  if (await isBlank(logoFile)) {
    svg = svg
      .replace(/(<svg\b[^>]*?)\sfill="none"/, '$1')
      .replace(/<svg\b/, '<svg fill="#141414" color="#141414"')
      .replace(/currentColor/g, '#141414');
    await fs.writeFile(logoFile, svg);
  }
}
if (!logoFile && brand.icon) logoFile = await download(brand.icon, path.join(outDir, 'logo.webp'), 600);
const iconFile = brand.icon ? await download(brand.icon, path.join(outDir, 'icon.webp'), 256) : null;
const bannerFiles = [];
for (const [i, b] of brand.banners.entries()) {
  const f = await download(b, path.join(outDir, `banner-${i + 1}.webp`), 1200);
  if (f) bannerFiles.push(rel(f));
}
const products = [];
for (const [i, p] of brand.products.entries()) {
  const f = await download(p.image, path.join(outDir, `product-${i + 1}.webp`), 700);
  if (!f) continue;
  const extra = [];
  for (const [j, im] of p.images.slice(1, 3).entries()) {
    const g = await download(im, path.join(outDir, `product-${i + 1}-${j + 2}.webp`), 700);
    if (g) extra.push(rel(g));
  }
  products.push({ ...p, image: rel(f), images: [rel(f), ...extra] });
}
const collections = [];
for (const [i, c] of brand.collections.entries()) {
  const f = c.image ? await download(c.image, path.join(outDir, `collection-${i + 1}.webp`), 300) : null;
  collections.push({ ...c, image: f ? rel(f) : null });
}

// Colours: the logo is the most reliable brand signal, so its colours win over theme CSS.
// CSS colours fill in an accent when the logo has only one hue.
const hue = (h) => rgbToHsl(hexToRgb(h))[0];
const hueGap = (a, b) => {
  const d = Math.abs(hue(a) - hue(b));
  return Math.min(d, 360 - d);
};
const chromatic = (h) => {
  const [, s, l] = rgbToHsl(hexToRgb(h));
  return s > 0.3 && l > 0.15 && l < 0.85;
};
// sharp rasterises SVG too, so SVG logos give colours as well.
const logoAll = logoFile ? await dominantColors(logoFile) : [];
const logoColors = logoAll.filter(chromatic);
const cssColors = brand.colors.found;
const strongCss = (brand.colors.weights || []).filter((c) => c.w >= 12).map((c) => c.hex);
const logoIsMono = logoAll.length > 0 && logoColors.length === 0;
if (logoIsMono) {
  // A black or white logo means a monochrome brand. Don't colour it with
  // whatever widget blue happens to be in the CSS; only a colour the theme
  // uses heavily (buttons, links) is allowed in as the accent.
  const dark = logoAll.find((h) => rgbToHsl(hexToRgb(h))[2] < 0.35);
  brand.colors.primary = dark && dark !== '#000000' ? dark : '#141414';
  brand.colors.accent = strongCss[0] || null;
  brand.colors.source = 'logo (monochrome)';
} else if (logoColors.length) {
  const primary = logoColors[0];
  const accent =
    logoColors.find((h) => hueGap(h, primary) > 35) || cssColors.find((h) => hueGap(h, primary) > 35) || null;
  brand.colors.primary = primary;
  brand.colors.accent = accent;
  brand.colors.source = 'logo';
} else if (cssColors.length) {
  brand.colors.source = 'css';
} else {
  brand.colors.source = 'none';
  brand.warnings.push('No brand colour found in the logo or CSS; set colors.primary under "overrides".');
}
// Make sure white text is readable on the primary colour; otherwise use dark text.
const onPrimary = contrast(hexToRgb(brand.colors.primary), [255, 255, 255]) >= 3 ? '#ffffff' : '#141414';

const out = {
  slug,
  name: brand.name,
  url: brand.url,
  platform: brand.platform,
  currency: brand.currency,
  contact: flag('contact') || existing?.contact || null,
  logo: rel(logoFile),
  icon: rel(iconFile),
  colors: { ...brand.colors, onPrimary },
  fonts: brand.fonts,
  banners: bannerFiles.length ? bannerFiles : existing?.banners || [],
  collections: keepOld('collections') ? existing.collections : collections,
  products: keepOld('products') ? existing.products : products,
  productCount: brand.productCount,
  features: brand.features,
  storeApps: brand.storeApps || [],
  crawledAt: brand.crawledAt,
  warnings: brand.warnings,
  overrides: existing?.overrides || {},
};

await fs.writeFile(jsonPath, JSON.stringify(out, null, 2) + '\n');
console.log(`\nSaved ${path.relative(ROOT, jsonPath)}`);
console.log(`  ${out.products.length} products, ${out.collections.length} collections, ${out.banners.length} banners`);
console.log(`  colours ${out.colors.primary} / ${out.colors.accent || '-'}   fonts ${out.fonts.heading || '-'} / ${out.fonts.body || '-'}`);
if (out.warnings.length) console.log('  Check:\n   - ' + out.warnings.join('\n   - '));
console.log(`\nPreview at http://localhost:3000/for/${slug} (npm run dev), live at /for/${slug} after deploy`);
