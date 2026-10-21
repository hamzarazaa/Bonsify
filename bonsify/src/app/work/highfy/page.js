import CaseStudy, { caseStudyMetadata } from "@/components/work/CaseStudy";

export async function generateMetadata() {
  const m = await caseStudyMetadata("highfy");
  return { ...m, alternates: { canonical: "/work/highfy" } };
}

export default function Page() {
  return <CaseStudy slug="highfy" />;
}
