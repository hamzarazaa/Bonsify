import { notFound } from "next/navigation";
import { getAnyBrand } from "@/lib/lab";
import RecApp from "./RecApp";

// Recording harness for the video engine (video/engine.mjs). It shows the bare
// brand app full-window and exposes it to the recorder. It only exists when the
// server is started with REC_ROUTE=1, so it is a 404 in every deployment.
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function Rec({ params }) {
  if (process.env.REC_ROUTE !== "1") notFound();
  const { slug } = await params;
  const brand = getAnyBrand(slug);
  if (!brand) notFound();
  return <RecApp brand={brand} />;
}
