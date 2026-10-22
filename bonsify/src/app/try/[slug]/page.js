import { notFound } from "next/navigation";
import PhoneOnly from "@/components/proposals/PhoneOnly";
import CustomTry from "@/components/proposals/CustomTry";
import { getLabBrands } from "@/lib/lab";
import { googleFontsHref } from "@/lib/proposalFonts";

// A lab demo store opened on its own, for a real phone. The QR code on the lab
// home page points here. "custom" is the store a visitor typed in.
export const dynamicParams = false;

export function generateStaticParams() {
  return [...getLabBrands({ all: true }).map((b) => ({ slug: b.slug })), { slug: "custom" }];
}

export const metadata = {
  title: "App preview | Bonsify",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "App preview", statusBarStyle: "black-translucent" },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport = { viewportFit: "cover", width: "device-width", initialScale: 1, themeColor: "#0d0f11" };

export default async function TryPage({ params }) {
  const { slug } = await params;
  if (slug === "custom") return <CustomTry />;
  const brand = getLabBrands({ all: true }).find((b) => b.slug === slug);
  if (!brand) notFound();
  const href = googleFontsHref(brand.fonts);
  return (
    <>
      {href && <link rel="stylesheet" href={href} precedence="default" />}
      <PhoneOnly brand={brand} liveReviews />
    </>
  );
}
