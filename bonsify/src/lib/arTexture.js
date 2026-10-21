// Draws a simple screen for a store's app on a canvas, so the AR phone can show
// a store typed in by the visitor. Only images the store's server lets us read
// are used, so the canvas never ends up blocked.
function loadImg(src, ms = 4500) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const im = new Image();
    im.crossOrigin = "anonymous";
    const t = setTimeout(() => resolve(null), ms);
    im.onload = () => {
      clearTimeout(t);
      resolve(im);
    };
    im.onerror = () => {
      clearTimeout(t);
      resolve(null);
    };
    im.src = src;
  });
}

function cover(ctx, im, x, y, w, h, r = 0) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
  const s = Math.max(w / im.width, h / im.height);
  ctx.drawImage(im, x + (w - im.width * s) / 2, y + (h - im.height * s) / 2, im.width * s, im.height * s);
  ctx.restore();
}

export async function makeScreenTexture(brand) {
  const W = 780;
  const H = 1688;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const primary = brand.colors?.primary || "#2f6b4f";
  const accent = brand.colors?.accent || primary;
  const on = brand.colors?.onPrimary || "#fff";

  const [logo, banner, ...prods] = await Promise.all([
    loadImg(brand.logo),
    loadImg(brand.banners?.[0]),
    ...brand.products.slice(0, 4).map((p) => loadImg(p.image)),
  ]);

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);

  // header
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, 210);
  ctx.fillStyle = "#e9e9e9";
  ctx.fillRect(0, 209, W, 2);
  if (logo) {
    const s = Math.min(300 / logo.width, 70 / logo.height);
    ctx.drawImage(logo, (W - logo.width * s) / 2, 140 - (logo.height * s) / 2, logo.width * s, logo.height * s);
  } else {
    ctx.fillStyle = "#16181b";
    ctx.font = "800 54px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(brand.name, W / 2, 158);
  }

  // search
  ctx.fillStyle = "#f3f3f4";
  ctx.beginPath();
  ctx.roundRect(36, 236, W - 72, 84, 24);
  ctx.fill();
  ctx.fillStyle = "#6b7076";
  ctx.font = "400 30px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Search ${brand.name}`, 96, 288);

  // banner
  if (banner) cover(ctx, banner, 36, 350, W - 72, 440, 28);
  else {
    const g = ctx.createLinearGradient(36, 350, W - 36, 790);
    g.addColorStop(0, primary);
    g.addColorStop(1, accent);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(36, 350, W - 72, 440, 28);
    ctx.fill();
    ctx.fillStyle = on;
    ctx.font = "800 64px Arial, sans-serif";
    ctx.fillText(`New in at ${brand.name}`, 76, 620);
  }

  // offer
  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.roundRect(36, 826, W - 72, 120, 24);
  ctx.fill();
  ctx.fillStyle = on;
  ctx.font = "700 32px Arial, sans-serif";
  ctx.fillText("10% off your first app order", 76, 892);
  ctx.globalAlpha = 0.85;
  ctx.font = "400 24px Arial, sans-serif";
  ctx.fillText("Unlocked when you install the app. Code APP10", 76, 928);
  ctx.globalAlpha = 1;

  // products
  ctx.fillStyle = "#16181b";
  ctx.font = "800 38px Arial, sans-serif";
  ctx.fillText("Best sellers", 36, 1018);
  const cw = (W - 72 - 24) / 2;
  brand.products.slice(0, 4).forEach((p, i) => {
    const x = 36 + (i % 2) * (cw + 24);
    const y = 1048 + Math.floor(i / 2) * 250;
    ctx.fillStyle = "#f4f4f5";
    ctx.beginPath();
    ctx.roundRect(x, y, cw, 150, 20);
    ctx.fill();
    if (prods[i]) cover(ctx, prods[i], x, y, cw, 150, 20);
    ctx.fillStyle = "#16181b";
    ctx.font = "500 24px Arial, sans-serif";
    const t = p.title.length > 24 ? p.title.slice(0, 23) + "..." : p.title;
    ctx.fillText(t, x, y + 186);
  });

  // tab bar
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 1560, W, 128);
  ctx.fillStyle = "#e9e9e9";
  ctx.fillRect(0, 1560, W, 2);
  [0, 1, 2, 3].forEach((i) => {
    ctx.fillStyle = i === 0 ? primary : "#c9cbcf";
    ctx.beginPath();
    ctx.arc(W / 8 + (i * W) / 4, 1610, 20, 0, Math.PI * 2);
    ctx.fill();
  });

  return c.toDataURL("image/jpeg", 0.9);
}
