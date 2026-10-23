"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { normalizeStoreUrl } from "@/lib/storeUrl";
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

  // onClose changes on every keystroke (it closes over the form values), so keep it in a ref.
  // Otherwise the effect below re-runs on each letter and pulls focus back to the first field.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    first.current?.focus();
    const esc = (e) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
    };
  }, []);

  const notice = kind === "notshopify" || kind === "blocked";
  const submit = (e) => {
    e.preventDefault();
    if (!values.name.trim()) return setErr("Add your name.");
    if (!EMAIL.test(values.email.trim())) return setErr("Add a valid email so we can send you the app.");
    const clean = normalizeStoreUrl(values.url);
    if (!clean) return setErr("That store address does not look right. Try something like yourstore.com.");
    if (clean !== values.url) onChange({ ...values, url: clean });
    if (kind === "intake" && !token) return setErr("Tick the small check box first.");
    setErr("");
    onSubmit(token);
  };

  const notShop = false;
  if (notice) {
    const blocked = kind === "blocked";
    return (
      <div className={styles.back} onMouseDown={(e) => e.target === e.currentTarget && onClose()} data-modal>
        <div className={styles.card} role="dialog" aria-modal="true" aria-labelledby="sm-title">
          <button type="button" className={styles.x} onClick={onClose} aria-label="Close">
            &times;
          </button>
          <h2 id="sm-title">{blocked ? "We could not fetch this store" : "This store is not on Shopify"}</h2>
          <p className={styles.lede}>
            {blocked
              ? "That store blocks automated visits, so we could not draw its app here. We can still build it. Book a call and we will show you."
              : "We build apps for Shopify stores, so we could not draw this one here. We can still build it, or help you move to Shopify. Book a call and we will show you."}
          </p>
          <Link className={`${styles.go} ${styles.cta}`} href="/contact" onClick={onClose}>
            Book a call
          </Link>
          <p className={styles.fine}>We reply from hello@bonsify.io.</p>
        </div>
      </div>
    );
  }
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
          <input ref={first} value={values.name} onChange={set("name")} autoComplete="name" placeholder="Jordan Rivera" />
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
