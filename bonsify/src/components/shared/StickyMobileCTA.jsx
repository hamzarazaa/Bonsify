"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./StickyMobileCTA.module.css";

const DISMISS_KEY = "bonsify-sticky-cta-dismissed";

export default function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) {
      setDismissed(true);
      return;
    }
    function onScroll() {
      setVisible(window.scrollY > 700);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, "1");
  }

  if (dismissed) return null;

  return (
    <div className={`${styles.bar} ${visible ? styles.visible : ""}`}>
      <Link href="/contact" className={styles.cta}>
        Book a free audit
      </Link>
      <button
        type="button"
        className={styles.close}
        aria-label="Dismiss"
        onClick={dismiss}
      >
        ×
      </button>
    </div>
  );
}
