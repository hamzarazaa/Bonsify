"use client";

import Link from "next/link";
import BrandApp from "@/components/proposals/BrandApp";
import Phone from "@/components/proposals/Phone";
import AppQr from "@/components/proposals/AppQr";
import styles from "./demo.module.css";

export default function DemoClient({ brand, video }) {
  return (
    <main className={styles.page}>
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
            prices. Tap through products, the bag and checkout.
          </p>
          <AppQr path={`/try/${brand.slug}`} title="Open it on your phone" hint="Scan with your camera. The app opens full screen." />
          <p className={styles.small}>A preview, not the final design. In the real build we design every screen with your team, and checkout stays on your Shopify.</p>
        </div>
        <div className={styles.phone}>
          <Phone statusBar label={`${brand.name} app, interactive preview`}>
            <BrandApp brand={brand} liveReviews />
          </Phone>
        </div>
      </section>
    </main>
  );
}
