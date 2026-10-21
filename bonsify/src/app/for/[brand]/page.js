import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Archivo } from "next/font/google";
import ProposalShell from "@/components/proposals/ProposalShell";
import { getProposal, getProposalSlugs } from "@/lib/proposals";
import { getShowcaseApps } from "@/lib/showcase";

// Private, per-prospect proposal pages: bonsify.io/for/<brand>.
// One page is built for each file in content/proposals/. Add a brand with
//   npm run add-brand -- https://their-store.com
// then commit and deploy. Unknown slugs 404 instead of being built on demand.
export const dynamicParams = false;

// Display face for the proposal pages only (the rest of the site stays on
// Inter). Archivo's width axis gives both the condensed headlines and the
// wide numerals from one family.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display", display: "swap" });

export function generateStaticParams() {
  return getProposalSlugs().map((brand) => ({ brand }));
}

export async function generateMetadata({ params }) {
  const { brand: slug } = await params;
  const brand = getProposal(slug);
  if (!brand) return {};
  const title = `An app for ${brand.name} | Bonsify`;
  const description = `A native iOS and Android app proposal for ${brand.domain}, with a working preview built from the ${brand.name} catalogue.`;
  return {
    title,
    description,
    // Sent one-to-one, so keep them out of search results and the sitemap.
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: `https://bonsify.io/for/${slug}`,
      siteName: "Bonsify",
      images: [{ url: "/images/og-image.jpg", width: 1200, height: 630, alt: title }],
      type: "website",
    },
  };
}

function googleFontsHref(fonts) {
  const families = [
    fonts?.headingGoogle && fonts.heading,
    fonts?.bodyGoogle && fonts.body !== fonts.heading && fonts.body,
  ].filter(Boolean);
  if (!families.length) return null;
  const q = families.map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700`).join("&");
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}

export default async function ProposalPage({ params }) {
  const { brand: slug } = await params;
  const brand = getProposal(slug);
  if (!brand) notFound();

  const fontsHref = googleFontsHref(brand.fonts);

  // QR codes are drawn at build time as inline SVG, one per app with store links.
  const apps = await Promise.all(
    getShowcaseApps().map(async (a) => ({
      ...a,
      qr: a.getUrl
        ? await QRCode.toString(a.getUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0d0f11", light: "#ffffff" } })
        : null,
    }))
  );

  return (
    <>
      {fontsHref && <link rel="stylesheet" href={fontsHref} precedence="default" />}
      <div className={archivo.variable}>
        <ProposalShell brand={brand} apps={apps} />
      </div>
    </>
  );
}
