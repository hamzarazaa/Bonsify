"use client";

import { usePathname } from "next/navigation";
import styles from "./PageTransition.module.css";

export default function PageTransition({ children }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className={`${styles.fade} lab-page`}>
      {children}
    </div>
  );
}
