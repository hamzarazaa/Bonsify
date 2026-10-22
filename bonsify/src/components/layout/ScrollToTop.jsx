"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// A page opened from the bottom of another page must start at its top.
// Instant, not smooth, and only when there is no #anchor to land on.
export default function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.location.hash) return;
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = prev;
  }, [pathname]);
  return null;
}
