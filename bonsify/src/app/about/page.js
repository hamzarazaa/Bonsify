import Link from "next/link";
import CTABand from "@/components/shared/CTABand";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import FAQBlock from "@/components/shared/FAQBlock";
import JsonLd from "@/components/shared/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/metadata";
import { isClientVisible } from "@/lib/clients";
import styles from "./About.module.css";

const ROSTER = [
  { slug: "bachaparty", label: "BachaParty (fashion, iOS + Android, live)" },
  { slug: "highfy", label: "Highfy (beauty, iOS + Android, live)" },
];

export const metadata = pageMetadata({
  title: "About Bonsify - The Mobile Team Your Shopify Store Never Hired",
  description:
    "Bonsify is a done-for-you Shopify mobile app service by FetchSky. We turn stores into native iOS and Android apps and PWAs, then keep them running.",
  path: "/about",
});

const beliefs = [
  { h: "Mobile is the main event", p: "Not a channel. For most stores it is the majority of customers.", i: "phone" },
  { h: "Installs are part of the build", p: "An app nobody installs is decoration, so install strategy ships with the app.", i: "download" },
  { h: "Numbers over adjectives", p: "If we cannot measure it, we do not claim it.", i: "chart" },
  { h: "Sometimes the answer is no", p: 'We will tell you "you do not need an app yet." Out loud, in writing.', i: "no" },
];

const FLOW = [
  ["Audit", "We read your store like a stranger would."],
  ["Build", "Native iOS, Android or a PWA, on your theme."],
  ["Launch", "Store listings, push set up, installs planned."],
  ["Support", "OS updates, Shopify changes, fixes. Forever."],
];

function Icon({ name }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" {...p}>
      {name === "phone" && (<><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></>)}
      {name === "download" && (<><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5" /><path d="M5 19.5h14" /></>)}
      {name === "chart" && (<><path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /></>)}
      {name === "no" && (<><circle cx="12" cy="12" r="8.5" /><path d="M6 6l12 12" /></>)}
    </svg>
  );
}

/* Conversion index built only from the two cited figures: mobile web is about half of
   desktop, and apps are about 130% above mobile web. Desktop is the 100 baseline. */
function ConversionChart() {
  const bars = [
    { l: "Desktop", v: 100, c: "rgba(244,239,228,0.35)" },
    { l: "Mobile web", v: 50, c: "rgba(244,239,228,0.35)" },
    { l: "Native app", v: 115, c: "var(--clay)" },
  ];
  return (
    <figure className={styles.chart}>
      <svg viewBox="0 0 360 190" role="img" aria-label="Conversion index: desktop 100, mobile web about 50, native app about 115">
        <line x1="20" y1="160" x2="340" y2="160" stroke="rgba(244,239,228,0.25)" />
        {bars.map((b, i) => {
          const h = (b.v / 120) * 130;
          const x = 36 + i * 108;
          return (
            <g key={b.l}>
              <rect x={x} y={160 - h} width="72" height={h} rx="8" fill={b.c} className={styles.bar} style={{ animationDelay: `${i * 0.12}s` }} />
              <text x={x + 36} y={160 - h - 8} textAnchor="middle" className={styles.barNum}>{b.v}</text>
              <text x={x + 36} y="180" textAnchor="middle" className={styles.barLbl}>{b.l}</text>
            </g>
          );
        })}
      </svg>
      <figcaption>Conversion, desktop = 100. Derived from the two sources cited below, so read it as a sketch, not a measurement.</figcaption>
    </figure>
  );
}

function Offices() {
  return (
    <svg className={styles.offices} viewBox="0 0 420 150" fill="none" aria-hidden="true">
      <path d="M70 92 Q 210 -22 350 92" stroke="rgba(244,239,228,0.4)" strokeWidth="1.6" strokeDasharray="4 6" />
      <circle cx="70" cy="92" r="7" fill="var(--jade)" />
      <circle cx="70" cy="92" r="14" stroke="var(--jade)" strokeOpacity="0.4" />
      <circle cx="350" cy="92" r="7" fill="var(--clay)" />
      <circle cx="350" cy="92" r="14" stroke="var(--clay)" strokeOpacity="0.4" />
      <text x="70" y="124" textAnchor="middle" className={styles.mapT}>Santa Ana, CA</text>
      <text x="350" y="124" textAnchor="middle" className={styles.mapT}>Karachi, PK</text>
      <g className={styles.plane} transform="translate(210 14)"><path d="M-8 4 L8 0 L-8 -4 L-5 0 Z" fill="var(--bone)" /></g>
    </svg>
  );
}

const faqItems = [
  {
    q: "Who is behind Bonsify?",
    a: "Bonsify is built and operated by FetchSky, a software product company founded a decade ago, with teams in the United States and Pakistan.",
  },
  {
    q: "Is Bonsify an app builder like Tapcart?",
    a: "No. Builders are self-serve software you configure yourself. Bonsify is done-for-you: we build, launch and maintain the app for you.",
  },
  {
    q: "Where is Bonsify located?",
    a: "Santa Ana, California (US) and Karachi (Pakistan). Client work is remote-first regardless of location.",
  },
  {
    q: "Do you only work with Shopify stores?",
    a: "Yes. Specializing in one platform is why the builds are fast and the integrations are deep.",
  },
];

export default function AboutPage() {
  const roster = ROSTER.filter((r) => isClientVisible(r.slug))
    .map((r) => r.label)
    .join(" · ");

  return (
    <main className={styles.page}>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />

      <section className={styles.hero} data-dark-hero>
        <div className={`wrap ${styles.heroGrid}`}>
          <div>
            <p className={styles.kicker}>About Bonsify</p>
            <h1 className={styles.title}>
              The mobile team
              <br />
              your store <span>never hired.</span>
            </h1>
            <p className={styles.lede}>
              Bonsify turns Shopify stores into native iOS and Android apps and PWAs, done for you. Built by FetchSky, a product company shipping software for a decade.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/contact" className="btn btn-clay">Get your app now</Link>
              <Link href="/work" className={styles.ghost}>See the work</Link>
            </div>
          </div>
          <div className={styles.heroArt} aria-hidden="true">
            <div className={styles.phone}>
              <i className={styles.notch} />
              <span className={styles.tile} style={{ "--d": "0s" }} />
              <span className={`${styles.tile} ${styles.wide}`} style={{ "--d": "0.15s" }} />
              <span className={styles.tile} style={{ "--d": "0.3s" }} />
              <span className={styles.tile} style={{ "--d": "0.45s" }} />
              <span className={styles.home} />
            </div>
            <span className={`${styles.chip} ${styles.c1}`}>Push sent</span>
            <span className={`${styles.chip} ${styles.c2}`}>Order shipped</span>
            <span className={`${styles.chip} ${styles.c3}`}>10% off, app only</span>
          </div>
        </div>
      </section>

      <section className={styles.sec}>
        <div className={`wrap ${styles.why}`}>
          <div>
            <RevealOnScroll as="span" className={styles.eyebrow}>Why we exist</RevealOnScroll>
            <RevealOnScroll as="h2" className={styles.h2}>Phones bring the visitors. Desktops get the sales.</RevealOnScroll>
            <RevealOnScroll as="p" className={styles.big}>
              Most Shopify merchants know two things at once: most of their traffic is on phones, and most of their revenue is not. Roughly 75% of ecommerce sessions are mobile (Statista, 2025), yet the mobile web converts at about half the desktop rate (Dynamic Yield, 2025).
            </RevealOnScroll>
            <RevealOnScroll as="p" className={styles.p}>
              The fix has existed for years. Apps convert around 130% higher than the mobile web (Venn Apps, 2025). What has not existed is a sane way for a mid-sized store to get one. The DIY builders hand you a template and a second job. Custom development starts at six figures. Bonsify was built for the merchants in between: agency-grade native apps, delivered as a service, without the enterprise invoice or the internal workload.
            </RevealOnScroll>
          </div>
          <RevealOnScroll as="div"><ConversionChart /></RevealOnScroll>
        </div>
      </section>

      <section className={`${styles.sec} ${styles.light}`}>
        <div className={`wrap ${styles.where}`}>
          <div>
            <RevealOnScroll as="span" className={styles.eyebrow}>Where we come from</RevealOnScroll>
            <RevealOnScroll as="h2" className={styles.h2}>Ten years of running software, not just launching it.</RevealOnScroll>
            <RevealOnScroll as="p" className={styles.p}>
              Bonsify is a product of FetchSky, a software company that has spent ten years building and operating products used by real businesses. That matters for one practical reason: we run apps after launch, not just before it. OS updates, Shopify API changes, push infrastructure, app store policies. A decade of operating software is the difference between a launch partner and a long-term one.
            </RevealOnScroll>
          </div>
          <RevealOnScroll as="div" className={styles.mapCard}>
            <Offices />
            <p>One team across two time zones. Client work is remote-first, wherever you are.</p>
          </RevealOnScroll>
        </div>
      </section>

      <section className={styles.sec}>
        <div className="wrap">
          <RevealOnScroll as="span" className={styles.eyebrow}>How we work</RevealOnScroll>
          <RevealOnScroll as="h2" className={styles.h2}>One team, start to finish.</RevealOnScroll>
          <ol className={styles.flow}>
            {FLOW.map(([t, d], i) => (
              <RevealOnScroll as="li" key={t}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <b>{t}</b>
                <p>{d}</p>
              </RevealOnScroll>
            ))}
          </ol>
          <RevealOnScroll as="p" className={styles.p} style={{ marginTop: 28 }}>
            No handoffs, no half-finished apps, one accountable party from the first review of your store to the update that ships two years later. The full engagement model is on the{" "}
            <Link href="/how-we-work" className={styles.link}>How We Work</Link>{" "}
            page.
          </RevealOnScroll>
        </div>
      </section>

      <section className={`${styles.sec} ${styles.light}`}>
        <div className="wrap">
          <RevealOnScroll as="span" className={styles.eyebrow}>What we believe</RevealOnScroll>
          <RevealOnScroll as="h2" className={styles.h2}>Four opinions, no hedging.</RevealOnScroll>
          <ul className={styles.beliefs}>
            {beliefs.map((b) => (
              <RevealOnScroll as="li" key={b.h}>
                <span className={styles.ico}><Icon name={b.i} /></span>
                <b>{b.h}</b>
                <p>{b.p}</p>
              </RevealOnScroll>
            ))}
          </ul>
        </div>
      </section>

      {roster && (
        <section className={styles.rosterSec}>
          <div className="wrap">
            <p className={styles.roster}>{roster}</p>
          </div>
        </section>
      )}

      <CTABand
        heading="See what going native would change"
        subtext="Tell us about your store. We will give you a straight answer."
        buttonText="Get your app now"
        buttonHref="/contact"
      />

      <section className={styles.sec}>
        <div className="wrap-narrow">
          <RevealOnScroll as="h2" className="sec-title">
            Frequently asked
          </RevealOnScroll>
          <div style={{ marginTop: 20 }}>
            <FAQBlock items={faqItems} />
          </div>
        </div>
      </section>
    </main>
  );
}
