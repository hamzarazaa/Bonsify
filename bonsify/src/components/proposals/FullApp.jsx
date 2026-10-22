"use client";

import { useEffect, useRef, useState } from "react";
import BonsaiArt from "@/components/lab/BonsaiArt";
import BrandApp from "./BrandApp";
import Phone from "./Phone";
import AppQr from "./AppQr";
import { enterFullscreen, exitFullscreen, isFullscreen, onFullscreenChange } from "@/lib/fullscreen";
import styles from "./FullApp.module.css";

// The app on its own: a big phone on a quiet backdrop, the browser asked to go
// full screen, and a QR code to carry the same app over to a real phone. On a
// touch device the app fills the screen itself instead of sitting in a shell.
export default function FullApp({ brand, qrPath, onClose, liveReviews = false }) {
  const [touch, setTouch] = useState(false);
  const [box, setBox] = useState({ s: 1, x: 0, y: 0 });
  const entered = useRef(false);

  useEffect(() => {
    const t = window.matchMedia("(pointer: coarse)").matches;
    setTouch(t);
    const fit = () => {
      const s = Math.min(window.innerWidth / 390, window.innerHeight / 844);
      setBox({ s, x: (window.innerWidth - 390 * s) / 2, y: (window.innerHeight - 844 * s) / 2 });
    };
    fit();
    window.addEventListener("resize", fit);
    // Ask for browser full screen. Opening this view was a click, so it is allowed.
    enterFullscreen().then((ok) => (entered.current = ok));
    const off = onFullscreenChange((on) => {
      if (!on && entered.current) onClose();
    });
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("keydown", esc);
      off();
      document.body.style.overflow = prev;
      if (isFullscreen()) exitFullscreen();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tint = `color-mix(in oklab, ${brand.colors.accent || brand.colors.primary} 70%, white)`;

  return (
    <div className={styles.fs} role="dialog" aria-label={`${brand.name} app, full screen`} style={{ "--fsc": tint }}>
      {touch ? (
        <div className={styles.fsApp} style={{ transform: `scale(${box.s})`, left: box.x, top: box.y }}>
          <BrandApp key={`fs-${brand.slug}`} brand={brand} liveReviews={liveReviews} />
        </div>
      ) : (
        <>
          <div className={styles.art} aria-hidden="true">
            <span className={styles.glow} />
            <BonsaiArt seed={brand.slug || brand.name} />
            <span className={styles.word} style={{ fontFamily: brand.fonts?.heading ? `"${brand.fonts.heading}", system-ui, sans-serif` : undefined }}>
              {brand.name}
            </span>
            <span className={styles.cap}>{brand.name} app, made with Bonsify</span>
          </div>
          <div className={styles.shell}>
            <Phone statusBar statusTone={brand.slug === "highfy" ? "light" : "dark"} label={`${brand.name} app, full screen`}>
              <BrandApp key={`fs-${brand.slug}`} brand={brand} liveReviews={liveReviews} />
            </Phone>
          </div>
          {qrPath && (
            <div className={styles.qr}>
              <AppQr path={qrPath} tone="dark" size={132} />
            </div>
          )}
        </>
      )}
      <button className={styles.close} onClick={onClose}>
        Close
      </button>
    </div>
  );
}
