import CaseStudy, { caseStudyMetadata } from "@/components/work/CaseStudy";

export async function generateMetadata() {
  const m = await caseStudyMetadata("bachaparty");
  return { ...m, alternates: { canonical: "/work/bachaparty" } };
}

export default function Page() {
  return <CaseStudy slug="bachaparty" />;
}
