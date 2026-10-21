"use client";

import { useMemo } from "react";
import styles from "./BonsaiArt.module.css";

function rngFrom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tree(rng, { x, y, angle, len, w, droop, maxDepth }) {
  const segs = [];
  const tips = [];
  const grow = (x, y, a, len, w, depth, t0) => {
    if (depth > maxDepth || len < 9) {
      tips.push({ x, y, t: t0, a });
      return;
    }
    const bend = (rng() - 0.5) * 0.55 + droop * 0.18;
    const a2 = a + bend;
    const x2 = x + Math.cos(a2) * len;
    const y2 = y + Math.sin(a2) * len;
    const cx = x + Math.cos(a + bend * 0.2) * len * 0.55 + (rng() - 0.5) * len * 0.25;
    const cy = y + Math.sin(a + bend * 0.2) * len * 0.55 + (rng() - 0.5) * len * 0.25;
    const dur = 0.45 + len / 110;
    segs.push({ d: `M${x.toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`, w, t: t0, dur, depth });
    const kids = depth < 1 ? 2 : rng() < 0.62 ? 2 : rng() < 0.5 ? 3 : 1;
    for (let k = 0; k < kids; k++) {
      const spread = kids === 1 ? 0 : (k / (kids - 1) - 0.5) * (0.9 + rng() * 0.5);
      const lead = k === Math.floor(kids / 2) ? 0.82 : 0.66;
      grow(x2, y2, a2 + spread + (rng() - 0.5) * 0.2, len * (lead + rng() * 0.12), w * 0.68, depth + 1, t0 + dur * 0.78);
    }
  };
  grow(x, y, angle, len, w, 0, 0);
  return { segs, tips };
}

export default function BonsaiArt({ seed = "bonsify" }) {
  const art = useMemo(() => {
    const rng = rngFrom(seed);
    const a = tree(rng, { x: 46, y: 1010, angle: -1.28, len: 150, w: 7, droop: 0, maxDepth: 7 });
    const b = tree(rng, { x: 570, y: -10, angle: 1.95, len: 130, w: 6, droop: 0.55, maxDepth: 7 });
    const petals = (tips, n) =>
      tips
        .filter(() => rng() < n)
        .map((t) => ({ x: t.x, y: t.y, t: t.t + 0.9 + rng() * 1.2, r: rng() * 360, s: 0.7 + rng() * 0.9, hue: rng() < 0.28 ? "w" : "c" }));
    const fall = Array.from({ length: 9 }, () => ({ left: rng() * 100, dur: 22 + rng() * 18, delay: -rng() * 30, size: 5 + rng() * 6, sway: 20 + rng() * 40 }));
    return { a, b, pa: petals(a.tips, 0.9), pb: petals(b.tips, 0.9), fall };
  }, [seed]);

  const side = (t, petals, cls) => (
    <svg className={`${styles.tree} ${cls}`} viewBox="0 0 600 1000" preserveAspectRatio="xMinYMid meet" aria-hidden="true">
      <g className={styles.sway}>
        {t.segs.map((s, i) => (
          <path
            key={i}
            d={s.d}
            pathLength="1"
            className={styles.branch}
            style={{ strokeWidth: Math.max(0.7, s.w), animationDelay: `${(0.3 + s.t).toFixed(2)}s`, animationDuration: `${s.dur.toFixed(2)}s`, opacity: 0.25 + Math.max(0, 0.5 - s.depth * 0.07) }}
          />
        ))}
        {petals.map((p, i) => (
          <ellipse
            key={i}
            cx={p.x}
            cy={p.y}
            rx={4.2 * p.s}
            ry={2.2 * p.s}
            transform={`rotate(${p.r.toFixed(0)} ${p.x.toFixed(1)} ${p.y.toFixed(1)})`}
            className={p.hue === "w" ? styles.petalW : styles.petal}
            style={{ animationDelay: `${(0.3 + p.t).toFixed(2)}s` }}
          />
        ))}
      </g>
    </svg>
  );

  return (
    <div className={styles.art} aria-hidden="true">
      {side(art.a, art.pa, styles.treeA)}
      {side(art.b, art.pb, styles.treeB)}
      {art.fall.map((f, i) => (
        <i key={i} className={styles.fall} style={{ left: `${f.left}%`, width: f.size, height: f.size * 0.55, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s`, "--sway": `${f.sway}px` }} />
      ))}
    </div>
  );
}
