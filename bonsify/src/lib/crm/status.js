// Works out how far a lead's page, deck and video have got, without the engine having to write to our database.
// The engine publishes the brand page to the content repo (page and deck first, video later), so the repo is the truth.
import { runState, engineMock } from "../engine.js";

const PROJECT = process.env.GITLAB_PROJECT || "hamzaraza/bonsify.io";
const SUB = (process.env.GIT_SUBDIR || "bonsify").replace(/\/$/, "");
const BUSY = new Set(["queued", "deck"]);

export const inProgress = (lead) => !!lead.engine?.execution && BUSY.has(lead.pageStatus);

async function repoRecord(slug, token) {
  const file = encodeURIComponent(`${SUB}/content/proposals/${slug}.json`);
  const r = await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(PROJECT)}/repository/files/${file}/raw?ref=main`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(5000) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitLab ${r.status}`);
  return r.json().catch(() => null);
}

// Returns the fields to change on the lead, or null when nothing changed.
export async function refreshStatus(lead, token) {
  if (!inProgress(lead)) return null;
  const slug = lead.pageSlug || lead.engine.slug;
  let run;
  try { run = await runState(lead.engine.execution); } catch { return null; }
  let deck = false, video = false;
  if (engineMock()) {
    const age = Date.now() - new Date(lead.engine.startedAt).getTime();
    deck = age > 2000; video = run.state === "done";
  } else {
    try { const rec = await repoRecord(slug, token); deck = !!rec; video = !!rec?.video?.ready; } catch { return null; }
  }
  let next = lead.pageStatus;
  if (video || (run.state === "done" && deck)) next = "ready";
  else if (run.state === "failed") next = "failed";
  else if (deck) next = "deck";
  const out = {};
  if (next !== lead.pageStatus) out.pageStatus = next;
  if (deck !== !!lead.deckReady) out.deckReady = deck;
  if (!Object.keys(out).length) return null;
  const say = next === "ready" ? "Page, deck and video are ready" : next === "deck" ? "Page and deck are live, video is still rendering" : next === "failed" ? "The render failed" + (deck ? " after the page and deck were published" : "") : "";
  return { patch: out, note: out.pageStatus && say ? say : "" };
}
