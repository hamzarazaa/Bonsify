// Turns what a visitor types ("hello.com", "www.hello.com/shop", "https://hello.com") into a clean
// https address, or returns null when it is not a plausible web address.
export function normalizeStoreUrl(input) {
  const raw = String(input || "").trim();
  if (!raw || /\s/.test(raw)) return null;
  const withProto = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withProto);
    if (!/^https?:$/.test(u.protocol)) return null;
    const h = u.hostname.toLowerCase();
    if (!/^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(h)) return null;
    return `${u.protocol}//${h}${u.pathname === "/" ? "" : u.pathname}${u.search}`;
  } catch {
    return null;
  }
}
