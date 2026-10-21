const SITE_URL = "https://bonsify.io";
const SITE_NAME = "Bonsify";
const OG_IMAGE = "/images/og-image.jpg";

/**
 * Builds a complete, self-contained Metadata object (title, description,
 * canonical, OpenGraph, Twitter card) for a single page. Deliberately does
 * not rely on parent/child metadata merging — Next.js does not deep-merge
 * nested fields like `openGraph`, so a page that only overrides `openGraph.title`
 * would silently lose the parent's `images`/`siteName`. Building every page's
 * metadata explicitly avoids that trap.
 */
export function pageMetadata({ title, description, path, image = OG_IMAGE }) {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
