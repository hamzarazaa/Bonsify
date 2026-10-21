import AlternativesIndex from "@/components/alternatives/AlternativesIndex";
import { getCategoryEntries } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Shopify App Builder Alternatives | Bonsify",
  description:
    "Why merchants move from self-serve Shopify app builders to a done-for-you native build.",
  path: "/alternatives",
});

export default function AlternativesPage() {
  return (
    <AlternativesIndex
      basePath="/alternatives"
      breadcrumbLabel="Alternatives"
      title="Looking for an alternative?"
      lede="Why merchants move from self-serve Shopify app builders to a done-for-you native build."
      entries={getCategoryEntries("alternatives")}
    />
  );
}
