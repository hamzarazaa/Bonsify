import CompareIndex from "@/components/compare/CompareIndex";
import { getCategoryEntries } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Compare Bonsify - Shopify App Builders & Alternatives | Bonsify",
  description:
    "Honest comparisons between Bonsify's done-for-you native builds and self-serve Shopify app builders.",
  path: "/vs",
});

export default function ComparisonIndex() {
  return (
    <CompareIndex
      basePath="/vs"
      breadcrumbLabel="Compare"
      title="Bonsify compared, honestly"
      lede="Where done-for-you native builds win, where self-serve builders win, and how to tell which one fits your store."
      entries={getCategoryEntries("vs")}
    />
  );
}
