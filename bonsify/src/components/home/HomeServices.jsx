import Link from "next/link";
import styles from "./HomeServices.module.css";

const GROUPS = [
  {
    title: "Mobile apps",
    blurb: "Native iOS and Android apps and PWAs, with push notifications that bring shoppers back.",
    links: [
      ["Mobile app development", "/services/mobile-app-development"],
      ["PWA development", "/services/pwa-development"],
      ["Push notification setup", "/services/push-notification-setup"],
    ],
  },
  {
    title: "Build and migrate",
    blurb: "Custom Shopify apps, headless builds, and moves from WooCommerce, Magento or an app builder.",
    links: [
      ["Custom Shopify apps", "/services/custom-shopify-app-development"],
      ["Migration to Shopify", "/services/migration-to-shopify"],
      ["App rescue and migration", "/services/app-rescue-migration"],
    ],
  },
  {
    title: "Launch and grow",
    blurb: "Store submissions, ASO, conversion work and install-to-purchase attribution.",
    links: [
      ["App Store submission and ASO", "/services/app-store-submission-aso"],
      ["Store optimization and CRO", "/services/store-optimization-cro"],
      ["Install attribution", "/services/install-to-purchase-attribution"],
    ],
  },
  {
    title: "Store and scale",
    blurb: "Store setup, themes, B2B and wholesale, international selling, and ongoing support.",
    links: [
      ["Store setup and design", "/services/shopify-store-setup-design"],
      ["B2B and wholesale", "/services/b2b-wholesale-setup"],
      ["App maintenance and support", "/services/app-maintenance-support"],
    ],
  },
];

export default function HomeServices() {
  return (
    <section className={styles.section}>
      <div className="wrap">
        <div className={styles.head}>
          <h2>Everything a Shopify store needs.</h2>
          <Link href="/services" className={styles.more}>
            All services
          </Link>
        </div>
        <div className={styles.grid}>
          {GROUPS.map((g, n) => (
            <div key={g.title} className={styles.card}>
              <span className={styles.num}>0{n + 1}</span>
              <h3>{g.title}</h3>
              <p>{g.blurb}</p>
              <ul>
                {g.links.map(([t, href]) => (
                  <li key={href}>
                    <Link href={href}>{t}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
