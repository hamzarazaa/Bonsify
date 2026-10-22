"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import BrandApp from "./BrandApp";
import Phone from "./Phone";
import AppQr from "./AppQr";
import FullApp from "./FullApp";
import styles from "./YourApp.module.css";

// "Your app" tab, laid out like the home screen of the lab site: copy on the
// left, one large live phone on the right with a full screen button, and a QR
// code that opens the same app on the prospect's own phone.
const YourApp = forwardRef(function YourApp({ brand }, ref) {
  const appRef = useRef(null);
  const [run, setRun] = useState(0);
  const [full, setFull] = useState(false);

  useImperativeHandle(ref, () => ({
    show: (...a) => appRef.current?.show(...a),
    add: (...a) => appRef.current?.add(...a),
    scrollBy: (...a) => appRef.current?.scrollBy(...a),
    restart: () => setRun((r) => r + 1),
  }));

  const swatches = [brand.colors.primary, brand.colors.accent].filter(Boolean);
  const font = brand.fonts?.heading;
  const productCount = brand.productCount || brand.products.length;
  const qrPath = `/for/${brand.slug}/app`;

  return (
    <div className={styles.launch}>
      <div className={styles.copy}>
        <p className={styles.made}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {brand.icon ? <img src={brand.icon} alt="" /> : null}
          Built from {brand.domain}
        </p>
        <h2 className={styles.headline}>{brand.name}, on every home screen.</h2>
        <p className={styles.lede}>
          This is your app, made from your live store. Tap the phone: products open, the cart works, and checkout shows
          the welcome offer for app installs.
        </p>
        <div className={styles.actions}>
          <button className={styles.primary} onClick={() => appRef.current?.show("product", 0)}>
            Open a product
          </button>
          <button
            className={styles.secondary}
            onClick={() => {
              appRef.current?.add(0);
              appRef.current?.show("cart");
            }}
          >
            See checkout
          </button>
          <button className={styles.plain} onClick={() => setRun((r) => r + 1)}>
            Restart the app
          </button>
        </div>

        <div className={styles.qrRow}>
          <AppQr path={qrPath} title="Hold it in your hand" hint={`Scan with your phone camera to open the ${brand.name} app full screen.`} />
        </div>

        <dl className={styles.spec}>
          {brand.logo && (
            <div>
              <dt>Logo</dt>
              <dd>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={brand.logo} alt={`${brand.name} logo`} className={styles.logo} />
              </dd>
            </div>
          )}
          <div>
            <dt>Colours</dt>
            <dd className={styles.swatches}>
              {swatches.map((hex) => (
                <span key={hex}>
                  <i style={{ background: hex }} />
                  {hex.toUpperCase()}
                </span>
              ))}
            </dd>
          </div>
          {font && (
            <div>
              <dt>Typeface</dt>
              <dd style={{ fontFamily: `"${font}", var(--sans)` }}>
                {font}
                {!brand.fonts.headingGoogle && <small> (close substitute)</small>}
              </dd>
            </div>
          )}
          <div>
            <dt>Catalogue</dt>
            <dd>{productCount >= 5000 ? `${productCount.toLocaleString("en")}+ products` : `${productCount.toLocaleString("en")} products`}</dd>
          </div>
        </dl>
        <p className={styles.small}>A preview, not the final design. In the real build we design every screen with your team.</p>
      </div>

      <div className={styles.stage}>
        <div className={styles.phone}>
          <Phone statusBar statusTone={brand.slug === "highfy" ? "light" : "dark"} label={`${brand.name} app, interactive preview`}>
            <BrandApp key={run} ref={appRef} brand={brand} />
          </Phone>
          <button className={styles.fsIcon} onClick={() => setFull(true)} aria-label="Open the app full screen" title="Full screen">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            </svg>
          </button>
        </div>
      </div>

      {full && <FullApp brand={brand} qrPath={qrPath} onClose={() => setFull(false)} />}
    </div>
  );
});

export default YourApp;
