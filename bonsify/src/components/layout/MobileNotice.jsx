"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./MobileNotice.module.css";

const KEY = "bonsify_mobile_notice";

// On a phone, the site opens with a short note: it is built to be explored on
// a computer, where the interactive app preview has room. Share sends the page
// to another device through the phone's own share sheet (AirDrop, Messages,
// "Send to your devices" in Chrome and so on); Continue keeps going here.
export default function MobileNotice() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [canShare, setCanShare] = useState(false);
  const pathname = usePathname();
  // Phone preview links (/try/...) are made for phones, so no note there.
  const onTry = pathname?.startsWith("/try");

  useEffect(() => {
    if (onTry) {
      setOpen(false);
      return;
    }
    try {
      if (sessionStorage.getItem(KEY)) return;
    } catch {}
    const phone = window.matchMedia("(pointer: coarse)").matches && Math.min(window.innerWidth, window.innerHeight) < 700;
    if (!phone) return;
    setCanShare(typeof navigator.share === "function");
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [onTry]);

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
  };

  const share = async () => {
    const data = { title: "Bonsify", text: "Open this on your computer: your Shopify store as an app, live.", url: window.location.origin + "/" };
    try {
      if (navigator.share) {
        await navigator.share(data);
        setMsg("Shared. Open it on your computer.");
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(data.url);
      setMsg("Link copied. Paste it on your computer.");
    } catch {
      setMsg(data.url);
    }
  };

  if (!open) return null;
  return (
    <div className={styles.back} role="dialog" aria-modal="true" aria-labelledby="mn-title">
      <div className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>
        </div>
        <h2 id="mn-title">Best on a bigger screen</h2>
        <p>Bonsify shows your store as a live app, and it has more room to play on a computer. Send yourself the link, or carry on here.</p>
        <div className={styles.acts}>
          <button className={styles.share} onClick={share}>
            {canShare ? "Share to another device" : "Copy the link"}
          </button>
          <button className={styles.go} onClick={close}>
            Continue here
          </button>
        </div>
        {msg && <p className={styles.msg} role="status">{msg}</p>}
      </div>
    </div>
  );
}
