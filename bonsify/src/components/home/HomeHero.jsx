import Link from "next/link";
import styles from "./HomeHero.module.css";

// Headline-only hero: the proof is the strip underneath, the phones come next.
export default function HomeHero({ proof = [] }) {
  return (
    <section className={styles.hero}>
      <div className={`wrap ${styles.inner}`}>
        <p className={styles.eyebrow}>Shopify mobile apps, done for you</p>
        <h1 className={styles.title}>
          <span>Your store already converts.</span>
          <span>
            Your <em>phone screen</em>{" "}
            doesn&apos;t.
          </span>
        </h1>
        <div className={styles.row}>
          <p className={styles.sub}>
            Bonsify turns Shopify stores into native iOS and Android apps. We build them, launch them in the stores and keep them running, so
            shoppers land on your home screen instead of a browser tab.
          </p>
          <div className={styles.cta}>
            <Link className="btn btn-clay" href="/contact">
              Get your app now
            </Link>
            <Link className={styles.ghost} href="/work">
              See the apps
            </Link>
          </div>
        </div>
        {proof.length > 0 && (
          <dl className={styles.proof} aria-label="Results from our apps">
            {proof.map((p) => (
              <div key={p.label}>
                <dt>{p.big}</dt>
                <dd>{p.label}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
