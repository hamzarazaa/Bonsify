// Website forms feed the Lead Centre. Called by the homepage and contact form routes AFTER the Sheet and
// Formspree writes. It never throws and never delays the visitor for long: a failure here is only logged,
// so the forms keep working exactly as before even if the Lead Centre storage is down or not set up.
import { store, loadSettings } from "./store.js";
import { newLead, hostOf, idFromHost } from "./schema.js";

const clip = (v, n) => String(v ?? "").trim().slice(0, n);

// kind: "home" | "contact"
export async function recordEnquiry({ kind, url, name, email, phone, brandName, message, topic }) {
  try {
    if (process.env.CRM_INTAKE === "0") return { skipped: "off" };
    const host = hostOf(clip(url, 300));
    if (!host) return { skipped: "no store address" };
    const st = store();
    const settings = await loadSettings(st);
    const source = kind === "contact" ? "Contact page" : "Homepage enquiry";
    const by = "Website";
    const now = new Date();
    const iso = now.toISOString();
    const what = kind === "contact"
      ? `Sent a message from the contact page${topic ? ` (${clip(topic, 60)})` : ""}${message ? `: ${clip(message, 300)}` : ""}`
      : "Filled in the homepage form";
    const id = idFromHost(host);
    const existing = await st.get(id);
    if (existing) {
      const patch = { notes: [{ at: iso, by, text: what, system: true }, ...(existing.notes || [])].slice(0, 200), lastTouch: iso, updatedAt: iso };
      if (!existing.pocEmail && email) patch.pocEmail = clip(email, 120);
      if (!existing.poc && name) patch.poc = clip(name, 80);
      if (!existing.pocPhone && phone) patch.pocPhone = clip(phone, 40);
      await st.update(id, patch);
      return { updated: id };
    }
    const src = settings.sources.includes(source) ? source : settings.sources[0];
    const { lead, error } = newLead(
      { url, brand: clip(brandName, 80), poc: clip(name, 80), pocEmail: clip(email, 120), pocPhone: clip(phone, 40), source: src, note: kind === "contact" ? clip(message, 600) : "" },
      { by, stages: settings.stages, sources: settings.sources, now },
    );
    if (error) return { skipped: error };
    lead.notes = [{ at: iso, by, text: what, system: true }];
    lead.owner = "";
    const made = await st.create(lead);
    return made ? { created: lead.id } : { updated: lead.id };
  } catch (e) {
    console.error("CRM_INTAKE_FAILED " + String(e?.message || e).slice(0, 200));
    return { skipped: "error" };
  }
}
