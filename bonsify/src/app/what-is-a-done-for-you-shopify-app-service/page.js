import { getContentEntry } from "@/lib/content";
import ContentPage from "@/components/shared/ContentPage";
import { pageMetadata } from "@/lib/metadata";

const SLUG = "what-is-a-done-for-you-shopify-app-service";

export const metadata = pageMetadata({
  title: "What Is a Done-For-You Shopify App Service? | Bonsify",
  description:
    "Category definition distinguishing done-for-you builds from self-serve app builders and custom development agencies.",
  path: `/${SLUG}`,
});

export default function CategoryDefinitionPage() {
  const entry = getContentEntry("pages", SLUG);

  return (
    <ContentPage
      entry={entry}
      path={`/${SLUG}`}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: entry.title, path: `/${SLUG}` },
      ]}
    />
  );
}
