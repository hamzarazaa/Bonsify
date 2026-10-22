import { notFound } from "next/navigation";
import { getLabBrands } from "@/lib/lab";
import { googleFontsHref } from "@/lib/proposalFonts";
import DemoClient from "./DemoClient";

// A personal demo page sent with a pitch video: the video, the "Get your app
// now" button and the live app for that store. Only stores in the lab list
// that also have a video file in public/demo get a page.
export const dynamicParams = false;

const VIDEOS = {
  gulahmed: { src: "/demo/gulahmed.mp4", poster: "/demo/gulahmed-poster.jpg", who: "Gul Ahmad" },
};

export function generateStaticParams() {
  return Object.keys(VIDEOS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const v = VIDEOS[slug];
  if (!v) return {};
  return {
    title: `A short video for ${v.who} | Bonsify`,
    description: `${v.who}: your store as a mobile app, built from your live catalogue.`,
    robots: { index: false, follow: false },
  };
}

export default async function DemoPage({ params }) {
  const { slug } = await params;
  const v = VIDEOS[slug];
  const brand = getLabBrands({ all: true }).find((b) => b.slug === slug);
  if (!v || !brand) notFound();
  const href = googleFontsHref(brand.fonts);
  return (
    <>
      {href && <link rel="stylesheet" href={href} precedence="default" />}
      <DemoClient brand={brand} video={v} />
    </>
  );
}
