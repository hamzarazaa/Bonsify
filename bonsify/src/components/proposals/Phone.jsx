"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Phone.module.css";

// Device frame drawn at a fixed iPhone size (390 x 844 screen) and scaled to
// fit its container, so app layouts render the same at every viewport and
// in the video recorder. The parent decides the available space.
const DEVICE_W = 418;
const DEVICE_H = 872;

export default function Phone({
  children,
  statusBar = false,
  statusTone = "dark",
  maxScale = 1,
  className = "",
  label,
}) {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(0.7);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const s = Math.min(maxScale, height / DEVICE_H, width / DEVICE_W);
      if (s > 0) setScale(Math.round(s * 1000) / 1000);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxScale]);

  return (
    <div className={`${styles.box} ${className}`} ref={boxRef}>
      <div
        className={styles.sizer}
        style={{ width: DEVICE_W * scale, height: DEVICE_H * scale }}
        role="group"
        aria-label={label}
      >
        <div className={styles.device} style={{ transform: `scale(${scale})` }}>
          <div className={styles.screen}>
            {statusBar && (
              <div className={`${styles.status} ${statusTone === "light" ? styles.statusLight : ""}`} aria-hidden="true">
                <span>9:41</span>
                <span className={styles.statusIcons}>
                  <svg width="18" height="11" viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="6" rx="1" /><rect x="10" y="2.5" width="3" height="8.5" rx="1" /><rect x="15" y="0" width="3" height="11" rx="1" /></svg>
                  <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="currentColor" opacity="0.5" /><rect x="2" y="2" width="16" height="8" rx="1.8" /><rect x="22.5" y="4" width="1.8" height="4" rx="0.9" opacity="0.5" /></svg>
                </span>
              </div>
            )}
            <div className={styles.island} aria-hidden="true" />
            {children}
            <div className={styles.homeBar} aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

// A scrollable screenshot screen (images are full-width; tall ones scroll).
// data-lenis-prevent stops the site's smooth scroll from capturing the wheel.
export function ScreenImage({ src, alt, scrollRef }) {
  return (
    <div className={styles.scroll} ref={scrollRef} data-lenis-prevent>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={styles.shot} draggable={false} />
    </div>
  );
}
