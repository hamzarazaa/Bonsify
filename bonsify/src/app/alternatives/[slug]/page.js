import { notFound } from "next/navigation";
import { getContentEntry, getCategoryEntries } from "@/lib/content";
import ContentPage from "@/components/shared/ContentPage";
import { pageMetadata } from "@/lib/metadata";

export function generateStaticParams() {
  return getCategoryEntries("alternatives").map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = getContentEntry("alternatives", slug);
  if (!entry) return {};
  return pageMetadata({
    title: `${entry.title} | Bonsify`,
    description: entry.description,
    path: `/alternatives/${slug}`,
  });
}

export default async function AlternativePage({ params }) {
  const { slug } = await params;
  const entry = getContentEntry("alternatives", slug);
  if (!entry) notFound();

  return (
    <ContentPage
      entry={entry}
      path={`/alternatives/${slug}`}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Alternatives", path: "/alternatives" },
        { name: entry.title, path: `/alternatives/${slug}` },
      ]}
    />
  );
}
