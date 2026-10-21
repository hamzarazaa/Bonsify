"use client";

import { useEffect, useRef, useState } from "react";
import BonsaiArt from "./BonsaiArt";

// Quiet bonsai branches behind a dark section. Lab site only. The branches
// start growing when the section scrolls into view, not on page load, so the
// drawing is always seen. `tone` is a CSS colour; it defaults to the site moss.
export default function LabBranches({ seed = "bonsify", tone, strength = 1 }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  const lab = process.env.NEXT_PUBLIC_LAB === "1";

  useEffect(() => {
    if (!lab || !ref.current) return;
    if (!("IntersectionObserver" in window)) return setOn(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [lab]);

  if (!lab) return null;
  return (
    <div
      ref={ref}
      className={`lab-branches${on ? " on" : ""}`}
      aria-hidden="true"
      style={{ "--fsc": tone || "color-mix(in oklab, var(--moss) 75%, white)", "--lb": strength }}
    >
      {on && <BonsaiArt seed={seed} />}
    </div>
  );
}
