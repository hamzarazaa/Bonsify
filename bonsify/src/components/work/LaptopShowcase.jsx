"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./LaptopShowcase.module.css";

const AUTOPLAY_MS = 4500;

export default function LaptopShowcase({ shots }) {
  const [active, setActive] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (shots.length <= 1) return;
    const container = containerRef.current;
    let paused = false;
    const onEnter = () => {
      paused = true;
    };
    const onLeave = () => {
      paused = false;
    };
    container?.addEventListener("mouseenter", onEnter);
    container?.addEventListener("mouseleave", onLeave);

    const id = setInterval(() => {
      if (!paused) setActive((i) => (i + 1) % shots.length);
    }, AUTOPLAY_MS);

    return () => {
      clearInterval(id);
      container?.removeEventListener("mouseenter", onEnter);
      container?.removeEventListener("mouseleave", onLeave);
    };
  }, [shots.length]);

  if (!shots.length) return null;
  const active_ = shots[active];

  return (
    <div className={styles.showcase} ref={containerRef}>
      <div className={styles.frame}>
        <div className={styles.chrome}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.url} />
        </div>
        <div className={styles.screen}>
          {shots.map((shot, i) => (
            <Image
              key={shot.src}
              src={shot.src}
              alt={shot.caption || ""}
              fill
              className={`${styles.screenImg} ${
                i === active ? styles.screenImgActive : ""
              }`}
              sizes="(max-width: 900px) 92vw, 720px"
              priority={i === 0}
            />
          ))}
        </div>
      </div>

      {shots.length > 1 && (
        <div className={styles.tabs}>
          {shots.map((shot, i) => (
            <button
              key={shot.src}
              type="button"
              className={`${styles.tab} ${i === active ? styles.tabActive : ""}`}
              onClick={() => setActive(i)}
              aria-label={shot.label || `Screen ${i + 1}`}
            >
              {shot.label || String(i + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
      )}

      <p className={styles.caption}>{active_.caption}</p>
    </div>
  );
}
