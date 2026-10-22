import PageHero from "@/components/shared/PageHero";
import CTABand from "@/components/shared/CTABand";
import JsonLd from "@/components/shared/JsonLd";
import ShippedApps from "@/components/home/ShippedApps";
import WorkDetails from "@/components/work/WorkDetails";
import HomeDockify from "@/components/home/HomeDockify";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/metadata";
import { getShowcaseApps } from "@/lib/showcase";

export const metadata = pageMetadata({
  title: "Work - Shopify Apps Bonsify Has Built | Bonsify",
  description: "Shopify stores Bonsify has turned into native iOS and Android apps, with live store listings, tap-through prototypes and what every build includes.",
  path: "/work",
});

export default function WorkPage() {
  const apps = getShowcaseApps();
  return (
    <main>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
        ])}
      />
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Work" }]}
        title="Stores that stopped living in a browser tab"
        lede="The Shopify brands we have moved onto the home screen, with the apps in the stores and the prototypes to tap through."
      />
      <ShippedApps apps={apps} />
      <HomeDockify />
      <WorkDetails />
      <CTABand
        heading="Your store could be next"
        subtext="Tell us about your Shopify store. We will show you what going native would change."
        buttonText="Get your app now"
        buttonHref="/contact"
      />
    </main>
  );
}
