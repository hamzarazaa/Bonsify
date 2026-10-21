import CaseStudy, { caseStudyMetadata } from "@/components/work/CaseStudy";

export async function generateMetadata() {
  const m = await caseStudyMetadata("creedvintage");
  return { ...m, alternates: { canonical: "/work/creedvintage" } };
}

export default function Page() {
  return <CaseStudy slug="creedvintage" />;
}
