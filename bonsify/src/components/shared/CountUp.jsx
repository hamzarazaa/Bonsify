"use client";

import { useEffect, useRef, useState } from "react";

export default function CountUp({ to, suffix = "", duration = 1300, className }) {
  const ref = useRef(null);
  // Starts at the real target, not 0 - this is what's server-rendered and
  // what any crawler or no-JS visitor sees. The count-up animation resets
  // it to 0 itself once it actually starts (below), so real visitors still
  // see the same count-from-0 effect; only the pre-animation/no-JS state
  // changes, from a misleading "0" to the true value.
  const [value, setValue] = useState(to);
  const countedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function animate() {
      if (countedRef.current) return;
      countedRef.current = true;
      setValue(0);
      let start = null;
      function step(t) {
        if (!start) start = t;
        const p = Math.min((t - start) / duration, 1);
        setValue(Math.round((1 - Math.pow(1 - p, 3)) * to));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      setValue(to);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
}
