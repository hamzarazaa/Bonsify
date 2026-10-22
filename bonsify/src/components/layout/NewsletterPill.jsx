"use client";

import { useState } from "react";
import { saveLead } from "@/lib/leads";
import styles from "./NewsletterPill.module.css";

// A short sign-up strip above the footer: email plus the Shopify store address.
export default function NewsletterPill() {
  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");
  const [state, setState] = useState("idle"); // idle | busy | done | error
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setState("error");
      return setMsg("Add a valid email.");
    }
    setState("busy");
    const ok = await saveLead({ stage: "newsletter", email: email.trim(), url: url.trim(), source: "footer-pill" });
    setState(ok ? "done" : "error");
    setMsg(ok ? "You are on the list. We will also look at your store." : "Could not send that. Try again, or email hello@bonsify.io.");
  };

  return (
    <section className={styles.wrap} aria-label="Newsletter">
      <form className={styles.pill} onSubmit={submit}>
        <span className={styles.copy}>
          <b>Shopify app notes, once in a while</b>
          <small>What works in store apps, and what we are shipping.</small>
        </span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" autoComplete="email" aria-label="Your email" disabled={state === "done"} />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="yourstore.com" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-label="Your Shopify store address" disabled={state === "done"} />
        <button type="submit" disabled={state === "busy" || state === "done"}>
          {state === "busy" ? "Sending" : state === "done" ? "Subscribed" : "Subscribe"}
        </button>
      </form>
      {msg && (
        <p className={`${styles.msg} ${state === "error" ? styles.bad : ""}`} role="status">
          {msg}
        </p>
      )}
    </section>
  );
}
