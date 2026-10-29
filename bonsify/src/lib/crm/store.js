// Lead storage. Firestore in production (REST, using the service account in GCP_SA_KEY),
// a JSON file for local development and tests (CRM_STORE=file).
import fs from "node:fs";
import { googleToken } from "../gcp.js";
import { DEFAULT_STAGES, DEFAULT_SOURCES } from "./schema.js";

const PROJECT = process.env.GCP_PROJECT || "bonsify-engine";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

// ---------- Firestore value encoding ----------
export function enc(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } };
}
export function dec(f) {
  if ("nullValue" in f) return null;
  if ("booleanValue" in f) return f.booleanValue;
  if ("integerValue" in f) return Number(f.integerValue);
  if ("doubleValue" in f) return f.doubleValue;
  if ("stringValue" in f) return f.stringValue;
  if ("timestampValue" in f) return f.timestampValue;
  if ("arrayValue" in f) return (f.arrayValue.values || []).map(dec);
  if ("mapValue" in f) return Object.fromEntries(Object.entries(f.mapValue.fields || {}).map(([k, x]) => [k, dec(x)]));
  return null;
}
const fields = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, enc(v)]));
const unfields = (doc) => ({ id: doc.name.split("/").pop(), ...Object.fromEntries(Object.entries(doc.fields || {}).map(([k, x]) => [k, dec(x)])) });

async function fs_(method, path, body) {
  const t = await googleToken();
  const r = await fetch(`${BASE}${path}`, { method, headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const j = r.status === 204 ? {} : await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error?.message || `Firestore ${r.status}`); e.status = r.status; throw e; }
  return j;
}

const firestore = {
  async list() {
    const out = []; let token = "";
    do {
      const j = await fs_("GET", `/leads?pageSize=300${token ? `&pageToken=${encodeURIComponent(token)}` : ""}`);
      for (const d of j.documents || []) out.push(unfields(d));
      token = j.nextPageToken || "";
    } while (token);
    return out;
  },
  async get(id) { try { return unfields(await fs_("GET", `/leads/${encodeURIComponent(id)}`)); } catch (e) { if (e.status === 404) return null; throw e; } },
  async create(lead) {
    const { id, ...rest } = lead;
    try { await fs_("POST", `/leads?documentId=${encodeURIComponent(id)}`, { fields: fields(rest) }); return true; }
    catch (e) { if (e.status === 409) return false; throw e; }
  },
  async update(id, patch) {
    const mask = Object.keys(patch).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
    await fs_("PATCH", `/leads/${encodeURIComponent(id)}?${mask}&currentDocument.exists=true`, { fields: fields(patch) });
  },
  async remove(id) { await fs_("DELETE", `/leads/${encodeURIComponent(id)}`); },
  async getSettings() {
    try { const d = unfields(await fs_("GET", "/meta/settings")); return { stages: d.stages, sources: d.sources, views: d.views || [] }; }
    catch (e) { if (e.status === 404) return null; throw e; }
  },
  async setSettings(s) { await fs_("PATCH", "/meta/settings", { fields: fields(s) }); },
};

// ---------- file store (dev and tests) ----------
const FILE = () => process.env.CRM_FILE || "/tmp/bonsify-crm.json";
const read = () => { try { return JSON.parse(fs.readFileSync(FILE(), "utf8")); } catch { return { leads: {}, settings: null }; } };
const write = (d) => fs.writeFileSync(FILE(), JSON.stringify(d, null, 1));
const file = {
  async list() { return Object.values(read().leads); },
  async get(id) { return read().leads[id] || null; },
  async create(lead) { const d = read(); if (d.leads[lead.id]) return false; d.leads[lead.id] = lead; write(d); return true; },
  async update(id, patch) { const d = read(); if (!d.leads[id]) { const e = new Error("not found"); e.status = 404; throw e; } d.leads[id] = { ...d.leads[id], ...patch }; write(d); },
  async remove(id) { const d = read(); delete d.leads[id]; write(d); },
  async getSettings() { return read().settings; },
  async setSettings(s) { const d = read(); d.settings = s; write(d); },
};

export const store = () => (process.env.CRM_STORE === "file" && process.env.NODE_ENV !== "production" ? file : firestore);

export async function loadSettings(st = store()) {
  const s = await st.getSettings();
  return { stages: s?.stages?.length ? s.stages : DEFAULT_STAGES, sources: s?.sources?.length ? s.sources : DEFAULT_SOURCES, views: s?.views || [] };
}
