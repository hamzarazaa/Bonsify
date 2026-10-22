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
  const [labHome, setLabHome] = useState(false);
  const pathname = usePathname();
  const labSite = process.env.NEXT_PUBLIC_LAB === "1";

  // Pages whose hero is a dark illustration get light nav text until scrolled.
  useEffect(() => {
    setOnDark(Boolean(document.querySelector("[data-dark-hero]")));
  }, [pathname]);

  // The lab home changes colour from section to section and says so on <body>.
  useEffect(() => {
    const read = () => {
      setLabHome(document.body.dataset.labHome === "1");
      if (document.body.dataset.labHome === "1") setOnDark(document.body.dataset.heroDark === "1");
      else setOnDark(Boolean(document.querySelector("[data-dark-hero]")));
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.body, { attributes: true, attributeFilter: ["data-lab-home", "data-hero-dark"] });
    return () => mo.disconnect();
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
    <header data-site-header className={`${styles.header} ${scrolled && !labHome ? styles.scrolled : ""} ${onDark && (!scrolled || labHome) ? styles.onDark : ""}`}>
      <Link className={styles.brand} href="/">
        <BrandMark variant={onDark && (!scrolled || labHome) ? "light" : "dark"} />
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
        <Link className={styles.navLink} href="/integrations">
          Integrations
        </Link>
        <div className={styles.navLink}>
          <CompanyDropdown />
        </div>
        <Link className={styles.navLink} href="/blog">
          Blog
        </Link>
        <Link
          className={`${styles.btn} ${styles.btnClay} ${styles.navCta}`}
          href={labSite ? "/#start" : "/contact"}
        >
          Get your app now
        </Link>
      </nav>
      <MobileMenu />
    </header>
  );
}
