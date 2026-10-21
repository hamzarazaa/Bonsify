"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { SPLASH_HOLD_MS, SPLASH_OPEN_MS } from "@/lib/introTiming";
import styles from "./HomeSplash.module.css";

// Deferred so three.js (which this pulls in) isn't part of the bundle every
// route has to fetch/parse - the dark .root/.vignette overlay below is
// plain CSS and still shows immediately either way, since WebGL can't paint
// anything before hydration regardless of which chunk the shader code is
// in; this only changes when that chunk is fetched, not what's on screen.
const ShaderAnimation = dynamic(
  () => import("@/components/shared/ShaderAnimation"),
  { ssr: false }
);

// The wordmark's CSS keyframe would otherwise fire the instant this
// component mounts - but the shader canvases mount empty and only start
// painting a moment later (WebGL init + first compiled frame), which reads
// as "text first, shader catches up." If neither panel reports ready within
// this window, show the wordmark anyway rather than risk it never appearing.
const READY_FALLBACK_MS = 500;

// Rendered as a sibling of Header/PageTransition in layout.js (not nested
// inside page.js's content) for two reasons: it needs to be part of the
// server-rendered HTML so it's on screen from the very first paint with no
// JS-dependent delay, and PageTransition's fade wrapper animates opacity,
// which makes it a permanent stacking context in Chrome (any element with
// an opacity/transform keyframe animation gets one, whether or not it's
// still playing) - a descendant's z-index would only be compared inside
// that wrapper's local context and lose to Header's explicit one. Being a
// plain sibling instead means this compares directly against Header at the
// true root, and exists in the initial HTML instead of only after hydration.
export default function HomeSplash() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(true);
  const [opening, setOpening] = useState(false);
  const [ready, setReady] = useState(false);
  const readyCount = useRef(0);

  function handlePanelReady() {
    readyCount.current += 1;
    if (readyCount.current >= 2) setReady(true);
  }

  useEffect(() => {
    if (pathname !== "/") return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) {
      setMounted(false);
      return;
    }

    const readyFallback = setTimeout(() => setReady(true), READY_FALLBACK_MS);
    const openTimer = setTimeout(() => setOpening(true), SPLASH_HOLD_MS);
    const removeTimer = setTimeout(
      () => setMounted(false),
      SPLASH_HOLD_MS + SPLASH_OPEN_MS + 150
    );

    return () => {
      clearTimeout(readyFallback);
      clearTimeout(openTimer);
      clearTimeout(removeTimer);
    };
  }, [pathname]);

  if (pathname !== "/" || !mounted) return null;

  return (
    <div
      className={`${styles.root} ${opening ? styles.opening : ""} ${
        ready ? styles.ready : ""
      }`}
      style={{ "--panel-open-ms": `${SPLASH_OPEN_MS}ms` }}
      aria-hidden="true"
    >
      <div className={styles.panelLeft}>
        <div className={styles.canvasWrap}>
          <ShaderAnimation onReady={handlePanelReady} />
        </div>
      </div>
      <div className={styles.panelRight}>
        <div className={`${styles.canvasWrap} ${styles.canvasWrapRight}`}>
          <ShaderAnimation onReady={handlePanelReady} />
        </div>
      </div>
      <div className={styles.vignette} />
      <div className={styles.wordmark}>Bonsify</div>
    </div>
  );
}
