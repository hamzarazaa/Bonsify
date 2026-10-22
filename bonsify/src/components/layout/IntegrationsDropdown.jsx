"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./IntegrationsDropdown.module.css";

export default function IntegrationsDropdown({ categories = [], popular = [], total = 0 }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function openNow() {
    clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function closeSoon() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <div
      className={`${styles.wrap} ${open ? styles.open : ""}`}
      ref={wrapRef}
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <Link
        href="/integrations"
        className={styles.trigger}
        aria-expanded={open}
        onClick={() => setOpen(false)}
      >
        Integrations
        <svg className={styles.caret} viewBox="0 0 10 6" fill="none">
          <path d="M1 1 L5 5 L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <div className={styles.panel}>
        <div className={styles.cats}>
          <p className={styles.label}>By category</p>
          <div className={styles.catGrid}>
            {categories.map((k) => (
              <Link key={k.id} href={`/integration-categories/${k.id}`} onClick={() => setOpen(false)}>
                <span>{k.title}</span>
                <em>{k.count}</em>
              </Link>
            ))}
          </div>
        </div>
        <div className={styles.pop}>
          <p className={styles.label}>Popular apps</p>
          {popular.map((p) => (
            <Link key={p.slug} href={`/integrations/${p.slug}`} onClick={() => setOpen(false)}>
              {p.name}
            </Link>
          ))}
          <Link href="/integrations" className={styles.all} onClick={() => setOpen(false)}>
            Browse all {total}{" "}integrations &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
