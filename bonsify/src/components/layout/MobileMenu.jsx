"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./MobileMenu.module.css";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.toggle} ${open ? styles.open : ""}`}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      <div className={`${styles.panel} ${open ? styles.open : ""}`}>
        <nav className={styles.links}>
          <Link href="/work" onClick={close}>
            Work
          </Link>
          <Link href="/services" onClick={close}>
            Services
          </Link>
          <Link href="/industries" onClick={close}>
            Industries
          </Link>
          <Link href="/blog" onClick={close}>
            Blog
          </Link>
          <Link href="/about" onClick={close}>
            About
          </Link>
          <Link href="/how-we-work" onClick={close}>
            How We Work
          </Link>
          <Link href="/integrations" onClick={close}>
            Integrations
          </Link>
          <Link href="/faq" onClick={close}>
            FAQ
          </Link>
        </nav>
        <Link
          href="/contact"
          onClick={close}
          className={`btn btn-clay ${styles.cta}`}
        >
          Book a free audit
        </Link>
      </div>
    </>
  );
}
