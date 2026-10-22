"use client";

import { useEffect } from "react";
import styles from "./Tour.module.css";

// Steps drive the phone through every feature, one at a time. `screen` is what
// BrandApp.show() understands.
export const TOUR = [
  { screen: "home", t: "Home", p: "Your storefront in your colours. Categories, banners and best sellers come from Shopify and update by themselves." },
  { screen: "shop", t: "Browse and search", p: "Search with suggestions, filters and sorting, all on your real catalogue." },
  { screen: "vouchers", t: "Offers", p: "Welcome codes, free shipping and gifts live in one tab, one tap from home." },
  { screen: "notifications", t: "Push notifications", p: "Restocks, price drops and delivery updates reach the lock screen. No ad spend." },
  { screen: "orders", t: "Order tracking", p: "Packed, shipped, out today. Shoppers see where the parcel is without writing to support." },
  { screen: "fbt", t: "Frequently bought together", p: "The product page suggests what goes with it and adds the whole set in one tap." },
  { screen: "reviews", t: "Reviews", p: "Ratings and written reviews sit right where the decision is made." },
  { screen: "rewards", t: "Loyalty rewards", p: "Points, tiers and vouchers to spend, in the Account tab." },
  { screen: "giftcards", t: "Gift cards", p: "Send a gift card by email, or add one to the cart." },
  { screen: "chat", t: "Chat with the store", p: "One tap opens a chat with your team, with quick answers for delivery, returns and orders." },
  { screen: "home", t: "That is the app", p: "Open it full screen, or scan the code to hold it in your hand. Checkout opens in Shopify, so payments stay safe." },
];

export default function Tour({ step, onStep, onClose, name, onFull, inFull }) {
  const n = TOUR.length;
  const s = TOUR[step];
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") { if (!inFull) onClose(); }
      else if (e.key === "ArrowRight") onStep(Math.min(n - 1, step + 1));
      else if (e.key === "ArrowLeft") onStep(Math.max(0, step - 1));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [step, n, onStep, onClose, inFull]);

  return (
    <aside className={styles.card} role="dialog" aria-label={`Tour of the ${name} app`} aria-live="polite">
      <button className={styles.x} onClick={onClose} aria-label="Close the tour">
        &times;
      </button>
      <p className={styles.count}>
        Feature {step + 1} of {n}
      </p>
      <h3>{s.t}</h3>
      <p className={styles.text}>{s.p}</p>
      <div className={styles.dots} aria-hidden="true">
        {TOUR.map((_, i) => (
          <i key={i} className={i === step ? styles.on : i < step ? styles.done : ""} />
        ))}
      </div>
      <div className={styles.nav}>
        <button className={styles.arrow} onClick={() => onStep(step - 1)} disabled={step === 0} aria-label="Previous feature">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        {step === n - 1 ? (
          <button className={styles.primary} onClick={inFull ? onClose : onFull}>
            {inFull ? "Finish tour" : "Open full screen"}
          </button>
        ) : (
          <button className={styles.primary} onClick={() => onStep(step + 1)}>
            Next feature
          </button>
        )}
        <button className={styles.arrow} onClick={() => onStep(step + 1)} disabled={step === n - 1} aria-label="Next feature">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </aside>
  );
}
