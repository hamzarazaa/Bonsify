import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/shared/PageHero";
import CTABand from "@/components/shared/CTABand";
import JsonLd from "@/components/shared/JsonLd";
import AppLogo from "@/components/integrations/AppLogo";
import styles from "@/components/integrations/Integrations.module.css";
import { breadcrumbSchema } from "@/lib/schema";
import { fitTitle, pageMetadata } from "@/lib/metadata";
import { APPS, appBySlug, appsInCategory, categoryById, shopifySearchUrl } from "@/lib/integrations";

export function generateStaticParams() {
  return APPS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const a = appBySlug(slug);
  if (!a) return {};
  const c = categoryById(a.groups[0]);
  return pageMetadata({
    title: fitTitle(`${a.name} Integration for Shopify Mobile Apps | Bonsify`),
    description: `${a.line} See how ${a.name} works inside your Bonsify Shopify mobile app, what shoppers get, and how it connects.`.slice(0, 158),
    path: `/integrations/${slug}`,
  });
}

export default async function AppPage({ params }) {
  const { slug } = await params;
  const a = appBySlug(slug);
  if (!a) notFound();
  const cats = a.groups.map(categoryById).filter(Boolean);
  const main = cats[0];
  const related = appsInCategory(main.id).filter((x) => x.slug !== a.slug).slice(0, 8);
  const native = main.id === "native";
  return (
    <main>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Integrations", path: "/integrations" },
          { name: main.title, path: `/integration-categories/${main.id}` },
          { name: a.name, path: `/integrations/${a.slug}` },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${a.name} integration for Shopify mobile apps`,
          url: `https://bonsify.io/integrations/${a.slug}`,
          description: a.line,
          about: { "@type": "SoftwareApplication", name: a.name, applicationCategory: main.title, ...(a.site ? { url: `https://${a.site}` } : {}) },
          isPartOf: { "@id": "https://bonsify.io/#website" },
        }}
      />
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Integrations", href: "/integrations" }, { label: main.title, href: `/integration-categories/${main.id}` }, { label: a.name }]}
        title={`${a.name} in your Shopify mobile app`}
        lede={a.line}
      />
      <section className="section">
        <div className="wrap">
          <div className={styles.pgGrid}>
            <div className={styles.pgMain}>
              <h2>What {a.name} does</h2>
              <p>{a.line} It is part of the {main.title.toLowerCase()} category, which covers {main.short.charAt(0).toLowerCase() + main.short.slice(1)}</p>
              <h2>{native ? `How ${a.name} works in your app` : `How ${a.name} works in your Bonsify app`}</h2>
              <p>{main.intro}</p>
              <h2>Use cases</h2>
              <ul>
                {main.uses.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
              {!native && (
                <>
                  <h2>How it connects</h2>
                  <p>
                    We connect to the {a.name} account your store already has, so there is nothing to migrate and your settings stay as they are. Shoppers see {a.name} features in the app the same way they do on the website.
                    We confirm exactly how {a.name} connects to your store during the free audit.
                  </p>
                </>
              )}
              {cats.length > 1 && (
                <p>
                  Also listed under:{" "}
                  {cats.slice(1).map((c, i) => (
                    <span key={c.id}>
                      <Link href={`/integration-categories/${c.id}`} style={{ textDecoration: "underline" }}>{c.title}</Link>
                      {i < cats.length - 2 ? ", " : ""}
                    </span>
                  ))}
                </p>
              )}
            </div>
            <aside className={styles.side}>
              <div className={styles.sideTop}>
                <AppLogo app={a} size={56} />
                <span>
                  <b>{a.name}</b>
                  <small>{main.title}</small>
                </span>
              </div>
              {!native && (
                <a className={styles.disc} href={shopifySearchUrl(a)} target="_blank" rel="noopener noreferrer nofollow">
                  Discover on Shopify
                </a>
              )}
              <Link className={styles.ghostBtn} href="/contact">Get your app now</Link>
              <p className={styles.sideNote}>Opens the Shopify App Store. {a.name} is a trademark of its owner; Bonsify is not affiliated with it.</p>
            </aside>
          </div>
          {related.length > 0 && (
            <div className={styles.related}>
              <h2>Other {main.title.toLowerCase()} apps</h2>
              <ul className={styles.tiles} style={{ marginTop: 18, gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/integrations/${r.slug}`} className={styles.tile}>
                      <AppLogo app={r} size={52} />
                      <span>{r.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
      <CTABand heading={`Run ${a.name}? We will connect it.`} subtext="Send us your app stack and we will show you how it works in your Bonsify app." buttonText="Get your app now" buttonHref="/contact" />
    </main>
  );
}
