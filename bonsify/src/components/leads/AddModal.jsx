"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import s from "./leads.module.css";
import { AddableSelect, Icon, ICONS, api } from "./shared";
import { parseImport, classify, summarize } from "../../lib/crm/import.js";
import { hostOf, idFromHost, DEFAULT_OWNER } from "../../lib/crm/schema.js";

const blankRow = (stage, source) => ({ url: "", brand: "", poc: "", stage, source });
const STATUS = {
  new: ["New", "#DCE8DD", "#2F5A3A"],
  duplicate: ["Already a lead", "#F6E7C2", "#6B4A00"],
  twice: ["Listed twice", "#F6E7C2", "#6B4A00"],
  invalid: ["Not a store address", "#FDECEA", "#8C1D18"],
  badstage: ["Unknown stage", "#FDECEA", "#8C1D18"],
};
const SHOW = 200;

export default function AddModal({ settings, me, leads, presetStage, addStage, addSource, onClose, onDone }) {
  const stage0 = presetStage || settings.stages[0].name;
  const [tab, setTab] = useState("rows");
  const [rows, setRows] = useState([blankRow(stage0, settings.sources[0])]);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [defStage, setDefStage] = useState(stage0);
  const [defSource, setDefSource] = useState(settings.sources.includes("Import") ? "Import" : settings.sources[0]);
  const [render, setRender] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);
  const existing = useMemo(() => new Set(leads.map((l) => l.id)), [leads]);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const set = (i, k, v) => setRows((p) => p.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const filled = rows.filter((r) => r.url.trim());
  const knownRows = filled.filter((r) => { const h = hostOf(r.url); return h && existing.has(idFromHost(h)); }).length;

  const parsed = useMemo(() => (tab === "rows" ? [] : classify(parseImport(text), { existingIds: existing, stages: settings.stages, sources: settings.sources })), [tab, text, existing, settings]);
  const sum = summarize(parsed);
  const toAdd = tab === "rows" ? filled.length : sum.fresh;

  function switchTab(t) { setTab(t); setErr(""); setRender(t === "rows"); }

  async function readFile(file) {
    if (!file) return;
    if (file.size > 2_000_000) { setErr("That file is too big. Keep it under 2 MB."); return; }
    setErr(""); setFileName(file.name); setText(await file.text());
  }

  async function submit() {
    if (!toAdd) { setErr(tab === "rows" ? "Add at least one store address." : "Nothing new to add yet."); return; }
    setBusy(true); setErr("");
    const payload = tab === "rows"
      ? filled
      : parsed.filter((r) => r.status === "new").map((r) => ({ url: r.url, brand: r.brand, poc: r.poc, pocEmail: r.pocEmail, pocPhone: r.pocPhone, owner: r.owner, note: r.note, stage: r.stage || defStage, source: r.source || defSource }));
    const merged = { added: [], skipped: [], errors: [], renders: [] };
    try {
      for (let i = 0; i < payload.length; i += 300) {
        const res = await api("POST", { leads: payload.slice(i, i + 300), render: render && i === 0 });
        for (const k of Object.keys(merged)) merged[k].push(...(res[k] || []));
      }
      onDone(merged);
    } catch (e) {
      if (merged.added.length) onDone({ ...merged, errors: [...merged.errors, { url: "", error: e.message }] });
      else { setErr(e.message); setBusy(false); }
    }
  }

  return (
    <div className={s.scrim} role="dialog" aria-modal="true" aria-label="Add leads">
      <div className={s.modal}>
        <div className={s.mHead}>
          <h2 className={s.h1} style={{ fontSize: 24 }}>Add leads</h2>
          <div className={s.tabs} role="tablist" aria-label="How to add">
            {[["rows", "One or more"], ["paste", "Paste a list"], ["csv", "Upload CSV"]].map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} className={`${s.tab} ${tab === id ? s.tabOn : ""}`} onClick={() => switchTab(id)}>{label}</button>
            ))}
          </div>
          <button className={s.iconBtn} style={{ marginLeft: "auto", border: 0 }} onClick={onClose} aria-label="Close"><Icon d={ICONS.close} /></button>
        </div>

        <div className={s.mBody}>
          {tab === "rows" && (
            <>
              {rows.map((r, i) => {
                const h = hostOf(r.url);
                const dup = h && existing.has(idFromHost(h));
                return (
                  <div key={i}>
                    <div className={s.addRow}>
                      <div className={s.fld}><label className={s.lbl} htmlFor={`u${i}`}>Store address</label><input id={`u${i}`} className={s.input} placeholder="brandstore.com" value={r.url} autoComplete="off" autoFocus={i === rows.length - 1} onChange={(e) => set(i, "url", e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && r.url.trim()) { e.preventDefault(); setRows((p) => [...p, blankRow(r.stage, r.source)]); } }} /></div>
                      <div className={s.fld}><label className={s.lbl} htmlFor={`b${i}`}>Brand name</label><input id={`b${i}`} className={s.input} placeholder="Read from the store" autoComplete="off" value={r.brand} onChange={(e) => set(i, "brand", e.target.value)} /></div>
                      <div className={s.fld}><label className={s.lbl} htmlFor={`p${i}`}>Contact</label><input id={`p${i}`} className={s.input} placeholder="Optional" autoComplete="off" value={r.poc} onChange={(e) => set(i, "poc", e.target.value)} /></div>
                      <AddableSelect id={`s${i}`} label="Stage" what="stage" value={r.stage} options={settings.stages.map((x) => x.name)} onChange={(v) => set(i, "stage", v)} onCreate={async (n) => { const v = await addStage(n); if (v) set(i, "stage", v); }} />
                      <AddableSelect id={`o${i}`} label="Source" what="source" value={r.source} options={settings.sources} onChange={(v) => set(i, "source", v)} onCreate={async (n) => { const v = await addSource(n); if (v) set(i, "source", v); }} />
                      <button type="button" className={s.iconBtn} aria-label={`Remove row ${i + 1}`} disabled={rows.length === 1} onClick={() => setRows((p) => p.filter((_, j) => j !== i))} style={{ opacity: rows.length === 1 ? 0.4 : 1 }}><Icon d={ICONS.minus} /></button>
                    </div>
                    {r.url.trim() && !h && <p className={s.warn}>That does not look like a store address.</p>}
                    {dup && <p className={s.warn}>Already a lead, so this row will be skipped.</p>}
                  </div>
                );
              })}
              <div><button type="button" className={s.btn} onClick={() => setRows((p) => [...p, blankRow(p[p.length - 1].stage, p[p.length - 1].source)])}><Icon d={ICONS.plus} size={16} />Add another</button></div>
              <p className={s.mute} style={{ margin: 0 }}>Press Enter in the address box to add another row. Owner is set to {DEFAULT_OWNER}.</p>
            </>
          )}

          {tab !== "rows" && (
            <div className={s.importGrid}>
              <section className={s.importLeft}>
                {tab === "paste" ? (
                  <>
                    <label className={s.lbl} htmlFor="paste">Paste store addresses or rows from a sheet</label>
                    <textarea id="paste" className={s.pasteBox} value={text} onChange={(e) => setText(e.target.value)} placeholder={"shahzebsaeed.com\tShahzeb\nforth-lighting.com\tAhsan\nhttps://optusstore.pk"} spellCheck={false} />
                    <p className={s.mute} style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>One store per line. Copy rows straight from Google Sheets or Excel. After the address, optional columns: contact, source.</p>
                  </>
                ) : (
                  <>
                    <span className={s.lbl}>CSV file</span>
                    <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv" className={s.visually} id="csvfile" onChange={(e) => readFile(e.target.files?.[0])} />
                    <label htmlFor="csvfile" className={s.drop} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); readFile(e.dataTransfer.files?.[0]); }}>
                      <Icon d={ICONS.upload} size={26} />
                      <b>{fileName || "Choose a CSV file"}</b>
                      <span className={s.mute}>{fileName ? "Choose a different file" : "or drop it here"}</span>
                    </label>
                    <p className={s.mute} style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>First row can name the columns: Website, Brand, Contact, Email, Phone, Source, Stage, Owner, Notes. Without a header row, the first column is the address.</p>
                  </>
                )}
                <div className={s.defaults}>
                  <AddableSelect id="dstage" label="Stage for rows without one" what="stage" value={defStage} options={settings.stages.map((x) => x.name)} onChange={setDefStage} onCreate={async (n) => { const v = await addStage(n); if (v) setDefStage(v); }} />
                  <AddableSelect id="dsource" label="Source for rows without one" what="source" value={defSource} options={settings.sources} onChange={setDefSource} onCreate={async (n) => { const v = await addSource(n); if (v) setDefSource(v); }} />
                </div>
              </section>
              <section className={s.importRight} aria-live="polite">
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <b>Preview</b>
                  {parsed.length > 0 && <span className={s.okPill}>{sum.fresh} new{sum.skipped ? `, ${sum.skipped} duplicate` : ""}{sum.invalid ? `, ${sum.invalid} not valid` : ""}</span>}
                </div>
                {parsed.length === 0 ? <div className={s.previewEmpty}>Rows will show here, with anything that is already a lead flagged before you add it.</div> : (
                  <div className={s.previewTable} role="table" aria-label="Import preview">
                    <div className={s.prow} role="row" style={{ background: "#FBF8F1", fontWeight: 600, color: "#5C5A52", fontSize: 12 }}><span>Store</span><span>Contact</span><span>Source</span><span>Result</span></div>
                    {parsed.slice(0, SHOW).map((r, i) => {
                      const st = STATUS[r.status];
                      return (
                        <div key={i} className={s.prow} role="row">
                          <span className={s.brandName}>{r.host || r.url || "(empty)"}</span>
                          <span className={s.cell}>{r.poc || <span className={s.mute}>Not set</span>}</span>
                          <span className={`${s.cell} ${s.mute}`}>{r.source || defSource}</span>
                          <span><span className={s.pill} style={{ background: st[1], color: st[2] }} title={r.note2}>{r.note2 && r.status !== "new" ? r.note2 : st[0]}</span></span>
                        </div>
                      );
                    })}
                    {parsed.length > SHOW && <div className={s.prow} style={{ color: "#5C5A52" }}>and {parsed.length - SHOW} more rows</div>}
                  </div>
                )}
              </section>
            </div>
          )}

          <label className={s.renderOpt}>
            <input type="checkbox" className={s.check} checked={render} onChange={(e) => setRender(e.target.checked)} />
            <span><b>Make the page, deck and video as soon as they are added</b><br /><span className={s.mute} style={{ fontSize: 13 }}>The page goes live with the deck in about 2 minutes. The video tab is added when the video finishes. You can close this window. Starts the first 25 only.</span></span>
          </label>
          {err && <div className={s.error} role="alert">{err}</div>}
        </div>

        <div className={s.mFoot}>
          <span className={s.mute}>{tab === "rows" ? `${filled.length} to add${knownRows ? `, ${knownRows} already leads` : ""}` : parsed.length ? `${sum.fresh} will be added${sum.skipped ? `, ${sum.skipped} skipped as duplicates` : ""}` : "Nothing to add yet"}</span>
          <button className={s.btn} style={{ marginLeft: "auto" }} onClick={onClose}>Cancel</button>
          <button className={`${s.btn} ${s.primary}`} onClick={submit} disabled={busy || !toAdd}>{busy ? "Adding..." : `Add ${toAdd || ""} lead${toAdd === 1 ? "" : "s"}`}</button>
        </div>
      </div>
    </div>
  );
}
