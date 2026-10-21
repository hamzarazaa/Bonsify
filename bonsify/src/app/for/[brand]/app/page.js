import { notFound } from "next/navigation";
import PhoneOnly from "@/components/proposals/PhoneOnly";
import { getProposal, getProposalSlugs } from "@/lib/proposals";
import { googleFontsHref } from "@/lib/proposalFonts";

// The proposal's app on its own, built for a real phone. The proposal page
// shows a QR code that opens this address.
export const dynamicParams = false;

export function generateStaticParams() {
  return getProposalSlugs().map((brand) => ({ brand }));
}

export async function generateMetadata({ params }) {
  const { brand: slug } = await params;
  const brand = getProposal(slug);
  if (!brand) return {};
  return {
    title: `${brand.name} app preview | Bonsify`,
    robots: { index: false, follow: false },
    appleWebApp: { capable: true, title: brand.name, statusBarStyle: "black-translucent" },
    other: { "mobile-web-app-capable": "yes" },
  };
}

export async function generateViewport({ params }) {
  const { brand: slug } = await params;
  const brand = getProposal(slug);
  return { viewportFit: "cover", themeColor: brand?.colors?.primary || "#0d0f11", width: "device-width", initialScale: 1 };
}

export default async function ProposalAppPage({ params }) {
  const { brand: slug } = await params;
  const brand = getProposal(slug);
  if (!brand) notFound();
  const fontsHref = googleFontsHref(brand.fonts);
  return (
    <>
      {fontsHref && <link rel="stylesheet" href={fontsHref} precedence="default" />}
      <PhoneOnly brand={brand} />
    </>
  );
}
