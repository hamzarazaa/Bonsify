import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/shared/PageHero";
import CTABand from "@/components/shared/CTABand";
import JsonLd from "@/components/shared/JsonLd";
import AppLogo from "@/components/integrations/AppLogo";
import styles from "@/components/integrations/Integrations.module.css";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/metadata";
import { CATEGORIES, categoryById, appsInCategory } from "@/lib/integrations";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const c = categoryById(id);
  if (!c) return {};
  const n = appsInCategory(id).length;
  return pageMetadata({
    title: `${c.title} Integrations for Shopify Mobile Apps | Bonsify`,
    description: `${c.short} ${n} ${c.title.toLowerCase()} apps that connect to your Bonsify Shopify mobile app, with what each one does in the app.`,
    path: `/integration-categories/${id}`,
  });
}

export default async function CategoryPage({ params }) {
  const { id } = await params;
  const c = categoryById(id);
  if (!c) notFound();
  const apps = appsInCategory(id);
  const others = CATEGORIES.filter((x) => x.id !== id);
  return (
    <main>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Integrations", path: "/integrations" },
          { name: c.title, path: `/integration-categories/${id}` },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${c.title} apps for Shopify mobile apps`,
          numberOfItems: apps.length,
          itemListElement: apps.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.name, url: `https://bonsify.io/integrations/${a.slug}` })),
        }}
      />
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Integrations", href: "/integrations" }, { label: c.title }]}
        title={`${c.title} in your Shopify app`}
        lede={c.short}
      />
      <section className="section">
        <div className="wrap">
          <div className={styles.pgGrid}>
            <div className={styles.pgMain}>
              <h2>How this works in your app</h2>
              <p>{c.intro}</p>
              <h2>What shoppers get</h2>
              <ul>
                {c.uses.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
              <p>We connect to the account you already have, so there is nothing to migrate. Support for each app is confirmed for your store during the free audit.</p>
            </div>
            <aside className={styles.side}>
              <b>{apps.length} apps in this category</b>
              <p className={styles.sideNote}>Not here? Tell us which app you use and we will check it.</p>
              <Link href="/contact" className={styles.disc}>Get your app now</Link>
            </aside>
          </div>
          <div className={styles.related}>
            <h2>All {c.title.toLowerCase()} apps</h2>
            <ul className={styles.tiles} style={{ marginTop: 18, gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
              {apps.map((a) => (
                <li key={a.slug}>
                  <Link href={`/integrations/${a.slug}`} className={styles.tile}>
                    <AppLogo app={a} size={52} />
                    <span>{a.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.related}>
            <h2>More categories</h2>
            <p className={styles.note} style={{ marginTop: 8 }}>
              {others.map((o, i) => (
                <span key={o.id}>
                  <Link href={`/integration-categories/${o.id}`} style={{ textDecoration: "underline" }}>{o.title}</Link>
                  {i < others.length - 1 ? " · " : ""}
                </span>
              ))}
            </p>
          </div>
        </div>
      </section>
      <CTABand heading={`Using a ${c.title.toLowerCase()} app?`} subtext="Send us your app stack. We will show you how it works in your Bonsify app." buttonText="Get your app now" buttonHref="/contact" />
    </main>
  );
}
