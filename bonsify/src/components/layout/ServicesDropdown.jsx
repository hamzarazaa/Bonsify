"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./ServicesDropdown.module.css";

export default function ServicesDropdown({ groups }) {
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
        href="/services"
        className={styles.trigger}
        aria-expanded={open}
        onClick={() => setOpen(false)}
      >
        Services
        <svg className={styles.caret} viewBox="0 0 10 6" fill="none">
          <path d="M1 1 L5 5 L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <div className={`${styles.panel} ${styles.groupPanel}`}>
        <Link className={styles.viewAll} href="/services">
          All services →
        </Link>
        <div className={styles.groups}>
          {groups.map((g) => (
            <div key={g.label} className={styles.group}>
              <h4>{g.label}</h4>
              {g.items.map((s) => (
                <Link key={s.slug} href={`/services/${s.slug}`}>
                  {s.title}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
