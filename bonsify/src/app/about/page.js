import Link from "next/link";
import PageHero from "@/components/shared/PageHero";
import CTABand from "@/components/shared/CTABand";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import FAQBlock from "@/components/shared/FAQBlock";
import JsonLd from "@/components/shared/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/metadata";
import { isClientVisible } from "@/lib/clients";

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
  "Mobile is not a channel. For most stores it is the majority of customers.",
  "An app nobody installs is decoration. Install strategy is part of the build.",
  "Numbers over adjectives. If we cannot measure it, we do not claim it.",
  'The honest answer is sometimes "you do not need an app yet." We say it.',
];

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
    <main>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
        title="The mobile team your Shopify store never hired"
        lede="Bonsify turns Shopify stores into native iOS and Android apps and PWAs, done for you. Built by FetchSky, a product company shipping software for a decade."
      />

      <section className="section section-bone">
        <div className="wrap-narrow">
          <RevealOnScroll as="span" className="eyebrow">
            Why we exist
          </RevealOnScroll>
          <div className="prose" style={{ marginTop: 20 }}>
            <RevealOnScroll as="p" className="big">
              Most Shopify merchants know two things at once: most of their
              traffic is on phones, and most of their revenue is not.
              Roughly 75% of ecommerce sessions are mobile (Statista, 2025),
              yet the mobile web converts at about half the desktop rate
              (Dynamic Yield, 2025).
            </RevealOnScroll>
            <RevealOnScroll as="p">
              The fix has existed for years. Apps convert around 130% higher
              than the mobile web (Venn Apps, 2025). What has not existed is
              a sane way for a mid-sized store to get one. The DIY builders
              hand you a template and a second job. Custom development
              starts at six figures. Bonsify was built for the merchants in
              between: agency-grade native apps, delivered as a service,
              without the enterprise invoice or the internal workload.
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className="section section-ink">
        <div className="wrap-narrow">
          <RevealOnScroll as="span" className="eyebrow">
            Where we come from
          </RevealOnScroll>
          <div className="prose" style={{ marginTop: 20 }}>
            <RevealOnScroll as="p">
              Bonsify is a product of FetchSky, a software company that has
              spent ten years building and operating products used by real
              businesses. That matters for one practical reason: we run apps
              after launch, not just before it. OS updates, Shopify API
              changes, push infrastructure, app store policies. A decade of
              operating software is the difference between a launch partner
              and a long-term one.
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className="section section-bone">
        <div className="wrap-narrow">
          <RevealOnScroll as="span" className="eyebrow">
            How we work
          </RevealOnScroll>
          <div className="prose" style={{ marginTop: 20 }}>
            <RevealOnScroll as="p">
              Audit, build, launch, support. One team, one accountable
              party, from the first review of your store to the update that
              ships two years later. No handoffs, no half-finished apps. The
              full engagement model is on the{" "}
              <Link href="/how-we-work" style={{ color: "var(--jade)" }}>
                How We Work
              </Link>{" "}
              page.
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className="section section-ink">
        <div className="wrap-narrow">
          <RevealOnScroll as="span" className="eyebrow">
            What we believe
          </RevealOnScroll>
          <ul className="flist" style={{ marginTop: 20 }}>
            {beliefs.map((b) => (
              <RevealOnScroll as="li" key={b}>
                <span>{b}</span>
              </RevealOnScroll>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section-soft">
        <div className="wrap">
          <RevealOnScroll
            as="p"
            style={{
              textAlign: "center",
              fontFamily: "var(--sans)",
              fontSize: 13,
              color: "var(--sand)",
              opacity: 0.75,
              letterSpacing: "0.03em",
            }}
          >
            {roster}
          </RevealOnScroll>
        </div>
      </section>

      <CTABand
        heading="See what going native would change"
        subtext="Tell us about your store. We will give you a straight answer."
        buttonText="Book a free audit"
        buttonHref="/contact"
      />

      <section className="section section-ink">
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
