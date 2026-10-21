"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./IndustriesDropdown.module.css";

export default function IndustriesDropdown({ industries }) {
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
        href="/industries"
        className={styles.trigger}
        aria-expanded={open}
        onClick={() => setOpen(false)}
      >
        Industries
        <svg className={styles.caret} viewBox="0 0 10 6" fill="none">
          <path d="M1 1 L5 5 L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <div className={styles.panel}>
        {industries.map((i) => (
          <Link key={i.slug} href={`/industries/${i.slug}`}>
            {i.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
