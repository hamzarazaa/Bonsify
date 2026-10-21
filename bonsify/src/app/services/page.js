import PageHero from "@/components/shared/PageHero";
import CTABand from "@/components/shared/CTABand";
import JsonLd from "@/components/shared/JsonLd";
import CompareFan from "@/components/compare/CompareFan";
import { getCategoryEntries } from "@/lib/content";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/metadata";
import { isClientVisible } from "@/lib/clients";

export const metadata = pageMetadata({
  title: "Shopify Services: Mobile Apps, PWAs & Migrations | Bonsify",
  description:
    "Full service list spanning mobile apps, PWAs, store builds, migrations, and custom Shopify development.",
  path: "/services",
});

const FLAGSHIP = [
  {
    slug: "mobile-app-development",
    tag: "Native iOS & Android",
    requiresClient: "bachaparty",
  },
  {
    slug: "pwa-development",
    tag: "Home screen PWA",
  },
  {
    slug: "install-to-purchase-attribution",
    tag: "Measurement",
  },
  {
    slug: "custom-shopify-app-development",
    tag: "Built around your store",
    requiresClient: "highfy",
  },
];

const SUPPORTING = [
  "ios-app-development",
  "android-app-development",
  "app-rescue-migration",
  "app-store-submission-aso",
  "push-notification-setup",
  "store-optimization-cro",
  "app-maintenance-support",
];

const FULL_STACK = [
  "migration-to-shopify",
  "shopify-store-setup-design",
  "shopify-theme-development",
  "headless-hydrogen-development",
  "b2b-wholesale-setup",
  "subscription-recurring-revenue",
  "internationalization",
];

function cardsFor(slugs, bySlug, tagBySlug) {
  return slugs
    .map((slug, i) => {
      const entry = bySlug[slug];
      if (!entry) return null;
      return {
        slug,
        name: entry.title,
        description: entry.description,
        eyebrow: tagBySlug?.[slug],
        mark: String(i + 1).padStart(2, "0"),
      };
    })
    .filter(Boolean);
}

export default function ServicesIndex() {
  const all = getCategoryEntries("services");
  const bySlug = Object.fromEntries(all.map((e) => [e.slug, e]));

  // Flagship entries whose screenshot belongs to a client that isn't public
  // yet fall back to a plain supporting-tier card instead - no screenshot,
  // no risk of exposing the client early.
  const visibleFlagship = FLAGSHIP.filter(
    (f) => !f.requiresClient || isClientVisible(f.requiresClient)
  );
  const demotedSlugs = FLAGSHIP.filter(
    (f) => f.requiresClient && !isClientVisible(f.requiresClient)
  ).map((f) => f.slug);
  const flagshipSlugs = visibleFlagship.map((f) => f.slug);
  const flagshipTags = Object.fromEntries(
    visibleFlagship.map((f) => [f.slug, f.tag])
  );
  const supportingSlugs = [...demotedSlugs, ...SUPPORTING];

  const flagshipCards = cardsFor(flagshipSlugs, bySlug, flagshipTags);
  const supportingCards = cardsFor(supportingSlugs, bySlug);
  const fullStackCards = cardsFor(FULL_STACK, bySlug);

  return (
    <main>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
        ])}
      />
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Services" }]}
        title="Everything a Shopify store needs"
        lede="Mobile apps are the specialty. Store builds, migrations, and custom Shopify development are the full stack."
        image={{
          src: "/images/services/ServicesHero.jpg",
          alt: "Services overview",
          width: 600,
          height: 500,
        }}
        compactTitle
      />

      <section className="section section-soft">
        <div className="wrap">
          <span className="eyebrow">Where most stores start</span>
          <h2 className="sec-title">The Flagship Work</h2>
        </div>
        <CompareFan
          cards={flagshipCards}
          basePath="/services"
          eyebrow="Shopify service"
          badgeLabel=""
          ctaLabel="See the service"
        />
      </section>

      <section className="section section-ink">
        <div className="wrap">
          <span className="eyebrow">Supporting the build</span>
          <h2 className="sec-title">More Ways We Help</h2>
        </div>
        <CompareFan
          cards={supportingCards}
          basePath="/services"
          eyebrow="Shopify service"
          badgeLabel=""
          ctaLabel="See the service"
        />
      </section>

      <section className="section section-soft">
        <div className="wrap">
          <span className="eyebrow">The rest of the stack</span>
          <h2 className="sec-title">Beyond Mobile</h2>
        </div>
        <CompareFan
          cards={fullStackCards}
          basePath="/services"
          eyebrow="Shopify service"
          badgeLabel=""
          ctaLabel="See the service"
        />
      </section>

      <CTABand
        heading="See what going native would change"
        subtext="Tell us about your Shopify store. We'll give you a straight answer."
        buttonText="Book a free audit"
        buttonHref="/contact"
      />
    </main>
  );
}
