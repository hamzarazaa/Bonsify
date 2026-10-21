import BlogIndex from "@/components/blog/BlogIndex";
import { getCategoryEntries } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Blog - Shopify Mobile Strategy | Bonsify",
  description:
    "Articles on Shopify mobile conversion, app strategy, push notifications, and retention.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <BlogIndex
      basePath="/blog"
      breadcrumbLabel="Blog"
      entries={getCategoryEntries("blog")}
    />
  );
}
