"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import styles from "./Phone3D.module.css";

// Real 3D geometry (not flat CSS panels) so the rounded edge is an actual
// bevel with real lighting/specular highlights, not an approximation.
// Proportions measured from a reference phone mockup: ~1:2.045
// width:height, corner radius = 12.1% of width (measured via pixel edge
// detection on the reference image, not eyeballed).
// Built as an extruded rounded-rect + edge bevel (not RoundedBoxGeometry)
// because RoundedBoxGeometry clamps its single radius to half of the
// shortest dimension - with a thin BOX_DEPTH that forces the front-face
// corners to go nearly square. Extruding keeps BOX_RADIUS on the front/back
// faces independent of how thin BOX_DEPTH is.
// Must match .hvRig's width/height in Hero.module.css.
const BOX_WIDTH = 300;
const BOX_HEIGHT = 610;
const BOX_DEPTH = 32;
const BOX_RADIUS = 40;
const BOX_SEGMENTS = 47;
// Chamfer size for the thin edge running around the phone's perimeter.
const EDGE_BEVEL = Math.min(9, BOX_DEPTH / 2 - 1);

function makeRoundedRectShape(width, height, radius) {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.absarc(w - r, -h + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(w, h - r);
  shape.absarc(w - r, h - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-w + r, h);
  shape.absarc(-w + r, h - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-w, -h + r);
  shape.absarc(-w + r, -h + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
}

// Front/back caps get a plain planar UV (position / size, centered on 0.5)
// so the screenshot texture isn't distorted near the rounded corners. The
// back cap is mirrored on X to read correctly when viewed from behind,
// matching the front/back UV mirroring BoxGeometry uses by convention.
function makePhoneUVGenerator() {
  return {
    generateTopUV(geometry, vertices, indexA, indexB, indexC) {
      const isBack = vertices[indexA * 3 + 2] < 0;
      const toUv = (i) => {
        const x = vertices[i * 3] / BOX_WIDTH;
        const y = vertices[i * 3 + 1] / BOX_HEIGHT + 0.5;
        return new THREE.Vector2(isBack ? 0.5 - x : 0.5 + x, y);
      };
      return [toUv(indexA), toUv(indexB), toUv(indexC)];
    },
    generateSideWallUV(geometry, vertices, indexA, indexB, indexC, indexD) {
      // Side/bevel material is a flat color with no map, so UVs are unused.
      return [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(1, 0),
        new THREE.Vector2(1, 1),
        new THREE.Vector2(0, 1),
      ];
    },
  };
}

function buildPhoneGeometry() {
  const shape = makeRoundedRectShape(BOX_WIDTH, BOX_HEIGHT, BOX_RADIUS);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: BOX_DEPTH - EDGE_BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: EDGE_BEVEL,
    bevelSize: EDGE_BEVEL,
    bevelSegments: 6,
    curveSegments: BOX_SEGMENTS,
    UVGenerator: makePhoneUVGenerator(),
  });
  // Center on Z to match the rest of the scene's assumptions (camera,
  // rotation) about the mesh spanning [-depth/2, depth/2].
  geometry.translate(0, 0, EDGE_BEVEL - BOX_DEPTH / 2);

  // ExtrudeGeometry groups both lid faces (bottom + top) into a single
  // material slot; split them in half so the front/back can use separate
  // screen textures. Bottom (lower Z, generated first) is the back face;
  // top is the front face - see the "front(+z)/back(-z)" convention below.
  const [lid, sides] = geometry.groups;
  geometry.clearGroups();
  const half = lid.count / 2;
  geometry.addGroup(lid.start, half, 0); // back (-z)
  geometry.addGroup(lid.start + half, half, 1); // front (+z)
  geometry.addGroup(sides.start, sides.count, 2); // side bevel

  return geometry;
}

// Screen content is baked into a canvas texture (screenshot + bezel inset +
// notch) at ~2.2x the box's footprint for crisp text/UI at any viewing angle.
// A thin bezel and slim notch read as a modern iPhone rather than a
// generic/dated device mockup. The screen's corner radius uses the same
// radius:width ratio as the body (BOX_RADIUS / BOX_WIDTH) so the screen
// reads as consistently rounded as the case around it, not tighter/sharper.
const TEX_W = 735;
const TEX_H = 1514;
const BEZEL_INSET = 12;
const SCREEN_RADIUS = 85;
const NOTCH_W = 227;
const NOTCH_H = 45;
const NOTCH_RADIUS = 24;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawImageCover(ctx, img, dx, dy, dw, dh) {
  const scale = Math.max(dw / img.width, dh / img.height);
  const iw = img.width * scale;
  const ih = img.height * scale;
  const ix = dx + (dw - iw) / 2;
  const iy = dy; // object-position: top center
  ctx.drawImage(img, ix, iy, iw, ih);
}

function drawNotch(ctx) {
  ctx.fillStyle = "#0e1113";
  ctx.beginPath();
  ctx.roundRect((TEX_W - NOTCH_W) / 2, 0, NOTCH_W, NOTCH_H, [
    0,
    0,
    NOTCH_RADIUS,
    NOTCH_RADIUS,
  ]);
  ctx.fill();
}

function makeTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

async function buildScreenTexture(src) {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0e1113";
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  const sx = BEZEL_INSET;
  const sy = BEZEL_INSET;
  const sw = TEX_W - BEZEL_INSET * 2;
  const sh = TEX_H - BEZEL_INSET * 2;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, SCREEN_RADIUS);
  ctx.clip();
  drawImageCover(ctx, img, sx, sy, sw, sh);
  ctx.restore();

  drawNotch(ctx);

  return makeTexture(canvas);
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// The "gap" stat card the phone lands on at the end of its journey into the
// Gap section - drawn directly (no source photo), on the brand's clay/orange,
// echoing the same 79%-traffic stat the section's own copy makes.
export async function buildStatCardTexture() {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Font loading can't be confirmed - draw with whatever is available
      // rather than blocking the texture forever.
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0e1113";
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  const sx = BEZEL_INSET;
  const sy = BEZEL_INSET;
  const sw = TEX_W - BEZEL_INSET * 2;
  const sh = TEX_H - BEZEL_INSET * 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, SCREEN_RADIUS);
  ctx.clip();

  ctx.fillStyle = "#A85A36"; // --clay
  ctx.fillRect(sx, sy, sw, sh);

  const padX = sx + 52;
  const maxW = sw - 104;
  let cy = sy + 480;

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 176px Inter, system-ui, sans-serif";
  ctx.fillText("79%", padX, cy);
  cy += 90;

  ctx.font = "400 34px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#F4EFE4"; // bone
  const descLines = wrapText(
    ctx,
    "of Shopify traffic is mobile. Most of it never converts the way desktop does.",
    maxW
  );
  descLines.forEach((line) => {
    cy += 46;
    ctx.fillText(line, padX, cy);
  });
  cy += 90;

  const barRows = [
    { label: "TRAFFIC", value: 79, pct: "79%", dim: false },
    { label: "REVENUE", value: 57, pct: "57%", dim: true },
  ];
  const barLabelW = 168;
  const barValueW = 76;
  const barTrackW = maxW - barLabelW - barValueW;
  const barH = 10;

  ctx.font = "700 22px Inter, system-ui, sans-serif";
  barRows.forEach((row) => {
    const trackX = padX + barLabelW;
    const trackY = cy - barH / 2;

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(row.label, padX, cy);

    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.roundRect(trackX, trackY, barTrackW, barH, barH / 2);
    ctx.fill();

    const fillW = Math.max(barH, (barTrackW * row.value) / 100);
    ctx.fillStyle = row.dim ? "rgba(255,255,255,0.65)" : "#ffffff";
    ctx.beginPath();
    ctx.roundRect(trackX, trackY, fillW, barH, barH / 2);
    ctx.fill();

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(row.pct, trackX + barTrackW + barValueW, cy);

    cy += 64;
  });
  cy += 30;

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = "400 22px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(244,239,228,0.6)";
  ctx.fillText("Source: Statista, 2025", padX, cy);

  ctx.restore();

  drawNotch(ctx);

  return makeTexture(canvas);
}

export async function buildServicesGridTexture() {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // continue even if fonts are not ready
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0e1113";
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  const sx = BEZEL_INSET;
  const sy = BEZEL_INSET;
  const sw = TEX_W - BEZEL_INSET * 2;
  const sh = TEX_H - BEZEL_INSET * 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, SCREEN_RADIUS);
  ctx.clip();

  ctx.fillStyle = "#F4EFE4";
  ctx.fillRect(sx, sy, sw, sh);

  const cardPadding = 28;
  const landscapeWidth = sh;
  const landscapeHeight = sw;
  const cardWidth = (landscapeWidth - cardPadding * 3) / 2;
  const cardHeight = (landscapeHeight - cardPadding * 3) / 2;
  const cards = [
    {
      title: "Native iOS & Android apps",
      desc: "On the App Store and Google Play.",
    },
    {
      title: "Home screen PWA builds",
      desc: "No app store review required.",
    },
    {
      title: "Shopify ecosystem integration",
      desc: "Checkout, inventory, and loyalty.",
    },
    {
      title: "Ongoing support & iteration",
      desc: "Maintained after launch.",
    },
  ];

  const titleFont = "600 38px Inter, system-ui, sans-serif";
  const descFont = "400 30px Inter, system-ui, sans-serif";

  ctx.save();
  ctx.translate(sx, sy + sh);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  const iconD = 46;
  const iconR = iconD / 2;
  const iconToTitleGap = 24;
  const titleLineH = 36;
  const titleToDescGap = 20;
  const descLineH = 28;

  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      const cardIndex = row * 2 + col;
      const card = cards[cardIndex];
      const cardX = cardPadding + col * (cardWidth + cardPadding);
      const cardY = cardPadding + row * (cardHeight + cardPadding);

      ctx.fillStyle = "#A85A36"; // --clay
      ctx.strokeStyle = "rgba(20,23,26,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 24);
      ctx.fill();
      ctx.stroke();

      const textX = cardX + 28;

      // Measure both blocks first so the whole icon+title+desc group can be
      // centered as one unit in the card - with the shorter one-line descs
      // (see the cards array above), anchoring everything to the top like
      // before left a big dead gap under each card's text.
      ctx.font = titleFont;
      const titleLines = wrapText(ctx, card.title, cardWidth - 56);
      ctx.font = descFont;
      const descLines = wrapText(ctx, card.desc, cardWidth - 56).slice(0, 4);

      const totalH =
        iconD +
        iconToTitleGap +
        titleLines.length * titleLineH +
        titleToDescGap +
        descLines.length * descLineH;
      const blockTop = cardY + (cardHeight - totalH) / 2;

      // Icon badge - a simple checkmark, giving each card a visual anchor
      // instead of just two lines of text floating in an empty rectangle.
      const iconCX = textX + iconR;
      const iconCY = blockTop + iconR;
      ctx.fillStyle = "rgba(244, 239, 228, 0.16)";
      ctx.beginPath();
      ctx.arc(iconCX, iconCY, iconR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#F4EFE4";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(iconCX - 9, iconCY + 1);
      ctx.lineTo(iconCX - 3, iconCY + 8);
      ctx.lineTo(iconCX + 10, iconCY - 9);
      ctx.stroke();

      // Baselines, not top-of-line: each block's first line sits ~28px
      // (title) / ~24px (desc) below the block's nominal top, roughly the
      // font's cap-height, so fillText's baseline anchor lands where it
      // visually should.
      let textY = blockTop + iconD + iconToTitleGap + 28;
      ctx.fillStyle = "#14171A"; // --ink
      ctx.font = titleFont;
      titleLines.forEach((line) => {
        ctx.fillText(line, textX, textY);
        textY += titleLineH;
      });
      // textY is now one titleLineH past the last title baseline - back up
      // to that baseline, then step down by the gap plus the desc font's
      // own baseline offset.
      textY += titleToDescGap - titleLineH + 24;

      ctx.fillStyle = "#F4EFE4"; // --bone
      ctx.font = descFont;
      descLines.forEach((line) => {
        ctx.fillText(line, textX, textY);
        textY += descLineH;
      });
    }
  }
  ctx.restore();
  ctx.restore();

  drawNotch(ctx);

  return makeTexture(canvas);
}

export async function buildDockifyTexture() {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // continue even if fonts not ready
    }
  }

  const img = await loadImage("/images/dockify/install-banner.webp");
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0e1113";
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  const sx = BEZEL_INSET;
  const sy = BEZEL_INSET;
  const sw = TEX_W - BEZEL_INSET * 2;
  const sh = TEX_H - BEZEL_INSET * 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, SCREEN_RADIUS);
  ctx.clip();

  // Draw the dockify screenshot to cover the screen area (top aligned)
  drawImageCover(ctx, img, sx, sy, sw, sh);

  ctx.restore();

  // Reward card is drawn *outside* the screen's rounded-rect clip (matching
  // RewardCard.jsx, which sits as a sibling over the phone frame rather than
  // inside PhoneMockup's .screen) - clipping it to SCREEN_RADIUS cut its
  // corners off with a stray curve wherever it overlapped the screen's
  // bottom corner rounding, leaving a gap of bare background beside it.
  const rewardW = TEX_W - BEZEL_INSET * 2;
  const rewardH = 170;
  const rewardX = BEZEL_INSET;
  const rewardY = sy + sh - rewardH - 30;
  const rewardR = 14;

  ctx.fillStyle = "#0e1113"; // --ink
  ctx.beginPath();
  ctx.roundRect(rewardX, rewardY, rewardW, rewardH, rewardR);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(rewardX, rewardY, rewardW, rewardH, rewardR);
  ctx.stroke();

  // Title
  const pad = 20;
  ctx.fillStyle = "#F4EFE4"; // bone
  ctx.font = "600 22px Inter, system-ui, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Every install, attributed", rewardX + pad, rewardY + 36);

  // Stats grid
  const stats = [
    { v: "10", l: "Installs" },
    { v: "8/2", l: "Android / iOS" },
    { v: "5", l: "Redeemed" },
    { v: "50%", l: "Conv. rate" },
  ];
  const gridX = rewardX + pad;
  const gridY = rewardY + 52;
  const colW = (rewardW - pad * 2 - 6 * 3) / 4;

  ctx.font = "700 30px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#F4EFE4";
  stats.forEach((s, i) => {
    const x = gridX + i * (colW + 6);
    ctx.textAlign = "left";
    ctx.fillText(s.v, x, gridY + 30);
    ctx.font = "400 12px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(244,239,228,0.85)";
    ctx.fillText(s.l, x, gridY + 54);
    ctx.font = "700 30px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#F4EFE4";
  });

  // Caption
  ctx.font = "400 14px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(191,174,160,0.9)";
  ctx.fillText("   Real installs from the Dockify dashboard", rewardX + pad, rewardY + rewardH - 18);

  drawNotch(ctx);

  return makeTexture(canvas);
}

// A service link rendered as a phone-screen "card" instead of a photo - the
// Services page cycles a phone through several of these per column (see
// src/components/services/ServicePhone.jsx), one card per service link.
export async function buildServiceCardTexture({
  eyebrow,
  title,
  description,
  index = 0,
  total = 1,
}) {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Font loading can't be confirmed - draw with whatever is available
      // rather than blocking the texture forever.
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0e1113";
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  const sx = BEZEL_INSET;
  const sy = BEZEL_INSET;
  const sw = TEX_W - BEZEL_INSET * 2;
  const sh = TEX_H - BEZEL_INSET * 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, SCREEN_RADIUS);
  ctx.clip();

  ctx.fillStyle = "#F4EFE4"; // --bone
  ctx.fillRect(sx, sy, sw, sh);

  const padX = sx + 52;
  const maxW = sw - 104;
  let cy = sy + 420;

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  if (eyebrow) {
    ctx.font = "700 22px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#2F6B4F"; // --jade
    ctx.fillText(eyebrow.toUpperCase(), padX, cy);
    cy += 56;
  }

  ctx.font = "500 54px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#14171A"; // --ink
  wrapText(ctx, title, maxW).forEach((line, i) => {
    if (i > 0) cy += 60;
    ctx.fillText(line, padX, cy);
  });
  cy += 66;

  if (description) {
    ctx.font = "400 29px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#41474b";
    wrapText(ctx, description, maxW)
      .slice(0, 5)
      .forEach((line) => {
        cy += 40;
        ctx.fillText(line, padX, cy);
      });
  }

  const bottomY = sy + sh - 90;
  ctx.font = "700 22px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#A85A36"; // --clay
  ctx.fillText("LEARN MORE →", padX, bottomY);

  if (total > 1) {
    const dotR = 5;
    const gap = 20;
    const dotsW = (total - 1) * gap;
    const startX = padX + (maxW - dotsW) / 2;
    const dotY = bottomY + 40;
    for (let i = 0; i < total; i++) {
      ctx.beginPath();
      ctx.fillStyle = i === index ? "#14171A" : "rgba(20,23,26,0.25)";
      ctx.arc(startX + i * gap, dotY, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  drawNotch(ctx);

  return makeTexture(canvas);
}

// Pure function so an external scroll-choreography controller (see
// PhoneJourney.jsx) can replicate this exact spin math itself and feed the
// result back in via the imperative setRotationY() handle - one source of
// truth for "how fast/when" the phone spins, instead of two formulas that
// could drift apart.
export function getAutoSpinRotationY(elapsedMs, startDelayMs, halfSpinMs) {
  if (elapsedMs < startDelayMs) return 0;
  const spinElapsed = elapsedMs - startDelayMs;
  return -((spinElapsed / (halfSpinMs * 2)) * Math.PI * 2);
}

// screens: [{ src, alt }] - cycled across front/back as the phone spins.
// startDelayMs: hold flat (matching a splash + center-to-slot reveal)
// before the continuous spin begins.
// halfSpinMs: time to rotate a continuous 180deg (full spin = 2x this).
//
// Exposes an imperative handle (via ref) instead of taking rapidly-changing
// values as props, since a parent driving this from its own rAF loop (e.g.
// PhoneJourney.jsx tying rotation to scroll position) would otherwise cause
// a React re-render on every animation frame:
//   - setRotationY(radiansOrNull): overrides rotation.y directly; pass null
//     to release control back to the internal auto-spin timer.
//   - setCarouselActive(bool): freezes/resumes the screens auto-cycling
//     without touching rotation or swapping to a pinned screen.
//   - setPinnedScreen(asyncBuilderOrNull): async () => THREE.Texture. When
//     set, both faces switch to this texture once (outside the screens
//     carousel) and auto-cycling stops regardless of setCarouselActive.
//     Pass null to release back to the screens carousel.
const Phone3D = forwardRef(function Phone3D(
  { screens, startDelayMs = 0, halfSpinMs = 3600 },
  ref
) {
  const containerRef = useRef(null);
  const isVisibleRef = useRef(true);
  const externalRotationYRef = useRef(null);
  const carouselActiveRef = useRef(true);
  const pinnedScreenRef = useRef(null);
  const frontMaterialRef = useRef(null);
  const backMaterialRef = useRef(null);
  const appliedPinnedScreenRef = useRef(null);

  useImperativeHandle(ref, () => ({
    setRotationY(value) {
      externalRotationYRef.current = value;
    },
    setCarouselActive(value) {
      carouselActiveRef.current = value;
    },
    setPinnedScreen(builder) {
      pinnedScreenRef.current = builder;
      if (!builder || appliedPinnedScreenRef.current === builder) {
        if (!builder) appliedPinnedScreenRef.current = null;
        return;
      }
      const front = frontMaterialRef.current;
      const back = backMaterialRef.current;
      if (!front || !back) return; // main effect hasn't set up the mesh yet

      appliedPinnedScreenRef.current = builder;
      builder().then((texture) => {
        if (pinnedScreenRef.current !== builder) {
          texture.dispose();
          return;
        }
        const oldFront = front.map;
        const oldBack = back.map;
        front.map = texture;
        back.map = texture;
        front.needsUpdate = true;
        back.needsUpdate = true;
        if (oldFront) oldFront.dispose();
        if (oldBack && oldBack !== oldFront) oldBack.dispose();
      });
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !screens || screens.length === 0) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let renderer;
    try {
      // preserveDrawingBuffer so canvas.toDataURL() (used for the
      // click-to-zoom page-transition snapshot on the Services page) always
      // captures a real frame - WebGL otherwise clears the buffer right
      // after compositing, and a snapshot taken from an arbitrary click
      // handler (not synced to the render loop) can catch it empty.
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
    } catch {
      return;
    }
    // Reduce pixel ratio to lower GPU load and improve scroll smoothness
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Pause heavy rendering when the canvas is offscreen or the page is hidden
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      isVisibleRef.current = !!(e && e.isIntersecting);
    }, { threshold: 0.05 });
    io.observe(container);

    const onVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, 1, 10, 4000);
    camera.position.set(0, 0, 1500);

    const ambient = new THREE.HemisphereLight(0x8aa394, 0x0e1113, 0.55);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(220, 260, 420);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6b8f71, 0.55);
    rim.position.set(-260, 120, -300);
    scene.add(rim);

    const geometry = buildPhoneGeometry();
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: 0x1b1e21,
      metalness: 0.65,
      roughness: 0.32,
    });
    const frontMaterial = new THREE.MeshBasicMaterial();
    const backMaterial = new THREE.MeshBasicMaterial();
    frontMaterialRef.current = frontMaterial;
    backMaterialRef.current = backMaterial;
    // Group order set up by buildPhoneGeometry: 0 = back(-z), 1 = front(+z),
    // 2 = side bevel.
    const mesh = new THREE.Mesh(geometry, [
      backMaterial,
      frontMaterial,
      sideMaterial,
    ]);
    scene.add(mesh);

    function onResize() {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    onResize();
    window.addEventListener("resize", onResize);

    let cancelled = false;
    let rafId = null;
    let nextIdx = 2 % screens.length;
    let lastTick = 0;
    const mountTime = performance.now();

    // Each screens[] entry is either a photo ({ src }) or a custom-drawn
    // screen ({ buildTexture }, e.g. buildServiceCardTexture) - dispatch on
    // whichever it provides.
    function loadScreen(screen) {
      return screen.buildTexture
        ? screen.buildTexture()
        : buildScreenTexture(screen.src);
    }

    function swapFace(isFront, screen) {
      loadScreen(screen).then((texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }
        const material = isFront ? frontMaterial : backMaterial;
        const old = material.map;
        material.map = texture;
        material.needsUpdate = true;
        if (old) old.dispose();
      });
    }

    function animate(now) {
      rafId = requestAnimationFrame(animate);

      const overrideY = externalRotationYRef.current;

      // If offscreen and there's no external override, skip heavy work.
      if (!isVisibleRef.current && (overrideY === null || overrideY === undefined)) {
        return;
      }

      if (overrideY !== null && overrideY !== undefined) {
        mesh.rotation.y = overrideY;
      } else if (!reduce) {
        const elapsed = now - mountTime;
        mesh.rotation.y = getAutoSpinRotationY(
          elapsed,
          startDelayMs,
          halfSpinMs
        );

        if (
          carouselActiveRef.current &&
          !pinnedScreenRef.current &&
          screens.length > 1
        ) {
          const spinElapsed = Math.max(0, elapsed - startDelayMs);
          const tick = Math.floor(spinElapsed / halfSpinMs);
          if (tick !== lastTick) {
            lastTick = tick;
            const screen = screens[nextIdx];
            nextIdx = (nextIdx + 1) % screens.length;
            swapFace(tick % 2 === 1, screen);
          }
        }
      }

      renderer.render(scene, camera);
    }

    Promise.all([
      loadScreen(screens[0]),
      loadScreen(screens[1] || screens[0]),
    ]).then(([frontTex, backTex]) => {
      if (cancelled) {
        frontTex.dispose();
        backTex.dispose();
        return;
      }
      frontMaterial.map = frontTex;
      frontMaterial.needsUpdate = true;
      backMaterial.map = backTex;
      backMaterial.needsUpdate = true;
      rafId = requestAnimationFrame(animate);
    });

    return () => {
      cancelled = true;
      frontMaterialRef.current = null;
      backMaterialRef.current = null;
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      io.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      sideMaterial.dispose();
      if (frontMaterial.map) frontMaterial.map.dispose();
      if (backMaterial.map) backMaterial.map.dispose();
      frontMaterial.dispose();
      backMaterial.dispose();
      renderer.dispose();
    };
  }, [screens, startDelayMs, halfSpinMs]);

  return <div ref={containerRef} className={styles.container} />;
});

export default Phone3D;
