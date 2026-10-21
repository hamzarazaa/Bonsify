import Link from "next/link";
import Image from "next/image";
import PageHero from "@/components/shared/PageHero";
import CTABand from "@/components/shared/CTABand";
import PhoneMockup from "@/components/shared/PhoneMockup";
import RewardCard from "@/components/shared/RewardCard";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import JsonLd from "@/components/shared/JsonLd";
import LaptopShowcase from "@/components/work/LaptopShowcase";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/metadata";
import { getNextClient, getPrevClient } from "@/lib/clients";

export const metadata = pageMetadata({
  title: "Dockify - Home Screen Install & Reward App | Bonsify",
  description:
    "Dockify turns a browser visit into a home-screen install and rewards the customer for it - with full install-to-purchase attribution. Live on the Shopify App Store.",
  path: "/work/dockify",
});

const CheckIcon = () => (
  <svg className="fi" viewBox="0 0 20 20" fill="none">
    <path
      d="M4 10 L8 14 L16 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const laptopShots = [
  {
    src: "/images/dockify/dashboard-overview.webp",
    label: "Overview",
    caption: "Installs, redemptions, and conversion rate at a glance",
    width: 1342,
    height: 882,
  },
  {
    src: "/images/dockify/dashboard-installs.webp",
    label: "Installs",
    caption: "Every install logged with platform, so you know where growth is coming from",
    width: 1647,
    height: 788,
  },
  {
    src: "/images/dockify/reward-settings.webp",
    label: "Reward setup",
    caption: "Set the install reward once - no code required",
    width: 1463,
    height: 863,
  },
];

const panelShots = [
  {
    src: "/images/dockify/app-embed-toggle.webp",
    caption: "Turned on from the Shopify theme editor, like any other app block",
    width: 335,
    height: 462,
  },
  {
    src: "/images/dockify/app-embed-config.webp",
    caption: "Banner copy and timing, configured to match the store's voice",
    width: 338,
    height: 863,
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Dockify",
  serviceType: "Home screen install & reward PWA app",
  provider: {
    "@type": "Organization",
    name: "Bonsify",
    url: "https://bonsify.io",
  },
  areaServed: "Worldwide",
  description:
    "Dockify adds a home-screen install prompt to a Shopify store, delivers a discount code on install, and attributes each install to the purchase it produces.",
};

export default function DockifyProductPage() {
  const next = getNextClient("dockify");
  const prev = getPrevClient("dockify");

  return (
    <main>
      <JsonLd data={serviceSchema} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
          { name: "Dockify", path: "/work/dockify" },
        ])}
      />
      <PageHero
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Work", href: "/work" },
          { label: "Dockify" },
        ]}
        title="Dockify: add to home screen, instantly rewarded"
        lede="Our Shopify App Store app. Dockify turns a browser visit into a home-screen install, hands the customer a discount for making it, and ties every install back to the purchase it drove."
        meta={[
          { k: "Product", v: "Dockify" },
          { k: "Type", v: "Home-screen PWA" },
          { k: "Platform", v: "Shopify App Store" },
          { k: "Works on", v: "iOS & Android" },
        ]}
      />

      <section className="section section-bone">
        <div className="wrap">
          <div className="split">
            <div>
              <RevealOnScroll
                as="span"
                className="eyebrow"
                style={{ color: "var(--clay)" }}
              >
                Why it&apos;s different
              </RevealOnScroll>
              <RevealOnScroll as="h2" className="sec-title">
                Plenty of apps prompt an install. None reward it and prove it
                paid off.
              </RevealOnScroll>
              <div className="prose" style={{ marginTop: 26 }}>
                <RevealOnScroll as="p" className="big">
                  The install prompt is the easy part. The hard part is
                  giving customers a reason to tap it - and knowing whether
                  it was worth anything.
                </RevealOnScroll>
                <RevealOnScroll as="p">
                  Dockify does both. A discount code is delivered the instant
                  a customer installs, so there&apos;s a real reason to say
                  yes. Then every install is tracked through to the order it
                  produces, so you see exactly which installs turned into
                  revenue.
                </RevealOnScroll>
              </div>
              <RevealOnScroll as="div" style={{ marginTop: 14 }}>
                <Link
                  className="btn btn-clay"
                  href="#"
                  rel="noopener"
                >
                  Get Dockify on the Shopify App Store
                </Link>
              </RevealOnScroll>
            </div>
            <RevealOnScroll as="div">
              <PhoneMockup
                light
                src="/images/dockify/install-banner.webp"
                alt="A Shopify storefront with the Dockify install banner prompting a home screen install"
                imgPosition="bottom center"
              >
                <RewardCard />
              </PhoneMockup>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className="section section-ink">
        <div className="wrap">
          <div className="split narrow-gap">
            <div>
              <RevealOnScroll as="span" className="eyebrow">
                What&apos;s inside
              </RevealOnScroll>
              <RevealOnScroll as="h2" className="sec-title">
                Install, reward, attribute
              </RevealOnScroll>
            </div>
            <ul className="flist">
              <RevealOnScroll as="li">
                <CheckIcon />
                <span>
                  One-tap install to the home screen - a real PWA, with no
                  App Store review or wait.
                </span>
              </RevealOnScroll>
              <RevealOnScroll as="li">
                <CheckIcon />
                <span>
                  Automatic discount code delivered the moment a customer
                  installs.
                </span>
              </RevealOnScroll>
              <RevealOnScroll as="li">
                <CheckIcon />
                <span>
                  Merchant dashboard with install-to-purchase attribution -
                  see which installs earned their reward back.
                </span>
              </RevealOnScroll>
              <RevealOnScroll as="li">
                <CheckIcon />
                <span>
                  Works across iOS and Android from a single install prompt,
                  styled to match your store.
                </span>
              </RevealOnScroll>
            </ul>
          </div>
        </div>
      </section>

      <section className="section section-bone">
        <div className="wrap">
          <RevealOnScroll as="span" className="eyebrow">
            Behind the scenes
          </RevealOnScroll>
          <RevealOnScroll as="h2" className="sec-title">
            The merchant dashboard
          </RevealOnScroll>
          <RevealOnScroll as="div" style={{ marginTop: 40 }}>
            <LaptopShowcase shots={laptopShots} />
          </RevealOnScroll>
          <div style={{ marginTop: 60 }}>
            <RevealOnScroll as="span" className="eyebrow">
              Set up in the theme editor
            </RevealOnScroll>
            <RevealOnScroll
              as="div"
              style={{
                marginTop: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 40,
                flexWrap: "wrap",
              }}
            >
              {panelShots.map((shot) => (
                <Image
                  key={shot.src}
                  src={shot.src}
                  alt={shot.caption}
                  width={shot.width}
                  height={shot.height}
                  style={{ width: "auto", height: 420, maxWidth: "100%" }}
                />
              ))}
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="wrap">
          <RevealOnScroll
            as="span"
            className="eyebrow"
            style={{ display: "block", marginBottom: 8 }}
          >
            How it works
          </RevealOnScroll>
          <RevealOnScroll
            as="h2"
            className="sec-title"
            style={{ marginBottom: 50 }}
          >
            Three steps, no dev work on your side
          </RevealOnScroll>
          <RevealOnScroll as="div" className="results">
            <div className="r">
              <div className="rn" style={{ fontSize: 34 }}>
                01
              </div>
              <div
                className="rl"
                style={{
                  fontSize: 14,
                  color: "var(--sand)",
                  opacity: 0.85,
                  fontFamily: "var(--sans)",
                  letterSpacing: 0,
                }}
              >
                <strong style={{ color: "var(--bone)" }}>
                  Install from the App Store.
                </strong>
                <br />
                Add Dockify to your Shopify store in a few clicks.
              </div>
            </div>
            <div className="r">
              <div className="rn" style={{ fontSize: 34 }}>
                02
              </div>
              <div
                className="rl"
                style={{
                  fontSize: 14,
                  color: "var(--sand)",
                  opacity: 0.85,
                  fontFamily: "var(--sans)",
                  letterSpacing: 0,
                }}
              >
                <strong style={{ color: "var(--bone)" }}>
                  Set your reward.
                </strong>
                <br />
                Choose the discount customers get for installing to their
                home screen.
              </div>
            </div>
            <div className="r">
              <div className="rn" style={{ fontSize: 34 }}>
                03
              </div>
              <div
                className="rl"
                style={{
                  fontSize: 14,
                  color: "var(--sand)",
                  opacity: 0.85,
                  fontFamily: "var(--sans)",
                  letterSpacing: 0,
                }}
              >
                <strong style={{ color: "var(--bone)" }}>
                  Watch attribution roll in.
                </strong>
                <br />
                Track installs through to the orders they generate.
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <CTABand
        heading="Put Dockify on your store"
        subtext="Live on the Shopify App Store today. Or let us build you a full native app around it."
        buttonText="Get Dockify"
        buttonHref="#"
      />
      {(prev || next) && (
        <div
          className="wrap"
          style={{
            padding: "0 0 60px",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {prev ? (
            <Link href={`/work/${prev.slug}`} style={{ opacity: 0.7, fontSize: 13 }}>
              ← Previous: {prev.name}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/work/${next.slug}`} style={{ opacity: 0.7, fontSize: 13 }}>
              Next: {next.name} →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </main>
  );
}
