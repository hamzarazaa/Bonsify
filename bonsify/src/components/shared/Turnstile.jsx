"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// Renders via Cloudflare's explicit-render JS API (not the auto-render
// data-sitekey div) so we control exactly when it mounts and can clean it
// up on unmount - the auto-render approach re-scans the DOM on script load
// and doesn't play well with React re-rendering the same container.
export default function Turnstile({ siteKey, onVerify, onExpire, onError }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!scriptReady || !containerRef.current || !window.turnstile) return;
    // StrictMode/fast-refresh can re-run this effect against an already
    // -rendered container - guard so we don't create a second widget.
    if (widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: onVerify,
      "expired-callback": onExpire,
      "error-callback": onError,
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // onVerify/onExpire/onError are expected to be stable (state setters or
    // useCallback with empty deps) - re-running this to pick up a fresh
    // closure would just hit the guard above and silently keep the stale
    // one bound to the widget instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady, siteKey]);

  return (
    <>
      <Script src={SCRIPT_SRC} strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div ref={containerRef} />
    </>
  );
}
