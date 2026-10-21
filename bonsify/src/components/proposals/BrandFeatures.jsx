"use client";

import { useEffect, useMemo, useState } from "react";
import { APPAREL, SHOES, KIDS, RINGS, apparelSize, shoeSize, kidsSize, ringSize } from "@/lib/sizing";
import { giftAmounts, trending } from "@/lib/storeProfile";
import { Svg, buzz } from "./appUi";
import base from "./BrandApp.module.css";
import fx from "./BrandFeatures.module.css";

// Features that the store engine (src/lib/storeProfile.js) switches on or off.
// Every export here is only rendered when the profile says the store gets it.

/* ---------- shared bottom sheet ---------- */
export function Sheet({ title, onClose, children, foot }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className={fx.scrim} onClick={onClose}>
      <div className={fx.panel} role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className={fx.grab} />
        <header className={fx.panelHead}>
          <h3>{title}</h3>
          <button onClick={onClose} aria-label="Close">
            <Svg name="close" size={20} />
          </button>
        </header>
        <div className={fx.panelBody} data-lenis-prevent>
          {children}
        </div>
        {foot && <div className={fx.panelFoot}>{foot}</div>}
      </div>
    </div>
  );
}

const Switch = ({ on, onChange, label }) => (
  <button role="switch" aria-checked={on} aria-label={label} className={`${fx.switch} ${on ? fx.switchOn : ""}`} onClick={() => (buzz(14), onChange(!on))}>
    <i />
  </button>
);

/* ---------- 1. size guide and find-my-size ---------- */
const COPY = {
  apparel: { title: "Size guide", find: "Find my size" },
  shoe: { title: "Shoe size guide", find: "Find my size" },
  kids: { title: "Kids size guide", find: "Find my size" },
  ring: { title: "Ring size guide", find: "Find my size" },
};

export function SizeSheet({ profile, values, onPick, onClose }) {
  const kind = profile.sizing;
  const [tab, setTab] = useState("find");
  const [f, setF] = useState({ height: 170, weight: 65, fit: "regular", foot: 26, months: 24, kh: "", circ: 54 });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target ? e.target.value : e }));
  const res = kind === "apparel" ? apparelSize(f) : kind === "shoe" ? shoeSize(f) : kind === "kids" ? kidsSize({ months: f.months, height: f.kh }) : ringSize(f);
  const cands = !res
    ? []
    : kind === "shoe"
      ? [res.row.eu, res.row.us, res.row.uk]
      : kind === "kids"
        ? [res.row.size, res.row.age]
        : [res.size];
  const match = (values || []).find((v) => cands.some((c) => String(v).trim().toUpperCase() === String(c).toUpperCase() || (kind === "kids" && String(v).toUpperCase().includes(String(c).toUpperCase()))));
  const T = COPY[kind] || COPY.apparel;

  const num = (k, label, unit, step = 1) => (
    <label className={fx.field}>
      <span>{label}</span>
      <span className={fx.inputWrap}>
        <input type="number" inputMode="decimal" step={step} value={f[k]} onChange={set(k)} />
        <em>{unit}</em>
      </span>
    </label>
  );

  return (
    <Sheet title={T.title} onClose={onClose}>
      <div className={fx.tabsRow} role="tablist">
        {[["find", T.find], ["chart", "Size chart"]].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? fx.tabOn : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "find" ? (
        <div className={fx.form}>
          {kind === "apparel" && (
            <>
              <div className={fx.two}>
                {num("height", "Height", "cm")}
                {num("weight", "Weight", "kg")}
              </div>
              <div>
                <span className={fx.lab}>How do you like it to fit?</span>
                <div className={base.chips}>
                  {["snug", "regular", "loose"].map((v) => (
                    <button key={v} className={`${base.chip} ${f.fit === v ? base.chipOn : ""}`} onClick={() => setF((x) => ({ ...x, fit: v }))}>
                      {v[0].toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {kind === "shoe" && (
            <>
              {num("foot", "Foot length, heel to longest toe", "cm", 0.5)}
              <p className={fx.hint}>Stand on a sheet of paper against a wall, mark the longest toe, measure to the wall.</p>
            </>
          )}
          {kind === "kids" && (
            <div className={fx.two}>
              {num("months", "Age", "months")}
              {num("kh", "or height", "cm")}
            </div>
          )}
          {kind === "ring" && (
            <>
              {num("circ", "Finger circumference", "mm")}
              <p className={fx.hint}>Wrap a strip of paper round the base of the finger, mark where it meets, measure the length.</p>
            </>
          )}

          {res ? (
            <div className={fx.result}>
              <small>We suggest</small>
              <strong>{kind === "shoe" ? `EU ${res.size}` : kind === "ring" ? `US ${res.size}` : res.size}</strong>
              <p>{res.note}</p>
              {match ? (
                <button className={base.buy} onClick={() => (onPick(match), onClose())}>
                  Use {match}
                </button>
              ) : (
                <p className={fx.hint}>Pick the closest option on the product page.</p>
              )}
            </div>
          ) : (
            <p className={fx.hint}>Fill in the measurements to see a size.</p>
          )}
        </div>
      ) : (
        <div className={fx.chart}>
          {kind === "apparel" && (
            <table>
              <thead><tr><th>Size</th><th>Chest (cm)</th><th>Waist (cm)</th></tr></thead>
              <tbody>
                {APPAREL.map((r) => (
                  <tr key={r.size} className={res?.size === r.size ? fx.hit : ""}><td>{r.size}</td><td>{r.chest.join("-")}</td><td>{r.waist.join("-")}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {kind === "shoe" && (
            <table>
              <thead><tr><th>EU</th><th>UK</th><th>US M</th><th>US W</th><th>Foot (cm)</th></tr></thead>
              <tbody>
                {SHOES.map((r) => (
                  <tr key={r.eu} className={res?.row?.eu === r.eu ? fx.hit : ""}><td>{r.eu}</td><td>{r.uk}</td><td>{r.us}</td><td>{r.usw}</td><td>{r.cm}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {kind === "kids" && (
            <table>
              <thead><tr><th>Age</th><th>Size</th><th>Height (cm)</th></tr></thead>
              <tbody>
                {KIDS.map((r) => (
                  <tr key={r.size} className={res?.row?.size === r.size ? fx.hit : ""}><td>{r.age}</td><td>{r.size}</td><td>{r.height}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {kind === "ring" && (
            <table>
              <thead><tr><th>US</th><th>UK</th><th>EU</th><th>Inner (mm)</th></tr></thead>
              <tbody>
                {RINGS.map((r) => (
                  <tr key={r.us} className={res?.row?.us === r.us ? fx.hit : ""}><td>{r.us}</td><td>{r.uk}</td><td>{r.eu}</td><td>{r.mm}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          <p className={fx.hint}>Typical fits, used as a sample. Your own size chart goes here in the real app.</p>
        </div>
      )}
    </Sheet>
  );
}

/* ---------- 2. back-in-stock and price-drop alerts ---------- */
export function AlertSheet({ product: p, state, money, onSave, onClose }) {
  const [s, setS] = useState(state || { price: true, target: 0, stock: p.available === false });
  const sold = p.available === false;
  const targets = [[0, "Any drop"], [10, "10% off"], [20, "20% off"]];
  return (
    <Sheet
      title="Alerts"
      onClose={onClose}
      foot={
        <button className={`${base.buy} ${base.full}`} onClick={() => (onSave(s), onClose())}>
          {s.price || s.stock ? "Save alerts" : "Turn alerts off"}
        </button>
      }
    >
      <div className={fx.prodRow}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image} alt="" />
        <span>
          <strong>{p.title}</strong>
          <small>{p.price > 0 ? `${money(p.price)} now` : "Price tracking"}{sold ? ", sold out" : ""}</small>
        </span>
      </div>
      <div className={fx.optRow}>
        <span>
          <strong>Price drops</strong>
          <small>Push notification the moment it falls</small>
        </span>
        <Switch on={s.price} onChange={(v) => setS((x) => ({ ...x, price: v }))} label="Price drop alert" />
      </div>
      {s.price && (
        <div className={base.chips}>
          {targets.map(([v, l]) => (
            <button key={v} className={`${base.chip} ${s.target === v ? base.chipOn : ""}`} onClick={() => setS((x) => ({ ...x, target: v }))}>
              {l}{v && p.price > 0 ? ` (${money(p.price * (1 - v / 100))})` : ""}
            </button>
          ))}
        </div>
      )}
      <div className={fx.optRow}>
        <span>
          <strong>Back in stock</strong>
          <small>{sold ? "It is sold out right now" : "Only used if it sells out"}</small>
        </span>
        <Switch on={s.stock} onChange={(v) => setS((x) => ({ ...x, stock: v }))} label="Back in stock alert" />
      </div>
      <p className={fx.hint}>Sample screen. Alerts are sent from your store's price and stock events.</p>
    </Sheet>
  );
}

/* ---------- 11. chat (WhatsApp or in-app) ---------- */
export function ChatSheet({ brand, profile, onClose, toast }) {
  const wa = profile.whatsapp;
  const [log, setLog] = useState([{ who: "bot", t: `Hi, this is ${brand.name}. How can we help?` }]);
  const [text, setText] = useState("");
  const quick = [
    ["Where is my order?", "Open Account, then Orders, to see live tracking. We also push every step to your phone."],
    ["Delivery times", "Most orders arrive in 2 to 5 days. The exact date shows on every product page."],
    ["Returns", "Returns start from the Orders screen in two taps. Sample answer, yours goes here."],
    ...(profile.sizing ? [["Help me pick a size", "Tap Size guide on any product. It suggests a size from your measurements."]] : []),
    ...(profile.stores ? [["Is it in stores?", "Open Account, then Stores and pickup, to see stores near you and reserve for pickup."]] : []),
    ...(profile.cod ? [["Cash on delivery?", "Yes, choose Cash on delivery at checkout and pay the courier."]] : []),
  ];
  const say = (q, a) => {
    setLog((l) => [...l, { who: "me", t: q }]);
    setTimeout(() => setLog((l) => [...l, { who: "bot", t: a }]), 650);
  };
  return (
    <Sheet title={wa ? "Chat on WhatsApp" : "Chat with us"} onClose={onClose}>
      <div className={fx.chatHead}>
        <span className={fx.chatAv}>{brand.icon ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={brand.icon} alt="" /> : (brand.name || "A").slice(0, 1)}</span>
        <span>
          <strong>{brand.name} support</strong>
          <small>Usually replies within a few minutes</small>
        </span>
      </div>
      <div className={fx.chatLog}>
        {log.map((m, k) => (
          <p key={k} className={m.who === "me" ? fx.me : fx.bot}>{m.t}</p>
        ))}
      </div>
      <div className={fx.quick}>
        {quick.map(([q, a]) => (
          <button key={q} onClick={() => (buzz(14), say(q, a))}>{q}</button>
        ))}
      </div>
      <form
        className={fx.chatForm}
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          say(text.trim(), "Thanks, a team member will reply here shortly. This is a sample chat.");
          setText("");
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" aria-label="Message" />
        <button aria-label="Send"><Svg name="send" size={18} /></button>
      </form>
      {wa && (
        <button className={fx.waBtn} onClick={() => toast("Opens WhatsApp in the real app")}>
          <Svg name="phone" size={18} /> Continue on WhatsApp
        </button>
      )}
    </Sheet>
  );
}

/* ---------- 10. filters and sort ---------- */
export const SORTS = [
  ["featured", "Featured"],
  ["low", "Price: low to high"],
  ["high", "Price: high to low"],
  ["sale", "Biggest discount"],
  ["az", "A to Z"],
];

export const EMPTY_FILTERS = { min: null, max: null, types: [], stock: false, sale: false };

export const activeCount = (f) => (f.min != null || f.max != null ? 1 : 0) + f.types.length + (f.stock ? 1 : 0) + (f.sale ? 1 : 0);

const off = (p) => (p.compareAt && p.compareAt > p.price ? 1 - p.price / p.compareAt : 0);

export function applyFilters(list, f, sort) {
  let out = list.filter((p) => {
    if (f.min != null && (p.price ?? 0) < f.min) return false;
    if (f.max != null && (p.price ?? 0) > f.max) return false;
    if (f.types.length && !f.types.includes(p.type)) return false;
    if (f.stock && p.available === false) return false;
    if (f.sale && !off(p)) return false;
    return true;
  });
  if (sort === "low") out = [...out].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  else if (sort === "high") out = [...out].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  else if (sort === "sale") out = [...out].sort((a, b) => off(b) - off(a));
  else if (sort === "az") out = [...out].sort((a, b) => a.title.localeCompare(b.title));
  return out;
}

export function FilterSheet({ products, filters, sort, money, onApply, onClose }) {
  const [f, setF] = useState(filters);
  const [s, setS] = useState(sort);
  const prices = products.map((p) => p.price).filter((n) => n > 0);
  const lo = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const hi = prices.length ? Math.ceil(Math.max(...prices)) : 0;
  const min = f.min ?? lo;
  const max = f.max ?? hi;
  const types = [...new Set(products.map((p) => p.type).filter(Boolean))];
  const anySale = products.some((p) => off(p));
  const anySold = products.some((p) => p.available === false);
  const n = applyFilters(products, f, s).length;
  return (
    <Sheet
      title="Filter and sort"
      onClose={onClose}
      foot={
        <div className={fx.footRow}>
          <button className={base.ghost} onClick={() => (setF(EMPTY_FILTERS), setS("featured"))}>Clear</button>
          <button className={base.buy} onClick={() => (onApply(f, s), onClose())}>Show {n} item{n === 1 ? "" : "s"}</button>
        </div>
      }
    >
      <span className={fx.lab}>Sort by</span>
      <div className={base.chips}>
        {SORTS.map(([id, l]) => (
          <button key={id} className={`${base.chip} ${s === id ? base.chipOn : ""}`} onClick={() => setS(id)}>{l}</button>
        ))}
      </div>

      {hi > lo && (
        <div className={fx.range}>
          <span className={fx.lab}>Price <b>{money(min)} to {money(max)}</b></span>
          <input type="range" min={lo} max={hi} value={min} aria-label="Minimum price" onChange={(e) => { const v = Math.min(Number(e.target.value), max); setF((x) => ({ ...x, min: v <= lo ? null : v })); }} />
          <input type="range" min={lo} max={hi} value={max} aria-label="Maximum price" onChange={(e) => { const v = Math.max(Number(e.target.value), min); setF((x) => ({ ...x, max: v >= hi ? null : v })); }} />
        </div>
      )}

      {types.length > 1 && (
        <>
          <span className={fx.lab}>Type</span>
          <div className={base.chips}>
            {types.map((t) => {
              const on = f.types.includes(t);
              return (
                <button key={t} className={`${base.chip} ${on ? base.chipOn : ""}`} onClick={() => setF((x) => ({ ...x, types: on ? x.types.filter((y) => y !== t) : [...x.types, t] }))}>{t}</button>
              );
            })}
          </div>
        </>
      )}

      <div className={fx.optRow}>
        <span><strong>In stock only</strong><small>{anySold ? "Hide sold out items" : "Everything shown is in stock"}</small></span>
        <Switch on={f.stock} onChange={(v) => setF((x) => ({ ...x, stock: v }))} label="In stock only" />
      </div>
      {anySale && (
        <div className={fx.optRow}>
          <span><strong>On sale</strong><small>Only reduced items</small></span>
          <Switch on={f.sale} onChange={(v) => setF((x) => ({ ...x, sale: v }))} label="On sale" />
        </div>
      )}
    </Sheet>
  );
}

/* ---------- 9. recent and trending searches ---------- */
export function Suggest({ brand, query, recents, onPick, onOpen, onClear, onDrop }) {
  const hot = useMemo(() => trending(brand), [brand]);
  const q = query.trim().toLowerCase();
  if (q) {
    const hits = brand.products.map((p, i) => ({ p, i })).filter(({ p }) => p.title.toLowerCase().includes(q)).slice(0, 4);
    if (!hits.length) return null;
    return (
      <ul className={fx.hits}>
        {hits.map(({ p, i }) => (
          <li key={i}>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => onOpen(i)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" />
              <span>{p.title}</span>
              <Svg name="chev" size={14} />
            </button>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className={fx.suggest}>
      {recents.length > 0 && (
        <section>
          <div className={fx.sugHead}>
            <h4>Recent searches</h4>
            <button onMouseDown={(e) => e.preventDefault()} onClick={onClear}>Clear</button>
          </div>
          <div className={fx.tags}>
            {recents.map((r) => (
              <span key={r} className={fx.tag}>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(r)}><Svg name="clock" size={13} /> {r}</button>
                <button aria-label={`Remove ${r}`} onMouseDown={(e) => e.preventDefault()} onClick={() => onDrop(r)}><Svg name="close" size={12} /></button>
              </span>
            ))}
          </div>
        </section>
      )}
      {hot.length > 0 && (
        <section>
          <div className={fx.sugHead}><h4>Trending now</h4></div>
          <ol className={fx.trend}>
            {hot.map((t, k) => (
              <li key={t}>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(t)}>
                  <b>{k + 1}</b> {t}
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

/* ---------- 3. complete the look ---------- */
function pickLook(products, idx) {
  const me = products[idx];
  const rest = products.map((p, i) => ({ p, i })).filter(({ i }) => i !== idx);
  const seen = new Set([(me?.type || "").toLowerCase()]);
  const out = [];
  for (const { p, i } of rest) {
    const t = (p.type || "").toLowerCase();
    if (t && seen.has(t)) continue;
    seen.add(t);
    out.push(i);
    if (out.length === 3) break;
  }
  for (const { i } of rest) {
    if (out.length >= 3) break;
    if (!out.includes(i)) out.push(i);
  }
  return out.slice(0, 3);
}

export function CompleteLook({ brand, index, label, money, chosen, onAddAll }) {
  const picks = useMemo(() => pickLook(brand.products, index), [brand.products, index]);
  const [skip, setSkip] = useState([]);
  useEffect(() => setSkip([]), [index]);
  if (picks.length < 2) return null;
  const items = [index, ...picks.filter((i) => !skip.includes(i))];
  const total = items.reduce((n, i) => n + (brand.products[i].price || 0), 0);
  const card = (i, mine) => {
    const p = brand.products[i];
    const on = mine || !skip.includes(i);
    return (
      <button key={i} className={`${fx.lookCard} ${on ? fx.lookOn : ""}`} onClick={() => !mine && (buzz(14), setSkip((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i])))} aria-pressed={on} aria-label={mine ? "This item" : p.title}>
        <span className={fx.lookImg}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image} alt="" loading="lazy" />
          <i>{on && <Svg name="check" size={13} />}</i>
        </span>
        <small>{mine ? "This item" : p.title}</small>
        <b>{money(p.price)}</b>
      </button>
    );
  };
  return (
    <section className={fx.look}>
      <h3 className={base.h}>{label}</h3>
      <div className={fx.lookRow} data-lenis-prevent>{[card(index, true), ...picks.map((i) => card(i, false))]}</div>
      <button className={`${base.buy} ${base.full}`} onClick={() => onAddAll(items, chosen)}>
        Add {items.length} items{total > 0 ? <> &middot; {money(total)}</> : null}
      </button>
    </section>
  );
}

/* ---------- 4. store locator and click and collect ---------- */
export function storesFor(brand, profile) {
  const km = !profile.imperial;
  const d = (x) => (km ? `${x.toFixed(1)} km` : `${(x * 0.621).toFixed(1)} mi`);
  return [
    { name: `${brand.name} Flagship`, area: "City Centre", dist: d(1.2), hours: "Open until 9 pm", ready: "Ready in 2 hours", open: true, pos: [58, 40] },
    { name: `${brand.name} Central Mall`, area: "Central Mall, level 2", dist: d(3.8), hours: "Open until 10 pm", ready: "Ready today", open: true, pos: [30, 66] },
    { name: `${brand.name} Outlet`, area: "North Retail Park", dist: d(7.5), hours: "Opens 10 am", ready: "Ready tomorrow", open: false, pos: [78, 72] },
  ];
}

export function StoresScreen({ brand, profile, store, setStore, toast }) {
  const list = storesFor(brand, profile);
  return (
    <div className={base.home}>
      <h2 className={base.pageTitle}>Stores and pickup</h2>
      <div className={fx.map} aria-hidden="true">
        {list.map((s, k) => (
          <span key={k} className={`${fx.pin} ${store === k ? fx.pinOn : ""}`} style={{ left: `${s.pos[0]}%`, top: `${s.pos[1]}%` }}>
            <Svg name="pin" size={28} />
          </span>
        ))}
        <span className={fx.you} style={{ left: "46%", top: "52%" }} />
      </div>
      <ul className={fx.storeList}>
        {list.map((s, k) => (
          <li key={s.name} className={store === k ? fx.storeOn : ""}>
            <div>
              <strong>{s.name}</strong>
              <small>{s.area} &middot; {s.dist}</small>
              <small className={s.open ? fx.open : fx.shut}>{s.hours}</small>
              <small>{s.ready} for pickup</small>
            </div>
            <div className={fx.storeBtns}>
              <button onClick={() => (buzz(16), setStore(k), toast(`Pickup set to ${s.name}`))} className={store === k ? fx.picked : ""}>
                {store === k ? "Selected" : "Pick up here"}
              </button>
              <button onClick={() => toast("Opens maps in the real app")}>Directions</button>
            </div>
          </li>
        ))}
      </ul>
      <p className={base.muted}>Sample stores. Your real locations and stock per store load here.</p>
      <div className={base.spacer} />
    </div>
  );
}

/* ---------- 5. loyalty tiers ---------- */
const TIERS = [["Member", 0], ["Insider", 500], ["VIP", 1500]];

export function pointsFor(orders) {
  return 250 + orders.length * 120;
}

export function RewardsScreen({ brand, money, orders, onInvite, toast }) {
  const pts = pointsFor(orders);
  const k = TIERS.reduce((a, [, at], i) => (pts >= at ? i : a), 0);
  const next = TIERS[k + 1];
  const pct = next ? Math.min(100, ((pts - TIERS[k][1]) / (next[1] - TIERS[k][1])) * 100) : 100;
  const amts = giftAmounts(brand.products);
  const redeem = [[200, amts[0]], [500, amts[1]], [1000, amts[2] ?? amts[1]]];
  const hist = [
    ...orders.map((o) => ({ t: `Order #${o.id}`, p: 120, d: "Just now" })),
    { t: "Product review", p: 30, d: "2 weeks ago" },
    { t: "Order #4755", p: 120, d: "3 weeks ago" },
    { t: "Welcome bonus", p: 100, d: "Joined" },
  ];
  return (
    <div className={base.home}>
      <h2 className={base.pageTitle}>Rewards</h2>
      <div className={fx.tierCard}>
        <span className={fx.tierName}><Svg name="crown" size={16} /> {TIERS[k][0]}</span>
        <strong>{pts.toLocaleString("en")}</strong>
        <small>points</small>
        <div className={fx.bar}><i style={{ width: `${pct}%` }} /></div>
        <small>{next ? `${(next[1] - pts).toLocaleString("en")} more points to reach ${next[0]}` : "You are at the top tier"}</small>
        <ul className={fx.tierDots}>
          {TIERS.map(([n, at], i) => (
            <li key={n} className={i <= k ? fx.tierDone : ""}><i />{n}<small>{at ? `${at}+` : "Start"}</small></li>
          ))}
        </ul>
      </div>

      <section>
        <h3 className={base.h}>Spend your points</h3>
        <ul className={fx.redeem}>
          {redeem.map(([need, val]) => (
            <li key={need}>
              <span><strong>{money(val)} voucher</strong><small>{need} points</small></span>
              <button disabled={pts < need} onClick={() => (buzz(16), toast("Voucher added to your wallet (sample)"))}>{pts >= need ? "Redeem" : `${need - pts} to go`}</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className={base.h}>Ways to earn</h3>
        <ul className={fx.earn}>
          <li><Svg name="bag" size={18} /> Every order<b>+120</b></li>
          <li><Svg name="star" size={18} /> Write a review<b>+30</b></li>
          <li><button onClick={onInvite}><Svg name="users" size={18} /> Invite a friend<b>+200</b></button></li>
        </ul>
      </section>

      <section>
        <h3 className={base.h}>History</h3>
        <ul className={fx.history}>
          {hist.map((h, i) => (
            <li key={i}><span><strong>{h.t}</strong><small>{h.d}</small></span><b>+{h.p}</b></li>
          ))}
        </ul>
      </section>
      <p className={base.muted}>Sample balance and tiers. Your existing loyalty programme carries over.</p>
      <div className={base.spacer} />
    </div>
  );
}

/* ---------- 6. referral ---------- */
export function InviteScreen({ brand, money, toast }) {
  const amt = giftAmounts(brand.products)[0];
  const code = `${(brand.name || "FRIEND").replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase()}-YOU`;
  const share = async () => {
    buzz(16);
    const text = `Get ${money(amt)} off your first ${brand.name} order with my code ${code}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard?.writeText(text);
    } catch {}
    toast("Invite copied (sample)");
  };
  return (
    <div className={base.home}>
      <h2 className={base.pageTitle}>Invite friends</h2>
      <div className={fx.invite}>
        <Svg name="gift" size={34} />
        <strong>Give {money(amt)}, get {money(amt)}</strong>
        <small>Your friend gets {money(amt)} off their first order. You get {money(amt)} when they buy.</small>
        <div className={fx.codeBox}>
          <code>{code}</code>
          <button onClick={() => { buzz(14); navigator.clipboard?.writeText(code).catch(() => {}); toast("Code copied (sample)"); }} aria-label="Copy code"><Svg name="copy" size={16} /></button>
        </div>
        <button className={base.buy} onClick={share}>Share my invite</button>
      </div>
      <ol className={fx.steps}>
        <li><b>1</b><span>Share your code by message, WhatsApp or link</span></li>
        <li><b>2</b><span>They order in the app and get {money(amt)} off</span></li>
        <li><b>3</b><span>You get {money(amt)} credit and 200 points</span></li>
      </ol>
      <div className={fx.stats}>
        <span><b>0</b><small>Friends joined</small></span>
        <span><b>{money(0)}</b><small>Earned</small></span>
      </div>
      <p className={base.muted}>Sample referral. Amounts and rules come from your own offer.</p>
      <div className={base.spacer} />
    </div>
  );
}

/* ---------- 7. gift cards ---------- */
export function GiftCardScreen({ brand, money, onAdd, toast }) {
  const amts = useMemo(() => giftAmounts(brand.products), [brand.products]);
  const [amt, setAmt] = useState(amts[1] ?? amts[0]);
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState("");
  const [code, setCode] = useState("");
  return (
    <div className={base.home}>
      <h2 className={base.pageTitle}>Gift cards</h2>
      <div className={fx.gcard}>
        <span className={fx.gcLogo}>{brand.logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={brand.logo} alt="" /> : <b>{brand.name}</b>}</span>
        <strong>{money(amt)}</strong>
        <small>{to ? `For ${to}` : "Gift card"}</small>
      </div>
      <div>
        <span className={fx.lab}>Choose an amount</span>
        <div className={base.chips}>
          {amts.map((a) => (
            <button key={a} className={`${base.chip} ${a === amt ? base.chipOn : ""}`} onClick={() => (buzz(14), setAmt(a))}>{money(a)}</button>
          ))}
        </div>
      </div>
      <label className={fx.field}>
        <span>Who is it for?</span>
        <span className={fx.inputWrap}><input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Their name" maxLength={30} /></span>
      </label>
      <label className={fx.field}>
        <span>Add a message</span>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Happy birthday!" maxLength={140} rows={3} />
      </label>
      <button className={`${base.buy} ${base.full}`} onClick={() => onAdd({ amount: amt, to, msg })}>Add to cart &middot; {money(amt)}</button>
      <div className={fx.redeemBox}>
        <strong>Have a gift card?</strong>
        <div className={fx.codeBox}>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code" aria-label="Gift card code" />
          <button onClick={() => toast(code ? "Added to your wallet (sample)" : "Type a code first")}>Add</button>
        </div>
      </div>
      <p className={base.muted}>Delivered by email or message, never expires. Sample screen.</p>
      <div className={base.spacer} />
    </div>
  );
}

/* ---------- 8. saved cards and wallet pay (sample UI, no real card data) ---------- */
export const CARDS = [
  { id: "visa", brand: "Visa", last: "4242", exp: "08/28" },
  { id: "mc", brand: "Mastercard", last: "4444", exp: "02/27" },
];

export function CardsScreen({ profile, pay, setPay, toast }) {
  return (
    <div className={base.home}>
      <h2 className={base.pageTitle}>Payment methods</h2>
      <ul className={fx.cards}>
        {CARDS.map((c) => (
          <li key={c.id}>
            <button className={pay === c.id ? fx.cardOn : ""} onClick={() => (buzz(14), setPay(c.id))}>
              <Svg name="card" size={22} />
              <span><strong>{c.brand} ending {c.last}</strong><small>Expires {c.exp}</small></span>
              {pay === c.id && <em>Default</em>}
            </button>
          </li>
        ))}
      </ul>
      <button className={base.ghost} onClick={() => toast("Opens the secure card form in the real app")}>Add a card</button>
      <section>
        <h3 className={base.h}>Wallets</h3>
        <ul className={fx.cards}>
          {["Apple Pay", "Google Pay"].map((w) => (
            <li key={w}>
              <button className={pay === w ? fx.cardOn : ""} onClick={() => (buzz(14), setPay(w))}>
                <Svg name="wallet" size={22} />
                <span><strong>{w}</strong><small>One tap at checkout</small></span>
                {pay === w && <em>Default</em>}
              </button>
            </li>
          ))}
          {profile.cod && (
            <li>
              <button className={pay === "cod" ? fx.cardOn : ""} onClick={() => (buzz(14), setPay("cod"))}>
                <Svg name="cash" size={22} />
                <span><strong>Cash on delivery</strong><small>Pay the courier when it arrives</small></span>
                {pay === "cod" && <em>Default</em>}
              </button>
            </li>
          )}
        </ul>
      </section>
      <p className={base.muted}>Sample cards. The real app never stores card numbers; your payment provider does.</p>
      <div className={base.spacer} />
    </div>
  );
}

/* ---------- 7, 8, 12. checkout options: gift note, delivery, payment ---------- */
export function CheckoutOptions({ brand, profile, store, opt, setOpt, money }) {
  const methods = [
    { id: "visa", icon: "card", t: "Visa ending 4242", s: "Saved card" },
    { id: "Google Pay", icon: "wallet", t: "Google Pay", s: "One tap" },
    { id: "Apple Pay", icon: "wallet", t: "Apple Pay", s: "One tap" },
    ...(profile.cod ? [{ id: "cod", icon: "cash", t: "Cash on delivery", s: "Pay the courier when it arrives" }] : []),
  ];
  const st = storesFor(brand, profile)[store] || storesFor(brand, profile)[0];
  return (
    <div className={fx.co}>
      {profile.stores && (
        <section>
          <h3 className={base.h}>Delivery</h3>
          <div className={fx.seg} role="tablist">
            {[["ship", "Deliver to me"], ["pickup", "Pick up in store"]].map(([id, l]) => (
              <button key={id} role="tab" aria-selected={opt.mode === id} className={opt.mode === id ? fx.segOn : ""} onClick={() => (buzz(14), setOpt({ ...opt, mode: id }))}>{l}</button>
            ))}
          </div>
          {opt.mode === "pickup" && (
            <p className={fx.coNote}><Svg name="store" size={16} /> <span><b>{st.name}</b><br />{st.ready}. Free.</span></p>
          )}
        </section>
      )}
      <section>
        <div className={fx.optRow}>
          <span><strong>This is a gift</strong><small>Adds a note, hides prices on the packing slip</small></span>
          <Switch on={opt.gift} onChange={(v) => setOpt({ ...opt, gift: v })} label="This is a gift" />
        </div>
        {opt.gift && (
          <textarea className={fx.giftNote} value={opt.note} onChange={(e) => setOpt({ ...opt, note: e.target.value })} placeholder="Write a short note for the card" maxLength={160} rows={3} aria-label="Gift note" />
        )}
      </section>
      <section>
        <h3 className={base.h}>Pay with</h3>
        <ul className={fx.cards}>
          {methods.map((m) => (
            <li key={m.id}>
              <button className={opt.pay === m.id ? fx.cardOn : ""} onClick={() => (buzz(14), setOpt({ ...opt, pay: m.id }))} aria-pressed={opt.pay === m.id}>
                <Svg name={m.icon} size={22} />
                <span><strong>{m.t}</strong><small>{m.s}</small></span>
                <i className={fx.radio} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
