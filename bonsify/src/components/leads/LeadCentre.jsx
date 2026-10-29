"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import s from "./leads.module.css";
import Board from "./Board";
import AddModal from "./AddModal";
import Panel from "./Panel";
import { Icon, ICONS, PAGE, Confirm, api, token, keep, initials, tileOf, tint, ago, niceDate, pageUrl, deckUrl, rendering } from "./shared";
import { isDue, OWNERS } from "../../lib/crm/schema.js";

// Lead Centre: table and board views, add one or many (paste or CSV), edit in a side panel, bulk actions,
// saved views and the page, deck and video render. Uses the GitLab token the /admin editor already holds;
// the API checks it again on every call.

export default function LeadCentre() {
  const [state, setState] = useState({ status: "loading", leads: [], settings: null, me: null, error: "" });
  const [q, setQ] = useState("");
  const [fStage, setFStage] = useState("");
  const [fSource, setFSource] = useState("");
  const [fOwner, setFOwner] = useState("");
  const [fDue, setFDue] = useState(false);
  const [view, setView] = useState("board");
  const [sort, setSort] = useState({ key: "lastTouch", dir: -1 });
  const [activeView, setActiveView] = useState("");
  const [savingView, setSavingView] = useState(false);
  const [viewName, setViewName] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [adding, setAdding] = useState(null); // null | { stage }
  const [openId, setOpenId] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  useEffect(() => { setView(keep.get("view2", "board")); const sv = keep.get("sort", null); if (sv?.key) setSort(sv); }, []);
  useEffect(() => { keep.set("view2", view); }, [view]);
  useEffect(() => { keep.set("sort", sort); }, [sort]);

  const say = useCallback((m) => { setToast(m); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(""), 5000); }, []);

  const load = useCallback(async (silent) => {
    if (!token()) { setState((p) => ({ ...p, status: "signin" })); return; }
    try {
      const j = await api("GET");
      setState({ status: "ready", leads: j.leads, settings: j.settings, me: j.me, error: "" });
    } catch (e) {
      if (silent) return;
      setState((p) => ({ ...p, status: e.status === 401 ? "signin" : "error", error: e.message }));
    }
  }, []);
  useEffect(() => { load(false); }, [load]);

  const { leads, settings } = state;
  const anyRendering = leads.some(rendering);
  useEffect(() => {
    if (!anyRendering) return;
    const t = setInterval(() => load(true), 15000);
    return () => clearInterval(t);
  }, [anyRendering, load]);

  const stageColor = useCallback((name) => settings?.stages.find((x) => x.name === name)?.color || "#9A978E", [settings]);
  const owners = useMemo(() => [...new Set(leads.map((l) => l.owner).filter(Boolean))].sort(), [leads]);
  const dueCount = useMemo(() => leads.filter((l) => isDue(l)).length, [leads]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = leads.filter((l) =>
      (!fStage || l.stage === fStage) && (!fSource || l.source === fSource) && (!fOwner || l.owner === fOwner) && (!fDue || isDue(l)) &&
      (!needle || [l.brand, l.host, l.poc, l.pocEmail, l.note].some((v) => String(v || "").toLowerCase().includes(needle))));
    const { key, dir } = sort;
    const stageIdx = (n) => settings?.stages.findIndex((x) => x.name === n) ?? 0;
    const val = (l) => (key === "stage" ? stageIdx(l.stage) : key === "nextFollowUp" ? l.nextFollowUp || "9999" : String(l[key] || "").toLowerCase());
    return list.sort((a, b) => (val(a) < val(b) ? -dir : val(a) > val(b) ? dir : 0));
  }, [leads, q, fStage, fSource, fOwner, fDue, sort, settings]);

  const kpis = useMemo(() => {
    const n = (...names) => leads.filter((l) => names.includes(l.stage)).length;
    return [["Open", n("Open")], ["In conversation", n("Contacted", "Follow up")], ["Meetings set", n("Meeting set")], ["Converted", n("Converted")]];
  }, [leads]);

  const byId = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);
  const sel = useMemo(() => [...selected].filter((id) => byId.has(id)), [selected, byId]);
  const open = byId.get(openId);
  const filtered = !!(q || fStage || fSource || fOwner || fDue);

  const replace = (lead) => setState((p) => ({ ...p, leads: p.leads.map((l) => (l.id === lead.id ? lead : l)) }));
  const toggle = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOn = rows.length > 0 && rows.every((l) => selected.has(l.id));

  async function patch(id, p) {
    try { const j = await api("PATCH", { id, patch: p }); replace(j.lead); return true; }
    catch (e) { say(e.message); return false; }
  }
  async function move(id, stage) {
    const lead = byId.get(id);
    if (!lead || lead.stage === stage) return;
    replace({ ...lead, stage });
    try { const j = await api("PATCH", { id, patch: { stage } }); replace(j.lead); }
    catch (e) { replace(lead); say(e.message); }
  }
  async function saveSettings(next) {
    try { const j = await api("PATCH", { settings: next }); setState((p) => ({ ...p, settings: j.settings })); return j.settings; }
    catch (e) { say(e.message); return null; }
  }
  const addStage = async (name) => { const ns = await saveSettings({ ...settings, stages: [...settings.stages, { name }] }); return ns ? ns.stages.find((x) => x.name.toLowerCase() === name.toLowerCase())?.name : null; };
  const addSource = async (name) => { const ns = await saveSettings({ ...settings, sources: [...settings.sources, name] }); return ns ? ns.sources.find((x) => x.toLowerCase() === name.toLowerCase()) : null; };

  // Saved views (shared by the team, kept with the stages and sources)
  const currentView = (name) => ({ name, view, q, stage: fStage, source: fSource, owner: fOwner, due: fDue, sortKey: sort.key, sortDir: sort.dir });
  async function saveView() {
    const name = viewName.trim();
    if (!name) return;
    const others = (settings.views || []).filter((v) => v.name.toLowerCase() !== name.toLowerCase());
    const ns = await saveSettings({ ...settings, views: [...others, currentView(name)] });
    if (ns) { setActiveView(name); setSavingView(false); setViewName(""); say(`View "${name}" saved`); }
  }
  function applyView(name) {
    const v = (settings.views || []).find((x) => x.name === name);
    setActiveView(name);
    if (!v) return;
    setView(v.view); setQ(v.q || ""); setFStage(v.stage || ""); setFSource(v.source || ""); setFOwner(v.owner || ""); setFDue(!!v.due); setSort({ key: v.sortKey || "lastTouch", dir: v.sortDir === 1 ? 1 : -1 });
  }
  async function deleteView() {
    const ns = await saveSettings({ ...settings, views: (settings.views || []).filter((v) => v.name !== activeView) });
    if (ns) { say(`View "${activeView}" removed`); setActiveView(""); }
  }
  const touchFilter = (fn) => (e) => { setActiveView(""); fn(e.target.value); };
  const clearFilters = () => { setActiveView(""); setQ(""); setFStage(""); setFSource(""); setFOwner(""); setFDue(false); };

  // Bulk actions
  async function bulkPatch(p, label) {
    try {
      let n = 0;
      for (let i = 0; i < sel.length; i += 300) { const j = await api("PATCH", { ids: sel.slice(i, i + 300), patch: p }); for (const l of j.leads) replace(l); n += j.leads.length; }
      say(`${label} for ${n} lead${n === 1 ? "" : "s"}`);
    }
    catch (e) { say(e.message); }
  }
  async function bulkRender() {
    const todo = sel.map((id) => byId.get(id)).filter((l) => l && !rendering(l)).slice(0, 25);
    let ok = 0, last = "";
    for (const l of todo) { try { const j = await api("PATCH", { id: l.id, render: true }); replace(j.lead); ok++; } catch (e) { last = e.message; } }
    say(ok ? `Render started for ${ok} lead${ok === 1 ? "" : "s"}${last ? `. ${last}` : ""}` : last || "Nothing to start");
  }
  function askDelete(ids) {
    const names = ids.map((id) => byId.get(id)?.brand).filter(Boolean);
    setConfirm({
      title: ids.length === 1 ? `Delete ${names[0]}?` : `Delete ${ids.length} leads?`,
      body: "This removes the lead and its notes. It cannot be undone. Pages and decks already published stay as they are.",
      yes: "Delete", danger: true,
      run: async () => {
        try { for (let i = 0; i < ids.length; i += 300) await api("DELETE", { ids: ids.slice(i, i + 300) }); setSelected(new Set()); if (ids.includes(openId)) setOpenId(""); await load(true); say(ids.length === 1 ? "Lead deleted" : `${ids.length} leads deleted`); }
        catch (e) { say(e.message); }
      },
    });
  }

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
  if (state.status === "error") return <div className={s.app}><div className={s.gate}><p className={s.error}>{state.error}</p><button className={s.btn} onClick={() => load(false)}>Try again</button></div></div>;

  const th = (key, label) => (
    <button className={s.th} onClick={() => { setActiveView(""); setSort((p) => ({ key, dir: p.key === key ? -p.dir : 1 })); }} aria-label={`Sort by ${label}`}>
      {label}{sort.key === key ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
    </button>
  );

  return (
    <div className={s.app}>
      <aside className={s.side}>
        <div className={s.logo}>Bonsify</div>
        <nav className={s.nav} aria-label="Admin">
          <a href="/leads" aria-current="page"><Icon d={ICONS.people} />Leads</a>
          <a href="/admin/"><Icon d={ICONS.cms} />Content manager</a>
        </nav>
        <div className={s.me}><span className={s.avatar} aria-hidden="true">{initials(state.me?.name)}</span><span style={{ lineHeight: 1.3 }}><b style={{ color: "#fff" }}>{state.me?.name || "Team"}</b><br /><span style={{ fontSize: 12, color: "#A9A394" }}>Signed in with GitLab</span></span></div>
      </aside>

      <main className={s.main}>
        <header className={s.head}>
          <h1 className={s.h1}>Leads</h1>
          <span className={s.count}>{leads.length}</span>
          <div className={s.spacer}>
            <button className={s.iconBtn} style={{ background: "var(--clay)", borderColor: "var(--clay)", color: "#fff" }} onClick={() => setAdding({ stage: "" })} aria-label="Add lead" title="Add lead"><Icon d={ICONS.plus} size={20} /></button>
          </div>
        </header>

        <section className={s.kpis} aria-label="Summary">
          {kpis.map(([l, v]) => <div key={l} className={s.kpi}><span className={s.kpiL}>{l}</span><span className={s.kpiV}>{v}</span></div>)}
          <button className={`${s.kpi} ${s.kpiBtn} ${fDue ? s.kpiOn : ""}`} onClick={() => { setActiveView(""); setFDue(!fDue); }} aria-pressed={fDue}><span className={s.kpiL}>Follow-ups due</span><span className={s.kpiV} style={dueCount ? { color: "#B3261E" } : undefined}>{dueCount}</span></button>
        </section>

        <section className={s.bar}>
          <div className={s.tabs} role="tablist" aria-label="View">
            <button role="tab" aria-selected={view === "table"} className={`${s.tab} ${view === "table" ? s.tabOn : ""}`} onClick={() => { setActiveView(""); setView("table"); }} aria-label="Table view" title="Table view"><Icon d={ICONS.table} size={18} /></button>
            <button role="tab" aria-selected={view === "board"} className={`${s.tab} ${view === "board" ? s.tabOn : ""}`} onClick={() => { setActiveView(""); setView("board"); }} aria-label="Board view" title="Board view"><Icon d={ICONS.board} size={18} /></button>
          </div>
          <label className={s.visually} htmlFor="q">Search leads</label>
          <input id="q" className={`${s.input} ${s.search}`} placeholder="Search brand, contact, address" autoComplete="off" value={q} onChange={touchFilter(setQ)} />
          <select aria-label="Filter by stage" className={s.sel} value={fStage} onChange={touchFilter(setFStage)}><option value="">Stage: any</option>{settings.stages.map((x) => <option key={x.name}>{x.name}</option>)}</select>
          <select aria-label="Filter by source" className={s.sel} value={fSource} onChange={touchFilter(setFSource)}><option value="">Source: any</option>{settings.sources.map((x) => <option key={x}>{x}</option>)}</select>
          <select aria-label="Filter by owner" className={s.sel} value={fOwner} onChange={touchFilter(setFOwner)}><option value="">Owner: anyone</option>{OWNERS.map((x) => <option key={x}>{x}</option>)}</select>
          {filtered && <button className={s.iconBtn} onClick={clearFilters} aria-label="Clear filters" title="Clear filters"><Icon d={ICONS.close} size={18} /></button>}
          <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {(settings.views || []).length > 0 && (
              <select aria-label="Saved views" className={s.sel} value={activeView} onChange={(e) => (e.target.value ? applyView(e.target.value) : setActiveView(""))}>
                <option value="">Saved views</option>{settings.views.map((v) => <option key={v.name}>{v.name}</option>)}
              </select>
            )}
            {activeView && <button className={s.iconBtn} onClick={deleteView} aria-label={`Remove saved view ${activeView}`} title="Remove this saved view"><Icon d={ICONS.trash} size={18} /></button>}
            {savingView ? (
              <>
                <label className={s.visually} htmlFor="vname">Name this view</label>
                <input id="vname" className={s.input} placeholder="Name this view" value={viewName} autoFocus autoComplete="off" onChange={(e) => setViewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveView(); if (e.key === "Escape") setSavingView(false); }} />
                <button className={s.iconBtn} style={{ background: "var(--clay)", borderColor: "var(--clay)", color: "#fff" }} onClick={saveView} aria-label="Save view" title="Save view"><Icon d={ICONS.check} size={18} /></button>
              </>
            ) : <button className={s.iconBtn} onClick={() => setSavingView(true)} aria-label="Save this view" title="Save this view"><Icon d={ICONS.save} size={18} /></button>}
          </span>
        </section>

        {sel.length > 0 && (
          <section className={s.bulk} aria-label="Selected leads">
            <b>{sel.length} selected</b>
            <label className={s.visually} htmlFor="bstage">Move selected to a stage</label>
            <select id="bstage" className={s.sel} value="" onChange={(e) => e.target.value && bulkPatch({ stage: e.target.value }, `Moved to ${e.target.value}`)}>
              <option value="">Move to stage...</option>{settings.stages.map((x) => <option key={x.name}>{x.name}</option>)}
            </select>
            <label className={s.visually} htmlFor="bowner">Set the owner of selected leads</label>
            <select id="bowner" className={s.sel} value="" onChange={(e) => e.target.value && bulkPatch({ owner: e.target.value }, `Owner set to ${e.target.value}`)}>
              <option value="">Set owner...</option>{OWNERS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <button className={s.iconBtn} onClick={bulkRender} aria-label="Make page, deck and video" title="Make page, deck and video"><Icon d={ICONS.play} size={18} /></button>
            <button className={s.iconBtn} style={{ color: "#8C1D18" }} onClick={() => askDelete(sel)} aria-label="Delete selected" title="Delete selected"><Icon d={ICONS.trash} size={18} /></button>
            <button className={s.iconBtn} style={{ marginLeft: "auto" }} onClick={() => setSelected(new Set())} aria-label="Clear selection" title="Clear selection"><Icon d={ICONS.close} size={18} /></button>
          </section>
        )}

        {view === "board" ? (
          <Board leads={rows} settings={settings} onOpen={setOpenId} onMove={move} onAddTo={(stage) => setAdding({ stage })} selected={selected} onToggle={toggle} />
        ) : (
          <section className={s.card}>
            {rows.length === 0 ? (
              <div className={s.empty}>
                <b style={{ color: "#14171A", fontSize: 16 }}>{leads.length ? "No leads match these filters" : "No leads yet"}</b>
                <span>{leads.length ? "Try clearing a filter." : "Add the first one, or paste a whole list."}</span>
                {!leads.length && <button className={`${s.btn} ${s.primary}`} onClick={() => setAdding({ stage: "" })}>Add lead</button>}
              </div>
            ) : (
              <div role="table" aria-label="Leads">
                <div className={`${s.grid} ${s.thead}`} role="row">
                  <span role="columnheader"><input type="checkbox" className={s.check} aria-label="Select all shown" checked={allOn} onChange={() => setSelected(allOn ? new Set() : new Set(rows.map((l) => l.id)))} /></span>
                  <span role="columnheader">{th("brand", "Brand")}</span><span role="columnheader">{th("stage", "Stage")}</span><span role="columnheader">{th("poc", "Contact")}</span>
                  <span role="columnheader">{th("source", "Source")}</span><span role="columnheader">Page and video</span><span role="columnheader">{th("nextFollowUp", "Follow-up")}</span><span role="columnheader">{th("lastTouch", "Last touch")}</span><span role="columnheader">{th("owner", "Owner")}</span>
                </div>
                {rows.map((l) => {
                  const ps = PAGE[l.pageStatus] || PAGE.none;
                  const sc = stageColor(l.stage);
                  const due = isDue(l);
                  const live = l.pageSlug && (l.deckReady || l.pageStatus === "ready");
                  return (
                    <div key={l.id} className={`${s.grid} ${s.row} ${selected.has(l.id) ? s.rowOn : ""}`} role="row" tabIndex={0} onClick={() => setOpenId(l.id)}
                      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setOpenId(l.id); } }} aria-label={`Open ${l.brand}`}>
                      <span role="cell" onClick={(e) => e.stopPropagation()}><input type="checkbox" className={s.check} aria-label={`Select ${l.brand}`} checked={selected.has(l.id)} onChange={() => toggle(l.id)} /></span>
                      <span className={s.brandCell} role="cell"><span className={s.tile} style={{ background: tileOf(l.id) }}>{initials(l.brand)}</span><span style={{ minWidth: 0 }}><span className={s.brandName}>{l.brand}</span><span className={s.sub}>{l.host}</span></span></span>
                      <span role="cell"><span className={s.pill} style={{ background: tint(sc), color: sc }}>{l.stage}</span></span>
                      <span className={s.cell} role="cell">{l.poc || <span className={s.mute}>Not set</span>}</span>
                      <span className={`${s.cell} ${s.mute}`} role="cell">{l.source}</span>
                      <span className={s.cell} role="cell"><span className={s.dot} style={{ background: ps[1] }} />{ps[0].split(",")[0]}
                        {live && <> <a className={s.miniLink} style={{ display: "inline-flex", verticalAlign: "middle" }} href={pageUrl(l)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Open the page" title="Open the page"><Icon d={ICONS.page} size={14} /></a><a className={s.miniLink} style={{ display: "inline-flex", verticalAlign: "middle" }} href={deckUrl(l)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Open the deck PDF" title="Open the deck PDF"><Icon d={ICONS.deck} size={14} /></a></>}
                      </span>
                      <span className={s.cell} role="cell" style={due ? { color: "#B3261E", fontWeight: 600 } : { color: "#5C5A52" }}>{l.nextFollowUp ? niceDate(l.nextFollowUp) : ""}</span>
                      <span className={`${s.cell} ${s.mute}`} role="cell">{ago(l.lastTouch)}</span>
                      <span role="cell"><span className={s.avatar} style={{ background: "#EAE3D3", color: "#14171A", width: 28, height: 28, fontSize: 12 }} title={l.owner}>{initials(l.owner)}</span></span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {adding && (
        <AddModal settings={settings} me={state.me} leads={leads} presetStage={adding.stage} addStage={addStage} addSource={addSource} onClose={() => setAdding(null)}
          onDone={(res) => { setAdding(null); load(true); say(`${res.added.length} added${res.renders?.length ? `, ${res.renders.length} rendering` : ""}${res.skipped.length ? `, ${res.skipped.length} skipped (already leads)` : ""}${res.errors.length ? `. ${res.errors[0].error}` : ""}`); }} />
      )}
      {open && <Panel lead={open} settings={settings} owners={owners} stageColor={stageColor} addStage={addStage} addSource={addSource} onClose={() => setOpenId("")} patch={patch} replace={replace} say={say} onDelete={() => askDelete([open.id])} />}
      {confirm && <Confirm title={confirm.title} body={confirm.body} yes={confirm.yes} danger={confirm.danger} onNo={() => setConfirm(null)} onYes={() => { const run = confirm.run; setConfirm(null); run(); }} />}
      {toast && <div className={s.toast} role="status">{toast}</div>}
    </div>
  );
}
