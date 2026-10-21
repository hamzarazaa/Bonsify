"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandMark from "@/components/shared/BrandMark";
import ServicesDropdown from "@/components/layout/ServicesDropdown";
import IndustriesDropdown from "@/components/layout/IndustriesDropdown";
import CompanyDropdown from "@/components/layout/CompanyDropdown";
import MobileMenu from "@/components/layout/MobileMenu";
import styles from "./Header.module.css";

export default function Header({ serviceGroups, industries }) {
  const [scrolled, setScrolled] = useState(false);
  const [onDark, setOnDark] = useState(false);
  const pathname = usePathname();

  // Pages whose hero is a dark illustration get light nav text until scrolled.
  useEffect(() => {
    setOnDark(Boolean(document.querySelector("[data-dark-hero]")));
  }, [pathname]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""} ${onDark && !scrolled ? styles.onDark : ""}`}>
      <Link className={styles.brand} href="/">
        <BrandMark variant={onDark && !scrolled ? "light" : "dark"} />
        <span className={styles.name}>Bonsify</span>
      </Link>
      <nav className={styles.nav}>
        <Link className={styles.navLink} href="/work">
          Work
        </Link>
        <div className={styles.navLink}>
          <ServicesDropdown groups={serviceGroups} />
        </div>
        <div className={styles.navLink}>
          <IndustriesDropdown industries={industries} />
        </div>
        <div className={styles.navLink}>
          <CompanyDropdown />
        </div>
        <Link className={styles.navLink} href="/blog">
          Blog
        </Link>
        <Link
          className={`${styles.btn} ${styles.btnClay} ${styles.navCta}`}
          href="/contact"
        >
          Book a free audit
        </Link>
      </nav>
      <MobileMenu />
    </header>
  );
}
