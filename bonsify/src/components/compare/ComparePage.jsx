import PageHero from "@/components/shared/PageHero";
import CompareBody from "@/components/compare/CompareBody";
import FAQBlock from "@/components/shared/FAQBlock";
import CTABand from "@/components/shared/CTABand";
import JsonLd from "@/components/shared/JsonLd";
import StickyMobileCTA from "@/components/shared/StickyMobileCTA";
import { breadcrumbSchema } from "@/lib/schema";
import styles from "./ComparePage.module.css";

export default function ComparePage({ entry, breadcrumbs }) {
  const { title, description, body, faqItems } = entry;

  return (
    <main>
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />

      <PageHero
        breadcrumbs={breadcrumbs.map((b, i) =>
          i === breadcrumbs.length - 1
            ? { label: b.name }
            : { label: b.name, href: b.path }
        )}
        title={title}
        lede={description}
      />

      <section className="section section-bone">
        <div className="wrap">
          <CompareBody body={body} />

          {faqItems.length > 0 && (
            <div className={styles.faqWrap}>
              <FAQBlock items={faqItems} />
            </div>
          )}
        </div>
      </section>

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
