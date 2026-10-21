"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import BrandApp from "./BrandApp";
import Phone from "./Phone";
import styles from "./YourApp.module.css";

// "Your app" tab, laid out like the prospect's own launch page: their name in
// the headline, the live app in the middle, a product and a cart screen on
// either side, and a strip showing what was taken from their store.
const YourApp = forwardRef(function YourApp({ brand }, ref) {
  const appRef = useRef(null);
  const [run, setRun] = useState(0);

  useImperativeHandle(ref, () => ({
    show: (...a) => appRef.current?.show(...a),
    add: (...a) => appRef.current?.add(...a),
    scrollBy: (...a) => appRef.current?.scrollBy(...a),
    restart: () => setRun((r) => r + 1),
  }));

  const swatches = [brand.colors.primary, brand.colors.accent].filter(Boolean);
  const font = brand.fonts?.heading;
  const productCount = brand.productCount || brand.products.length;

  return (
    <div className={styles.launch}>
      <div className={styles.intro}>
        <p className={styles.made}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {brand.icon ? <img src={brand.icon} alt="" /> : null}
          Built from {brand.domain}
        </p>
        <h2 className={styles.headline}>{brand.name}, on every home screen.</h2>
        <p className={styles.lede}>
          This is your app, made from your live store. Tap the middle phone: products open, the cart works, and checkout
          shows the welcome offer for app installs.
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
      </div>

      <div className={styles.phones}>
        <div className={`${styles.side} ${styles.sideLeft}`} aria-hidden="true">
          <Phone statusBar>
            <StillScreen brand={brand} screen="product" index={1} />
          </Phone>
        </div>
        <div className={styles.center}>
          <Phone statusBar label={`${brand.name} app, interactive preview`}>
            <BrandApp key={run} ref={appRef} brand={brand} />
          </Phone>
        </div>
        <div className={`${styles.side} ${styles.sideRight}`} aria-hidden="true">
          <Phone statusBar>
            <StillScreen brand={brand} screen="cart" add={[2, 3]} />
          </Phone>
        </div>
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
              {!brand.fonts.headingGoogle && <small> (close substitute shown)</small>}
            </dd>
          </div>
        )}
        <div>
          <dt>Catalogue</dt>
          <dd>{productCount >= 5000 ? `${productCount.toLocaleString("en")}+ products` : `${productCount.toLocaleString("en")} products`}</dd>
        </div>
        <p className={styles.small}>A preview, not the final design. In the real build we design every screen with your team.</p>
      </dl>
    </div>
  );
});

export default YourApp;

// A non-interactive copy of the app parked on one screen, for the side phones.
function StillScreen({ brand, screen, index = 0, add = [] }) {
  const ref = useRef(null);
  useEffect(() => {
    add.forEach((i) => ref.current?.add(i));
    ref.current?.show(screen, index);
    // Set once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <BrandApp ref={ref} brand={brand} autoSplash={false} interactive={false} />;
}
