import { notFound } from "next/navigation";
import { getContentEntry, getCategoryEntries } from "@/lib/content";
import ContentPage from "@/components/shared/ContentPage";
import { pageMetadata } from "@/lib/metadata";

export function generateStaticParams() {
  return getCategoryEntries("services").map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = getContentEntry("services", slug);
  if (!entry) return {};
  return pageMetadata({
    title: `${entry.title} | Bonsify`,
    description: entry.description,
    path: `/services/${slug}`,
  });
}

export default async function ServicePage({ params }) {
  const { slug } = await params;
  const entry = getContentEntry("services", slug);
  if (!entry) notFound();

  return (
    <ContentPage
      entry={entry}
      path={`/services/${slug}`}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
        { name: entry.title, path: `/services/${slug}` },
      ]}
      schemaType="Service"
    />
  );
}
