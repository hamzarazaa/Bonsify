"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BrandApp from "@/components/proposals/BrandApp";
import Phone from "@/components/proposals/Phone";
import AppQr from "@/components/proposals/AppQr";
import FullApp from "@/components/proposals/FullApp";
import Tour, { TOUR } from "@/components/lab/Tour";
import styles from "./demo.module.css";

export default function DemoClient({ brand, video }) {
  const appRef = useRef(null);
  const phoneRef = useRef(null);
  const fsRef = useRef(null);
  const [full, setFull] = useState(false);
  const [tour, setTour] = useState(null); // step number while the tour runs
  const tourOn = tour != null;

  // The same tour as the lab home page: one feature at a time, with a card.
  // It carries on in full screen: the step is shown on whichever app is open.
  useEffect(() => {
    if (tour == null) return;
    const t = setTimeout(() => (full ? fsRef : appRef).current?.show(TOUR[tour].screen), full ? 450 : 120);
    return () => clearTimeout(t);
  }, [tour, full]);

  const startTour = () => {
    setTour(0);
    phoneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <main className={`${styles.page} ${tourOn ? styles.touring : ""}`}>
      <section className={styles.hero}>
        <p className={styles.chip}>A short video for {video.who}</p>
        <h1>You asked what an app could look like. We built it.</h1>
        <div className={styles.player}>
          <video controls playsInline preload="metadata" poster={video.poster} src={video.src}>
            Your browser cannot play this video.
          </video>
        </div>
        <div className={styles.actions}>
          <Link href="/contact" className={styles.big}>
            Get your app now <span aria-hidden="true">→</span>
          </Link>
          <p>We start with a store audit this week, then send one fixed quote.</p>
        </div>
      </section>

      <section className={styles.live}>
        <div className={styles.copy}>
          <p className={styles.chip}>Live, not a mock-up</p>
          <h2>Try the {video.who} app yourself</h2>
          <p>
            This is the same app from the video, built from your public store data: your logo, colours, products and
            prices. Tap through products, the bag and checkout, or press Walk me through.
          </p>
          <div className={styles.controls}>
            <button className={styles.play} onClick={tourOn ? () => setTour(null) : startTour}>
              <span aria-hidden="true">{tourOn ? "❚❚" : "▶"}</span> {tourOn ? "Stop the walkthrough" : "Walk me through"}
            </button>
            <button className={styles.ghost} onClick={() => setFull(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              </svg>
              Full screen
            </button>
          </div>
          <AppQr path={`/try/${brand.slug}`} title="Open it on your phone" hint="Scan with your camera. The app opens full screen." />
          <p className={styles.small}>A preview, not the final design. In the real build we design every screen with your team, and checkout stays on your Shopify.</p>
        </div>
        <div className={styles.phone} ref={phoneRef}>
          <Phone statusBar label={`${brand.name} app, interactive preview`}>
            <BrandApp ref={appRef} brand={brand} liveReviews />
          </Phone>
          <button className={styles.fsIcon} onClick={() => setFull(true)} aria-label="Open the app full screen" title="Full screen">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            </svg>
          </button>
        </div>
      </section>

      {!full && tourOn && (
        <Tour step={tour} onStep={(n) => setTour(Math.max(0, Math.min(TOUR.length - 1, n)))} onClose={() => setTour(null)} name={brand.name} onFull={() => setFull(true)} />
      )}

      {full && (
        <FullApp
          brand={brand}
          qrPath={`/try/${brand.slug}`}
          onClose={() => setFull(false)}
          liveReviews
          appRef={fsRef}
          onTour={tourOn ? undefined : () => setTour(0)}
        >
          {tourOn && (
            <Tour step={tour} onStep={(n) => setTour(Math.max(0, Math.min(TOUR.length - 1, n)))} onClose={() => setTour(null)} inFull name={brand.name} onFull={() => setFull(true)} />
          )}
        </FullApp>
      )}
    </main>
  );
}
