import PageHero from "@/components/shared/PageHero";
import CTABand from "@/components/shared/CTABand";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import FAQBlock from "@/components/shared/FAQBlock";
import JsonLd from "@/components/shared/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/metadata";
import styles from "./page.module.css";

// One simple line icon per phase, matching the thin-stroke style already
// used elsewhere on the site (e.g. DockifySpotlight's feature checkmarks) -
// a quick visual anchor for each phase so this list doesn't read as one
// long, undifferentiated block of text.
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function AuditIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BuildIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function LaunchIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
      <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
      <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
      <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
    </svg>
  );
}

export const metadata = pageMetadata({
  title: "How We Work: Pricing & Engagement Model | Bonsify",
  description:
    "Bonsify prices by scope, not by a tier chart. Every store gets a fixed quote after the audit, before any build starts.",
  path: "/how-we-work",
});

const phases = [
  {
    num: "01",
    title: "Audit (fixed, small, sometimes the whole engagement)",
    desc: "We review your store, your mobile analytics and your customer flow. Output: a written read on where mobile is leaking, whether an app is justified, and if so which kind (native, PWA, or both, in what order). Includes the fixed quote for the build. Honest note: sometimes the audit says \"not yet.\" If your mobile web fundamentals are broken, an app amplifies the problem.",
    Icon: AuditIcon,
  },
  {
    num: "02",
    title: "Build",
    desc: "Native iOS and Android apps, or a PWA, synced to your live Shopify catalog, checkout, inventory and pricing. Design matched to your brand, not a template. You review working builds, not mockups. Typical duration: PWA in days to two weeks; native builds in several weeks depending on catalog complexity.",
    Icon: BuildIcon,
  },
  {
    num: "03",
    title: "Launch",
    desc: "App Store and Google Play submission, listing copy, screenshots, and the review process handled end to end. First Apple submissions can take up to two weeks in review and rejections are routine for first-timers. Install strategy ships with launch: a reward-on-install prompt (Dockify) so the app reaches phones instead of waiting on them.",
    Icon: LaunchIcon,
  },
  {
    num: "04",
    title: "Support (optional retainer)",
    desc: "OS updates, Shopify API changes, bug fixes, new features, push strategy. Monthly retainer, cancel anytime. Apps that stop being maintained decay within a couple of OS cycles; this phase is why our clients' apps are still live years later.",
    Icon: SupportIcon,
  },
];

const includes = [
  "Fixed quote before build. No percentage-of-sales fees, ever.",
  "You own the app, the store listings and the customer data.",
  "Install layer included (prompt, reward, attribution), because an app with no installs earns nothing.",
  "Direct line to the team building it. No account-manager relay.",
];

const faqItems = [
  {
    q: "How much does a Bonsify engagement cost?",
    a: "Each quote is scoped after the audit and then fixed. As orientation: more than a DIY builder subscription ($99 to $250 a month), a fraction of traditional custom development ($100,000 and up). The audit itself is a small fixed fee.",
  },
  {
    q: "Do you charge a percentage of my sales?",
    a: "No. No success fees, no GMV percentage, no tier jumps tied to order volume.",
  },
  {
    q: "How long until my app is live?",
    a: "PWA: days to two weeks. Native iOS and Android: several weeks including app store review. First-time App Store review alone can take up to two weeks.",
  },
  {
    q: "What if I already have an app from a builder?",
    a: "That is a common starting point. The audit covers rescue and migration cases: keeping what works, rebuilding what does not, and moving off per-order fees.",
  },
  {
    q: "Can I cancel the support retainer?",
    a: "Yes, anytime. The app keeps working; it just stops receiving updates from us.",
  },
];

export default function HowWeWorkPage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "How We Work", path: "/how-we-work" },
        ])}
      />
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "How We Work" }]}
        title="One engagement, four phases, no surprise fees"
        lede="Bonsify prices by scope, not by a tier chart. Every store gets a fixed quote after the audit, before any build starts. Here is exactly how an engagement runs and what each phase covers."
      />

      <section className="section section-bone">
        <div className="wrap-narrow">
          <RevealOnScroll as="span" className="eyebrow">
            Why no price table
          </RevealOnScroll>
          <div className="prose" style={{ marginTop: 20 }}>
            <RevealOnScroll as="p" className="big">
              Two stores with the same revenue can need very different
              builds. A 40-product beauty store wanting a PWA with push is a
              different project from a 6,000-SKU fashion catalog wanting
              native iOS and Android with multi-variant search. A single
              price tier would overcharge one and underserve the other.
            </RevealOnScroll>
            <RevealOnScroll as="p">
              What we can promise about pricing: the quote after the audit is
              fixed. No success fees, no percentage of your sales, no tier
              jump when your order volume grows. Several app builders charge
              exactly those, and merchants describe the price jumps as the
              number one surprise (Head West Guide, 2025; Shopify App Store
              reviews). Our position is simple: your growth is not our
              billing event.
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className="section section-ink">
        <div className="wrap">
          <RevealOnScroll as="h2" className="sec-title">
            The four phases
          </RevealOnScroll>
          <div className="svc-list">
            {phases.map((phase) => (
              <RevealOnScroll
                as="div"
                className={`svc-item ${styles.phaseItem}`}
                key={phase.num}
              >
                <div className="si-num">{phase.num}</div>
                <div>
                  <div className={styles.phaseHead}>
                    <span className={styles.phaseIcon}>
                      <phase.Icon />
                    </span>
                  </div>
                  <h3>{phase.title}</h3>
                  <p>{phase.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-bone">
        <div className="wrap-narrow">
          <RevealOnScroll as="span" className="eyebrow">
            What every engagement includes
          </RevealOnScroll>
          <ul className="flist" style={{ marginTop: 20 }}>
            {includes.map((item) => (
              <RevealOnScroll as="li" key={item}>
                <span>{item}</span>
              </RevealOnScroll>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section-ink">
        <div className="wrap-narrow">
          <RevealOnScroll as="span" className="eyebrow">
            What we do not do
          </RevealOnScroll>
          <div className="prose" style={{ marginTop: 20 }}>
            <RevealOnScroll as="p">
              Web design, branding, general marketing, non-Shopify platforms.
              Narrow on purpose.
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <CTABand
        heading="Start with the audit"
        subtext="A small fixed fee, a written answer, and a quote you can hold us to."
        buttonText="Get your app now"
        buttonHref="/contact"
      />

      <section className="section section-bone">
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
