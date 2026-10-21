"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./CompanyDropdown.module.css";

const ITEMS = [
  { href: "/about", title: "About" },
  { href: "/how-we-work", title: "How We Work" },
  { href: "/integrations", title: "Integrations" },
  { href: "/faq", title: "FAQ" },
  { href: "/contact", title: "Contact" },
  { href: "/vs", title: "Competitors" },
  { href: "/alternatives", title: "Alternatives" },
];

export default function CompanyDropdown() {
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
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Company
        <svg className={styles.caret} viewBox="0 0 10 6" fill="none">
          <path d="M1 1 L5 5 L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className={styles.panel}>
        <div className={styles.group}>
          {ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
