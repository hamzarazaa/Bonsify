// Reads the brand pages that already exist in the content repo, so they can be listed as leads.
import { engineMock } from "../engine.js";

const PROJECT = process.env.GITLAB_PROJECT || "hamzaraza/bonsify.io";
const SUB = (process.env.GIT_SUBDIR || "bonsify").replace(/\/$/, "");
const API = `https://gitlab.com/api/v4/projects/${encodeURIComponent(PROJECT)}`;
const SKIP = new Set(["readme", "engine"]); // README and the engine's own test record

async function gl(path, token) {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`GitLab ${r.status}`);
  return r;
}

async function tree(path, token) {
  const out = [];
  for (let page = 1; page <= 5; page++) {
    const r = await gl(`/repository/tree?path=${encodeURIComponent(path)}&ref=main&per_page=100&page=${page}`, token);
    const list = await r.json();
    out.push(...list);
    if (list.length < 100) break;
  }
  return out;
}

// Returns [{ slug, name, url, videoReady, deckReady, crawledAt }]
export async function listPages(token) {
  if (engineMock()) {
    return [
      { slug: "mock-alpha", name: "Mock Alpha", url: "https://mock-alpha.example.com", videoReady: true, deckReady: true, crawledAt: "2026-10-20T10:00:00.000Z" },
      { slug: "mock-beta", name: "Mock Beta", url: "https://mock-beta.example.com", videoReady: false, deckReady: true, crawledAt: "2026-10-21T10:00:00.000Z" },
    ];
  }
  const [files, decks] = await Promise.all([tree(`${SUB}/content/proposals`, token), tree(`${SUB}/public/decks`, token).catch(() => [])]);
  const deckNames = new Set(decks.map((d) => d.name));
  const slugs = files.filter((f) => f.type === "blob" && f.name.endsWith(".json")).map((f) => f.name.slice(0, -5)).filter((s) => !SKIP.has(s.toLowerCase()));
  const out = [];
  for (let i = 0; i < slugs.length; i += 10) {
    const got = await Promise.all(slugs.slice(i, i + 10).map(async (slug) => {
      try {
        const r = await gl(`/repository/files/${encodeURIComponent(`${SUB}/content/proposals/${slug}.json`)}/raw?ref=main`, token);
        const rec = await r.json();
        if (!rec?.url) return null;
        return { slug, name: String(rec.name || slug), url: String(rec.url), videoReady: !!rec.video?.ready, deckReady: deckNames.has(`${slug}-deck.pdf`), crawledAt: rec.crawledAt || "" };
      } catch { return null; }
    }));
    out.push(...got.filter(Boolean));
  }
  return out;
}
