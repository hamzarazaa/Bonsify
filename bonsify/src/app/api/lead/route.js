// Collects store addresses and contact details from the lab site: the
// "Bonsify your store" form, the non-Shopify notice, the newsletter pill and
// forms that were closed half way. Every call is written to the server log as
// one JSON line and forwarded to the same inbox as the contact form, so a
// store address is never lost, even when the visitor leaves the form.
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xlgyvadp";
const STAGES = new Set(["submitted", "abandoned", "not_shopify", "newsletter", "mobile_share"]);

const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const mine = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  if (mine.length >= 20) return true;
  mine.push(now);
  hits.set(ip, mine);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some((t) => now - t < 10 * 60_000)) hits.delete(k);
  return false;
}

const clip = (v, n) => String(v ?? "").trim().slice(0, n);

export async function POST(request) {
  let b;
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  if (b?.website) return Response.json({ ok: true }); // honeypot
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return Response.json({ ok: true });

  const stage = STAGES.has(b?.stage) ? b.stage : "submitted";
  const email = clip(b?.email, 160);
  const url = clip(b?.url, 300);
  const name = clip(b?.name, 120);
  const brandName = clip(b?.brandName, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "That email does not look right." }, { status: 400 });
  if (!email && !url) return Response.json({ error: "Nothing to save." }, { status: 400 });

  const rec = { stage, name, email, brandName, url, source: clip(b?.source, 60), at: new Date().toISOString(), lab: process.env.NEXT_PUBLIC_LAB === "1" };
  console.log("BONSIFY_LEAD " + JSON.stringify(rec));

  const body = new URLSearchParams();
  body.set("_subject", `[Bonsify${rec.lab ? " lab" : ""}] ${stage}: ${url || email}`);
  for (const [k, v] of Object.entries(rec)) if (v !== "" && v !== false) body.set(k, String(v));
  if (email) body.set("_replyto", email);
  try {
    await fetch(FORMSPREE_ENDPOINT, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body });
  } catch {
    /* the log line above is the fallback record */
  }
  return Response.json({ ok: true });
}
