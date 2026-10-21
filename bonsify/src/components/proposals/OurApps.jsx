"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Phone, { ScreenImage } from "./Phone";
import LivePrototype from "./LivePrototype";
import BonsifyLoader from "./BonsifyLoader";
import styles from "./OurApps.module.css";

// "Our apps" tab: apps we've shipped, shown on the same device frame as the
// prospect's app. Each app opens as its clickable Figma prototype ("Live"),
// with a curated set of still screens as the other view. The still screens
// are also what the video recorder uses, since it can't tap inside Figma.
const OurApps = forwardRef(function OurApps({ apps, active = true, initial }, ref) {
  const [appIdx, setAppIdx] = useState(() => Math.max(0, apps.findIndex((a) => a.slug === initial)));
  const [screen, setScreen] = useState(0);
  const [mode, setMode] = useState(() => (apps[0]?.prototype ? "live" : "screens"));
  // Prototypes are only loaded once their app has been opened on a visible
  // tab, then kept mounted so switching back is instant.
  const [visited, setVisited] = useState(() => new Set());
  // Bumping an app's count reloads its prototype from the first screen.
  const [runs, setRuns] = useState({});
  const scrollRef = useRef(null);
  const app = apps[appIdx];
  const live = mode === "live" && Boolean(app?.prototype);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [appIdx, screen, mode]);

  useEffect(() => {
    if (active && live && app && !visited.has(app.slug)) {
      setVisited((v) => new Set(v).add(app.slug));
    }
  }, [active, live, app, visited]);

  const pick = (n) => {
    setAppIdx(n);
    setScreen(0);
    setMode(apps[n].prototype ? "live" : "screens");
  };

  useImperativeHandle(ref, () => ({
    // Recorder: a specific still screen of an app.
    show(slug, n = 0) {
      const idx = apps.findIndex((a) => a.slug === slug);
      if (idx >= 0) setAppIdx(idx);
      setScreen(Math.max(0, n));
      setMode("screens");
    },
    // The clickable prototype of an app.
    live(slug) {
      const idx = apps.findIndex((a) => a.slug === slug);
      if (idx >= 0 && apps[idx].prototype) {
        setAppIdx(idx);
        setMode("live");
      }
    },
    scrollBy(px) {
      scrollRef.current?.scrollBy({ top: px, behavior: "smooth" });
    },
  }));

  if (!app) {
    return <p className={styles.empty}>App showcases are being added.</p>;
  }

  const shot = app.screens[Math.min(screen, app.screens.length - 1)];
  const cover = app.cover || app.screens[0]?.src;
  // Two still screens fanned behind the phone, so there's depth to the app
  // even before anyone taps it.
  const fan = app.screens.filter((s) => s.src !== cover).slice(1, 3);

  return (
    <div className={styles.stage} style={{ "--app": app.color || "#2F6B4F" }}>
      <span className={styles.bigName} aria-hidden="true" key={app.slug}>
        {app.name}
      </span>

      <div className={styles.switch} role="tablist" aria-label="Apps">
        {apps.map((a, n) => (
          <button
            key={a.slug}
            role="tab"
            aria-selected={n === appIdx}
            className={`${styles.appBtn} ${n === appIdx ? styles.appOn : ""}`}
            onClick={() => pick(n)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {a.icon ? <img src={a.icon} alt="" /> : <span className={styles.iconFallback}>{a.name[0]}</span>}
            {a.name}
          </button>
        ))}
      </div>

      <div className={styles.info}>
        {app.tags?.length > 0 && (
          <ul className={styles.tags} aria-label="Scope">
            {app.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        <h2 className={styles.headline}>{app.headline || app.name}</h2>
        <p className={styles.summary}>{app.summary}</p>

        {app.prototype && (
          <div className={styles.modes} role="group" aria-label="View">
            <button className={`${styles.mode} ${live ? styles.modeOn : ""}`} aria-pressed={live} onClick={() => setMode("live")}>
              Try it
            </button>
            <button className={`${styles.mode} ${!live ? styles.modeOn : ""}`} aria-pressed={!live} onClick={() => setMode("screens")}>
              Key screens
            </button>
          </div>
        )}

        {live ? (
          <div className={styles.hintRow}>
            <p className={styles.hint}>Tap around in the phone. Products, cart and checkout open the way they do in the app.</p>
            <button className={styles.restart} onClick={() => setRuns((r) => ({ ...r, [app.slug]: (r[app.slug] || 0) + 1 }))}>
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Start over
            </button>
          </div>
        ) : (
          <ul className={styles.screens} aria-label={`${app.name} screens`}>
            {app.screens.map((s, n) => (
              <li key={s.src}>
                <button className={`${styles.screenBtn} ${n === screen ? styles.screenOn : ""}`} onClick={() => setScreen(n)} aria-pressed={n === screen}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt="" loading="lazy" />
                  <span>{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <GetTheApp app={app} />

        {app.caseStudy && (
          <a className={styles.link} href={app.caseStudy} target="_blank" rel="noopener">
            Read the {app.name} case study
          </a>
        )}
      </div>

      <div className={styles.phoneArea}>
        {fan.map((s, n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={s.src} src={s.src} alt="" className={`${styles.fan} ${n === 0 ? styles.fanLeft : styles.fanRight}`} />
        ))}
        <div className={styles.phoneCol}>
          <Phone label={live ? `${app.name} app, clickable prototype` : `${app.name}, ${shot.label} screen`}>
            {!live && shot && <ScreenImage key={shot.src} src={shot.src} alt={`${app.name} app, ${shot.label} screen`} scrollRef={scrollRef} />}
            {live && !visited.has(app.slug) && <BonsifyLoader label={`Opening ${app.name}`} />}
            {apps.map((a) =>
              a.prototype && visited.has(a.slug) ? (
                <LivePrototype key={a.slug} app={a} run={runs[a.slug] || 0} shown={live && a.slug === app.slug} />
              ) : null
            )}
          </Phone>
        </div>
        {!live && shot.tall && <p className={styles.scrollNote}>This screen scrolls inside the phone.</p>}
      </div>
    </div>
  );
});

export default OurApps;

const APPLE = (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.7ZM14.1 5.8c.6-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.3Z" />
  </svg>
);
const PLAY = (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#34a853" d="M3.6 2.3 13.4 12l-9.8 9.7c-.4-.2-.6-.6-.6-1.1V3.4c0-.5.2-.9.6-1.1Z" />
    <path fill="#fbbc04" d="m16.7 15.3-3.3-3.3 3.3-3.3 3.7 2.1c1 .6 1 1.9 0 2.4l-3.7 2.1Z" />
    <path fill="#ea4335" d="M13.4 12 3.6 21.7c.3.2.8.2 1.2 0l11.9-6.4-3.3-3.3Z" />
    <path fill="#4285f4" d="M13.4 12 16.7 8.7 4.8 2.3c-.4-.2-.9-.2-1.2 0L13.4 12Z" />
  </svg>
);

// "Try on iPhone / Android" buttons to the store listings, plus a QR code
// (to bonsify.io/get/<app>) on screens that can't install apps.
function GetTheApp({ app }) {
  const { ios, android } = app.stores || {};
  const soon = app.storesSoon;
  if (!ios && !android && !soon) return null;

  const button = (href, icon, label, store) =>
    href ? (
      <a className={styles.badge} href={href} target="_blank" rel="noopener">
        {icon}
        <span>
          {label}
          <small>{store}</small>
        </span>
      </a>
    ) : soon ? (
      <span className={`${styles.badge} ${styles.badgeSoon}`} aria-disabled="true">
        {icon}
        <span>
          {label}
          <small>Coming soon</small>
        </span>
      </span>
    ) : null;

  return (
    <div className={styles.get}>
      <div className={styles.badges}>
        {button(ios, APPLE, "Try on iPhone", "App Store")}
        {button(android, PLAY, "Try on Android", "Google Play")}
      </div>
      {app.qr && (
        <div className={styles.qr}>
          <div className={styles.qrCode} dangerouslySetInnerHTML={{ __html: app.qr }} />
          <p>Scan with your phone camera to get {app.name} on iPhone or Android.</p>
        </div>
      )}
    </div>
  );
}
