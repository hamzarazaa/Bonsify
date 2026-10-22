import Link from "next/link";
import PageHero from "@/components/shared/PageHero";
import CTABand from "@/components/shared/CTABand";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import JsonLd from "@/components/shared/JsonLd";
import BlogThumbnail from "@/components/shared/BlogThumbnail";
import { breadcrumbSchema } from "@/lib/schema";

export default function ContentIndex({
  basePath,
  breadcrumbLabel,
  title,
  lede,
  catLabel,
  entries,
}) {
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
      <section className="section section-bone">
        <div className="wrap">
          <div className="post-grid">
            {entries.map((entry) => (
              <RevealOnScroll as="div" key={entry.slug}>
                <Link
                  className="post-card"
                  href={`${basePath}/${entry.slug}`}
                >
                  {catLabel === "Blog" && <BlogThumbnail title={entry.title} />}
                  <div className="post-card-body">
                    <span className="pc-cat">{catLabel}</span>
                    <h3>{entry.title}</h3>
                    <p>{entry.description}</p>
                  </div>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>
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
