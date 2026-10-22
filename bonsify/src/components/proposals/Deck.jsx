"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import BrandApp from "./BrandApp";
import Phone from "./Phone";
import { INTEGRATION_COUNT } from "@/lib/integrations";
import styles from "./Deck.module.css";

// The pitch deck tab. One template; every slide fills in from the brand file,
// so the deck talks about *their* store (catalogue size, collections, the
// apps their site already runs) instead of generic claims. Slide ids are
// stable so the video recorder can say "go to plan" rather than "go to 4".

export const SLIDE_IDS = ["cover", "today", "why", "plan", "apps", "work", "process", "next"];

const FEATURE_NOTES = {
  reviews: "Your product reviews show on every product page",
  loyalty: "Loyalty points earned and spent inside the app",
  bnpl: "Instalment payments at checkout, as on your site",
  wishlist: "Wishlists synced between site and app",
  subscriptions: "Subscriptions managed from the account tab",
  chat: "Live chat and WhatsApp support one tap away",
  push: "Your web push audience moved to native push",
  multicurrency: "Prices in each shopper's currency",
  cod: "Cash on delivery kept as a checkout option",
};

// A short reference built from the crawl date, e.g. 1020 for 20 October.
function proposalRef(brand) {
  const d = new Date(brand.date || brand.crawledAt || Date.now());
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
}

function formatCount(n) {
  if (!n) return null;
  return n >= 5000 ? `${n.toLocaleString("en")}+` : n.toLocaleString("en");
}

// The proposal date is when the brand was crawled (or "date" in overrides),
// so the server-built HTML and the browser always agree on it.
function proposalDate(brand) {
  const d = new Date(brand.date || brand.crawledAt || Date.now());
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

const Deck = forwardRef(function Deck({ brand, apps, onShowApps }, ref) {
  const [i, setI] = useState(0);
  const count = SLIDE_IDS.length;

  const goTo = useCallback((n) => setI(Math.max(0, Math.min(count - 1, n))), [count]);
  useImperativeHandle(ref, () => ({
    goTo(idOrIndex) {
      const n = typeof idOrIndex === "number" ? idOrIndex : SLIDE_IDS.indexOf(idOrIndex);
      if (n >= 0) goTo(n);
    },
    current: () => SLIDE_IDS[i],
  }));

  useEffect(() => {
    function onKey(e) {
      if (e.target.closest("input, textarea, [contenteditable]")) return;
      // Only while the deck is the visible tab.
      if (document.getElementById("panel-deck")?.hidden) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") goTo(i + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") goTo(i - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, goTo]);

  // Trackpad sideways swipes and touch swipes move between slides too. A
  // swipe is counted once, then ignored until the gesture has finished.
  const stageRef = useRef(null);
  const gesture = useRef({ sum: 0, lock: 0, x: null, y: null });
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const g = gesture.current;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      const now = Date.now();
      // Keep ignoring the trackpad's momentum until it goes quiet.
      if (now < g.lock) {
        g.lock = now + 250;
        return;
      }
      g.sum += e.deltaX;
      if (Math.abs(g.sum) > 60) {
        goTo(i + (g.sum > 0 ? 1 : -1));
        g.sum = 0;
        g.lock = now + 700;
      }
    };
    const onStart = (e) => {
      g.x = e.touches[0].clientX;
      g.y = e.touches[0].clientY;
    };
    const onEnd = (e) => {
      if (g.x == null) return;
      const dx = e.changedTouches[0].clientX - g.x;
      const dy = e.changedTouches[0].clientY - g.y;
      g.x = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(i + (dx < 0 ? 1 : -1));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [i, goTo]);

  const proofApp = apps.find((a) => a.proof);
  const proof = proofApp ? { name: proofApp.name, items: proofApp.proof } : null;
  const storeApps = brand.storeApps || [];
  const featureNotes = brand.features.map((f) => FEATURE_NOTES[f.id]).filter(Boolean);
  const productLabel = formatCount(brand.productCount || brand.products.length);
  const addressee = brand.contact ? `${brand.contact} and the ${brand.name} team` : `the ${brand.name} team`;

  const ref_ = `BON-${brand.slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10)}-${proposalRef(brand)}`;
  const productNums = brand.productCount || brand.products.length;

  const slides = {
    cover: (
      <div className={`${styles.slide} ${styles.cover}`}>
        <header className={styles.docHead}>
          <span>App proposal for {brand.name}</span>
          <span>Prepared for {addressee}</span>
          <span>{proposalDate(brand)}</span>
          <span>Ref {ref_}</span>
        </header>
        <div className={styles.coverBody}>
          <h1 className={styles.mega}>
            An app
            <br />
            for {brand.name}.
          </h1>
          <p className={styles.lede}>
            A native iOS and Android app for {brand.domain}, built from your live catalogue. Every product
            {brand.products.every((p) => p.price != null) ? ", price" : ""} and image on that phone is yours.
          </p>
        </div>
        <div className={styles.coverBrand} aria-hidden="true">
          {brand.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo} alt="" className={styles.coverLogo} />
          )}
        </div>
        <div className={styles.coverPhone}>
          <Phone statusBar statusTone={brand.slug === "highfy" ? "light" : "dark"} label={`${brand.name} app preview`}>
            <BrandApp brand={brand} autoSplash={false} interactive={false} />
          </Phone>
        </div>
      </div>
    ),
    today: (
      <div className={`${styles.slide} ${styles.today}`}>
        <div className={styles.headRow}>
          <h2 className={styles.title}>{brand.name} today.</h2>
          <p className={styles.aside}>What we found on {brand.domain} before writing this.</p>
        </div>
        <div className={styles.stats}>
          {productLabel && (
            <div>
              <strong>{productLabel}</strong>
              <span>products in your catalogue{productNums >= 5000 ? ", and counting" : ""}</span>
            </div>
          )}
          {brand.collections.length > 0 ? (
            <div>
              <strong>{brand.collections.length}</strong>
              <span>collections, from {brand.collections.slice(0, 2).map((c) => c.title).join(" to ")}</span>
            </div>
          ) : (
            <div>
              <strong>{brand.features.length}</strong>
              <span>store features the app has to keep working</span>
            </div>
          )}
          <div>
            <strong>{brand.platform === "shopify" ? "Shopify" : "Web"}</strong>
            <span>{brand.currency ? `store, selling in ${brand.currency}` : "store platform"}</span>
          </div>
        </div>
        <div className={styles.todayFoot}>
          {brand.products.length >= 4 && (
            <div className={styles.strip}>
              {brand.products.slice(0, 6).map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.image} src={p.image} alt={p.title} title={p.title} />
              ))}
            </div>
          )}
          {featureNotes.length > 0 && (
            <ul className={styles.ticks} aria-label="Kept in the app">
              {featureNotes.slice(0, 4).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    ),
    why: (
      <div className={`${styles.slide} ${styles.dark} ${styles.why}`}>
        <div className={styles.whyStat}>
          <strong>130%</strong>
          <p>more orders from shoppers in an app than on mobile web.</p>
          <small>Venn Apps, 2025</small>
        </div>
        <div className={styles.whyList}>
          <h2 className={styles.title}>Where mobile web loses people.</h2>
          <dl>
            {[
              ["Slow first load", "Every visit starts in a browser tab, so shoppers wait before they see a product."],
              ["No place on the home screen", "Once the tab closes, the only way back is a search or another paid ad."],
              ["No direct line", "Restocks and offers go to email, where most of them are never opened."],
              ["Checkout from scratch", "Addresses and card details are typed again on a small screen."],
            ].map(([h, p]) => (
              <div key={h}>
                <dt>{h}</dt>
                <dd>{p}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    ),
    plan: (
      <div className={`${styles.slide} ${styles.brandSlide}`}>
        <h2 className={styles.title}>What we would build for {brand.name}.</h2>
        <div className={styles.plan}>
          {[
            ["A native app, iOS and Android", `Your full ${brand.platform === "shopify" ? "Shopify " : ""}catalogue, checkout and accounts, in both stores under ${brand.name}'s name.`],
            ["Installs from your own site", "An install prompt on your storefront invites mobile visitors to add the app and rewards them when they do."],
            ["Push that sells", "Restock alerts, drops, abandoned carts and order updates, straight to the lock screen."],
            ["A portal your team runs", "Change banners, collections and offers yourselves. No release, no ticket."],
          ].map(([h, p]) => (
            <div key={h}>
              <h3>{h}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
        <p className={styles.note}>Built, launched and maintained by Bonsify. No developers to hire on your side.</p>
      </div>
    ),
    apps: (
      <div className={`${styles.slide} ${styles.brandSlide} ${styles.appsSlide}`}>
        <div className={styles.headRow}>
          <h2 className={styles.title}>The apps {brand.name} runs, kept in your app.</h2>
          <p className={styles.aside}>
            {storeApps.length > 0
              ? `Found on ${brand.domain}. We connect each one before launch.`
              : `We map every app on ${brand.domain} in the audit.`}
          </p>
        </div>
        {storeApps.length > 0 ? (
          <ul className={styles.appChips} aria-label={`Shopify apps used by ${brand.name}`}>
            {storeApps.map((n) => (
              <li key={n}>
                <i aria-hidden="true" />
                {n}
              </li>
            ))}
          </ul>
        ) : (
          <ul className={styles.appChips} aria-label="Examples of Shopify apps we connect">
            {["Klaviyo", "Recharge", "Yotpo", "Judge.me", "Gorgias", "Rebuy", "Smile.io", "Triple Whale"].map((n) => (
              <li key={n}>
                <i aria-hidden="true" />
                {n}
              </li>
            ))}
          </ul>
        )}
        <p className={styles.note}>
          Reviews, loyalty, subscriptions, search, messaging and support carry over, so shoppers see the same
          points, prices and reviews in the app as on the site. Bonsify apps connect to {INTEGRATION_COUNT}+ Shopify
          apps; we check each one in your audit and tell you what works on day one.
        </p>
      </div>
    ),
    work: (
      <div className={`${styles.slide} ${styles.dark} ${styles.workSlide}`}>
        <div className={styles.headRow}>
          <h2 className={styles.title}>Apps we have shipped.</h2>
          {apps.length > 0 && (
            <button className={styles.textBtn} onClick={() => onShowApps(apps[0].slug)}>
              Try them in Our apps
            </button>
          )}
        </div>
        {proof && (
          <div className={styles.proof}>
            {proof.items.map((i) => (
              <div key={i.label}>
                <strong>{i.big}</strong>
                <span>{i.label}</span>
              </div>
            ))}
            <small>{proof.name}, from its store listings, Oct 2026.</small>
          </div>
        )}
        <div className={styles.work}>
          {apps.map((a) => (
            <button key={a.slug} className={styles.workCard} style={{ "--app": a.color || "#2F6B4F" }} onClick={() => onShowApps(a.slug)}>
              <span className={styles.workName} aria-hidden="true">
                {a.name}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.cover || a.screens[0].src} alt="" className={styles.workShot} />
              <span className={styles.workMeta}>
                <strong>{a.name}</strong>
                <small>{a.category}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    ),
    process: (
      <div className={`${styles.slide} ${styles.processSlide}`}>
        <div className={styles.headRow}>
          <h2 className={styles.title}>How it works.</h2>
          <p className={styles.aside}>From the first call to the App Store.</p>
        </div>
        <ol className={styles.steps}>
          {[
            ["Audit", `We go through ${brand.domain} on a phone and mark where shoppers drop off.`],
            ["Build", "We design and build the app around your catalogue, in your branding throughout."],
            ["Launch", "We handle App Store and Google Play submission and switch on the install prompt on your storefront."],
            ["Grow", "We keep the app updated, watch the numbers and improve it every month."],
          ].map(([h, p], n) => (
            <li key={h}>
              <span className={styles.stepNum}>{String(n + 1).padStart(2, "0")}</span>
              <h3>{h}</h3>
              <p>{p}</p>
            </li>
          ))}
        </ol>
      </div>
    ),
    next: (
      <div className={`${styles.slide} ${styles.closing}`}>
        <h2 className={styles.mega}>
          Let&rsquo;s build
          <br />
          {brand.name}&rsquo;s app.
        </h2>
        <div className={styles.closeFoot}>
          <p className={styles.lede}>
            Start with a free audit of {brand.domain} on mobile. We show you where an app would win back sales, and you
            keep the findings either way.
          </p>
          <div className={styles.ctaRow}>
            <a className={styles.ctaBtn} href={`/contact?ref=${brand.slug}`}>
              Get your app now
            </a>
            <span className={styles.contact}>
              <a href={`mailto:hello@bonsify.io?subject=${encodeURIComponent(`${brand.name} app`)}`}>hello@bonsify.io</a>
              <span>+1 (251) 277-9302</span>
            </span>
          </div>
        </div>
      </div>
    ),
  };

  const id = SLIDE_IDS[i];

  return (
    <div className={styles.deck}>
      <div className={styles.stageWrap} ref={stageRef}>
        <div className={styles.stage} id={`slide-${id}`} key={id} aria-roledescription="slide" aria-label={`${i + 1} of ${count}`}>
          {slides[id]}
        </div>
      </div>
      <div className={styles.controls}>
        <button className={styles.arrow} onClick={() => goTo(i - 1)} disabled={i === 0} aria-label="Previous slide">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 5 8 12l7 7" /></svg>
        </button>
        <div className={styles.progress} role="tablist" aria-label="Slides">
          {SLIDE_IDS.map((s, n) => (
            <button
              key={s}
              role="tab"
              aria-selected={n === i}
              aria-label={`Slide ${n + 1}`}
              className={`${styles.pip} ${n === i ? styles.pipOn : ""} ${n < i ? styles.pipDone : ""}`}
              onClick={() => goTo(n)}
            />
          ))}
        </div>
        <span className={styles.counter}>
          {i + 1} / {count}
        </span>
        <button className={styles.arrow} onClick={() => goTo(i + 1)} disabled={i === count - 1} aria-label="Next slide">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 5 7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
});

export default Deck;
