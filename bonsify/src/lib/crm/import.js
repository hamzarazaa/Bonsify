// Turns pasted text or a CSV file into lead rows, and tells the person what will happen to each row
// before anything is saved. Pure functions, no network.
import { hostOf, idFromHost } from "./schema.js";

const HEAD = {
  url: /^(url|store|website|site|domain|link|address|store ?(url|address)|web ?(site|address))$/i,
  brand: /^(brand|name|company|business|store ?name|brand ?name)$/i,
  poc: /^(contact|poc|person|contact ?(person|name)|point of contact)$/i,
  pocEmail: /^e-?mail/i,
  pocPhone: /^(phone|mobile|tel|whatsapp)/i,
  source: /^source$/i,
  stage: /^(stage|status)$/i,
  owner: /^owner$/i,
  note: /^(note|notes|about|info)$/i,
};

// Split text into rows of cells. Tabs when the text has them (copied from Sheets or Excel), otherwise commas
// with quotes handled the usual CSV way.
export function parseCells(text) {
  const t = String(text || "").replace(/^\uFEFF/, "");
  const anyTab = t.includes("\t");
  // A tab-separated paste can still contain a loose "store, name" line: those split on the comma.
  let lineTab = anyTab, lineStart = true;
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (lineStart) { const e = t.slice(i).search(/[\r\n]/); lineTab = anyTab && t.slice(i, e < 0 ? undefined : i + e).includes("\t"); lineStart = false; }
    const delim = lineTab ? "\t" : ",";
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"' && cell === "") q = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim())) rows.push(row.map((x) => x.trim()));
      row = []; lineStart = true;
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row.map((x) => x.trim()));
  return rows;
}

const bullet = (s) => s.replace(/^\s*(?:[-*\u2022]|\d+[.)])\s+/, "");
const looksLikeHost = (s) => !!hostOf(s) && !/\s/.test(s) && !s.includes("@");

export function parseImport(text) {
  const cells = parseCells(text);
  if (!cells.length) return [];
  // A header row names its columns.
  const headMap = {};
  const first = cells[0];
  const isHeader = first.some((c) => HEAD.url.test(c.trim()));
  if (isHeader) {
    first.forEach((c, i) => { for (const [k, re] of Object.entries(HEAD)) if (re.test(c.trim()) && headMap[k] === undefined) headMap[k] = i; });
  }
  const body = isHeader ? cells.slice(1) : cells;
  const out = [];
  body.forEach((r, n) => {
    const line = n + 1 + (isHeader ? 1 : 0);
    const get = (k) => (headMap[k] !== undefined ? r[headMap[k]] || "" : "");
    if (isHeader) {
      out.push({ line, url: get("url"), brand: get("brand"), poc: get("poc"), pocEmail: get("pocEmail"), pocPhone: get("pocPhone"), source: get("source"), stage: get("stage"), owner: get("owner"), note: get("note") });
      return;
    }
    const cleaned = r.map((x, i) => (i === 0 ? bullet(x) : x));
    let ui = cleaned.findIndex(looksLikeHost);
    if (ui < 0) ui = 0;
    const rest = cleaned.filter((_, i) => i !== ui);
    const email = rest.find((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));
    const others = rest.filter((x) => x && x !== email);
    out.push({ line, url: cleaned[ui] || "", brand: "", poc: others[0] || "", pocEmail: email || "", pocPhone: "", source: others[1] || "", stage: "", owner: "", note: "" });
  });
  return out;
}

// What will happen to each row. existingIds are the ids of leads that already exist.
export function classify(rows, { existingIds = new Set(), stages = [], sources = [] } = {}) {
  const seen = new Set();
  const stageNames = new Map(stages.map((s) => [s.name.toLowerCase(), s.name]));
  const sourceNames = new Map(sources.map((s) => [s.toLowerCase(), s]));
  return rows.map((r) => {
    const host = hostOf(r.url);
    if (!host) return { ...r, status: "invalid", note2: "Not a public store address" };
    const id = idFromHost(host);
    let stage = r.stage;
    if (stage) {
      const m = stageNames.get(stage.toLowerCase());
      if (!m) return { ...r, host, id, status: "badstage", note2: `Unknown stage "${stage}"` };
      stage = m;
    }
    const source = r.source ? sourceNames.get(r.source.toLowerCase()) || r.source : "";
    if (existingIds.has(id)) return { ...r, host, id, stage, source, status: "duplicate", note2: "Already a lead" };
    if (seen.has(id)) return { ...r, host, id, stage, source, status: "twice", note2: "Listed twice" };
    seen.add(id);
    return { ...r, host, id, stage, source, status: "new", note2: "" };
  });
}

export const summarize = (rows) => ({
  fresh: rows.filter((r) => r.status === "new").length,
  skipped: rows.filter((r) => r.status === "duplicate" || r.status === "twice").length,
  invalid: rows.filter((r) => r.status === "invalid" || r.status === "badstage").length,
});
