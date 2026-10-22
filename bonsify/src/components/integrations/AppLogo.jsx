"use client";

import { useState } from "react";
import styles from "./Integrations.module.css";

// The app's own icon, from its website. If it is missing or fails to load, a
// tile with the first letter takes its place.
export default function AppLogo({ app, size = 44 }) {
  const [bad, setBad] = useState(false);
  const src = app.site ? `https://www.google.com/s2/favicons?domain=${app.site}&sz=128` : null;
  const box = { width: size, height: size };
  if (!src || bad) {
    return (
      <span className={styles.logoLetter} style={{ ...box, fontSize: size * 0.42 }} aria-hidden="true">
        {app.name.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={styles.logoImg} style={box} src={src} alt="" width={size} height={size} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBad(true)} onLoad={(e) => e.currentTarget.naturalWidth < 20 && setBad(true)} />
  );
}
