"use client";

import { useEffect, useState } from "react";
import QrCode from "@/components/shared/QrCode";
import styles from "./AppQr.module.css";

// "Try it on your phone": a QR code that opens the same app full screen on the
// visitor's own phone. `path` is the page to open, relative to this site.
export default function AppQr({ path, title = "Try it on your phone", hint = "Point your camera here. The app opens full screen.", size = 148, tone = "light" }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const url = origin ? `${origin}${path}` : "";
  return (
    <div className={`${styles.card} ${tone === "dark" ? styles.dark : ""}`}>
      {url ? <QrCode value={url} size={size} label={`QR code to open the app on your phone`} /> : <span className={styles.ph} style={{ width: size, height: size }} />}
      <div className={styles.copy}>
        <b>{title}</b>
        <span>{hint}</span>
      </div>
    </div>
  );
}
