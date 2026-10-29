"use client";

import { useEffect, useState } from "react";
import s from "./leads.module.css";

// Helpers shared by the Lead Centre screens.

export const NEW = "__new";
export const PAGE = {
  none: ["Not started", "#9A978E"],
  queued: ["Queued", "#9A978E"],
  deck: ["Page and deck live, video coming", "#C9902B"],
  ready: ["Page, deck and video ready", "#4C8A5A"],
  failed: ["Needs a look", "#B3261E"],
};
export const SITE = "https://bonsify.io";
const TILES = ["#14171A", "#B5603B", "#6B8F71", "#44614A", "#96502F", "#2F4252", "#7A3E20", "#5C5A52", "#1D4228"];

export function token() {
  try {
    const u = JSON.parse(localStorage.getItem("decap-cms-user") || localStorage.getItem("netlify-cms-user") || "{}");
    return u.token || (process.env.NEXT_PUBLIC_CRM_DEV === "1" ? "dev" : "");
  } catch { return ""; }
}

export async function api(method, body) {
  const r = await fetch("/api/leads", { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || "Something went wrong."); e.status = r.status; throw e; }
  return j;
}

// Small per-viewer conveniences (last view, sort). Never required for the page to work.
export const keep = {
  get(k, d) { try { const v = localStorage.getItem(`crm:${k}`); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(`crm:${k}`, JSON.stringify(v)); } catch {} },
};

export const initials = (n) => (n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
export const tileOf = (id) => TILES[[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % TILES.length];
export const tint = (hex) => `${hex}22`;
export function ago(iso) {
  if (!iso) return "";
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return "Today";
  if (d < 2) return "Yesterday";
  if (d < 14) return `${Math.floor(d)} days ago`;
  return `${Math.floor(d / 7)} weeks ago`;
}
export function niceDate(key) {
  if (!key) return "";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}
export const pageUrl = (lead) => (lead.pageSlug ? `${SITE}/for/${lead.pageSlug}` : "");
export const deckUrl = (lead) => (lead.pageSlug ? `${SITE}/decks/${lead.pageSlug}-deck.pdf` : "");
export const rendering = (lead) => lead.pageStatus === "queued" || lead.pageStatus === "deck";

export function Icon({ d, size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={d} /></svg>;
}
export const ICONS = {
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  close: "M6 6l12 12M18 6L6 18",
  people: "M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a3 3 0 100-6M21 20c0-2.6-1.4-4.6-3.5-5.5",
  cms: "M4 4h16v16H4zM4 9h16",
  table: "M3 5h18v14H3zM3 10h18M9 5v14",
  board: "M4 4h5v16H4zM10 4h5v10h-5zM16 4h4v13h-4z",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  save: "M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6",
  check: "M5 12l5 5 9-11",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6",
  page: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  deck: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7",
  play: "M7 4l13 8-13 8z",
};

// A select with a "+ New..." entry that lets you type a new value (stage or source).
export function AddableSelect({ id, label, value, options, onChange, onCreate, what }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const create = () => { if (text.trim()) { onCreate(text.trim()); setAdding(false); setText(""); } };
  if (adding) {
    return (
      <div className={s.fld}>
        <label className={s.lbl} htmlFor={`${id}-new`}>New {what}</label>
        <div style={{ display: "flex", gap: 6 }}>
          <input id={`${id}-new`} className={s.input} style={{ flex: 1, minWidth: 0 }} value={text} autoFocus autoComplete="off" onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); create(); } if (e.key === "Escape") { e.stopPropagation(); setAdding(false); } }} />
          <button type="button" className={s.btn} style={{ padding: "0 12px" }} onClick={create}>Add</button>
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

// Our own confirm box. The browser's confirm() blocks the page and looks out of place.
export function Confirm({ title, body, yes = "Confirm", danger, onYes, onNo }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") { e.stopPropagation(); onNo(); } };
    window.addEventListener("keydown", h, true); return () => window.removeEventListener("keydown", h, true);
  }, [onNo]);
  return (
    <div className={s.scrim} style={{ zIndex: 90, alignItems: "center" }} role="alertdialog" aria-modal="true" aria-label={title}>
      <div className={s.modal} style={{ width: "min(440px,100%)" }}>
        <div className={s.mBody} style={{ gap: 8 }}>
          <h2 className={s.h1} style={{ fontSize: 22 }}>{title}</h2>
          <p className={s.mute} style={{ margin: 0, lineHeight: 1.5 }}>{body}</p>
        </div>
        <div className={s.mFoot}>
          <button className={s.btn} style={{ marginLeft: "auto" }} onClick={onNo} autoFocus>Cancel</button>
          <button className={`${s.btn} ${danger ? s.danger : s.primary}`} onClick={onYes}>{yes}</button>
        </div>
      </div>
    </div>
  );
}

export function StatusLine({ lead }) {
  const ps = PAGE[lead.pageStatus] || PAGE.none;
  return <span className={s.cell}><span className={s.dot} style={{ background: ps[1] }} />{ps[0]}</span>;
}
