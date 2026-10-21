// Real reviews for the demo app, when the store's product page publishes them
// as structured data (many review apps do, many do not). Reads one public
// product page and returns up to five reviews. Nothing is saved.
export const maxDuration = 20;

const LAB = process.env.NEXT_PUBLIC_LAB === "1" || process.env.LAB_DEMO === "1";
const hits = new Map();

function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 600000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 60;
}

function okHost(h) {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(h) && !/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(h) && !/\.(local|internal|test)$/i.test(h);
}

const flat = (x) => (Array.isArray(x) ? x.flatMap(flat) : x && typeof x === "object" ? [x, ...(x["@graph"] ? flat(x["@graph"]) : [])] : []);
const text = (v) => (typeof v === "string" ? v : v?.name || "");

export async function GET(request) {
  if (!LAB) return Response.json({ reviews: [] }, { status: 404 });
  const u = new URL(request.url);
  const domain = (u.searchParams.get("domain") || "").toLowerCase().replace(/^www\./, "");
  const handle = u.searchParams.get("handle") || "";
  if (!okHost(domain) || !/^[a-z0-9][a-z0-9_-]{0,120}$/i.test(handle)) return Response.json({ reviews: [] }, { status: 400 });
  const ip = (request.headers.get("x-forwarded-for") || "anon").split(",")[0].trim();
  if (limited(ip)) return Response.json({ reviews: [] }, { status: 429 });
  try {
    const r = await fetch(`https://${domain}/products/${handle}`, {
      headers: { "user-agent": "Mozilla/5.0 BonsifyProposalBot", accept: "text/html" },
      signal: AbortSignal.timeout(9000),
      redirect: "follow",
    });
    if (!r.ok) return Response.json({ reviews: [] });
    const html = (await r.text()).slice(0, 2_000_000);
    const nodes = [];
    for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        nodes.push(...flat(JSON.parse(m[1].trim())));
      } catch {}
    }
    const prod = nodes.find((n) => /Product/.test([].concat(n["@type"] || []).join(" ")) && (n.review || n.aggregateRating));
    if (!prod) return Response.json({ reviews: [] });
    const reviews = flat(prod.review || [])
      .map((x) => ({
        name: text(x.author).slice(0, 40) || "Customer",
        rating: Math.max(1, Math.min(5, Math.round(Number(x.reviewRating?.ratingValue ?? x.reviewRating) || 0))),
        title: text(x.name).slice(0, 90),
        body: text(x.reviewBody).replace(/\s+/g, " ").trim().slice(0, 300),
        date: x.datePublished || null,
      }))
      .filter((x) => x.rating && (x.body || x.title))
      .slice(0, 5);
    const agg = prod.aggregateRating;
    return Response.json(
      { reviews, rating: Number(agg?.ratingValue) || null, count: Number(agg?.reviewCount || agg?.ratingCount) || reviews.length },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch {
    return Response.json({ reviews: [] });
  }
}
