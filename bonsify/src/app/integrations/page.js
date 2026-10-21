import PageHero from "@/components/shared/PageHero";
import CTABand from "@/components/shared/CTABand";
import JsonLd from "@/components/shared/JsonLd";
import IntegrationGroups from "@/components/integrations/IntegrationGroups";
import styles from "@/components/integrations/Integrations.module.css";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/metadata";
import { INTEGRATION_GROUPS, INTEGRATION_COUNT } from "@/lib/integrations";

export const metadata = pageMetadata({
  title: "Shopify App Integrations: Klaviyo, Recharge, Yotpo & More | Bonsify",
  description:
    "The Shopify apps your Bonsify mobile app connects to: reviews, loyalty, subscriptions, search, email and SMS, support, payments, shipping and analytics.",
  path: "/integrations",
});

export default function IntegrationsPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Shopify apps Bonsify mobile apps integrate with",
    numberOfItems: INTEGRATION_COUNT,
    itemListElement: INTEGRATION_GROUPS.flatMap((g) => g.apps.map((a) => ({ g, a })))
      .filter((x, i, arr) => arr.findIndex((y) => y.a === x.a) === i)
      .map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.a })),
  };
  return (
    <main>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Integrations", path: "/integrations" },
        ])}
      />
      <JsonLd data={itemList} />
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Integrations" }]}
        title="The Shopify apps your store runs on, inside your app"
        lede={`${INTEGRATION_COUNT}+ apps and services a Bonsify mobile app connects to, from Klaviyo and Recharge to Yotpo, Gorgias and Triple Whale.`}
      />
      <section className="section">
        <div className="wrap">
          <span className="eyebrow">What we connect</span>
          <h2 className="sec-title" style={{ marginTop: 14 }}>
            Keep every tool you already pay for
          </h2>
          <p style={{ marginTop: 16, maxWidth: 720, fontSize: 18, lineHeight: 1.65, opacity: 0.8 }}>
            A mobile app that cannot show your reviews, run your subscriptions or send
            your Klaviyo flows is a downgrade. Bonsify apps plug into the apps your store
            already uses, so loyalty points, subscriptions, reviews, search and
            messaging all work the same on the home screen as they do on the web.
          </p>
          <IntegrationGroups />
          <p className={styles.note}>
            Not on the list? Send us your app stack. During the free audit we check every
            app your store uses and tell you exactly how each one connects, including
            custom and less common apps.
          </p>
        </div>
      </section>
      <CTABand
        heading="Send us your app stack"
        subtext="We will map each app your store uses to the mobile app and tell you what connects on day one."
        buttonText="Book a free audit"
        buttonHref="/contact"
      />
    </main>
  );
}
