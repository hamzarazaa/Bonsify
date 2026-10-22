import Link from "next/link";
import QRCode from "qrcode";
import { notFound } from "next/navigation";
import JsonLd from "@/components/shared/JsonLd";
import CTABand from "@/components/shared/CTABand";
import LaptopShowcase from "@/components/work/LaptopShowcase";
import CasePrototype from "@/components/work/CasePrototype";
import { getShowcaseApps } from "@/lib/showcase";
import { CASE_STUDIES } from "@/lib/caseStudies";
import { breadcrumbSchema } from "@/lib/schema";
import styles from "./CaseStudy.module.css";

const APPLE = (
  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.7ZM14.1 5.8c.6-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.3Z" />
  </svg>
);
const PLAY = (
  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#34a853" d="M3.6 2.3 13.4 12l-9.8 9.7c-.4-.2-.6-.6-.6-1.1V3.4c0-.5.2-.9.6-1.1Z" />
    <path fill="#fbbc04" d="m16.7 15.3-3.3-3.3 3.3-3.3 3.7 2.1c1 .6 1 1.9 0 2.4l-3.7 2.1Z" />
    <path fill="#ea4335" d="M13.4 12 3.6 21.7c.3.2.8.2 1.2 0l11.9-6.4-3.3-3.3Z" />
    <path fill="#4285f4" d="M13.4 12 16.7 8.7 4.8 2.3c-.4-.2-.9-.2-1.2 0L13.4 12Z" />
  </svg>
);

export async function caseStudyMetadata(slug) {
  const app = getShowcaseApps().find((a) => a.slug === slug);
  return app
    ? { title: `${app.name} Case Study | Bonsify`, description: CASE_STUDIES[slug]?.lede || app.summary }
    : {};
}

export default async function CaseStudy({ slug }) {
  const apps = getShowcaseApps();
  const idx = apps.findIndex((a) => a.slug === slug);
  const copy = CASE_STUDIES[slug];
  if (idx < 0 || !copy) notFound();
  const app = apps[idx];
  const next = apps.length > 1 ? apps[(idx + 1) % apps.length] : null;
  const qr = app.getUrl
    ? await QRCode.toString(app.getUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0d0f11", light: "#ffffff" } })
    : null;
  const cover = app.cover || app.screens[0].src;
  const stats = copy.stats === "proof" ? app.proof : null;

  return (
    <main className={styles.page} style={{ "--app": app.color }}>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
          { name: app.name, path: `/work/${slug}` },
        ])}
      />

      <section className={styles.hero} data-dark-hero>
        <span className={styles.ghost} aria-hidden="true">
          {app.name}
        </span>
        <div className={`wrap ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              <Link href="/">Home</Link> / <Link href="/work">Work</Link> / <span>{app.name}</span>
            </nav>
            <h1>{app.name}</h1>
            <p className={styles.lede}>{copy.lede}</p>
            <ul className={styles.meta}>
              <li>
                <small>Category</small>
                {app.category}
              </li>
              <li>
                <small>Platforms</small>
                {app.platforms}
              </li>
              <li>
                <small>Scope</small>
                Build, launch, support
              </li>
            </ul>
            <div className={styles.badges}>
              {app.stores.ios && (
                <a href={app.stores.ios} target="_blank" rel="noopener">
                  {APPLE} App Store
                </a>
              )}
              {app.stores.android && (
                <a href={app.stores.android} target="_blank" rel="noopener">
                  {PLAY} Google Play
                </a>
              )}
              {app.storesSoon && <span className={styles.soon}>Stores coming soon</span>}
            </div>
          </div>
          <div className={styles.heroShot} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" />
          </div>
        </div>
      </section>

      <section className={styles.block}>
        <div className={`wrap ${styles.two}`}>
          <div>
            <p className={styles.kicker}>The problem</p>
            <h2>{copy.problem.title}</h2>
            {copy.problem.body.map((p) => (
              <p key={p} className={styles.body}>
                {p}
              </p>
            ))}
          </div>
          <div>
            <p className={styles.kicker}>What we built</p>
            <h2>{copy.solution.title}</h2>
            <dl className={styles.features}>
              {copy.solution.items.map(([h, t]) => (
                <div key={h}>
                  <dt>{h}</dt>
                  <dd>{t}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {app.prototype && (
        <section className={styles.try}>
          <div className={`wrap ${styles.tryGrid}`}>
            <div className={styles.tryCopy}>
              <p className={styles.kicker}>Try it</p>
              <h2>Tap through the real design.</h2>
              <p className={styles.body}>This is the {app.name} prototype, running in your browser. Open a product, add to cart, move around the app.</p>
              <div className={styles.badges}>
                {app.stores.ios && (
                  <a href={app.stores.ios} target="_blank" rel="noopener">
                    {APPLE} Try on iPhone
                  </a>
                )}
                {app.stores.android && (
                  <a href={app.stores.android} target="_blank" rel="noopener">
                    {PLAY} Try on Android
                  </a>
                )}
              </div>
              {qr && (
                <div className={styles.qr}>
                  <div className={styles.qrCode} dangerouslySetInnerHTML={{ __html: qr }} />
                  <p>Scan with your phone camera to get {app.name} on iPhone or Android.</p>
                </div>
              )}
            </div>
            <CasePrototype app={app} />
          </div>
        </section>
      )}

      <section className={styles.block}>
        <div className="wrap">
          <p className={styles.kicker}>Impact</p>
          <h2>What changed.</h2>
          {stats && (
            <dl className={styles.stats}>
              {stats.map((s) => (
                <div key={s.label}>
                  <dt>{s.big}</dt>
                  <dd>{s.label}</dd>
                </div>
              ))}
              <small>From the public store listings, Oct 2026.</small>
            </dl>
          )}
          <ul className={styles.outcomes}>
            {copy.outcomes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.screens}>
        <div className="wrap">
          <p className={styles.kicker}>Inside the app</p>
          <h2>Key screens.</h2>
        </div>
        <ul className={styles.strip}>
          {app.screens.map((s) => (
            <li key={s.src}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={`${app.name} ${s.label} screen`} loading="lazy" />
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {copy.portal && (
        <section className={styles.block}>
          <div className="wrap">
            <p className={styles.kicker}>Our support</p>
            <h2>A portal the team runs themselves.</h2>
            <p className={styles.body}>Every app comes with a web dashboard for banners, promotions and in-app content, so changes go live without a release or a support ticket.</p>
            <div style={{ marginTop: 30 }}>
              <LaptopShowcase shots={[copy.portal]} />
            </div>
          </div>
        </section>
      )}

      {next && (
        <section className={styles.nextBlock}>
          <div className="wrap">
            <Link href={`/work/${next.slug}`} className={styles.next} style={{ "--app": next.color }}>
              <span>Next case study</span>
              <strong>{next.name}</strong>
              <em>{next.headline}</em>
            </Link>
          </div>
        </section>
      )}

      <CTABand
        heading="Want an app like this?"
        subtext="Tell us about your Shopify store. We will show you what going native would change."
        buttonText="Get your app now"
        buttonHref="/contact"
      />
    </main>
  );
}
