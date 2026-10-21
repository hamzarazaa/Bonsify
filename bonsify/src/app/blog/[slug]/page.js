import { notFound } from "next/navigation";
import { getContentEntry, getCategoryEntries } from "@/lib/content";
import ContentPage from "@/components/shared/ContentPage";
import { pageMetadata } from "@/lib/metadata";

export function generateStaticParams() {
  return getCategoryEntries("blog").map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = getContentEntry("blog", slug);
  if (!entry) return {};
  return pageMetadata({
    title: `${entry.title} | Bonsify Blog`,
    description: entry.description,
    path: `/blog/${slug}`,
  });
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const entry = getContentEntry("blog", slug);
  if (!entry) notFound();

  // Same order Browse All lists posts in (getCategoryEntries sorts by
  // title) - so "next"/"previous" here matches what a reader would hit
  // browsing that list, not an arbitrary or date-based order.
  const allPosts = getCategoryEntries("blog");
  const index = allPosts.findIndex((p) => p.slug === slug);
  const prevEntry = index > 0 ? allPosts[index - 1] : null;
  const nextEntry =
    index >= 0 && index < allPosts.length - 1 ? allPosts[index + 1] : null;

  return (
    <ContentPage
      entry={entry}
      path={`/blog/${slug}`}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: entry.title, path: `/blog/${slug}` },
      ]}
      schemaType="Article"
      prevPost={
        prevEntry ? { title: prevEntry.title, href: `/blog/${prevEntry.slug}` } : null
      }
      nextPost={
        nextEntry ? { title: nextEntry.title, href: `/blog/${nextEntry.slug}` } : null
      }
    />
  );
}
