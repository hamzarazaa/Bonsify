import { notFound } from "next/navigation";
import { getDemo, getDemoSlugs } from "@/lib/demoPages";
import { googleFontsHref } from "@/lib/proposalFonts";
import DemoClient from "./DemoClient";

// A personal demo page sent with a pitch video: the video, the "Get your app
// now" button and the live app for that store. One page per published file in
// content/demo (edited in /admin under "Brand video pages").
export const dynamicParams = false;

export function generateStaticParams() {
  return getDemoSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const d = getDemo(slug);
  if (!d) return {};
  const v = d.video;
  return {
    title: `A short video for ${v.contact} | Bonsify`,
    description: `${v.who}: your store as a mobile app, built from your live catalogue.`,
    robots: { index: false, follow: false },
  };
}

export default async function DemoPage({ params }) {
  const { slug } = await params;
  const d = getDemo(slug);
  if (!d) notFound();
  const { brand, video: v } = d;
  const href = googleFontsHref(brand.fonts);
  return (
    <>
      {href && <link rel="stylesheet" href={href} precedence="default" />}
      <DemoClient brand={brand} video={v} />
    </>
  );
}
