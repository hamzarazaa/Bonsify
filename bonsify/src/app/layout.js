import { Inter, Archivo } from "next/font/google";
import Script from "next/script";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SmoothScroll from "@/components/shared/SmoothScroll";
import PageTransition from "@/components/shared/PageTransition";
import SiteChrome from "@/components/layout/SiteChrome";
import PrototypeWarmer from "@/components/proposals/PrototypeWarmer";
import { getShowcaseApps } from "@/lib/showcase";
import { getCategoryEntries } from "@/lib/content";
import "@/styles/tokens.css";
import "./globals.css";
import "@/styles/lab-theme.css";
import LabMotion from "@/components/lab/LabMotion";

// Display face: condensed, heavy headlines and wide numerals from one family.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display", display: "swap" });

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://bonsify.io"),
  title: "Bonsify - Shopify Mobile Apps, Done For You | Beyond the Browser",
  description:
    "Bonsify turns Shopify stores into native iOS and Android apps and PWAs. Built, launched, and maintained for you. Free audit.",
  other: {
    // Bing Webmaster Tools site verification - inherited by every route
    // (Next.js merges a layout's `other` metadata into each page's own),
    // so it only needs to be set here once.
    "msvalidate.01": "690309414B9B7F9A93E8A61E764F9CDD",
  },
};

// The /services index still lists every page for SEO, but the nav mega-menu
// groups services under category headers so it reads as organized instead
// of a flat wall of 18 links.
const NAV_SERVICE_GROUPS = [
  {
    label: "Mobile Apps",
    slugs: ["mobile-app-development", "pwa-development", "push-notification-setup"],
  },
  {
    label: "Build & Migrate",
    slugs: [
      "custom-shopify-app-development",
      "app-rescue-migration",
      "migration-to-shopify",
      "headless-hydrogen-development",
    ],
  },
  {
    label: "Launch & Grow",
    slugs: [
      "app-store-submission-aso",
      "store-optimization-cro",
      "install-to-purchase-attribution",
      "subscription-recurring-revenue",
    ],
  },
  {
    label: "Store & Scale",
    slugs: [
      "shopify-store-setup-design",
      "shopify-theme-development",
      "b2b-wholesale-setup",
      "internationalization",
      "app-maintenance-support",
    ],
  },
];

function curateNavServiceGroups(all) {
  const bySlug = new Map(all.map((s) => [s.slug, s]));
  return NAV_SERVICE_GROUPS.map((g) => ({
    label: g.label,
    items: g.slugs.map((slug) => bySlug.get(slug)).filter(Boolean),
  }));
}

export default function RootLayout({ children }) {
  const serviceGroups = curateNavServiceGroups(getCategoryEntries("services"));
  const industries = getCategoryEntries("industries");
  const protoUrls = getShowcaseApps().map((a) => a.prototype).filter(Boolean);

  return (
    <html
      lang="en"
      className={`${inter.variable} ${archivo.variable}`}
      data-lab={process.env.NEXT_PUBLIC_LAB === "1" ? "1" : undefined}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <Script id="js-class" strategy="beforeInteractive">
          {`document.documentElement.classList.add('js')`}
        </Script>
        {/* SiteChrome hides these on /for/<brand> proposal pages, which
            bring their own full-screen header. */}
        <SiteChrome>
          <SmoothScroll />
        </SiteChrome>
        <SiteChrome>
          <Header serviceGroups={serviceGroups} industries={industries} />
        </SiteChrome>
        <link rel="preconnect" href="https://embed.figma.com" />
        <link rel="dns-prefetch" href="https://www.figma.com" />
        <PrototypeWarmer urls={protoUrls} />
        <LabMotion />
        <PageTransition>{children}</PageTransition>
        <SiteChrome>
          <Footer />
        </SiteChrome>
      </body>
    </html>
  );
}
