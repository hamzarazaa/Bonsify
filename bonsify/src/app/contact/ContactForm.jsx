"use client";

import { useCallback, useRef, useState } from "react";
import Turnstile from "@/components/shared/Turnstile";
import { getAttribution, track } from "@/lib/track";
import styles from "./Contact.module.css";

// Cloudflare's published "always passes" test site key - safe to ship as a
// fallback for local dev. Real deployments must set
// NEXT_PUBLIC_TURNSTILE_SITE_KEY (see .env.example) to the real site key
// from the Cloudflare Turnstile dashboard.
const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

const TOPICS = ["An app for my store", "Move to Shopify", "Fix or maintain my app", "Something else"];

export default function ContactForm() {
  const formRef = useRef(null);
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);

  // Passed to Turnstile as callback props - kept stable (empty deps) so
  // Turnstile's effect never has a reason to think it should re-render the
  // widget (see the comment in Turnstile.jsx).
  const handleExpire = useCallback(() => setToken(null), []);
  const handleError = useCallback(() => setToken(null), []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token) {
      setStatus("error");
      setErrorMessage("Please complete the verification check before sending.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData(formRef.current);
    formData.set("cf-turnstile-response", token);
    const att = getAttribution();
    if (att) formData.set("first_touch_source", JSON.stringify(att));
    formData.set("submitted_from", window.location.pathname);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      track("generate_lead", { form: "contact", value: 1 });
      setStatus("success");
      formRef.current.reset();
      setToken(null);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className={styles.success}>
        <b>Got it.</b>
        <p>A real person will reply within a day or two. If it is urgent, email hello@bonsify.io.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} ref={formRef} onSubmit={handleSubmit}>
      <input
        type="text"
        name="_gotcha"
        style={{ display: "none" }}
        tabIndex="-1"
        autoComplete="off"
        aria-hidden="true"
      />
      <input
        type="hidden"
        name="_subject"
        value="New enquiry - bonsify.io contact form"
      />
      <input type="hidden" name="topic" value={topic} />
      <fieldset className={styles.topics}>
        <legend>What brings you here?</legend>
        {TOPICS.map((t) => (
          <button key={t} type="button" className={t === topic ? styles.topicOn : ""} onClick={() => setTopic(t)} aria-pressed={t === topic}>
            {t}
          </button>
        ))}
      </fieldset>
      <div className={styles.field}>
        <label htmlFor="name">Your name</label>
        <input id="name" name="name" type="text" placeholder="Jordan Rivera" />
      </div>
      <div className={styles.field}>
        <label htmlFor="store">Store URL</label>
        <input
          id="store"
          name="store"
          type="url"
          placeholder="yourstore.myshopify.com"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required placeholder="you@yourstore.com" />
      </div>
      <div className={styles.field}>
        <label htmlFor="msg">What should we know?</label>
        <textarea
          id="msg"
          name="message"
          required
          placeholder="Most of our traffic is mobile but repeat purchases are low. We use Klaviyo and Judge.me."
        />
      </div>

      <Turnstile
        siteKey={TURNSTILE_SITE_KEY}
        onVerify={setToken}
        onExpire={handleExpire}
        onError={handleError}
      />

      {status === "error" && errorMessage && (
        <p className={styles.formError} role="alert">
          {errorMessage}
        </p>
      )}

      <button
        className={`btn btn-clay ${styles.send}`}
        type="submit"
        disabled={status === "submitting" || !token}
        
      >
        {status === "submitting" ? "Sending..." : "Send it over"}
      </button>
    </form>
  );
}
