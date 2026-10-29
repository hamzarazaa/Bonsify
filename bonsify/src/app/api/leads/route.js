import { teamMember } from "../../../lib/crm/auth.js";
import { store, loadSettings } from "../../../lib/crm/store.js";
import { detectName } from "../../../../scripts/lib/detect-name.mjs";
import { newLead, applyPatch, cleanSettings, slugFromName } from "../../../lib/crm/schema.js";
import { startRun } from "../../../lib/engine.js";
import { refreshStatus, inProgress } from "../../../lib/crm/status.js";

// Lead Centre API. Only people who can push to the content repo may use it.
//   GET                                  -> { leads, settings, me }   (also refreshes page and video progress)
//   POST   { leads: [ {...} ], render? } -> create one or many; duplicates by store address are skipped
//   PATCH  { id, patch }                 -> edit fields
//          { ids, patch }                -> edit many (stage, owner)
//          { id, addNote }               -> add a note
//          { id, render: true }          -> start the page, deck and video render
//          { id, readName: true }        -> read the brand name from the store
//          { settings }                  -> stages, sources, saved views
//   DELETE { id } | { ids }              -> remove
export const maxDuration = 60;

const deny = () => Response.json({ error: "Sign in to /admin first. Only the Bonsify team can use the Lead Centre." }, { status: 401 });
const bad = (error, status = 400) => Response.json({ error }, { status });
const fail = (e) => Response.json({ error: e?.message || "Something went wrong." }, { status: 500 });
const bearer = (request) => (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
const MAX_RENDER = 25;

async function inChunks(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

function withNote(lead, patch, text, by, system = true) {
  const at = patch.updatedAt || new Date().toISOString();
  const notes = [{ at, by, text, system }, ...(lead.notes || [])].slice(0, 200);
  return { ...patch, notes };
}

// Start the engine for one lead. Returns { lead } or { error }.
async function startRender(st, lead, me) {
  if (inProgress(lead)) return { error: "A render is already running for this lead." };
  const slug = slugFromName(lead.brand);
  if (!slug) return { error: "The brand name needs letters or numbers." };
  try {
    const { execution } = await startRun({ url: lead.url, name: lead.brand, contact: lead.poc });
    const now = new Date().toISOString();
    const patch = withNote(lead, { pageStatus: "queued", pageSlug: slug, deckReady: false, engine: { execution, slug, startedAt: now }, updatedAt: now, lastTouch: now }, "Render started: page and deck first, then the video", me.name);
    await st.update(lead.id, patch);
    return { lead: { ...lead, ...patch } };
  } catch (e) { return { error: e.message || "Could not start the render." }; }
}

export async function GET(request) {
  const me = await teamMember(request);
  if (!me) return deny();
  try {
    const st = store();
    const [leads, settings] = await Promise.all([st.list(), loadSettings(st)]);
    // Catch up on renders that are in progress (bounded, so a slow lookup never blocks the page).
    const token = bearer(request);
    const busy = leads.filter(inProgress).slice(0, 15);
    await inChunks(busy, 5, async (lead) => {
      try {
        const r = await refreshStatus(lead, token);
        if (!r) return;
        const patch = r.note ? withNote(lead, { ...r.patch, updatedAt: new Date().toISOString() }, r.note, "Engine") : r.patch;
        await st.update(lead.id, patch);
        Object.assign(lead, patch);
      } catch {}
    });
    leads.sort((a, b) => String(b.lastTouch || "").localeCompare(String(a.lastTouch || "")));
    return Response.json({ leads, settings, me });
  } catch (e) { return fail(e); }
}

export async function POST(request) {
  const me = await teamMember(request);
  if (!me) return deny();
  let body;
  try { body = await request.json(); } catch { return bad("Send a list of leads."); }
  const list = Array.isArray(body?.leads) ? body.leads : [];
  if (!list.length) return bad("Add at least one store address.");
  if (list.length > 300) return bad("Add at most 300 leads at a time.");
  try {
    const st = store();
    const settings = await loadSettings(st);
    const { stages, sources } = settings;
    const added = [], skipped = [], errors = [], renders = [];
    const seen = new Set();
    // Read the real brand name from the store for the first few leads that came without one.
    const guess = (u) => Promise.race([detectName(u).catch(() => ""), new Promise((r) => setTimeout(() => r(""), 5000))]);
    const need = list.filter((x) => x && !String(x.brand || "").trim() && x.url).slice(0, 10);
    const names = new Map(await Promise.all(need.map(async (x) => [x, await guess(String(x.url))])));
    const newSources = new Set();
    for (const raw of list) {
      if (names.get(raw)) raw.brand = names.get(raw);
      const r = newLead(raw, { by: me.name, stages, sources });
      if (r.error) { errors.push({ url: String(raw?.url || ""), error: r.error }); continue; }
      if (seen.has(r.lead.id)) { skipped.push({ id: r.lead.id, url: r.lead.url, reason: "listed twice" }); continue; }
      seen.add(r.lead.id);
      const ok = await st.create(r.lead);
      if (ok) { added.push(r.lead); if (!sources.some((s) => s.toLowerCase() === r.lead.source.toLowerCase())) newSources.add(r.lead.source); }
      else skipped.push({ id: r.lead.id, url: r.lead.url, reason: "already a lead" });
    }
    // A source that came in with an import joins the list, so it shows up in filters and menus.
    if (newSources.size) { const c = cleanSettings({ sources: [...sources, ...newSources] }, settings); if (c.settings) await st.setSettings(c.settings); }
    // Optionally start the engine for what was just added.
    if (body?.render && added.length) {
      for (const lead of added.slice(0, MAX_RENDER)) {
        const r = await startRender(st, lead, me);
        if (r.lead) { Object.assign(lead, r.lead); renders.push(lead.id); }
        else errors.push({ url: lead.url, error: `Added, but the render did not start: ${r.error}` });
      }
      if (added.length > MAX_RENDER) errors.push({ url: "", error: `Only the first ${MAX_RENDER} renders were started. Start the rest from each lead.` });
    }
    return Response.json({ added, skipped, errors, renders });
  } catch (e) { return fail(e); }
}

export async function PATCH(request) {
  const me = await teamMember(request);
  if (!me) return deny();
  let body;
  try { body = await request.json(); } catch { return bad("Bad request."); }
  try {
    const st = store();
    const settings = await loadSettings(st);
    if (body?.settings) {
      const r = cleanSettings(body.settings, settings);
      if (r.error) return bad(r.error);
      await st.setSettings(r.settings);
      return Response.json({ settings: r.settings });
    }

    // Edit many leads at once.
    if (Array.isArray(body?.ids)) {
      const ids = [...new Set(body.ids.map(String))].slice(0, 300);
      if (!ids.length) return bad("Pick at least one lead.");
      const r0 = applyPatch(body.patch, { stages: settings.stages });
      if (r0.error) return bad(r0.error);
      const out = await inChunks(ids, 10, async (id) => {
        const lead = await st.get(id);
        if (!lead) return null;
        let patch = r0.patch;
        if (patch.stage && patch.stage !== lead.stage) patch = withNote(lead, patch, `Stage changed from ${lead.stage} to ${patch.stage}`, me.name);
        await st.update(id, patch);
        return { ...lead, ...patch };
      });
      return Response.json({ leads: out.filter(Boolean) });
    }

    const id = String(body?.id || "");
    if (!id) return bad("Which lead?");
    const lead = await st.get(id);
    if (!lead) return bad("That lead no longer exists.", 404);

    if (body?.addNote !== undefined) {
      const text = String(body.addNote || "").trim().slice(0, 1000);
      if (!text) return bad("Write something first.");
      const now = new Date().toISOString();
      const patch = withNote(lead, { lastTouch: now, updatedAt: now }, text, me.name, false);
      await st.update(id, patch);
      return Response.json({ lead: { ...lead, ...patch } });
    }

    if (body?.render) {
      const r = await startRender(st, lead, me);
      if (r.error) return bad(r.error, 409);
      return Response.json({ lead: r.lead });
    }

    if (body?.readName) {
      const name = String(await detectName(lead.url).catch(() => "")).slice(0, 80);
      if (!name) return bad("Could not read a name from that store.");
      const now = new Date().toISOString();
      const patch = { brand: name, updatedAt: now };
      await st.update(id, patch);
      return Response.json({ lead: { ...lead, ...patch } });
    }

    const r = applyPatch(body?.patch, { stages: settings.stages });
    if (r.error) return bad(r.error);
    let patch = r.patch;
    if (patch.stage && patch.stage !== lead.stage) patch = withNote(lead, patch, `Stage changed from ${lead.stage} to ${patch.stage}`, me.name);
    await st.update(id, patch);
    return Response.json({ lead: { ...lead, ...patch } });
  } catch (e) { return fail(e); }
}

export async function DELETE(request) {
  const me = await teamMember(request);
  if (!me) return deny();
  let body;
  try { body = await request.json(); } catch { return bad("Bad request."); }
  const ids = Array.isArray(body?.ids) ? [...new Set(body.ids.map(String))].slice(0, 300) : body?.id ? [String(body.id)] : [];
  if (!ids.length) return bad("Which lead?");
  try {
    const st = store();
    await inChunks(ids, 10, (id) => st.remove(id));
    return Response.json({ ok: true, removed: ids.length });
  } catch (e) { return fail(e); }
}
