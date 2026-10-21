"use client";

import Script from "next/script";
import { useEffect } from "react";
import { captureAttribution, track } from "@/lib/track";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// GA4. Renders nothing until NEXT_PUBLIC_GA_ID (G-XXXXXXXXXX) is set in the
// hosting environment, so the lab and preview builds stay untracked unless
// the variable is added to them on purpose.
//
// GA4 enhanced measurement already records page views on route changes,
// scrolls, outbound clicks and site search; source, medium and campaign come
// from the UTM tags or referrer on the landing request. This component adds
// the events a services site cares about: lead form sent, phone and email
// taps, and clicks on elements marked data-track.
export default function Analytics() {
  useEffect(() => {
    captureAttribution();
    function onClick(e) {
      const a = e.target.closest?.("a,button");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (href.startsWith("tel:")) track("click_phone", { link_url: href });
      else if (href.startsWith("mailto:")) track("click_email", { link_url: href });
      const t = a.closest("[data-track]")?.getAttribute("data-track");
      if (t) track(t, { link_text: (a.textContent || "").trim().slice(0, 60), page_path: window.location.pathname });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
