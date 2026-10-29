// Works out a store's brand name from its address: Shopify's /meta.json first, then the page's
// site name or title, then the web address itself. Used by the render job and the /admin trigger.
const clean = (s) => String(s || "").replace(/&amp;/g, "&").replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const fromHost = (host) => {
  const label = host.replace(/^www\./, "").split(".")[0];
  return label.split(/[-_]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
};
async function get(url, ms = 8000) {
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; BonsifyBot/1.0)", Accept: "*/*" }, signal: AbortSignal.timeout(ms), redirect: "follow" });
  if (!r.ok) throw new Error(String(r.status));
  return r;
}
export async function detectName(input) {
  const u = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  try {
    const j = await (await get(`${u.origin}/meta.json`)).json();
    if (j?.name && String(j.name).length < 60) return clean(j.name);
  } catch {}
  try {
    const html = (await (await get(u.origin)).text()).slice(0, 200000);
    const og = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i);
    if (og && clean(og[1]).length < 60) return clean(og[1]);
    const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (t) {
      const parts = clean(t[1]).split(/\s+[|–—-]\s+|\s*\|\s*/).filter(Boolean);
      const host = fromHost(u.hostname).toLowerCase().replace(/\s/g, "");
      const hit = parts.find((p) => p.toLowerCase().replace(/[^a-z0-9]/g, "").includes(host.slice(0, 5)));
      const pick = hit || parts[parts.length - 1];
      if (pick && pick.length < 40) return pick;
    }
  } catch {}
  return fromHost(u.hostname);
}
