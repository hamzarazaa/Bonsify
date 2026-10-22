"use client";

import { useEffect, useRef, useState } from "react";
import BrandApp from "./BrandApp";
import { canFullscreen, enterFullscreen, isFullscreen, onFullscreenChange } from "@/lib/fullscreen";
import styles from "./PhoneOnly.module.css";

// What a prospect sees after scanning the QR code: the app, filling their
// phone's screen. The browser is asked for full screen on the first tap (phones
// only allow it after a touch); where that is not possible (iPhone Safari) a
// there is no prompt; the app simply fills the screen.
export default function PhoneOnly({ brand, liveReviews = false }) {
  const [box, setBox] = useState({ s: 1, x: 0, y: 0 });
  const [fsOn, setFsOn] = useState(false);
  const tried = useRef(false);

  useEffect(() => {
    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const s = Math.min(w / 390, h / 844);
      setBox({ s, x: (w - 390 * s) / 2, y: (h - 844 * s) / 2 });
    };
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    const off = onFullscreenChange(setFsOn);
    // First touch anywhere asks the browser for full screen.
    const first = () => {
      if (tried.current) return;
      tried.current = true;
      if (!isFullscreen()) enterFullscreen();
    };
    window.addEventListener("pointerup", first, { once: true });
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
      window.removeEventListener("pointerup", first);
      off();
    };
  }, []);

  return (
    <div className={styles.root} style={{ background: brand.colors.primary }}>
      <div className={styles.app} style={{ transform: `scale(${box.s})`, left: box.x, top: box.y }}>
        <BrandApp brand={brand} liveReviews={liveReviews} />
      </div>
      {canFullscreen() && !fsOn && (
        <button className={styles.fsBtn} onClick={() => enterFullscreen()} aria-label="Full screen">
          Full screen
        </button>
      )}
    </div>
  );
}
