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
// Search results cut titles around 60 characters. Drop the brand suffix first,
// then the subtitle after a colon, so the part that matters stays readable.
export function fitTitle(title, max = 62) {
  if (!title || title.length <= max) return title;
  const base = title.replace(/\s*\|\s*Bonsify( Blog)?$/, "");
  if (`${base} | Bonsify`.length <= max) return `${base} | Bonsify`;
  if (base.length <= max) return base;
  const head = base.split(/:\s/)[0];
  if (head.length >= 24) return `${head} | Bonsify`.length <= max ? `${head} | Bonsify` : head;
  const cut = base.slice(0, max - 1).replace(/\s+\S*$/, "");
  return `${cut}…`;
}

export function pageMetadata({ title: rawTitle, description, path, image = OG_IMAGE }) {
  const title = fitTitle(rawTitle);
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
