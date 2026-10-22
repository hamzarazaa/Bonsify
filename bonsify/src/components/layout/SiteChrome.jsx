"use client";

import { usePathname } from "next/navigation";

// Proposal pages (/for/<brand>) are full-screen presentations with their own
// header, so the site's header, footer and smooth scroll stay off there.
// Everything else renders exactly as before.
export default function SiteChrome({ children, keepOnLabHome = false }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/for/") || pathname?.startsWith("/try/") || pathname === "/lab") return null;
  // The lab site (separate Vercel project) shows its own interactive home.
  if (process.env.NEXT_PUBLIC_LAB === "1" && pathname === "/" && !keepOnLabHome) return null;
  return children;
}
