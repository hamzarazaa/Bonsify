"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BrandMark from "@/components/shared/BrandMark";
import Deck from "./Deck";
import OurApps from "./OurApps";
import YourApp from "./YourApp";
import styles from "./ProposalShell.module.css";

const BASE_TABS = [
  { id: "deck", label: "Proposal" },
  { id: "apps", label: "Our apps" },
  { id: "app", label: "Your app" },
];

const VIDEO_TABS = [{ id: "video", label: "Video" }, ...BASE_TABS];

// Holds the three tabs and the controls everything else drives:
//  - deep links: /for/<brand>?tab=apps&app=highfy&screen=2  or  ?tab=deck&slide=plan
//  - window.__proposal: a small API the video recorder (Playwright) calls to
//    move between the deck and the app in time with the narration.
// All three tabs stay mounted, so the prospect's cart survives tab switches.
export default function ProposalShell({ brand, apps }) {
  const hasVideo = !!brand.video?.src;
  const TABS = hasVideo ? VIDEO_TABS : BASE_TABS;
  const [tab, setTab] = useState(hasVideo ? "video" : "deck");
  const deckRef = useRef(null);
  const appsRef = useRef(null);
  const appRef = useRef(null);

  const switchTab = useCallback((id) => {
    if (!TABS.some((t) => t.id === id)) return;
    setTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url);
  }, []);

  const showApp = useCallback(
    (slug) => {
      switchTab("apps");
      appsRef.current?.show(slug, 0);
    },
    [switchTab]
  );

  // Read deep-link params once on load.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("tab");
    if (t && TABS.some((x) => x.id === t)) setTab(t);
    const slide = q.get("slide");
    if (slide) deckRef.current?.goTo(/^\d+$/.test(slide) ? Number(slide) - 1 : slide);
    const app = q.get("app");
    if (app) appsRef.current?.show(app, Number(q.get("screen") || 1) - 1);
    if (q.get("record") === "1") document.documentElement.dataset.recording = "true";
  }, []);

  useEffect(() => {
    const api = {
      tab: switchTab,
      slide: (id) => {
        switchTab("deck");
        deckRef.current?.goTo(id);
      },
      ourApp: (slug, n = 0) => {
        switchTab("apps");
        appsRef.current?.show(slug, n);
      },
      ourLive: (slug) => {
        switchTab("apps");
        appsRef.current?.live(slug);
      },
      ourScroll: (px) => appsRef.current?.scrollBy(px),
      app: (screen, i) => {
        switchTab("app");
        appRef.current?.show(screen, i);
      },
      appAdd: (i) => appRef.current?.add(i),
      appScroll: (px) => appRef.current?.scrollBy(px),
      state: () => ({ tab, slide: deckRef.current?.current() }),
      brand: { slug: brand.slug, name: brand.name, apps: apps.map((a) => a.slug) },
    };
    window.__proposal = api;
    window.dispatchEvent(new Event("proposal:ready"));
  }, [switchTab, tab, brand.slug, brand.name, apps]);

  return (
    <div
      className={styles.shell}
      style={{
        "--brand": brand.colors.primary,
        "--brand-ink": brand.colors.onPrimary || "#fff",
        "--brand-accent": brand.colors.accent || brand.colors.primary,
      }}
    >
      <header className={styles.header}>
        <a className={styles.pair} href="/" aria-label="Bonsify home">
          <BrandMark className={styles.mark} />
          <span className={styles.name}>Bonsify</span>
          <span className={styles.for}>for</span>
          {brand.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo} alt={brand.name} className={styles.theirLogo} />
          ) : (
            <span className={styles.name}>{brand.name}</span>
          )}
        </a>

        <nav className={styles.tabs} role="tablist" aria-label="Proposal sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              className={`${styles.tab} ${tab === t.id ? styles.tabOn : ""}`}
              onClick={() => switchTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <a className={`btn ${styles.cta}`} href={`/contact?ref=${brand.slug}`}>
          Get your app now
        </a>
      </header>

      <main className={styles.main}>
        {hasVideo && (
          <section id="panel-video" role="tabpanel" aria-labelledby="tab-video" hidden={tab !== "video"} className={styles.panel}>
            <div className={styles.videoWrap}>
              <p className={styles.videoKick}>A short video for the {brand.name} team</p>
              <h1 className={styles.videoTitle}>You asked what an app could look like. We built it.</h1>
              <div className={styles.videoPlayer}>
                <video controls playsInline preload="metadata" poster={brand.video.poster} src={brand.video.src}>
                  Your browser cannot play this video.
                </video>
              </div>
              <div className={styles.videoActions}>
                <button className={styles.videoBtn} onClick={() => switchTab("app")}>Try your app <span aria-hidden="true">→</span></button>
                <a className={styles.videoGhost} href={`/contact?ref=${brand.slug}`}>Get your app now</a>
              </div>
            </div>
          </section>
        )}
        <section id="panel-deck" role="tabpanel" aria-labelledby="tab-deck" hidden={tab !== "deck"} className={styles.panel}>
          <Deck ref={deckRef} brand={brand} apps={apps} onShowApps={showApp} />
        </section>
        <section id="panel-apps" role="tabpanel" aria-labelledby="tab-apps" hidden={tab !== "apps"} className={styles.panel}>
          <OurApps ref={appsRef} apps={apps} active={tab === "apps"} />
        </section>
        <section id="panel-app" role="tabpanel" aria-labelledby="tab-app" hidden={tab !== "app"} className={styles.panel}>
          <YourApp ref={appRef} brand={brand} />
        </section>
      </main>
    </div>
  );
}
