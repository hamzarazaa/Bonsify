import IndustriesIndex from "@/components/industries/IndustriesIndex";
import { getCategoryEntries } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Shopify Mobile App Strategy by Industry | Bonsify",
  description:
    "Mobile app strategy and conversion benchmarks broken down by Shopify store category.",
  path: "/industries",
});

export default function IndustriesPage() {
  return (
    <IndustriesIndex
      basePath="/industries"
      breadcrumbLabel="Industries"
      title="Built around your category"
      lede="Mobile app strategy and conversion benchmarks broken down by Shopify store category."
      entries={getCategoryEntries("industries")}
    />
  );
}
