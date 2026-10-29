// Lead Centre data rules. Pure functions, no network, so they are easy to test.

export const DEFAULT_STAGES = [
  { name: "Open", color: "#2F4252" },
  { name: "Contacted", color: "#B5603B" },
  { name: "Follow up", color: "#C9902B" },
  { name: "Meeting set", color: "#4C8A5A" },
  { name: "Converted", color: "#1D4228" },
  { name: "On hold", color: "#9A978E" },
  { name: "Dead / DNR", color: "#7A2A25" },
];
export const DEFAULT_SOURCES = ["Self-added", "Homepage enquiry", "Contact page", "Import"];
export const EXTRA_COLORS = ["#5B6FA8", "#A8527A", "#2E8B8B", "#8A6D2F", "#6A4C93", "#3F7D20"];

export const PAGE_STATES = ["none", "queued", "deck", "ready", "failed"];

const clip = (v, n) => String(v ?? "").trim().slice(0, n);

export function hostOf(input) {
  try {
    const u = new URL(/^https?:\/\//i.test(String(input).trim()) ? String(input).trim() : `https://${String(input).trim()}`);
    const h = u.hostname.toLowerCase().replace(/^www\./, "");
    if (!h.includes(".") || /^\d+(\.\d+){3}$/.test(h) || /(^|\.)(local|localhost|internal|lan|home|corp)$/.test(h)) return null;
    return h;
  } catch { return null; }
}

export const idFromHost = (host) => host.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function brandFromHost(host) {
  return host.split(".")[0].split(/[-_]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export const slugFromName = (name) => String(name || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Fields a person may edit after a lead exists.
export const EDITABLE = {
  brand: 80, poc: 80, pocEmail: 120, pocPhone: 40, source: 40, owner: 60, note: 600, nextFollowUp: 20, stage: 40,
};

export function newLead(input, { by = "", stages = DEFAULT_STAGES, sources = DEFAULT_SOURCES, now = new Date() } = {}) {
  const url = clip(input?.url, 300);
  const host = hostOf(url);
  if (!host) return { error: "That does not look like a public store address." };
  const stage = clip(input?.stage, 40) || stages[0].name;
  if (!stages.some((s) => s.name === stage)) return { error: `Unknown stage "${stage}".` };
  const source = clip(input?.source, 40) || sources[0];
  const iso = now.toISOString();
  return {
    lead: {
      id: idFromHost(host),
      host,
      url: `https://${host}`,
      brand: clip(input?.brand, 80) || brandFromHost(host),
      stage,
      source,
      poc: clip(input?.poc, 80),
      pocEmail: clip(input?.pocEmail, 120),
      pocPhone: clip(input?.pocPhone, 40),
      owner: clip(input?.owner, 60) || by,
      note: clip(input?.note, 600),
      nextFollowUp: clip(input?.nextFollowUp, 20),
      pageStatus: "none",
      pageSlug: "",
      createdAt: iso,
      updatedAt: iso,
      lastTouch: iso,
      createdBy: by,
      notes: [],
    },
  };
}

export function applyPatch(patch, { stages = DEFAULT_STAGES, now = new Date() } = {}) {
  const out = {};
  for (const [k, max] of Object.entries(EDITABLE)) {
    if (patch?.[k] === undefined) continue;
    out[k] = clip(patch[k], max);
  }
  if (out.brand === "") return { error: "A lead needs a name." };
  if (out.stage !== undefined && !stages.some((s) => s.name === out.stage)) return { error: `Unknown stage "${out.stage}".` };
  if (out.nextFollowUp && !/^\d{4}-\d{2}-\d{2}$/.test(out.nextFollowUp)) return { error: "Follow-up date must look like 2026-11-05." };
  if (!Object.keys(out).length) return { error: "Nothing to change." };
  const iso = now.toISOString();
  out.updatedAt = iso;
  out.lastTouch = iso;
  return { patch: out };
}

// Settings: custom stages and sources added with the + button.
export function cleanSettings(input, current) {
  const stages = Array.isArray(input?.stages) ? input.stages : current.stages;
  const sources = Array.isArray(input?.sources) ? input.sources : current.sources;
  const seen = new Set();
  const outStages = [];
  for (const s of stages) {
    const name = clip(s?.name, 40);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    outStages.push({ name, color: /^#[0-9a-fA-F]{6}$/.test(s?.color || "") ? s.color : EXTRA_COLORS[outStages.length % EXTRA_COLORS.length] });
  }
  if (outStages.length < 2) return { error: "Keep at least two stages." };
  const seenS = new Set();
  const outSources = [];
  for (const s of sources) {
    const name = clip(typeof s === "string" ? s : s?.name, 40);
    if (!name || seenS.has(name.toLowerCase())) continue;
    seenS.add(name.toLowerCase());
    outSources.push(name);
  }
  if (!outSources.length) return { error: "Keep at least one source." };
  return { settings: { stages: outStages.slice(0, 20), sources: outSources.slice(0, 20) } };
}
