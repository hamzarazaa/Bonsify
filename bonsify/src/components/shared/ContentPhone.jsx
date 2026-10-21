"use client";

import { useMemo } from "react";
import Phone3D, { buildServiceCardTexture } from "@/components/home/Phone3D";
import styles from "./ContentPhone.module.css";

// The real product screenshot (if there is one) plus the service's own
// "What's included" bullets (see src/lib/content.js) drawn as cards - so
// the sticky visual column has something to cycle through for the whole
// scroll, instead of one static image with empty space around it.
export default function ContentPhone({ src, alt, title, checklist }) {
  const screens = useMemo(() => {
    const bullets = (checklist || []).slice(0, 4);
    const total = bullets.length + (src ? 1 : 0);
    const items = [];
    if (src) items.push({ src, alt: alt || title });
    bullets.forEach((item, i) => {
      const index = i + (src ? 1 : 0);
      items.push({
        buildTexture: () =>
          buildServiceCardTexture({ eyebrow: "Included", title: item, index, total }),
      });
    });
    return items;
  }, [src, alt, title, checklist]);

  if (screens.length === 0) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.glow} />
      <Phone3D screens={screens} halfSpinMs={5500} />
    </div>
  );
}
