import Link from "next/link";
import styles from "./ShippedApps.module.css";

const APPLE = (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.7ZM14.1 5.8c.6-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.3Z" />
  </svg>
);
const PLAY = (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#34a853" d="M3.6 2.3 13.4 12l-9.8 9.7c-.4-.2-.6-.6-.6-1.1V3.4c0-.5.2-.9.6-1.1Z" />
    <path fill="#fbbc04" d="m16.7 15.3-3.3-3.3 3.3-3.3 3.7 2.1c1 .6 1 1.9 0 2.4l-3.7 2.1Z" />
    <path fill="#ea4335" d="M13.4 12 3.6 21.7c.3.2.8.2 1.2 0l11.9-6.4-3.3-3.3Z" />
    <path fill="#4285f4" d="M13.4 12 16.7 8.7 4.8 2.3c-.4-.2-.9-.2-1.2 0L13.4 12Z" />
  </svg>
);

// One full-width colour panel per shipped app: the same stage treatment as the
// "Our apps" tab on the proposal pages, so the site and the pitch read alike.
export default function ShippedApps({ apps }) {
  if (!apps?.length) return null;
  return (
    <section className={styles.section} id="work">
      <div className="wrap">
        <div className={styles.head}>
          <h2>Apps we have shipped.</h2>
          <Link href="/work" className={styles.more}>
            All case studies
          </Link>
        </div>
        <div className={styles.stack}>
          {apps.map((a) => {
            const shots = a.screens.filter((s) => s.src !== a.cover).slice(0, 2);
            return (
              <article key={a.slug} className={styles.panel} style={{ "--app": a.color }}>
                <span className={styles.ghostName} aria-hidden="true">
                  {a.name}
                </span>
                <div className={styles.copy}>
                  <ul className={styles.tags}>
                    {a.tags?.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <h3>{a.headline}</h3>
                  <p>{a.summary}</p>
                  <div className={styles.actions}>
                    {a.stores?.ios && (
                      <a className={styles.badge} href={a.stores.ios} target="_blank" rel="noopener">
                        {APPLE} App Store
                      </a>
                    )}
                    {a.stores?.android && (
                      <a className={styles.badge} href={a.stores.android} target="_blank" rel="noopener">
                        {PLAY} Google Play
                      </a>
                    )}
                    {a.storesSoon && <span className={`${styles.badge} ${styles.soon}`}>Stores coming soon</span>}
                    <Link className={styles.case} href={a.caseStudy || "/work"}>
                      Read the case study
                    </Link>
                  </div>
                </div>
                <div className={styles.visual} aria-hidden="true">
                  {shots[0] && <img src={shots[0].src} alt="" className={`${styles.shot} ${styles.left}`} loading="lazy" />}
                  <img src={a.cover || a.screens[0].src} alt={`${a.name} app home screen`} className={`${styles.shot} ${styles.main}`} loading="lazy" />
                  {shots[1] && <img src={shots[1].src} alt="" className={`${styles.shot} ${styles.right}`} loading="lazy" />}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
