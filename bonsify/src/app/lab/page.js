import LabHome from "@/components/lab/LabHome";
import { getLabBrands } from "@/lib/lab";
import { getShowcaseApps } from "@/lib/showcase";

export const metadata = {
  title: "Bonsify lab",
  description: "An interactive preview of the Bonsify site.",
  robots: { index: false, follow: false },
};

export default function LabPage() {
  const apps = getShowcaseApps();
  const proof = [
    ...(apps.find((a) => a.proof)?.proof || []),
    { big: String(apps.length), label: "apps live under Bonsify, built and maintained" },
  ];
  return <LabHome brands={getLabBrands()} apps={apps} proof={proof} />;
}
