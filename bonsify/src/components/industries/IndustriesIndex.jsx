import PageHero from "@/components/shared/PageHero";
import CTABand from "@/components/shared/CTABand";
import JsonLd from "@/components/shared/JsonLd";
import CompareFan from "@/components/compare/CompareFan";
import { breadcrumbSchema } from "@/lib/schema";

function monogram(title) {
  const words = title.replace(/&/g, " ").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function IndustriesIndex({
  basePath,
  breadcrumbLabel,
  title,
  lede,
  entries,
}) {
  const cards = entries.map((entry) => ({
    slug: entry.slug,
    name: entry.title,
    description: entry.description,
    mark: monogram(entry.title),
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
          eyebrow="Industry"
          badgeLabel={null}
          ctaLabel="See benchmarks"
        />
      </section>

      <CTABand
        heading="See what going native would change"
        subtext="Tell us about your Shopify store. We'll give you a straight answer."
        buttonText="Get your app now"
        buttonHref="/contact"
      />
    </main>
  );
}
