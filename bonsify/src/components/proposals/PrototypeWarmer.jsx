"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Quietly loads the Figma prototypes in hidden frames while the visitor reads
// the home page or the Work pages, so Figma's own scripts and fonts are already
// in the browser cache when they open one. One at a time, only when the
// connection can afford it, and never on the proposal pages (they load their
// own). It cannot make Figma itself faster, only start the wait earlier.
export default function PrototypeWarmer({ urls }) {
  const path = usePathname();
  // The lab home page never loads Figma; it only warms up on the work pages.
  const labHome = process.env.NEXT_PUBLIC_LAB === "1";
  const active = (path === "/" && !labHome) || path.startsWith("/work");

  useEffect(() => {
    if (!active || !urls?.length) return;
    const conn = navigator.connection;
    if (conn && (conn.saveData || /(^|-)2g|3g/.test(conn.effectiveType || ""))) return;

    let cancelled = false;
    let frame;
    const timers = [];
    const run = (i) => {
      if (cancelled || i >= urls.length) return;
      frame = document.createElement("iframe");
      frame.src = urls[i];
      frame.setAttribute("aria-hidden", "true");
      frame.tabIndex = -1;
      frame.title = "";
      Object.assign(frame.style, {
        position: "fixed",
        left: "-9999px",
        top: "0",
        width: "420px",
        height: "900px",
        border: "0",
        opacity: "0",
        pointerEvents: "none",
      });
      document.body.appendChild(frame);
      const done = frame;
      timers.push(
        setTimeout(() => {
          done.remove();
          run(i + 1);
        }, 14000)
      );
    };

    const start = () => run(0);
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => timers.push(setTimeout(start, 2500)), { timeout: 5000 })
      : timers.push(setTimeout(start, 4000));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      if (window.cancelIdleCallback && typeof idle === "number") window.cancelIdleCallback(idle);
      document.querySelectorAll("iframe[aria-hidden='true'][src*='embed.figma.com']").forEach((f) => f.remove());
    };
  }, [active, urls]);

  return null;
}
