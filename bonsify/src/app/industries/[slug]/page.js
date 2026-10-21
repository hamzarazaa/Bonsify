import { notFound } from "next/navigation";
import { getContentEntry, getCategoryEntries } from "@/lib/content";
import ContentPage from "@/components/shared/ContentPage";
import { pageMetadata } from "@/lib/metadata";

export function generateStaticParams() {
  return getCategoryEntries("industries").map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = getContentEntry("industries", slug);
  if (!entry) return {};
  return pageMetadata({
    title: `${entry.title} - Shopify Mobile App Strategy | Bonsify`,
    description: entry.description,
    path: `/industries/${slug}`,
  });
}

export default async function IndustryPage({ params }) {
  const { slug } = await params;
  const entry = getContentEntry("industries", slug);
  if (!entry) notFound();

  return (
    <ContentPage
      entry={entry}
      path={`/industries/${slug}`}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Industries", path: "/industries" },
        { name: entry.title, path: `/industries/${slug}` },
      ]}
    />
  );
}
