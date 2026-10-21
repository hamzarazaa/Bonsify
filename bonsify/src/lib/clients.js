// Single source of truth for which client case studies are public.
//
// Visibility is driven by env vars, not hardcoded here, so going live for a
// client is a Vercel dashboard change (Project Settings -> Environment
// Variables -> set NEXT_PUBLIC_SHOW_BACHAPARTY / NEXT_PUBLIC_SHOW_HIGHFY to
// "true" -> Redeploy) instead of a code edit. This is a static export with
// no backend, so there's no way to flip this live for visitors without a
// rebuild either way - env var + redeploy is the lowest-friction version of
// that rebuild. See .env.example. Dockify is Bonsify's own product (already
// live on the Shopify App Store), so it's never gated by this.
export const CLIENTS = [
  {
    slug: "bachaparty",
    name: "BachaParty",
    visible: process.env.NEXT_PUBLIC_SHOW_BACHAPARTY === "true",
  },
  {
    slug: "highfy",
    name: "Highfy",
    visible: process.env.NEXT_PUBLIC_SHOW_HIGHFY === "true",
  },
  { slug: "dockify", name: "Dockify", visible: true },
];

export function isClientVisible(slug) {
  const client = CLIENTS.find((c) => c.slug === slug);
  return client ? client.visible : false;
}

export function getVisibleClients() {
  return CLIENTS.filter((c) => c.visible);
}

// Cycles through only the visible clients. Returns null if there's nothing
// to cycle to (0 or 1 visible clients).
export function getNextClient(currentSlug) {
  const visible = getVisibleClients();
  if (visible.length <= 1) return null;
  const idx = visible.findIndex((c) => c.slug === currentSlug);
  if (idx === -1) return visible[0];
  return visible[(idx + 1) % visible.length];
}

// Same cycle, opposite direction - powers the footer's "Previous" link.
export function getPrevClient(currentSlug) {
  const visible = getVisibleClients();
  if (visible.length <= 1) return null;
  const idx = visible.findIndex((c) => c.slug === currentSlug);
  if (idx === -1) return visible[visible.length - 1];
  return visible[(idx - 1 + visible.length) % visible.length];
}
