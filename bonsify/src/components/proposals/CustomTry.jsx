"use client";

import { useEffect, useState } from "react";
import PhoneOnly from "./PhoneOnly";

// The store a visitor typed into the lab demo, reopened on their phone. The
// store comes from the demo's one-day cache; once that has lapsed the visitor
// is sent back to the demo to enter it again.
export default function CustomTry() {
  const [state, setState] = useState({ phase: "load" });
  useEffect(() => {
    const host = new URLSearchParams(window.location.search).get("store");
    if (!host) return setState({ phase: "gone" });
    fetch(`/api/demo?host=${encodeURIComponent(host)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setState({ phase: "ok", brand: d.brand });
      })
      .catch(() => setState({ phase: "gone" }));
  }, []);

  useEffect(() => {
    const b = state.brand;
    if (!b?.fonts) return;
    const fams = [b.fonts.headingGoogle && b.fonts.heading, b.fonts.bodyGoogle && b.fonts.body !== b.fonts.heading && b.fonts.body].filter(Boolean);
    if (!fams.length) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = `https://fonts.googleapis.com/css2?${fams.map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700`).join("&")}&display=swap`;
    document.head.appendChild(l);
  }, [state.brand]);

  if (state.phase === "ok") return <PhoneOnly brand={state.brand} liveReviews />;
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", background: "#0d0f11", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      {state.phase === "load" ? (
        <p>Opening your app</p>
      ) : (
        <div style={{ maxWidth: 360 }}>
          <h1 style={{ fontSize: 22, margin: "0 0 10px" }}>That preview has expired</h1>
          <p style={{ opacity: 0.7, lineHeight: 1.5, margin: "0 0 18px" }}>Previews last a day. Enter your store again on the Bonsify home page and scan the new code.</p>
          <a href="/" style={{ display: "inline-block", padding: "12px 20px", borderRadius: 999, background: "#fff", color: "#0d0f11", fontWeight: 700, textDecoration: "none" }}>Back to Bonsify</a>
        </div>
      )}
    </main>
  );
}
