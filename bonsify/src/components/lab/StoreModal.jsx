"use client";

import { useEffect, useRef, useState } from "react";
import Turnstile from "@/components/shared/Turnstile";
import styles from "./StoreModal.module.css";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* One dialog for the lab site's two store prompts:
   "intake": Let's Bonsify your store (name, email, store address, brand name).
   "notshopify": the store address was read but it is not a Shopify store. */
export default function StoreModal({ kind, values, onChange, onClose, onSubmit, busy }) {
  const [token, setToken] = useState(null);
  const [err, setErr] = useState("");
  const first = useRef(null);
  const set = (k) => (e) => onChange({ ...values, [k]: e.target.value });

  useEffect(() => {
    first.current?.focus();
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const submit = (e) => {
    e.preventDefault();
    if (!values.name.trim()) return setErr("Add your name.");
    if (!EMAIL.test(values.email.trim())) return setErr("Add a valid email so we can send you the app.");
    if (!values.url.trim()) return setErr("Add your store address.");
    if (kind === "intake" && !token) return setErr("Tick the small check box first.");
    setErr("");
    onSubmit(token);
  };

  const notShop = kind === "notshopify";
  return (
    <div className={styles.back} onMouseDown={(e) => e.target === e.currentTarget && onClose()} data-modal>
      <form className={styles.card} role="dialog" aria-modal="true" aria-labelledby="sm-title" onSubmit={submit}>
        <button type="button" className={styles.x} onClick={onClose} aria-label="Close">
          &times;
        </button>
        {notShop ? (
          <>
            <h2 id="sm-title">That does not look like a Shopify store</h2>
            <p className={styles.lede}>
              <b>{values.url}</b> did not read as Shopify, so we could not draw its app. We build for Shopify, so if the store is moving to Shopify or we missed it, leave your details and we will check it by hand.
            </p>
          </>
        ) : (
          <>
            <h2 id="sm-title">Let&rsquo;s Bonsify your store</h2>
            <p className={styles.lede}>We read your public store pages and turn the phone into your app. It takes about a minute.</p>
          </>
        )}
        <label>
          <span>Your name</span>
          <input ref={first} value={values.name} onChange={set("name")} autoComplete="name" placeholder="Ayesha Khan" />
        </label>
        <label>
          <span>Email</span>
          <input type="email" value={values.email} onChange={set("email")} autoComplete="email" placeholder="you@yourstore.com" inputMode="email" />
        </label>
        <div className={styles.two}>
          <label>
            <span>Brand name</span>
            <input value={values.brandName} onChange={set("brandName")} placeholder="Your brand" />
          </label>
          <label>
            <span>Store address</span>
            <input value={values.url} onChange={set("url")} placeholder="yourstore.com" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
          </label>
        </div>
        <input className={styles.hp} tabIndex={-1} autoComplete="off" aria-hidden="true" value={values.website || ""} onChange={set("website")} name="website" />
        {!notShop && (
          <div className={styles.check}>
            <Turnstile siteKey={SITE_KEY} onVerify={setToken} onExpire={() => setToken(null)} onError={() => setToken(null)} />
          </div>
        )}
        {err && (
          <p className={styles.err} role="alert">
            {err}
          </p>
        )}
        <button className={styles.go} type="submit" disabled={busy}>
          {busy ? "Working" : notShop ? "Send my details" : "Make my app"}
        </button>
        <p className={styles.fine}>{notShop ? "We reply from hello@bonsify.io." : "We only read public pages. We will email you about your app, nothing else."}</p>
      </form>
    </div>
  );
}
