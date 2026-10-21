"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./ArticleNav.module.css";

function Arrow({ direction }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={styles.arrowIcon}>
      <path
        d={direction === "prev" ? "M15 5 8 12l7 7" : "M9 5 16 12l-7 7"}
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ArticleNav({ prev, next }) {
  // Starts hidden - the page always loads scrolled to the top, with the
  // hero on screen, so there's nothing to flash before the observers below
  // measure the real state.
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const hero = document.getElementById("article-hero");
    const footer = document.querySelector("footer");
    if (!hero && !footer) {
      setHidden(false);
      return;
    }

    let heroVisible = !!hero;
    let footerVisible = false;
    const update = () => setHidden(heroVisible || footerVisible);

    const observers = [];
    if (hero) {
      const io = new IntersectionObserver(([entry]) => {
        heroVisible = entry.isIntersecting;
        update();
      });
      io.observe(hero);
      observers.push(io);
    }
    if (footer) {
      const io = new IntersectionObserver(([entry]) => {
        footerVisible = entry.isIntersecting;
        update();
      });
      io.observe(footer);
      observers.push(io);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  if (!prev && !next) return null;

  return (
    <>
      {prev && (
        <Link
          href={prev.href}
          className={`${styles.arrowBtn} ${styles.prevBtn} ${
            hidden ? styles.arrowHidden : ""
          }`}
          aria-label={`Previous article: ${prev.title}`}
        >
          <Arrow direction="prev" />
        </Link>
      )}
      {next && (
        <Link
          href={next.href}
          className={`${styles.arrowBtn} ${styles.nextBtn} ${
            hidden ? styles.arrowHidden : ""
          }`}
          aria-label={`Next article: ${next.title}`}
        >
          <Arrow direction="next" />
        </Link>
      )}
    </>
  );
}
