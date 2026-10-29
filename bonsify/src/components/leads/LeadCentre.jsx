"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import s from "./leads.module.css";

// Lead Centre, sprint 1: table view, add leads (one or several), edit in a side panel, notes.
// Uses the GitLab token the /admin editor already holds; the API checks it again on every call.

const PAGE = { none: ["Not started", "#9A978E"], queued: ["Queued", "#9A978E"], deck: ["Deck ready, video coming", "#C9902B"], ready: ["Deck and video ready", "#4C8A5A"], failed: ["Needs a look", "#B3261E"] };
const NEW = "__new";

function token() {
  try {
    const u = JSON.parse(localStorage.getItem("decap-cms-user") || localStorage.getItem("netlify-cms-user") || "{}");
    return u.token || (process.env.NEXT_PUBLIC_CRM_DEV === "1" ? "dev" : "");
  } catch { return ""; }
}

async function api(method, body) {
  const r = await fetch("/api/leads", { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || "Something went wrong."); e.status = r.status; throw e; }
  return j;
}

const initials = (n) => (n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
const TILES = ["#14171A", "#B5603B", "#6B8F71", "#44614A", "#96502F", "#2F4252", "#7A3E20", "#5C5A52", "#1D4228"];
const tileOf = (id) => TILES[[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % TILES.length];
const tint = (hex) => `${hex}22`;
function ago(iso) {
  if (!iso) return "";
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return "Today";
  if (d < 2) return "Yesterday";
  if (d < 14) return `${Math.floor(d)} days ago`;
  return `${Math.floor(d / 7)} weeks ago`;
}

function Icon({ d, size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={d} /></svg>;
}

// A select with a "+ New..." entry that lets you type a new value (stage or source).
function AddableSelect({ id, label, value, options, onChange, onCreate, what }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  if (adding) {
    return (
      <div className={s.fld}>
        <label className={s.lbl} htmlFor={`${id}-new`}>New {what}</label>
        <div style={{ display: "flex", gap: 6 }}>
          <input id={`${id}-new`} className={s.input} style={{ flex: 1, minWidth: 0 }} value={text} autoFocus onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (text.trim()) { onCreate(text.trim()); setAdding(false); setText(""); } } if (e.key === "Escape") setAdding(false); }} />
          <button type="button" className={s.btn} style={{ padding: "0 12px" }} onClick={() => { if (text.trim()) { onCreate(text.trim()); setAdding(false); setText(""); } }}>Add</button>
        </div>
      </div>
    );
  }
  return (
    <div className={s.fld}>
      <label className={s.lbl} htmlFor={id}>{label}</label>
      <select id={id} className={s.sel} value={value} onChange={(e) => (e.target.value === NEW ? setAdding(true) : onChange(e.target.value))}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value={NEW}>+ New {what}...</option>
      </select>
    </div>
  );
}

const blankRow = (stage, source) => ({ url: "", brand: "", poc: "", stage, source });

export default function LeadCentre() {
  const [state, setState] = useState({ status: "loading", leads: [], settings: null, me: null, error: "" });
  const [q, setQ] = useState("");
  const [fStage, setFStage] = useState("");
  const [fSource, setFSource] = useState("");
  const [fOwner, setFOwner] = useState("");
  const [sort, setSort] = useState({ key: "lastTouch", dir: -1 });
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState("");
  const [toast, setToast] = useState("");

  const say = useCallback((m) => { setToast(m); setTimeout(() => setToast(""), 4000); }, []);

  const load = useCallback(async () => {
    if (!token()) { setState((p) => ({ ...p, status: "signin" })); return; }
    try {
      const j = await api("GET");
      setState({ status: "ready", leads: j.leads, settings: j.settings, me: j.me, error: "" });
    } catch (e) {
      setState((p) => ({ ...p, status: e.status === 401 ? "signin" : "error", error: e.message }));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const { leads, settings } = state;
  const stageColor = useCallback((name) => settings?.stages.find((x) => x.name === name)?.color || "#9A978E", [settings]);

  const owners = useMemo(() => [...new Set(leads.map((l) => l.owner).filter(Boolean))].sort(), [leads]);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = leads.filter((l) =>
      (!fStage || l.stage === fStage) && (!fSource || l.source === fSource) && (!fOwner || l.owner === fOwner) &&
      (!needle || [l.brand, l.host, l.poc, l.pocEmail, l.note].some((v) => String(v || "").toLowerCase().includes(needle))));
    const { key, dir } = sort;
    const stageIdx = (n) => settings?.stages.findIndex((x) => x.name === n) ?? 0;
    return list.sort((a, b) => {
      const av = key === "stage" ? stageIdx(a.stage) : String(a[key] || "").toLowerCase();
      const bv = key === "stage" ? stageIdx(b.stage) : String(b[key] || "").toLowerCase();
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }, [leads, q, fStage, fSource, fOwner, sort, settings]);

  const kpis = useMemo(() => {
    const n = (...names) => leads.filter((l) => names.includes(l.stage)).length;
    return [["Open", n("Open")], ["In conversation", n("Contacted", "Follow up")], ["Meetings set", n("Meeting set")], ["Converted", n("Converted")]];
  }, [leads]);

  const open = leads.find((l) => l.id === openId);
  const replace = (lead) => setState((p) => ({ ...p, leads: p.leads.map((l) => (l.id === lead.id ? lead : l)) }));

  async function patch(id, p) {
    try { const j = await api("PATCH", { id, patch: p }); replace(j.lead); return true; }
    catch (e) { say(e.message); return false; }
  }
  async function saveSettings(next) {
    try { const j = await api("PATCH", { settings: next }); setState((p) => ({ ...p, settings: j.settings })); return j.settings; }
    catch (e) { say(e.message); return null; }
  }
  const addStage = async (name) => { const ns = await saveSettings({ ...settings, stages: [...settings.stages, { name }] }); return ns ? ns.stages.find((x) => x.name.toLowerCase() === name.toLowerCase())?.name : null; };
  const addSource = async (name) => { const ns = await saveSettings({ ...settings, sources: [...settings.sources, name] }); return ns ? ns.sources.find((x) => x.toLowerCase() === name.toLowerCase()) : null; };

  if (state.status === "loading") return <div className={s.app}><div className={s.gate}>Loading leads...</div></div>;
  if (state.status === "signin") {
    return (
      <div className={s.app}>
        <div className={s.gate}>
          <h1 className={s.h1}>Lead Centre</h1>
          <p className={s.mute}>Sign in to the content manager first. It uses the same GitLab login, then come back here.</p>
          <a className={`${s.btn} ${s.primary}`} href="/admin/" style={{ textDecoration: "none" }}>Go to /admin</a>
        </div>
      </div>
    );
  }
  if (state.status === "error") return <div className={s.app}><div className={s.gate}><p className={s.error}>{state.error}</p><button className={s.btn} onClick={load}>Try again</button></div></div>;

  const th = (key, label) => (
    <button className={s.th} onClick={() => setSort((p) => ({ key, dir: p.key === key ? -p.dir : 1 }))} aria-label={`Sort by ${label}`}>
      {label}{sort.key === key ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
    </button>
  );

  return (
    <div className={s.app}>
      <aside className={s.side}>
        <div className={s.logo}>Bonsify</div>
        <nav className={s.nav} aria-label="Admin">
          <a href="/leads" aria-current="page"><Icon d="M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a3 3 0 100-6M21 20c0-2.6-1.4-4.600-3.500-5.500" />Leads</a>
          <a href="/admin/"><Icon d="M4 4h16v16H4zM4 9h16" />Content manager</a>
        </nav>
        <div className={s.me}><span className={s.avatar} aria-hidden="true">{initials(state.me?.name)}</span><span style={{ lineHeight: 1.3 }}><b style={{ color: "#fff" }}>{state.me?.name || "Team"}</b><br /><span style={{ fontSize: 12, color: "#A9A394" }}>Signed in with GitLab</span></span></div>
      </aside>

      <main className={s.main}>
        <header className={s.head}>
          <h1 className={s.h1}>Leads</h1>
          <span className={s.count}>{leads.length}</span>
          <div className={s.spacer}>
            <button className={`${s.btn} ${s.primary}`} onClick={() => setAdding(true)}><Icon d="M12 5v14M5 12h14" size={16} />Add lead</button>
          </div>
        </header>

        <section className={s.kpis} aria-label="Summary">
          {kpis.map(([l, v]) => <div key={l} className={s.kpi}><span className={s.kpiL}>{l}</span><span className={s.kpiV}>{v}</span></div>)}
        </section>

        <section className={s.bar}>
          <div className={s.tabs} role="tablist" aria-label="View">
            <button role="tab" aria-selected="true" className={`${s.tab} ${s.tabOn}`}>Table</button>
            <button role="tab" aria-selected="false" className={s.tab} disabled title="Board view comes in the next sprint" style={{ opacity: 0.5, cursor: "default" }}>Board</button>
          </div>
          <label className={s.visually} htmlFor="q">Search leads</label>
          <input id="q" className={`${s.input} ${s.search}`} placeholder="Search brand, contact, address" value={q} onChange={(e) => setQ(e.target.value)} />
          <select aria-label="Filter by stage" className={s.sel} value={fStage} onChange={(e) => setFStage(e.target.value)}><option value="">Stage: any</option>{settings.stages.map((x) => <option key={x.name}>{x.name}</option>)}</select>
          <select aria-label="Filter by source" className={s.sel} value={fSource} onChange={(e) => setFSource(e.target.value)}><option value="">Source: any</option>{settings.sources.map((x) => <option key={x}>{x}</option>)}</select>
          <select aria-label="Filter by owner" className={s.sel} value={fOwner} onChange={(e) => setFOwner(e.target.value)}><option value="">Owner: anyone</option>{owners.map((x) => <option key={x}>{x}</option>)}</select>
          {(q || fStage || fSource || fOwner) && <button className={s.btn} onClick={() => { setQ(""); setFStage(""); setFSource(""); setFOwner(""); }}>Clear</button>}
        </section>

        <section className={s.card}>
          {rows.length === 0 ? (
            <div className={s.empty}>
              <b style={{ color: "#14171A", fontSize: 16 }}>{leads.length ? "No leads match these filters" : "No leads yet"}</b>
              <span>{leads.length ? "Try clearing a filter." : "Add the first one with the button above."}</span>
              {!leads.length && <button className={`${s.btn} ${s.primary}`} onClick={() => setAdding(true)}>Add lead</button>}
            </div>
          ) : (
            <div role="table" aria-label="Leads">
              <div className={`${s.grid} ${s.thead}`} role="row">
                <span role="columnheader">{th("brand", "Brand")}</span><span role="columnheader">{th("stage", "Stage")}</span><span role="columnheader">{th("poc", "Contact")}</span>
                <span role="columnheader">{th("source", "Source")}</span><span role="columnheader">Page and video</span><span role="columnheader">{th("lastTouch", "Last touch")}</span><span role="columnheader">{th("owner", "Owner")}</span>
              </div>
              {rows.map((l) => {
                const ps = PAGE[l.pageStatus] || PAGE.none;
                const sc = stageColor(l.stage);
                return (
                  <button key={l.id} className={`${s.grid} ${s.row}`} role="row" onClick={() => setOpenId(l.id)} aria-label={`Open ${l.brand}`}>
                    <span className={s.brandCell} role="cell"><span className={s.tile} style={{ background: tileOf(l.id) }}>{initials(l.brand)}</span><span style={{ minWidth: 0 }}><span className={s.brandName}>{l.brand}</span><span className={s.sub}>{l.host}</span></span></span>
                    <span role="cell"><span className={s.pill} style={{ background: tint(sc), color: sc }}>{l.stage}</span></span>
                    <span className={s.cell} role="cell">{l.poc || <span className={s.mute}>Not set</span>}</span>
                    <span className={`${s.cell} ${s.mute}`} role="cell">{l.source}</span>
                    <span className={s.cell} role="cell"><span className={s.dot} style={{ background: ps[1] }} />{ps[0]}</span>
                    <span className={`${s.cell} ${s.mute}`} role="cell">{ago(l.lastTouch)}</span>
                    <span role="cell"><span className={s.avatar} style={{ background: "#EAE3D3", color: "#14171A", width: 28, height: 28, fontSize: 12 }} title={l.owner}>{initials(l.owner)}</span></span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {adding && <AddModal settings={settings} me={state.me} addStage={addStage} addSource={addSource} onClose={() => setAdding(false)} onDone={(res) => { setAdding(false); load(); say(`${res.added.length} added${res.skipped.length ? `, ${res.skipped.length} skipped (already leads)` : ""}${res.errors.length ? `, ${res.errors.length} not valid` : ""}`); }} />}
      {open && <Panel lead={open} settings={settings} stageColor={stageColor} addStage={addStage} addSource={addSource} onClose={() => setOpenId("")} patch={patch} replace={replace} say={say}
        onDelete={async () => { if (!confirm(`Delete ${open.brand}? This cannot be undone.`)) return; try { await api("DELETE", { id: open.id }); setOpenId(""); load(); say("Lead deleted"); } catch (e) { say(e.message); } }} />}
      {toast && <div className={s.toast} role="status">{toast}</div>}
    </div>
  );
}

function AddModal({ settings, me, addStage, addSource, onClose, onDone }) {
  const [rows, setRows] = useState([blankRow(settings.stages[0].name, settings.sources[0])]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (i, k, v) => setRows((p) => p.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const filled = rows.filter((r) => r.url.trim());
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  async function submit() {
    if (!filled.length) { setErr("Add at least one store address."); return; }
    setBusy(true); setErr("");
    try { onDone(await api("POST", { leads: filled })); }
    catch (e) { setErr(e.message); setBusy(false); }
  }
  return (
    <div className={s.scrim} role="dialog" aria-modal="true" aria-label="Add leads">
      <div className={s.modal}>
        <div className={s.mHead}><h2 className={s.h1} style={{ fontSize: 24, margin: 0 }}>Add leads</h2><button className={s.iconBtn} style={{ marginLeft: "auto", border: 0 }} onClick={onClose} aria-label="Close"><Icon d="M6 6l12 12M18 6L6 18" /></button></div>
        <div className={s.mBody}>
          {rows.map((r, i) => (
            <div key={i} className={s.addRow}>
              <div className={s.fld}><label className={s.lbl} htmlFor={`u${i}`}>Store address</label><input id={`u${i}`} className={s.input} placeholder="brandstore.com" value={r.url} autoFocus={i === rows.length - 1} onChange={(e) => set(i, "url", e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && r.url.trim()) { e.preventDefault(); setRows((p) => [...p, blankRow(r.stage, r.source)]); } }} /></div>
              <div className={s.fld}><label className={s.lbl} htmlFor={`b${i}`}>Brand name</label><input id={`b${i}`} className={s.input} placeholder="Optional" value={r.brand} onChange={(e) => set(i, "brand", e.target.value)} /></div>
              <div className={s.fld}><label className={s.lbl} htmlFor={`p${i}`}>Contact</label><input id={`p${i}`} className={s.input} placeholder="Optional" value={r.poc} onChange={(e) => set(i, "poc", e.target.value)} /></div>
              <AddableSelect id={`s${i}`} label="Stage" what="stage" value={r.stage} options={settings.stages.map((x) => x.name)} onChange={(v) => set(i, "stage", v)} onCreate={async (n) => { const v = await addStage(n); if (v) set(i, "stage", v); }} />
              <AddableSelect id={`o${i}`} label="Source" what="source" value={r.source} options={settings.sources} onChange={(v) => set(i, "source", v)} onCreate={async (n) => { const v = await addSource(n); if (v) set(i, "source", v); }} />
              <button type="button" className={s.iconBtn} aria-label={`Remove row ${i + 1}`} disabled={rows.length === 1} onClick={() => setRows((p) => p.filter((_, j) => j !== i))} style={{ opacity: rows.length === 1 ? 0.4 : 1 }}><Icon d="M5 12h14" /></button>
            </div>
          ))}
          <div><button type="button" className={s.btn} onClick={() => setRows((p) => [...p, blankRow(p[p.length - 1].stage, p[p.length - 1].source)])}><Icon d="M12 5v14M5 12h14" size={16} />Add another</button></div>
          <p className={s.mute} style={{ margin: 0 }}>Press Enter in the address box to add another row. Owner is set to {me?.name || "you"}. A store that is already a lead is skipped.</p>
          {err && <div className={s.error} role="alert">{err}</div>}
        </div>
        <div className={s.mFoot}>
          <span className={s.mute}>{filled.length} to add</span>
          <button className={s.btn} style={{ marginLeft: "auto" }} onClick={onClose}>Cancel</button>
          <button className={`${s.btn} ${s.primary}`} onClick={submit} disabled={busy}>{busy ? "Adding..." : `Add ${filled.length || ""} lead${filled.length === 1 ? "" : "s"}`}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, value, onSave, type = "text", placeholder }) {
  const [v, setV] = useState(value || "");
  useEffect(() => setV(value || ""), [value]);
  return (
    <div className={s.fld}>
      <label className={s.lbl} htmlFor={id}>{label}</label>
      <input id={id} type={type} className={s.input} value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)}
        onBlur={() => { if (v !== (value || "")) onSave(v); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
    </div>
  );
}

function Panel({ lead, settings, stageColor, addStage, addSource, onClose, patch, replace, say, onDelete }) {
  const [note, setNote] = useState("");
  const [about, setAbout] = useState(lead.note || "");
  useEffect(() => setAbout(lead.note || ""), [lead.id, lead.note]);
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const sc = stageColor(lead.stage);
  async function addNote() {
    if (!note.trim()) return;
    try { const j = await api("PATCH", { id: lead.id, addNote: note }); replace(j.lead); setNote(""); } catch (e) { say(e.message); }
  }
  return (
    <aside className={s.panel} role="dialog" aria-label={lead.brand}>
      <div className={s.mHead}>
        <span className={s.tile} style={{ background: tileOf(lead.id), width: 48, height: 48, fontSize: 16 }}>{initials(lead.brand)}</span>
        <div style={{ lineHeight: 1.35, minWidth: 0 }}><h2 className={s.h1} style={{ fontSize: 24, margin: 0 }}>{lead.brand}</h2><a href={lead.url} target="_blank" rel="noreferrer" style={{ color: "#96502F", fontWeight: 500 }}>{lead.host}</a></div>
        <button className={s.iconBtn} style={{ marginLeft: "auto", border: 0 }} onClick={onClose} aria-label="Close"><Icon d="M6 6l12 12M18 6L6 18" /></button>
      </div>
      <div className={s.pBody}>
        <div className={s.fields}>
          <AddableSelect id="ds" label="Stage" what="stage" value={lead.stage} options={settings.stages.map((x) => x.name)} onChange={(v) => patch(lead.id, { stage: v })} onCreate={async (n) => { const v = await addStage(n); if (v) patch(lead.id, { stage: v }); }} />
          <AddableSelect id="dsrc" label="Source" what="source" value={lead.source} options={settings.sources} onChange={(v) => patch(lead.id, { source: v })} onCreate={async (n) => { const v = await addSource(n); if (v) patch(lead.id, { source: v }); }} />
          <Field id="dbrand" label="Brand name" value={lead.brand} onSave={(v) => patch(lead.id, { brand: v })} />
          <Field id="downer" label="Owner" value={lead.owner} onSave={(v) => patch(lead.id, { owner: v })} />
          <Field id="dpoc" label="Contact person" value={lead.poc} onSave={(v) => patch(lead.id, { poc: v })} />
          <Field id="dphone" label="Phone" value={lead.pocPhone} onSave={(v) => patch(lead.id, { pocPhone: v })} />
          <Field id="demail" label="Email" value={lead.pocEmail} type="email" onSave={(v) => patch(lead.id, { pocEmail: v })} />
          <Field id="dnext" label="Next follow-up" value={lead.nextFollowUp} type="date" onSave={(v) => patch(lead.id, { nextFollowUp: v })} />
        </div>
        <div className={s.fld}>
          <label className={s.lbl} htmlFor="dabout">About the store</label>
          <textarea id="dabout" className={s.textarea} value={about} placeholder="Products, size, what they sell, anything useful" onChange={(e) => setAbout(e.target.value)} onBlur={() => { if (about !== (lead.note || "")) patch(lead.id, { note: about }); }} />
        </div>
        <div>
          <span className={s.pill} style={{ background: tint(sc), color: sc }}>{lead.stage}</span>
          <span className={s.mute} style={{ marginLeft: 10 }}>Added {ago(lead.createdAt).toLowerCase()}{lead.createdBy ? ` by ${lead.createdBy}` : ""}</span>
        </div>
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <b>Activity</b>
          <div style={{ display: "flex", gap: 10 }}>
            <label className={s.visually} htmlFor="dnote">Add a note</label>
            <input id="dnote" className={s.input} style={{ flex: 1, height: 44 }} placeholder="Add a note, call or follow-up" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addNote(); }} />
            <button className={s.btn} style={{ background: "#14171A", color: "#fff", borderColor: "#14171A" }} onClick={addNote}>Add note</button>
          </div>
          {(lead.notes || []).map((n, i) => (
            <div key={i} className={s.note}><span className={s.noteDot} /><span><b style={{ fontWeight: n.system ? 500 : 600 }}>{n.text}</b> <span className={s.mute}>{ago(n.at)}{n.by ? `, ${n.by}` : ""}</span></span></div>
          ))}
          <div className={s.note}><span className={s.noteDot} /><span><b>Lead added</b> <span className={s.mute}>{ago(lead.createdAt)}{lead.createdBy ? `, ${lead.createdBy}` : ""}</span></span></div>
        </section>
      </div>
      <div className={s.mFoot}><button className={s.btn} style={{ color: "#8C1D18" }} onClick={onDelete}>Delete lead</button></div>
    </aside>
  );
}
