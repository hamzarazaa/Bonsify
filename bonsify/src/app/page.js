import CTABand from "@/components/shared/CTABand";
import HomeHero from "@/components/home/HomeHero";
import ShippedApps from "@/components/home/ShippedApps";
import WhyApp from "@/components/home/WhyApp";
import HomeServices from "@/components/home/HomeServices";
import HomeDockify from "@/components/home/HomeDockify";
import HomeProcess from "@/components/home/HomeProcess";
import HomeIntegrations from "@/components/home/HomeIntegrations";
import { getShowcaseApps } from "@/lib/showcase";
import { pageMetadata } from "@/lib/metadata";
import LabPage, { metadata as labMetadata } from "./lab/page";

const LAB = process.env.NEXT_PUBLIC_LAB === "1";

export const metadata = LAB ? labMetadata : pageMetadata({
  title: "Bonsify - Shopify Mobile Apps, Done For You | Beyond the Browser",
  description:
    "Bonsify turns Shopify stores into native iOS and Android apps and PWAs. Built, launched, and maintained for you. Free audit.",
  path: "/",
});

export default function Home() {
  if (LAB) return <LabPage />;
  const apps = getShowcaseApps();
  // Real store-listing numbers (see showcase.js). Only shown for apps that have them.
  const proof = [
    ...(apps.find((a) => a.proof)?.proof || []),
    { big: String(apps.length), label: "apps live under Bonsify, built and maintained" },
  ];
  return (
    <main>
      <HomeHero proof={proof} />
      <ShippedApps apps={apps} />
      <WhyApp />
      <HomeServices />
      <HomeDockify />
      <HomeProcess />
      <HomeIntegrations />
      <CTABand
        heading="Let's put your store on the home screen"
        subtext="Tell us about your Shopify store. We'll show you what going native would change."
        buttonText="Book a free audit"
        buttonHref="/contact"
      />
    </main>
  );
}
