import PageHero from "@/components/shared/PageHero";
import ArticleHero from "@/components/blog/ArticleHero";
import ArticleNav from "@/components/blog/ArticleNav";
import ArticleBody from "@/components/shared/ArticleBody";
import FAQBlock from "@/components/shared/FAQBlock";
import CTABand from "@/components/shared/CTABand";
import JsonLd from "@/components/shared/JsonLd";
import StickyMobileCTA from "@/components/shared/StickyMobileCTA";
import ContentPhone from "@/components/shared/ContentPhone";
import LaptopMockup from "@/components/shared/LaptopMockup";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { SERVICE_VISUALS } from "@/lib/serviceVisuals";
import { isClientVisible } from "@/lib/clients";
import styles from "./ContentPage.module.css";

const SITE_URL = "https://bonsify.io";

function articleSchema({ title, description, path }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${SITE_URL}${path}`,
    dateModified: "2026-07-01",
    author: { "@type": "Organization", name: "Bonsify", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Bonsify", url: SITE_URL },
  };
}

function serviceSchema({ title, description }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    description,
    provider: { "@type": "Organization", name: "Bonsify", url: SITE_URL },
    areaServed: "Worldwide",
  };
}

export default function ContentPage({
  entry,
  path,
  breadcrumbs,
  schemaType,
  prevPost,
  nextPost,
}) {
  const { title, description, body, faqItems } = entry;

  const isService = schemaType === "Service";
  const rawVisual = isService ? SERVICE_VISUALS[entry.slug] : null;
  const visual =
    rawVisual && (!rawVisual.requiresClient || isClientVisible(rawVisual.requiresClient))
      ? rawVisual
      : null;

  const articleBlock = (
    <>
      <ArticleBody source={body} checkmarks={isService} />
      {faqItems.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <FAQBlock items={faqItems} injectSchema={false} />
        </div>
      )}
    </>
  );

  return (
    <main>
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
      {schemaType === "Article" && (
        <JsonLd data={articleSchema({ title, description, path })} />
      )}
      {schemaType === "Service" && (
        <JsonLd data={serviceSchema({ title, description })} />
      )}
      {faqItems.length > 0 && <JsonLd data={faqPageSchema(faqItems)} />}

      {schemaType === "Article" ? (
        <ArticleHero
          image={entry.heroImage}
          title={title}
          backHref={breadcrumbs[breadcrumbs.length - 2]?.path || "/"}
          backLabel={`Back to ${breadcrumbs[breadcrumbs.length - 2]?.name || "Blog"}`}
        />
      ) : (
        <PageHero
          breadcrumbs={breadcrumbs.map((b, i) =>
            i === breadcrumbs.length - 1
              ? { label: b.name }
              : { label: b.name, href: b.path }
          )}
          title={title}
          lede={description}
          image={entry.heroImage}
          compactTitle={isService}
        />
      )}

      {visual && visual.type === "phone" && (
        <section className="section section-bone">
          <div className={`wrap ${styles.withVisual}`}>
            <div className={styles.articleCol}>{articleBlock}</div>
            <div className={styles.visualCol}>
              <ContentPhone
                src={visual.src}
                alt={title}
                title={title}
                checklist={entry.checklist}
              />
              <div className={styles.highlightCard}>
                <span className={styles.highlightLabel}>Why this matters</span>
                <p>{description}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {visual && visual.type === "laptop" && (
        <section className="section section-bone">
          <div className="wrap-narrow">
            <div className={styles.laptopVisual}>
              <LaptopMockup
                src={visual.src}
                alt={title}
                width={visual.width}
                height={visual.height}
              />
            </div>
            {articleBlock}
          </div>
        </section>
      )}

      {!visual && (
        <section className="section section-bone">
          <div className="wrap-narrow">{articleBlock}</div>
        </section>
      )}

      {schemaType === "Article" && <ArticleNav prev={prevPost} next={nextPost} />}

      <CTABand
        heading="See what going native would change"
        subtext="Tell us about your Shopify store. We'll give you a straight answer."
        buttonText="Book a free audit"
        buttonHref="/contact"
      />
      <StickyMobileCTA />
    </main>
  );
}
