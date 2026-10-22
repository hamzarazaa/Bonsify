"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// A page opened from the bottom of another page must start at its top.
// Instant, not smooth, and only when there is no #anchor to land on. The site's
// smooth scroll (Lenis) keeps its own target position, so it is reset too, and
// again a moment later in case it is created after the page change.
export default function ScrollToTop() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.location.hash) return;
    const top = () => {
      const root = document.documentElement;
      const prev = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.__lenis?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
      root.style.scrollBehavior = prev;
    };
    top();
    const t = [60, 200, 500].map((ms) => setTimeout(top, ms));
    return () => t.forEach(clearTimeout);
  }, [pathname]);
  return null;
}
