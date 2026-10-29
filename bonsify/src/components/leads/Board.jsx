"use client";

import { useState } from "react";
import s from "./leads.module.css";
import { Icon, ICONS, PAGE, initials, tileOf, ago, niceDate } from "./shared";
import { isDue } from "../../lib/crm/schema.js";

// Board view: one column per stage. Drag a card to another column, or use the "Move to" menu on the card
// (works with keyboard and on phones).
export default function Board({ leads, settings, onOpen, onMove, onAddTo, selected, onToggle }) {
  const [over, setOver] = useState("");
  const [drag, setDrag] = useState("");
  const byStage = new Map(settings.stages.map((st) => [st.name, []]));
  for (const l of leads) (byStage.get(l.stage) || byStage.set(l.stage, []).get(l.stage)).push(l);

  return (
    <section className={s.board} aria-label="Pipeline board">
      {settings.stages.map((st) => {
        const cards = byStage.get(st.name) || [];
        return (
          <div key={st.name} className={`${s.col} ${over === st.name ? s.colOver : ""}`}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (over !== st.name) setOver(st.name); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(""); }}
            onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain") || drag; setOver(""); setDrag(""); if (id) onMove(id, st.name); }}
            role="group" aria-label={`${st.name}, ${cards.length} leads`}>
            <div className={s.colHead}>
              <span className={s.dot} style={{ background: st.color, margin: 0 }} />
              <b>{st.name}</b>
              <span className={s.colCount}>{cards.length}</span>
            </div>
            <div className={s.colBody}>
              {cards.map((l) => {
                const ps = PAGE[l.pageStatus] || PAGE.none;
                const due = isDue(l);
                return (
                  <div key={l.id} className={`${s.card2} ${drag === l.id ? s.dragging : ""}`} draggable
                    onDragStart={(e) => { e.dataTransfer.setData("text/plain", l.id); e.dataTransfer.effectAllowed = "move"; setDrag(l.id); }}
                    onDragEnd={() => { setDrag(""); setOver(""); }}
                    onClick={() => onOpen(l.id)} onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onOpen(l.id); } }}
                    tabIndex={0} role="button" aria-label={`Open ${l.brand}`}>
                    <div className={s.brandCell}>
                      <span className={s.tile} style={{ background: tileOf(l.id), width: 28, height: 28, fontSize: 11 }}>{initials(l.brand)}</span>
                      <span style={{ minWidth: 0, flex: 1 }}><span className={s.brandName}>{l.brand}</span><span className={s.sub}>{l.host}</span></span>
                      <input type="checkbox" className={s.check} checked={selected.has(l.id)} aria-label={`Select ${l.brand}`} onClick={(e) => e.stopPropagation()} onChange={() => onToggle(l.id)} />
                    </div>
                    <div className={s.cardMeta}><span>{l.poc || "No contact"}</span><span>{l.source}</span></div>
                    <div className={s.cardMeta}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#14171A", fontWeight: 500 }}><span className={s.dot} style={{ background: ps[1], margin: 0 }} />{ps[0].split(",")[0]}</span>
                      <span>{ago(l.lastTouch)}</span>
                    </div>
                    {l.nextFollowUp && <div className={`${s.chip} ${due ? s.chipDue : ""}`}>{due ? "Follow up due " : "Follow up "}{niceDate(l.nextFollowUp)}</div>}
                    <select className={s.moveSel} aria-label={`Move ${l.brand} to a stage`} value={l.stage} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} onChange={(e) => onMove(l.id, e.target.value)}>
                      {settings.stages.map((x) => <option key={x.name} value={x.name}>Move to: {x.name}</option>)}
                    </select>
                  </div>
                );
              })}
              {!cards.length && <div className={s.colEmpty}>Drop a lead here</div>}
              <button className={s.addTo} onClick={() => onAddTo(st.name)}><Icon d={ICONS.plus} size={14} />Add to {st.name}</button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
