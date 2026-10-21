"use client";
// Thin wrapper around GA4's gtag. Safe to call anywhere: it does nothing when
// GA is not configured (no NEXT_PUBLIC_GA_ID) or blocked by the visitor.
export function track(name, params = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", name, params);
    }
  } catch {}
}

const KEY = "bonsify_first_touch";
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

// First-touch attribution kept in localStorage so a lead that converts days
// later still carries the source it arrived from. Sent with the contact form.
export function captureAttribution() {
  try {
    if (localStorage.getItem(KEY)) return;
    const q = new URLSearchParams(window.location.search);
    const data = {
      landing: window.location.pathname,
      referrer: document.referrer || "direct",
      at: new Date().toISOString(),
    };
    UTM.forEach((k) => q.get(k) && (data[k] = q.get(k)));
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export function getAttribution() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
