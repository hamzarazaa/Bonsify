import PageHero from "@/components/shared/PageHero";
import CTABand from "@/components/shared/CTABand";
import JsonLd from "@/components/shared/JsonLd";
import CompareFan from "@/components/compare/CompareFan";
import { breadcrumbSchema } from "@/lib/schema";

function shortName(title) {
  return title.replace(/\s+Alternatives?$/i, "").trim();
}

export default function AlternativesIndex({
  basePath,
  breadcrumbLabel,
  title,
  lede,
  entries,
}) {
  const cards = entries.map((entry) => ({
    slug: entry.slug,
    name: shortName(entry.title),
    description: entry.description,
  }));

  return (
    <main>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: breadcrumbLabel, path: basePath },
        ])}
      />
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: breadcrumbLabel }]}
        title={title}
        lede={lede}
      />

      <section className="section section-soft">
        <CompareFan
          cards={cards}
          basePath={basePath}
          eyebrow="Alternative"
          badgeLabel="ALT"
          watermark="ALT"
          ctaLabel="See the alternative"
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
