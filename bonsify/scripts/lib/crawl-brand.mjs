// Crawl a store's public pages and return the brand data a proposal page needs:
// name, logo, colours, fonts, products, collections, banners and detected features.
// Works best on Shopify (uses the public /products.json and /collections.json feeds,
// falling back to the product sitemap when those are rate-limited); other platforms
// get name, logo, colours, fonts and banners from the homepage only.

import { detectStoreApps } from './detect-apps.mjs';
import * as cheerio from 'cheerio';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, opts = {}) {
  // Shopify rate-limits bursts; back off and retry on 429.
  const waits = [3000, 7000, 15000, 30000];
  for (const wait of waits) {
    const r = await getOnce(url, opts);
    if (r.status !== 429) return r;
    await sleep(wait + Math.random() * 1000);
  }
  return getOnce(url, opts);
}

async function getOnce(url, { json = false, timeout = 20000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, accept: json ? 'application/json' : 'text/html,*/*' },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    if (!res.ok) return { ok: false, status: res.status, url: res.url };
    const body = json ? await res.json().catch(() => null) : await res.text();
    return { ok: body != null, status: res.status, url: res.url, body };
  } catch (e) {
    return { ok: false, status: 0, error: String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

export function absolute(src, base) {
  if (!src) return null;
  src = src.trim().split(/\s+/)[0];
  if (src.startsWith('data:')) return null;
  if (src.startsWith('//')) return 'https:' + src;
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
}

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

// ---------- colour helpers ----------
export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}
export function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
export function luminance([r, g, b]) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
const isChromatic = (rgb) => {
  const [, s, l] = rgbToHsl(rgb);
  return s > 0.28 && l > 0.12 && l < 0.88;
};
const hueDistance = (a, b) => {
  const d = Math.abs(rgbToHsl(a)[0] - rgbToHsl(b)[0]);
  return Math.min(d, 360 - d);
};

function collectColors(cssText, weights) {
  // Shopify Dawn-style vars hold "r, g, b" triplets; weight brand-ish names higher.
  const varRe = /--([\w-]+)\s*:\s*([^;}{]+)/g;
  let m;
  while ((m = varRe.exec(cssText))) {
    const name = m[1].toLowerCase();
    const val = m[2].trim();
    let rgb = null;
    const trip = val.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);
    if (trip) rgb = trip.slice(1, 4).map(Number);
    const hex = val.match(/^#([0-9a-f]{3}|[0-9a-f]{6})\b/i);
    if (!rgb && hex) rgb = hexToRgb(hex[0]);
    const fn = val.match(/^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/i);
    if (!rgb && fn) rgb = fn.slice(1, 4).map(Number);
    if (!rgb) continue;
    let w = 1;
    if (/(accent|primary|brand|button|btn|cta|link|sale|badge|highlight)/.test(name)) w = 6;
    if (/(background|bg|scheme|text|foreground|border|shadow|overlay)/.test(name)) w = 0.6;
    add(weights, rgb, w);
  }
  // Plain hex usages in rules (buttons etc.)
  const hexRe = /(?:color|background(?:-color)?|fill|border-color)\s*:\s*(#[0-9a-f]{3,6})\b/gi;
  while ((m = hexRe.exec(cssText))) {
    const rgb = hexToRgb(m[1]);
    if (rgb) add(weights, rgb, 1);
  }
}
function add(weights, rgb, w) {
  const key = rgbToHex(rgb);
  weights.set(key, (weights.get(key) || 0) + w);
}

// Default colours shipped with popular Shopify themes (Dawn and friends). Merchants
// often leave these in unused colour schemes, so they say nothing about the brand.
const THEME_DEFAULTS = new Set(['#334fb4', '#121212', '#f3f3f3', '#242833', '#2f6eba', '#1878b9', '#e32c2b', '#3d81a7']);

export function pickPalette(weights, fallback = []) {
  const entries = [...weights.entries()]
    .filter(([hex]) => !THEME_DEFAULTS.has(hex.toLowerCase()))
    .map(([hex, w]) => ({ hex, rgb: hexToRgb(hex), w }))
    .sort((a, b) => b.w - a.w);
  const chromatic = entries.filter((e) => isChromatic(e.rgb));
  for (const hex of fallback) {
    const rgb = hexToRgb(hex);
    if (rgb && isChromatic(rgb) && !chromatic.find((c) => c.hex === hex)) chromatic.push({ hex, rgb, w: 0.5 });
  }
  const primary = chromatic[0] || null;
  const accent = primary ? chromatic.find((c) => hueDistance(c.rgb, primary.rgb) > 35) || null : null;
  const lights = entries.filter((e) => rgbToHsl(e.rgb)[2] > 0.9);
  const darks = entries.filter((e) => rgbToHsl(e.rgb)[2] < 0.22);
  return {
    primary: primary?.hex || '#111111',
    accent: accent?.hex || null,
    background: lights[0]?.hex || '#ffffff',
    text: darks[0]?.hex || '#141414',
    found: chromatic.slice(0, 6).map((c) => c.hex),
    weights: chromatic.slice(0, 6).map((c) => ({ hex: c.hex, w: Math.round(c.w * 10) / 10 })),
  };
}

// ---------- font helpers ----------
const GENERIC_FONTS = new Set([
  'serif', 'sans-serif', 'monospace', 'system-ui', 'inherit', 'initial', 'cursive', 'fantasy',
  '-apple-system', 'blinkmacsystemfont', 'segoe ui', 'arial', 'helvetica', 'helvetica neue',
  'roboto', 'times new roman', 'icons', 'swiper-icons', 'fontawesome', 'font awesome 5 free',
  'font awesome 6 free', 'slick', 'shopify-icons', 'apple color emoji',
]);
function cleanFont(f) {
  if (!f) return null;
  const name = f.split(',')[0].replace(/["']/g, '').trim();
  if (!name || name.startsWith('var(') || GENERIC_FONTS.has(name.toLowerCase())) return null;
  if (/icon|awesome|glyph|swiper|slick|judgeme|star|!important|unset|^font-\d/i.test(name)) return null;
  if (/\d{4,}/.test(name) || name.length > 40) return null;
  return name;
}

function collectFonts(cssText, html) {
  const counts = new Map();
  const bump = (name, w = 1, role) => {
    const n = cleanFont(name);
    if (!n) return;
    const cur = counts.get(n) || { w: 0, roles: new Set() };
    cur.w += w;
    if (role) cur.roles.add(role);
    counts.set(n, cur);
  };
  let m;
  const headVar = /--font-heading-family\s*:\s*([^;]+)/gi;
  while ((m = headVar.exec(cssText))) bump(m[1], 10, 'heading');
  const bodyVar = /--font-body-family\s*:\s*([^;]+)/gi;
  while ((m = bodyVar.exec(cssText))) bump(m[1], 10, 'body');
  const ff = /font-family\s*:\s*([^;}]+)/gi;
  while ((m = ff.exec(cssText))) bump(m[1], 1);
  const g = /fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/gi;
  while ((m = g.exec(html))) {
    for (const fam of decodeURIComponent(m[1]).split('|')) bump(fam.split(':')[0].replace(/\+/g, ' '), 4);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1].w - a[1].w);
  const heading = ranked.find(([, v]) => v.roles.has('heading'))?.[0] || ranked[0]?.[0] || null;
  const body = ranked.find(([, v]) => v.roles.has('body'))?.[0] || ranked.find(([n]) => n !== heading)?.[0] || heading;
  return { heading, body, found: ranked.slice(0, 6).map(([n]) => n) };
}

async function googleFontAvailable(name) {
  if (!name) return false;
  const r = await get(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}&display=swap`, {
    timeout: 8000,
  });
  return r.ok;
}

// ---------- feature detection ----------
// Matched against script/link URLs and app embeds (not page copy), so a product
// description that says "recharge your skin" does not count as a subscription app.
const FEATURE_RULES = [
  { id: 'reviews', label: 'Product reviews', re: /judge\.me|judgeme|yotpo\.com|loox\.io|okendo\.io|stamped\.io|reviews\.io/i },
  { id: 'loyalty', label: 'Loyalty points', re: /smile\.io|sweettooth|rivo\.io|loyaltylion|growave|bon-loyalty|joy\.avada/i },
  { id: 'bnpl', label: 'Pay in instalments', re: /baadmay|qisstpay|tabby\.ai|tamara\.co|klarna|afterpay|sezzle/i },
  { id: 'wishlist', label: 'Wishlist', re: /swym|wishlist-?(plus|king|hero)|growave.*wishlist/i },
  { id: 'subscriptions', label: 'Subscriptions', re: /rechargecdn|rechargeapps|appstle|sealsubscriptions|boldcommerce.*subscri/i },
  { id: 'chat', label: 'Live chat / WhatsApp', re: /gorgias|tidio|zdassets|intercom|wa\.me\/|api\.whatsapp\.com|whatsapp-/i },
  { id: 'push', label: 'Web push', re: /pushowl|aimtell|onesignal|webpushr/i },
  { id: 'multicurrency', label: 'Multi-currency', re: /localization-form|currency-selector|geolizr/i },
  { id: 'existing-app', label: 'Already has an app', re: /apps\.apple\.com\/|play\.google\.com\/store\/apps|tapcart|vajro|shopney|plobal/i },
];

// ---------- product sitemap fallback ----------
// Shopify limits /products.json per IP. The product sitemap is served from a
// different path, lists every product with its title and image, and is
// rarely limited. Prices then come from /products/<handle>.js one at a time.
async function productsFromSitemap(base, log) {
  const index = await getOnce(new URL('sitemap.xml', base).href);
  if (!index.ok) return [];
  const sub = index.body.match(/<loc>([^<]*sitemap_products[^<]*)<\/loc>/)?.[1]?.replace(/&amp;/g, '&');
  if (!sub) return [];
  const sm = await getOnce(sub);
  if (!sm.ok) return [];
  const $ = cheerio.load(sm.body, { xmlMode: true });
  const items = [];
  $('url').each((_, el) => {
    const loc = $(el).children('loc').first().text();
    const img = $(el).find('image\\:loc').first().text();
    const title = $(el).find('image\\:title').first().text();
    const handle = loc.split('/products/')[1]?.split(/[?#]/)[0];
    if (handle && img) items.push({ handle, image: img, title });
  });
  const picked = items.slice(0, 16);
  log(`Using the product sitemap (${items.length} products listed)`);

  const products = [];
  let limited = false;
  for (const it of picked) {
    let data = null;
    if (!limited) {
      const r = await getOnce(new URL(`products/${it.handle}.js`, base).href, { json: true, timeout: 10000 });
      if (r.status === 429) limited = true;
      else if (r.ok) data = r.body;
      await sleep(350);
    }
    const v = data?.variants?.find((x) => x.available) || data?.variants?.[0];
    products.push({
      title: data?.title || it.title || it.handle.replace(/-/g, ' '),
      handle: it.handle,
      type: data?.type || null,
      vendor: data?.vendor || null,
      // .js endpoints return prices in minor units (cents/paisa).
      price: v ? v.price / 100 : null,
      compareAt: v?.compare_at_price ? v.compare_at_price / 100 : null,
      available: data ? data.available : true,
      image: absolute(data?.featured_image || it.image, base),
      images: (data?.images?.slice(0, 4) || [it.image]).map((s) => absolute(s, base)),
      options: (data?.options || [])
        .filter((o) => o.name !== 'Title')
        .map((o) => ({ name: o.name, values: (o.values || []).slice(0, 8) })),
      description: data?.description ? cheerio.load(data.description).text().replace(/\s+/g, ' ').trim().slice(0, 400) : '',
    });
  }
  return products.slice(0, 12);
}

// ---------- main ----------
export async function crawlBrand(inputUrl, opts = {}) {
  const log = opts.log || (() => {});
  const warnings = [];
  let base = inputUrl.match(/^https?:\/\//) ? inputUrl : 'https://' + inputUrl;
  const home = await get(base);
  if (!home.ok) {
    throw new Error(
      `Could not load ${base} (status ${home.status}${home.error ? ', ' + home.error : ''}). ` +
        'The site may block automated visits; create content/proposals/<slug>.json by hand instead.'
    );
  }
  base = new URL(home.url).origin + '/';
  let html = home.body;

  // Follow a JavaScript or meta-refresh redirect once (common on tiny landing pages).
  const jsRedirect =
    html.length < 4000 &&
    (html.match(/location(?:\.href)?\s*=\s*["']([^"']+)["']/i)?.[1] ||
      html.match(/http-equiv=["']refresh["'][^>]*url=([^"'>]+)/i)?.[1]);
  if (jsRedirect) {
    const next = absolute(jsRedirect, base);
    log(`Following redirect to ${next}`);
    const r = await get(next);
    if (r.ok) html = r.body;
  }
  if (/\/lander\b|domain (is )?for sale|parked|sedoparking|afternic|dan\.com/i.test(html + (jsRedirect || ''))) {
    throw new Error(
      `${base} looks like a parked domain or landing page, not a store. Check the brand's real shop address.`
    );
  }
  const $ = cheerio.load(html);
  log(`Loaded ${base}`);

  let isShopify = /cdn\.shopify\.com|Shopify\.theme|shopify-section|\/cdn\/shop\//i.test(html);
  if (!isShopify) {
    // Headless or heavily customised Shopify stores still answer the public feed.
    const probe = await get(new URL('products.json?limit=1', base).href, { json: true, timeout: 10000 });
    isShopify = probe.ok && Array.isArray(probe.body?.products);
  }

  // Read the catalogue feeds first, before stylesheet and image requests use up the rate limit.
  let rawProducts = null;
  let rawCollections = null;
  let rankedBestSelling = false;
  if (isShopify) {
    const twice = async (u) => {
      let r = await getOnce(u, { json: true });
      if (r.status === 429) {
        await sleep(4000);
        r = await getOnce(u, { json: true });
      }
      return r;
    };
    // Best-selling first. Prefer the merchant's own best-sellers collection (it is
    // curated and varied), then Shopify's best-selling sort, then the raw feed (usually
    // newest or alphabetical, which gives runs of near-identical items).
    const c0 = await twice(new URL('collections.json?limit=250', base).href);
    const bestCol = c0.ok && Array.isArray(c0.body?.collections)
      ? c0.body.collections
          .filter((x) => /(^|-)best-?sell(er|ers|ing)(-|$)|(^|-)top-?sell|(^|-)trending(-|$)/i.test(x.handle) && x.products_count >= 8 && x.products_count <= 400)
          .sort((a, b) => (a.products_count || 0) - (b.products_count || 0))[0]
      : null;
    const tries = [
      bestCol && `collections/${bestCol.handle}/products.json?limit=80`,
      'collections/all/products.json?sort_by=best-selling&limit=80',
      'products.json?limit=80',
    ].filter(Boolean);
    // Escape hatch when the shop rate-limits this IP: a saved feed (BONSIFY_FEED_FILE).
    if (process.env.BONSIFY_FEED_FILE) {
      try {
        const fs = await import('node:fs');
        const f = JSON.parse(fs.readFileSync(process.env.BONSIFY_FEED_FILE, 'utf8'));
        if (Array.isArray(f.products) && f.products.length) {
          rawProducts = f.products;
          rankedBestSelling = true;
          log('Products read from BONSIFY_FEED_FILE');
        }
      } catch (e) {
        warnings.push('Could not read BONSIFY_FEED_FILE: ' + e.message);
      }
    }
    for (const t of rawProducts ? [] : tries) {
      const r = await twice(new URL(t, base).href);
      if (r.ok && Array.isArray(r.body?.products) && r.body.products.length) {
        rawProducts = r.body.products;
        rankedBestSelling = t !== 'products.json?limit=80';
        if (rankedBestSelling) log(`Products taken from ${t.split('?')[0]}`);
        break;
      }
    }
    const c = await twice(new URL('collections.json?limit=30', base).href);
    if (c.ok && Array.isArray(c.body?.collections)) rawCollections = c.body.collections;
  }

  // Name
  const ogSite = $('meta[property="og:site_name"]').attr('content');
  const title = $('title').first().text().trim();
  const name = opts.name || ogSite?.trim() || title.split(/[|\-–—:]/)[0].trim() || new URL(base).hostname;

  // CSS: inline <style> + first-party stylesheets (capped)
  let css = $('style').map((_, el) => $(el).html()).get().join('\n');
  css += '\n' + $('[style]').map((_, el) => $(el).attr('style')).get().join(';\n');
  const sheetUrls = $('link[rel="stylesheet"]')
    .map((_, el) => absolute($(el).attr('href'), base))
    .get()
    .filter((u) => u && !/fonts\.googleapis|cdnjs|jsdelivr|unpkg/.test(u))
    .slice(0, 6);
  for (const u of sheetUrls) {
    const r = await get(u, { timeout: 12000 });
    if (r.ok) css += '\n' + r.body.slice(0, 600000);
  }

  // Colours
  const weights = new Map();
  collectColors(css, weights);
  const themeColor = $('meta[name="theme-color"]').attr('content');
  const fallbackColors = themeColor && /^#/.test(themeColor) ? [themeColor] : [];
  const colors = pickPalette(weights, fallbackColors);

  // Fonts
  const fonts = collectFonts(css, html);
  const [headingOnGoogle, bodyOnGoogle] = await Promise.all([
    googleFontAvailable(fonts.heading),
    fonts.body && fonts.body !== fonts.heading ? googleFontAvailable(fonts.body) : Promise.resolve(null),
  ]);
  fonts.headingGoogle = headingOnGoogle;
  fonts.bodyGoogle = fonts.body === fonts.heading ? headingOnGoogle : bodyOnGoogle;
  if (fonts.heading && !headingOnGoogle) warnings.push(`Heading font "${fonts.heading}" is not on Google Fonts; a close fallback is used.`);

  // Logo: score every image instead of trusting the first one in the header, because
  // announcement bars and promo strips often sit inside <header> too.
  const nameKey = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const scored = [];
  $('img').each((i, el) => {
    const $el = $(el);
    const src = $el.attr('src') || $el.attr('data-src') || ($el.attr('srcset') || '').split(',').pop();
    const u = absolute(src, base);
    if (!u) return;
    const cls = ($el.attr('class') || '').toLowerCase();
    const alt = ($el.attr('alt') || '').toLowerCase();
    const ancestry = $el
      .parents()
      .slice(0, 6)
      .map((_, p) => `${p.tagName} ${$(p).attr('class') || ''} ${$(p).attr('id') || ''}`)
      .get()
      .join(' ')
      .toLowerCase();
    const w = Number($el.attr('width')) || 0;
    const h = Number($el.attr('height')) || 0;
    let s = 0;
    if (/logo/.test(cls)) s += 10;
    if (/logo/.test(ancestry)) s += 6;
    if (/logo/.test(u.toLowerCase())) s += 4;
    if (nameKey && alt.replace(/[^a-z0-9]/g, '').startsWith(nameKey.slice(0, 5))) s += 5;
    const homeLink = $el.closest('a').attr('href');
    if (homeLink && (homeLink === '/' || absolute(homeLink, base) === base)) s += 8;
    if (/\bheader\b/.test(ancestry)) s += 3;
    if (/announcement|banner|promo|slider|slideshow|gallery|marquee|carousel|footer|payment|card__/.test(ancestry + ' ' + cls)) s -= 12;
    if (w && h && (w / h > 8 || h / w > 3)) s -= 10;
    if (i < 15) s += 1;
    scored.push({ u, s });
  });
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const j = JSON.parse($(el).html());
      const arr = Array.isArray(j) ? j : j['@graph'] || [j];
      for (const node of arr) if (node && node.logo) scored.push({ u: absolute(node.logo.url || node.logo, base), s: 9 });
    } catch {}
  });
  scored.sort((a, b) => b.s - a.s);
  const logo = scored[0] && scored[0].s >= 8 ? scored[0].u : null;

  // Many themes draw the logo as inline SVG inside the home link.
  let logoSvg = null;
  if (!logo) {
    const svgEl = $(
      'header a[href="/"] svg, a[class*="logo" i] svg, [class*="logo" i] > svg, svg[class*="logo" i], svg[aria-label*="logo" i]'
    ).first();
    if (svgEl.length) {
      const markup = $.html(svgEl);
      if (markup.length > 200 && markup.length < 200000) {
        logoSvg = markup.includes('xmlns=') ? markup : markup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }
    }
  }
  const icon =
    absolute($('link[rel="apple-touch-icon"]').attr('href'), base) ||
    absolute($('link[rel~="icon"]').attr('href'), base);
  if (!logo && !logoSvg) warnings.push('No logo found in the header; using the site icon. Check and replace if needed.');

  // Banners (hero/slideshow imagery)
  const banners = [];
  $('[class*="slideshow"] img, [class*="banner"] img, [class*="hero"] img, [class*="slider"] img').each((_, el) => {
    const src =
      ($(el).attr('srcset') || $(el).attr('data-srcset') || '').split(',').map((s) => s.trim()).pop() ||
      $(el).attr('src') ||
      $(el).attr('data-src');
    const u = absolute(src, base);
    if (u && !banners.includes(u) && !/logo|icon/i.test(u)) banners.push(u);
  });

  // Currency
  const cur =
    html.match(/Shopify\.currency\s*=\s*\{[^}]*"active"\s*:\s*"([A-Z]{3})"/)?.[1] ||
    $('meta[property="og:price:currency"]').attr('content') ||
    null;

  // Products + collections
  let products = [];
  let collections = [];
  if (isShopify) {
    if (rawProducts) {
      products = rawProducts
        .filter((x) => x.images?.length && x.variants?.length)
        .map((x) => {
          const v = x.variants.find((v) => v.available) || x.variants[0];
          return {
            title: x.title,
            handle: x.handle,
            type: x.product_type || null,
            vendor: x.vendor || null,
            price: Number(v.price),
            compareAt: v.compare_at_price ? Number(v.compare_at_price) : null,
            available: x.variants.some((v) => v.available),
            image: x.images[0].src,
            images: x.images.slice(0, 4).map((i) => i.src),
            options: (x.options || []).filter((o) => o.name !== 'Title').map((o) => ({ name: o.name, values: o.values.slice(0, 8) })),
            description: cheerio.load(x.body_html || '').text().replace(/\s+/g, ' ').trim().slice(0, 400),
          };
        });
      // Keep the store's best-selling order, in-stock first, then drop look-alikes:
      // the same photo, or the same title once colour/size/pack words are removed.
      products.sort((a, b) => Number(b.available) - Number(a.available));
      const norm = (t) =>
        t.toLowerCase()
          .replace(/\b(\d+\s?(ml|g|gm|kg|oz|pcs?|pack|packs|inch|cm|mm|l)|small|medium|large|xl|xxl|xs|s|m|l|set of \d+|combo|bundle|pack of \d+)\b/g, '')
          .replace(/[^a-z0-9]+/g, ' ')
          .trim()
          .split(' ')
          .slice(0, 4)
          .join(' ');
      const imgKey = (u) => (u || '').split('?')[0].split('/').pop().replace(/_\d+x\d*|_\d+x/g, '');
      const titles = new Set();
      const imgs = new Set();
      const types = new Map();
      const picked = [];
      for (const x of products) {
        const tk = norm(x.title);
        const ik = imgKey(x.image);
        if (titles.has(tk) || imgs.has(ik)) continue;
        const tp = x.type || x.vendor || '_';
        if ((types.get(tp) || 0) >= 3) continue;
        titles.add(tk);
        imgs.add(ik);
        types.set(tp, (types.get(tp) || 0) + 1);
        picked.push(x);
        if (picked.length >= 12) break;
      }
      // If the variety cap left gaps (small catalogues), top up from what is left.
      for (const x of products) {
        if (picked.length >= 12) break;
        if (!picked.includes(x) && !imgs.has(imgKey(x.image))) {
          picked.push(x);
          imgs.add(imgKey(x.image));
        }
      }
      products = picked;
      if (rankedBestSelling) log('Products ranked by the store\'s best-selling order');
    } else {
      products = await productsFromSitemap(base, log);
      if (products.length) {
        warnings.push(
          `The product feed was rate-limited, so ${products.length} products came from the sitemap` +
            (products.some((p) => p.price == null) ? '; some have no price yet (re-run later to fill them in).' : '.')
        );
      } else warnings.push('No products could be read (feed and sitemap both unavailable). Re-run later or add them under "overrides".');
    }
    if (rawCollections) {
      collections = rawCollections
        .filter((x) => x.products_count !== 0 && !/^(all|frontpage|home ?page)$/i.test(x.title))
        .map((x) => ({ title: x.title, handle: x.handle, image: x.image?.src || null, count: x.products_count ?? null }))
        .slice(0, 10);
    }
  } else {
    warnings.push('Not a Shopify store. Products and collections are not read automatically; add them by hand.');
  }

  // Features
  const technical = [
    ...$('script[src], link[href], iframe[src], a[href]')
      .map((_, el) => $(el).attr('src') || $(el).attr('href'))
      .get(),
    ...$('script:not([src])').map((_, el) => ($(el).html() || '').slice(0, 20000)).get(),
    ...$('[id*="shopify-block"], [class*="shopify-app-block"]').map((_, el) => $(el).attr('id') || '').get(),
  ].join('\n');
  const features = FEATURE_RULES.filter((r) => r.re.test(technical)).map(({ id, label }) => ({ id, label }));
  if (/cash on delivery/i.test($('body').text())) features.push({ id: 'cod', label: 'Cash on delivery' });
  const storeApps = detectStoreApps(technical);

  // Store size (Shopify sitemap gives a rough product count)
  let productCount = null;
  if (isShopify) {
    const sm = await get(new URL('sitemap.xml', base).href);
    if (sm.ok) {
      const subs = [...sm.body.matchAll(/<loc>([^<]*sitemap_products[^<]*)<\/loc>/g)].map((m) => m[1]);
      let count = 0;
      for (const u of subs.slice(0, 5)) {
        const r = await get(u.replace(/&amp;/g, '&'));
        if (r.ok) count += (r.body.match(/<url>/g) || []).length;
      }
      if (count) productCount = count;
    }
  }

  return {
    slug: opts.slug || slugify(name),
    name,
    url: base,
    platform: isShopify ? 'shopify' : 'other',
    currency: cur,
    logo,
    logoCandidates: scored.filter((c) => c.u && c.s >= 4).slice(0, 5).map((c) => c.u),
    logoSvg,
    icon,
    colors,
    fonts,
    banners: banners.slice(0, 4),
    collections,
    products,
    productCount,
    features,
    storeApps,
    crawledAt: new Date().toISOString(),
    warnings,
  };
}
