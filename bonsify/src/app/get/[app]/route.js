import { NextResponse } from "next/server";
import { getStoreLinks } from "@/lib/showcase";

// bonsify.io/get/<app>: the link behind each app's QR code in a proposal.
// Sends iPhones to the App Store and Android phones to Google Play. Anything
// else (a laptop, an app with one store only) goes to whichever link exists,
// then the case study, then the home page.
export async function GET(request, { params }) {
  const { app } = await params;
  const links = getStoreLinks(app);
  const ua = request.headers.get("user-agent") || "";
  const home = new URL("/", request.url);

  if (!links) return NextResponse.redirect(home, 302);

  const isApple = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua));
  const isAndroid = /Android/i.test(ua);

  const target =
    (isApple && links.ios) ||
    (isAndroid && links.android) ||
    links.ios ||
    links.android ||
    (links.caseStudy ? new URL(links.caseStudy, request.url).toString() : null);

  return NextResponse.redirect(target || home, 302);
}
