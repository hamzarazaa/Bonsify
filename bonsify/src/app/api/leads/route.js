import { teamMember } from "../../../lib/crm/auth.js";
import { store, loadSettings } from "../../../lib/crm/store.js";
import { detectName } from "../../../../scripts/lib/detect-name.mjs";
import { newLead, applyPatch, cleanSettings } from "../../../lib/crm/schema.js";

// Lead Centre API. Only people who can push to the content repo may use it.
//   GET                          -> { leads, settings, me }
//   POST   { leads: [ {...} ] }  -> create one or many (duplicates by store address are skipped)
//   PATCH  { id, patch }         -> edit fields;  { id, addNote }  -> add a note;  { settings } -> stages and sources
//   DELETE { id }                -> remove
export const maxDuration = 30;

const deny = () => Response.json({ error: "Sign in to /admin first. Only the Bonsify team can use the Lead Centre." }, { status: 401 });
const bad = (error, status = 400) => Response.json({ error }, { status });
const fail = (e) => Response.json({ error: e?.message || "Something went wrong." }, { status: 500 });

export async function GET(request) {
  const me = await teamMember(request);
  if (!me) return deny();
  try {
    const st = store();
    const [leads, settings] = await Promise.all([st.list(), loadSettings(st)]);
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
    const { stages, sources } = await loadSettings(st);
    const added = [], skipped = [], errors = [];
    const seen = new Set();
    // Read the real brand name from the store for the first few leads that came without one.
    const guess = (u) => Promise.race([detectName(u).catch(() => ""), new Promise((r) => setTimeout(() => r(""), 5000))]);
    const need = list.filter((x) => x && !String(x.brand || "").trim() && x.url).slice(0, 10);
    const names = new Map(await Promise.all(need.map(async (x) => [x, await guess(String(x.url))])));
    for (const raw of list) {
      if (names.get(raw)) raw.brand = names.get(raw);
      const r = newLead(raw, { by: me.name, stages, sources });
      if (r.error) { errors.push({ url: String(raw?.url || ""), error: r.error }); continue; }
      if (seen.has(r.lead.id)) { skipped.push({ id: r.lead.id, url: r.lead.url, reason: "listed twice" }); continue; }
      seen.add(r.lead.id);
      const ok = await st.create(r.lead);
      if (ok) added.push(r.lead); else skipped.push({ id: r.lead.id, url: r.lead.url, reason: "already a lead" });
    }
    return Response.json({ added, skipped, errors });
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
    const id = String(body?.id || "");
    if (!id) return bad("Which lead?");
    const lead = await st.get(id);
    if (!lead) return bad("That lead no longer exists.", 404);
    if (body?.addNote !== undefined) {
      const text = String(body.addNote || "").trim().slice(0, 1000);
      if (!text) return bad("Write something first.");
      const now = new Date().toISOString();
      const notes = [{ at: now, by: me.name, text }, ...(lead.notes || [])].slice(0, 200);
      await st.update(id, { notes, lastTouch: now, updatedAt: now });
      return Response.json({ lead: { ...lead, notes, lastTouch: now, updatedAt: now } });
    }
    const r = applyPatch(body?.patch, { stages: settings.stages });
    if (r.error) return bad(r.error);
    const notes = [...(lead.notes || [])];
    if (r.patch.stage && r.patch.stage !== lead.stage) notes.unshift({ at: r.patch.updatedAt, by: me.name, text: `Stage changed from ${lead.stage} to ${r.patch.stage}`, system: true });
    const patch = notes.length !== (lead.notes || []).length ? { ...r.patch, notes: notes.slice(0, 200) } : r.patch;
    await st.update(id, patch);
    return Response.json({ lead: { ...lead, ...patch } });
  } catch (e) { return fail(e); }
}

export async function DELETE(request) {
  const me = await teamMember(request);
  if (!me) return deny();
  let body;
  try { body = await request.json(); } catch { return bad("Bad request."); }
  const id = String(body?.id || "");
  if (!id) return bad("Which lead?");
  try { await store().remove(id); return Response.json({ ok: true }); } catch (e) { return fail(e); }
}
