"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// The lab site's motion layer: a hairline scroll progress bar, a header that
// frosts once you scroll, and gentle reveals for headings, eyebrows and cards
// on every page (see styles/lab-theme.css). It never touches an element's own
// transform, and it lets go of each element once it has settled, so hover
// effects a component defines for itself keep working.
const TARGETS = [
  ".lab-page section h2",
  ".lab-page section .eyebrow",
  '.lab-page section [class*="card" i]',
  ".lab-page section figure",
  ".lab-page section blockquote",
  ".lab-page section details",
].join(",");

const SKIP = "[data-dark-hero], .lab-hero, .reveal, .lab-branches, [data-lm], [data-lm] *";

export default function LabMotion() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_LAB !== "1") return;
    const root = document.documentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    const bar = document.getElementById("lab-progress");
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - innerHeight;
        if (bar) bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
        root.toggleAttribute("data-scrolled", scrollY > 24);
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_LAB !== "1") return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target;
          io.unobserve(el);
          el.classList.add("lm-in");
          // Hand the element back to its own styles once the reveal is done.
          setTimeout(() => {
            el.removeAttribute("data-lm");
            el.classList.remove("lm-in");
            el.style.removeProperty("--lm-d");
          }, 1500);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    // Wait a frame so the new page has mounted, then mark what to reveal.
    const t = setTimeout(() => {
      const seen = new Map();
      document.querySelectorAll(TARGETS).forEach((el) => {
        if (el.matches(SKIP) || el.closest(SKIP)) return;
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight * 0.9 && r.bottom > 0 && scrollY < 40) {
          // Above the fold: a short, immediate entrance rather than waiting.
          el.setAttribute("data-lm", "");
          el.style.setProperty("--lm-d", "120ms");
          requestAnimationFrame(() => el.classList.add("lm-in"));
          setTimeout(() => {
            el.removeAttribute("data-lm");
            el.classList.remove("lm-in");
          }, 1500);
          return;
        }
        const p = el.parentElement;
        const n = seen.get(p) || 0;
        seen.set(p, n + 1);
        el.style.setProperty("--lm-d", `${Math.min(n, 6) * 70}ms`);
        el.setAttribute("data-lm", "");
        io.observe(el);
      });
    }, 60);

    return () => {
      clearTimeout(t);
      io.disconnect();
      document.querySelectorAll("[data-lm]").forEach((el) => {
        el.removeAttribute("data-lm");
        el.classList.remove("lm-in");
      });
    };
  }, [pathname]);

  if (process.env.NEXT_PUBLIC_LAB !== "1") return null;
  return <div id="lab-progress" className="lab-progress" aria-hidden="true" />;
}
