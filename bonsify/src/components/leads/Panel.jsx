"use client";

import { useEffect, useState } from "react";
import s from "./leads.module.css";
import { AddableSelect, Icon, ICONS, api, ago, initials, tileOf, tint, pageUrl, deckUrl, rendering } from "./shared";

function Field({ id, label, value, onSave, type = "text", placeholder, list }) {
  const [v, setV] = useState(value || "");
  useEffect(() => setV(value || ""), [value]);
  return (
    <div className={s.fld}>
      <label className={s.lbl} htmlFor={id}>{label}</label>
      <input id={id} name={`lead-${id}`} type={type} list={list} autoComplete="off" data-lpignore="true" className={s.input} value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)}
        onBlur={() => { if (v !== (value || "")) onSave(v); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
    </div>
  );
}

const STEP = {
  done: { bg: "#DCE8DD", fg: "#2F5A3A", mark: "✓", weight: 500 },
  run: { bg: "#F6E7C2", fg: "#6B4A00", mark: "…", weight: 600 },
  wait: { bg: "#EAE3D3", fg: "#5C5A52", mark: "", weight: 500 },
  bad: { bg: "#FDECEA", fg: "#8C1D18", mark: "!", weight: 600 },
};

function RenderBox({ lead, onRender, busy }) {
  const st = lead.pageStatus || "none";
  const deck = st === "ready" || st === "deck" || !!lead.deckReady;
  const steps = [
    ["Store read and deck made", st === "queued" ? "run" : st === "failed" && !deck ? "bad" : "done", st === "queued" ? "about 2 minutes" : ""],
    ["Page is live with the deck", deck ? "done" : "wait", deck ? "" : "after the deck"],
    ["Recording the video", st === "ready" ? "done" : st === "deck" ? "run" : st === "failed" && deck ? "bad" : "wait", st === "deck" ? "a few more minutes" : ""],
    ["Video tab added to the page", st === "ready" ? "done" : "wait", st === "ready" ? "" : "automatic"],
  ];
  if (st === "none") {
    return (
      <section className={s.renderBox}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}><b>Page, deck and video</b><br /><span className={s.mute} style={{ fontSize: 13 }}>Not made yet. The page is live in about 2 minutes, the video follows.</span></div>
          <button className={`${s.btn} ${s.primary}`} onClick={onRender} disabled={busy}>{busy ? "Starting..." : "Make page, deck and video"}</button>
        </div>
      </section>
    );
  }
  return (
    <section className={s.renderBox} aria-live="polite">
      <div style={{ display: "flex", alignItems: "center" }}><b>Page, deck and video</b>{rendering(lead) && <span className={s.mute} style={{ marginLeft: "auto", fontSize: 13 }}>Started {ago(lead.engine?.startedAt).toLowerCase()}</span>}</div>
      {steps.map(([label, kind, note]) => {
        const m = STEP[kind];
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className={s.stepMark} style={{ background: m.bg, color: m.fg }}>{m.mark}</span>
            <span style={{ fontWeight: m.weight }}>{label}</span>
            <span className={s.mute} style={{ marginLeft: "auto", fontSize: 13 }}>{note}</span>
          </div>
        );
      })}
      {st === "failed" && <div className={s.error}>The render stopped. {deck ? "The page and deck are live. " : ""}Try again, or check the run in Google Cloud.</div>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {deck && lead.pageSlug && <a className={s.btn} style={{ textDecoration: "none" }} href={pageUrl(lead)} target="_blank" rel="noreferrer">Open page</a>}
        {deck && lead.pageSlug && <a className={s.btn} style={{ textDecoration: "none" }} href={deckUrl(lead)} target="_blank" rel="noreferrer">Download deck PDF</a>}
        {(st === "ready" || st === "failed") && <button className={s.btn} onClick={onRender} disabled={busy}>{busy ? "Starting..." : "Make again"}</button>}
        {rendering(lead) && <span className={s.mute} style={{ fontSize: 13 }}>You can close this panel. It keeps going.</span>}
      </div>
    </section>
  );
}

export default function Panel({ lead, settings, owners, stageColor, addStage, addSource, onClose, patch, replace, say, onDelete }) {
  const [note, setNote] = useState("");
  const [about, setAbout] = useState(lead.note || "");
  const [busy, setBusy] = useState("");
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
  async function render() {
    setBusy("render");
    try { const j = await api("PATCH", { id: lead.id, render: true }); replace(j.lead); say("Render started. You can leave this page."); } catch (e) { say(e.message); }
    setBusy("");
  }
  async function readName() {
    setBusy("name");
    try { const j = await api("PATCH", { id: lead.id, readName: true }); replace(j.lead); say(`Name set to ${j.lead.brand}`); } catch (e) { say(e.message); }
    setBusy("");
  }

  return (
    <aside className={s.panel} role="dialog" aria-label={lead.brand}>
      <div className={s.mHead}>
        <span className={s.tile} style={{ background: tileOf(lead.id), width: 48, height: 48, fontSize: 16 }}>{initials(lead.brand)}</span>
        <div style={{ lineHeight: 1.35, minWidth: 0 }}><h2 className={s.h1} style={{ fontSize: 24 }}>{lead.brand}</h2><a href={lead.url} target="_blank" rel="noreferrer" style={{ color: "#96502F", fontWeight: 500 }}>{lead.host}</a></div>
        <button className={s.iconBtn} style={{ marginLeft: "auto", border: 0 }} onClick={onClose} aria-label="Close"><Icon d={ICONS.close} /></button>
      </div>
      <div className={s.pBody}>
        <RenderBox lead={lead} onRender={render} busy={busy === "render"} />
        <div className={s.fields}>
          <AddableSelect id="ds" label="Stage" what="stage" value={lead.stage} options={settings.stages.map((x) => x.name)} onChange={(v) => patch(lead.id, { stage: v })} onCreate={async (n) => { const v = await addStage(n); if (v) patch(lead.id, { stage: v }); }} />
          <AddableSelect id="dsrc" label="Source" what="source" value={lead.source} options={settings.sources} onChange={(v) => patch(lead.id, { source: v })} onCreate={async (n) => { const v = await addSource(n); if (v) patch(lead.id, { source: v }); }} />
          <div>
            <Field id="dbrand" label="Brand name" value={lead.brand} onSave={(v) => patch(lead.id, { brand: v })} />
            <button className={s.linkBtn} onClick={readName} disabled={busy === "name"}>{busy === "name" ? "Reading..." : "Read the name from the store"}</button>
          </div>
          <Field id="downer" label="Owner" value={lead.owner} list="owners" onSave={(v) => patch(lead.id, { owner: v })} />
          <datalist id="owners">{owners.map((o) => <option key={o} value={o} />)}</datalist>
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
            <input id="dnote" className={s.input} style={{ flex: 1, height: 44 }} placeholder="Add a note, call or follow-up" autoComplete="off" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addNote(); }} />
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
