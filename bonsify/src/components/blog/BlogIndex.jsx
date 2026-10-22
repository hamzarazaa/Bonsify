import Link from "next/link";
import BlogHero from "@/components/blog/BlogHero";
import CTABand from "@/components/shared/CTABand";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import JsonLd from "@/components/shared/JsonLd";
import BlogThumb from "@/components/blog/BlogThumb";
import BlogBrowse from "@/components/blog/BlogBrowse";
import { breadcrumbSchema } from "@/lib/schema";
import { BLOG_TOPICS, getBlogTopic, getBlogTopicLabel } from "@/lib/blogTopics";
import styles from "./BlogIndex.module.css";

export default function BlogIndex({ basePath, breadcrumbLabel, entries: rawEntries }) {
  const entries = rawEntries.map((entry) => ({
    ...entry,
    topicKey: getBlogTopic(entry.title).key,
  }));
  const topics = BLOG_TOPICS.map((t) => ({ key: t.key, label: t.label }));

  const featured = entries[0];
  const latest = entries.slice(1, 3);
  const trending = entries.slice(3, 6);

  return (
    <main>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: breadcrumbLabel, path: basePath },
        ])}
      />
      <BlogHero />

      <section className="section section-bone">
        <div className="wrap">
          {featured && (
            <div className={styles.headline}>
              <RevealOnScroll as="div" className={styles.featuredWrap}>
                <span className={styles.colLabel}>Featured</span>
                <Link className={styles.featured} href={`${basePath}/${featured.slug}`}>
                  <BlogThumb entry={featured} size="lg" />
                  <div className={styles.featuredBody}>
                    <span className={styles.tag}>
                      {getBlogTopicLabel(featured.topicKey)}
                    </span>
                    <h2>{featured.title}</h2>
                    <p>{featured.description}</p>
                    <span className={styles.readMore}>Read article →</span>
                  </div>
                </Link>
              </RevealOnScroll>

              <div className={styles.latestCol}>
                <span className={styles.colLabel}>Latest</span>
                {latest.map((entry, i) => (
                  <RevealOnScroll as="div" key={entry.slug}>
                    <Link
                      className={`${styles.latestRow} ${
                        i === 1 ? styles.latestHighlight : ""
                      }`}
                      href={`${basePath}/${entry.slug}`}
                    >
                      <span className={styles.tag}>
                        {getBlogTopicLabel(entry.topicKey)}
                      </span>
                      <h3>{entry.title}</h3>
                    </Link>
                  </RevealOnScroll>
                ))}

                <RevealOnScroll as="div" className={styles.ctaCard}>
                  <h4>See what going native would change</h4>
                  <p>
                    Tell us about your Shopify store. We&apos;ll give you a
                    straight answer.
                  </p>
                  <Link className={styles.ctaBtn} href="/contact">
                    Get your app now
                  </Link>
                </RevealOnScroll>
              </div>
            </div>
          )}

          {trending.length > 0 && (
            <>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Trending</h2>
              </div>
              <div className={styles.trendingGrid}>
                {trending.map((entry, i) => (
                  <RevealOnScroll as="div" key={entry.slug}>
                    <Link
                      className={`${styles.trendCard} ${
                        i === 1 ? styles.trendHighlight : ""
                      }`}
                      href={`${basePath}/${entry.slug}`}
                    >
                      <BlogThumb entry={entry} size="md" />
                      <div className={styles.trendBody}>
                        <span className={styles.tag}>
                          {getBlogTopicLabel(entry.topicKey)}
                        </span>
                        <h3>{entry.title}</h3>
                      </div>
                    </Link>
                  </RevealOnScroll>
                ))}
              </div>
            </>
          )}

          <BlogBrowse basePath={basePath} entries={entries} topics={topics} />
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
