import { notFound } from "next/navigation";
import { getContentEntry, getCategoryEntries } from "@/lib/content";
import ComparePage from "@/components/compare/ComparePage";
import { pageMetadata } from "@/lib/metadata";

export function generateStaticParams() {
  return getCategoryEntries("vs").map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = getContentEntry("vs", slug);
  if (!entry) return {};
  return pageMetadata({
    title: `${entry.title} | Bonsify`,
    description: entry.description,
    path: `/vs/${slug}`,
  });
}

export default async function CompareSlugPage({ params }) {
  const { slug } = await params;
  const entry = getContentEntry("vs", slug);
  if (!entry) notFound();

  return (
    <ComparePage
      entry={entry}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Compare", path: "/vs" },
        { name: entry.title, path: `/vs/${slug}` },
      ]}
    />
  );
}
