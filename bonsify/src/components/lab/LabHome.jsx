"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { INTEGRATION_COUNT } from "@/lib/integrations";
import AppQr from "@/components/proposals/AppQr";
import { enterFullscreen, exitFullscreen, isFullscreen, onFullscreenChange } from "@/lib/fullscreen";
import Phone from "@/components/proposals/Phone";
import BrandApp from "@/components/proposals/BrandApp";
import BrandMark from "@/components/shared/BrandMark";
import StoreModal from "./StoreModal";
import Tour, { TOUR } from "./Tour";
import { saveLead, brandGuess } from "@/lib/leads";
import BonsifyLoader from "@/components/proposals/BonsifyLoader";
import BonsaiArt from "./BonsaiArt";
import { curateBrand } from "@/lib/curate";
import { makeScreenTexture } from "@/lib/arTexture";
import styles from "./LabHome.module.css";

/* ---------- small helpers ---------- */
const buzz = (p = 20) => {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(p);
  } catch {}
};

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

function rgb(hex) {
  const h = (hex || "#444444").replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
}
const toHex = (a) => "#" + a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");
function mix(a, b, t) {
  const x = rgb(a);
  const y = rgb(b);
  return toHex(x.map((v, i) => v * (1 - t) + y[i] * t));
}

function palette(brand) {
  const p = brand.colors?.primary || "#2F6B4F";
  let a = brand.colors?.accent || p;
  // Near-black brands borrow the accent so the page still changes colour.
  const [r, g, b] = rgb(p);
  const dark = (r * 299 + g * 587 + b * 114) / 1000 < 40;
  const base = dark ? a : p;
  return [
    { bg: "linear-gradient(160deg,#F4EFE4 0%,#ECE5D5 100%)", light: true },
    { bg: `linear-gradient(145deg,${mix(base, "#000", 0.5)} 0%,${mix(a, "#000", 0.66)} 100%)` },
    { bg: `radial-gradient(900px 640px at 78% 42%,${mix(a, "#000", 0.5)} 0%,#14171A 72%)` },
    { bg: `linear-gradient(145deg,${mix(a, "#000", 0.58)} 0%,${mix(base, "#000", 0.62)} 100%)` },
    { bg: "linear-gradient(150deg,#2F6B4F 0%,#1c4533 100%)" },
    { bg: "linear-gradient(180deg,#14171A 0%,#1b2024 100%)" },
  ];
}

function moneyFor(currency) {
  try {
    const f = new Intl.NumberFormat("en", { style: "currency", currency: currency || "USD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 });
    return (n) => (n == null ? "" : f.format(Math.round(n)));
  } catch {
    return (n) => (n == null ? "" : `${currency || ""} ${Math.round(n)}`.trim());
  }
}

const PHRASES = ["Bonsifying your store", "Working the magic", "Polishing the pixels", "Stitching the screens", "Tuning every tap"];

// Each chapter shows one screen of the app. `screen` is what BrandApp.show() takes.
const CH = [
  { n: "Start", screen: "home" },
  { n: "Catalogue", screen: "shop" },
  { n: "Push", screen: "notifications" },
  { n: "Offers", screen: "vouchers" },
  { n: "Orders", screen: "orders" },
  { n: "Bundles", screen: "fbt" },
  { n: "Reviews", screen: "reviews" },
  { n: "Loyalty", screen: "rewards" },
  { n: "Support", screen: "chat" },
  { n: "Proof" },
  { n: "Work" },
];
const NAMES = CH.map((c) => c.n);
const PROOF = 9;
const WORK = 10;
// 1 means the phone sits left of the copy, so floating pieces fly to its right.
const SIDE = [-1, 1, -1, 1, -1, 1, -1, 1, -1, -1, 1];
// The first five palettes are used in turn; proof and work keep their own.
const palFor = (pal, ch) => (ch === 0 ? pal[0] : ch === PROOF ? pal[4] : ch === WORK ? pal[5] : pal[1 + ((ch - 1) % 3)]);

/* ---------- counters ---------- */
function Counter({ value }) {
  const m = /^(\D*)(\d+(?:\.\d+)?)(.*)$/.exec(String(value));
  const ref = useRef(null);
  const [n, setN] = useState(0);
  const target = m ? parseFloat(m[2]) : 0;
  const decimals = m && m[2].includes(".") ? 1 : 0;
  useEffect(() => {
    if (!m) return;
    const el = ref.current;
    let raf;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t) => {
          const k = clamp((t - t0) / 1400, 0, 1);
          setN(target * (1 - Math.pow(1 - k, 3)));
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!m) return <span ref={ref}>{value}</span>;
  return (
    <span ref={ref}>
      {m[1]}
      {n.toFixed(decimals)}
      {m[3]}
    </span>
  );
}

/* ---------- floating pieces ---------- */
function Piece({ show, ch, x, y, mx, my, hideM = false, r = 0, z = 40, delay = 0, children, label }) {
  return (
    <div
      className={`${styles.piece} ${show.includes(ch) ? styles.on : ""} ${hideM ? styles.hideM : ""}`}
      style={{ "--x": x, "--y": y, "--mx": mx ?? x, "--my": my ?? y, "--r": `${r}deg`, "--z": `${z}px`, "--d": `${delay}ms` }}
      aria-hidden="true"
      data-label={label}
    >
      <div className={styles.pieceIn}>{children}</div>
    </div>
  );
}

function Countdown() {
  const [s, setS] = useState(2 * 3600 + 14 * 60 + 9);
  useEffect(() => {
    const t = setInterval(() => setS((v) => (v > 0 ? v - 1 : 3 * 3600)), 1000);
    return () => clearInterval(t);
  }, []);
  const p = (n) => String(n).padStart(2, "0");
  return (
    <span>
      {p(Math.floor(s / 3600))}:{p(Math.floor((s % 3600) / 60))}:{p(s % 60)}
    </span>
  );
}

/* ---------- main ---------- */
export default function LabHome({ brands, apps, proof }) {
  const [slug, setSlug] = useState(brands[0]?.slug);
  const [custom, setCustom] = useState(null);
  const [ch, setCh] = useState(0);
  const [base, setBase] = useState(null);
  const [wipe, setWipe] = useState(null);
  const [navLight, setNavLight] = useState(true);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [phrase, setPhrase] = useState(0);
  const [err, setErr] = useState("");
  const [needsTiltTap, setNeedsTiltTap] = useState(false);
  const [touch, setTouch] = useState(false);
  const [arLib, setArLib] = useState(false);
  const [arCan, setArCan] = useState(null);
  const [arMsg, setArMsg] = useState("");
  const [fs, setFs] = useState(false);
  const [act, setAct] = useState(0);
  const [modal, setModal] = useState(null); // "intake" | "notshop"
  const [lead, setLead] = useState({ name: "", email: "", brandName: "", url: "", website: "" });
  const [note, setNote] = useState("");
  const [tip, setTip] = useState(false);
  const fsAppRef = useRef(null);
  const [tour, setTour] = useState(null); // step number while the tour runs
  const leadSent = useRef(false);

  const brand = (custom && slug === "yours" ? custom : brands.find((b) => b.slug === slug)) || brands[0];
  const tourOn = tour != null;
  const pal = useMemo(() => palette(brand), [brand]);
  const money = useMemo(() => moneyFor(brand.currency), [brand.currency]);

  const rootRef = useRef(null);
  const rigRef = useRef(null);
  const tiltRef = useRef(null);
  const appRef = useRef(null);
  const wipeId = useRef(0);
  const firstWipe = useRef(true);
  const lastBrand = useRef(brand.slug);
  const reduced = useRef(false);
  const mvRef = useRef(null);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  /* scroll snap only while the lab is mounted */
  useEffect(() => {
    document.documentElement.classList.add("lab-snap");
    return () => document.documentElement.classList.remove("lab-snap");
  }, []);

  /* which chapter is in the middle of the screen */
  useEffect(() => {
    const els = [...rootRef.current.querySelectorAll("main [data-ch]")];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setCh(Number(e.target.dataset.ch));
        });
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* Paging for mouse wheel, trackpad and keyboard: one push moves exactly one
     section, however hard it is flicked. The section is worked out from where
     the page actually is, not from a stored index, so it never drifts. Touch
     screens use the browser's own snapping. */
  const fsRef = useRef(false);
  fsRef.current = fs;
  const goRef = useRef(null);
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const secs = () => [...rootRef.current.querySelectorAll("main [data-ch]"), ...document.querySelectorAll("footer.lab-footer")];
    let target = null;
    let busyUntil = 0;
    let lastScroll = 0;
    let lastT = 0;
    let lastAbs = 0;
    let decayed = true;
    const onScroll = () => (lastScroll = performance.now());
    const current = () => {
      let best = 0;
      let d = Infinity;
      secs().forEach((el, i) => {
        const t = Math.abs(el.getBoundingClientRect().top);
        if (t < d) {
          d = t;
          best = i;
        }
      });
      return best;
    };
    const busy = (now) => now < busyUntil || now - lastScroll < 90;
    const go = (i) => {
      const s = secs();
      const n = clamp(i, 0, s.length - 1);
      target = n;
      busyUntil = performance.now() + (reduced.current ? 80 : 480);
      s[n].scrollIntoView({ behavior: reduced.current ? "auto" : "smooth" });
    };
    goRef.current = go;
    // A section taller than the window scrolls normally until its edge shows.
    const inside = (base, dir) => {
      const r = secs()[base]?.getBoundingClientRect();
      if (!r) return false;
      return (dir > 0 && r.bottom > window.innerHeight + 8) || (dir < 0 && r.top < -8);
    };
    const step = (dir) => {
      const now = performance.now();
      const base = busy(now) && target != null ? target : current();
      go(base + dir);
    };

    const onWheel = (e) => {
      if (!fine || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      // Over the phone the wheel belongs to the app, and the page never moves.
      if (e.target.closest?.("[data-phone]")) {
        const sc = e.target.closest("[data-lenis-prevent]");
        const can = sc && (e.deltaY < 0 ? sc.scrollTop > 0 : sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1);
        if (!can) e.preventDefault();
        return;
      }
      if (e.target.closest?.("input, textarea, select")) return;
      if (fsRef.current) return;
      const now = performance.now();
      const a = Math.abs(e.deltaY);
      const dir = e.deltaY > 0 ? 1 : -1;
      const gap = now - lastT;
      // One push = one section. A new push is a pause of 100 ms or more, or a
      // clear jump in speed after the previous swipe has died down. The tail of
      // a trackpad swipe is neither, so it can never skip a section.
      if (a < lastAbs * 0.85) decayed = true;
      const fresh = gap > 100 || (decayed && a > lastAbs * 1.4 + 8);
      lastT = now;
      lastAbs = a;
      if (a < 2) return;
      const isBusy = busy(now);
      const base = isBusy && target != null ? target : current();
      if (!isBusy && inside(base, dir)) return;
      e.preventDefault();
      if (!fresh) return;
      decayed = false;
      go(base + dir);
    };

    const onKey = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || fsRef.current) return;
      const t = e.target;
      if (t.closest?.("input, textarea, select, [contenteditable='true']")) return;
      let dir = 0;
      let to = null;
      if (e.key === "ArrowDown" || e.key === "PageDown") dir = 1;
      else if (e.key === "ArrowUp" || e.key === "PageUp") dir = -1;
      else if (e.key === " ") {
        if (t.closest?.("button, a, summary")) return;
        dir = e.shiftKey ? -1 : 1;
      } else if (e.key === "Home") to = 0;
      else if (e.key === "End") to = secs().length - 1;
      else return;
      const now = performance.now();
      const isBusy = busy(now);
      if (dir) {
        const base = isBusy && target != null ? target : current();
        if (!isBusy && inside(base, dir)) return; // let the browser scroll the tall section
        e.preventDefault();
        if (e.repeat && isBusy) return;
        go(base + dir);
      } else {
        e.preventDefault();
        go(to);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  /* Touch: a vertical swipe that starts on the phone only ever scrolls the app.
     If the app has nothing to scroll in that direction, the swipe does nothing. */
  const phoneRef = useRef(null);
  useEffect(() => {
    const el = phoneRef.current;
    if (!el) return;
    let y0 = 0;
    let x0 = 0;
    const scroller = (t) => {
      for (let n = t; n && n !== el; n = n.parentElement) {
        if (n.scrollHeight > n.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(n).overflowY)) return n;
      }
      return null;
    };
    const start = (e) => {
      y0 = e.touches[0].clientY;
      x0 = e.touches[0].clientX;
    };
    const move = (e) => {
      const dy = e.touches[0].clientY - y0;
      const dx = e.touches[0].clientX - x0;
      if (Math.abs(dx) > Math.abs(dy)) return;
      const sc = scroller(e.target);
      const up = dy > 0; // finger moving down means content scrolls to the top
      const can = sc && (up ? sc.scrollTop > 0 : sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1);
      if (!can && e.cancelable) e.preventDefault();
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
    };
  }, []);

  /* the site header and footer are shared, so tell the header which tone the page is in */
  useEffect(() => {
    document.body.dataset.labHome = "1";
    return () => {
      delete document.body.dataset.labHome;
      delete document.body.dataset.heroDark;
    };
  }, []);
  useEffect(() => {
    if (navLight) delete document.body.dataset.heroDark;
    else document.body.dataset.heroDark = "1";
  }, [navLight]);

  /* "Get your app now" in the header links here */
  const inputRef = useRef(null);
  useEffect(() => {
    const check = () => {
      if (window.location.hash === "#start") {
        goRef.current?.(0);
        setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 700);
      }
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);

  /* colour wipe from the phone whenever the chapter or the store changes */
  useEffect(() => {
    const next = palFor(pal, ch);
    setNavLight(!!next.light);
    if (firstWipe.current) {
      firstWipe.current = false;
      setBase(next.bg);
      return;
    }
    if (reduced.current) {
      setBase(next.bg);
      return;
    }
    const r = rigRef.current?.getBoundingClientRect();
    const x = r ? r.left + r.width / 2 : window.innerWidth / 2;
    const y = r ? r.top + r.height / 2 : window.innerHeight / 2;
    setWipe((w) => {
      if (w) setBase(w.bg);
      return { k: ++wipeId.current, bg: next.bg, x, y };
    });
    buzz(14);
  }, [ch, pal]);

  /* drive the phone through the story. While the tour runs, the tour is in charge. */
  useEffect(() => {
    if (tourOn) return;
    const changed = lastBrand.current !== brand.slug;
    lastBrand.current = brand.slug;
    const t = setTimeout(
      () => {
        const a = appRef.current;
        if (!a) return;
        a.show(CH[ch]?.screen || "home");
      },
      changed ? 1900 : 650
    );
    return () => clearTimeout(t);
  }, [ch, brand.slug, tourOn]);

  useEffect(() => {
    if (tour == null) return;
    // The tour drives whichever app is on screen: the full screen one when it is open.
    const t = setTimeout(() => (fs ? fsAppRef : appRef).current?.show(TOUR[tour].screen), fs ? 450 : 120);
    return () => clearTimeout(t);
  }, [tour, fs]);

  /* haptic taps as notifications land */
  useEffect(() => {
    if (ch !== 2) return;
    const ts = [750, 1250, 1750].map((d) => setTimeout(() => buzz([30]), d));
    return () => ts.forEach(clearTimeout);
  }, [ch]);

  /* cursor and gyroscope tilt, smoothed in a rAF loop. The phone leans by how
     far the device has moved from where it was first held. */
  useEffect(() => {
    const tgt = { rx: 0, ry: 0 };
    const cur = { rx: 0, ry: 0 };
    const base = { b: null, g: null };
    let raf;
    let gyro = false;
    // The phone holds still while the visitor is over it or using it, and leans
    // again once they scroll or press anything outside it.
    let hold = false;
    const inPhone = (t) => !!(t && t.closest && t.closest("[data-phone]"));
    const onDown = (e) => {
      hold = inPhone(e.target);
    };
    const onWheelTilt = (e) => {
      hold = inPhone(e.target);
    };
    const onScrollTilt = () => {
      hold = false;
    };
    const onKeyTilt = () => {
      hold = false;
    };
    const onMove = (e) => {
      if (inPhone(e.target)) hold = true;
      if (hold) {
        tgt.rx = 0;
        tgt.ry = 0;
        return;
      }
      if (gyro || reduced.current) return;
      tgt.ry = (e.clientX / window.innerWidth - 0.5) * 2 * 13;
      tgt.rx = -(e.clientY / window.innerHeight - 0.5) * 2 * 9;
    };
    const onOrient = (e) => {
      if (e.gamma == null || e.beta == null) return;
      gyro = true;
      if (hold) {
        tgt.rx = 0;
        tgt.ry = 0;
        return;
      }
      if (base.b == null) {
        base.b = e.beta;
        base.g = e.gamma;
      }
      // Drift the reference slowly so a new resting position becomes neutral.
      base.b += (e.beta - base.b) * 0.004;
      base.g += (e.gamma - base.g) * 0.004;
      tgt.ry = clamp((e.gamma - base.g) * 0.8, -22, 22);
      tgt.rx = clamp(-(e.beta - base.b) * 0.7, -18, 18);
    };
    const loop = () => {
      cur.rx += (tgt.rx - cur.rx) * 0.1;
      cur.ry += (tgt.ry - cur.ry) * 0.1;
      if (tiltRef.current) tiltRef.current.style.transform = `rotateX(${cur.rx.toFixed(2)}deg) rotateY(${cur.ry.toFixed(2)}deg)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("wheel", onWheelTilt, { passive: true });
    window.addEventListener("scroll", onScrollTilt, { passive: true });
    window.addEventListener("keydown", onKeyTilt);
    const D = window.DeviceOrientationEvent;
    if (D) {
      if (typeof D.requestPermission === "function") {
        setNeedsTiltTap(true);
        // Permission has to come from a tap; the first tap anywhere asks for it.
        const ask = async () => {
          try {
            const res = await D.requestPermission();
            if (res === "granted") {
              window.addEventListener("deviceorientation", onOrient);
              setNeedsTiltTap(false);
            }
          } catch {}
        };
        window.addEventListener("pointerup", ask, { once: true });
        window.__labAsk = ask;
      } else window.addEventListener("deviceorientation", onOrient);
    }
    raf = requestAnimationFrame(loop);
    window.__labOrient = onOrient;
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("wheel", onWheelTilt);
      window.removeEventListener("scroll", onScrollTilt);
      window.removeEventListener("keydown", onKeyTilt);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, []);

  const enableTilt = async () => {
    try {
      const res = await window.DeviceOrientationEvent.requestPermission();
      if (res === "granted") {
        window.addEventListener("deviceorientation", window.__labOrient);
        setNeedsTiltTap(false);
        buzz(22);
      }
    } catch {
      setNeedsTiltTap(false);
    }
  };

  /* custom cursor ring (mouse only) */
  const cursorRef = useRef(null);
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = cursorRef.current;
    let x = -100;
    let y = -100;
    let cx = x;
    let cy = y;
    let raf;
    const move = (e) => {
      x = e.clientX;
      y = e.clientY;
      const t = e.target.closest?.("[data-cursor]");
      const label = t ? t.dataset.cursor : "";
      el.dataset.mode = !t ? "" : label === "Open" ? "big" : "ring";
      el.textContent = label === "Open" ? label : "";
    };
    const loop = () => {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      el.style.transform = `translate(${cx}px,${cy}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    el.style.opacity = "1";
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* type your store */
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setPhrase((p) => (p + 1) % PHRASES.length), 1800);
    return () => clearInterval(t);
  }, [busy]);

  /* The store form. The hero field only asks for the address; the pop-up takes the rest. */
  const openIntake = (e) => {
    e.preventDefault();
    if (busy) return;
    if (!url.trim()) return setErr("Type your store address first, like yourstore.com.");
    setErr("");
    setNote("");
    leadSent.current = false;
    setLead((l) => ({ ...l, url: url.trim(), brandName: l.brandName && l.url === url.trim() ? l.brandName : brandGuess(url) }));
    setModal("intake");
  };

  // Closing the form half way still keeps the address.
  const closeModal = useCallback(() => {
    if (!leadSent.current) {
      leadSent.current = true;
      saveLead({ stage: modal === "notshop" ? "not_shopify" : "abandoned", ...lead, source: "lab-home" });
    }
    setModal(null);
  }, [modal, lead]);

  const submitModal = async (tk) => {
    if (modal === "notshop") {
      leadSent.current = true;
      saveLead({ stage: "not_shopify", ...lead, source: "lab-home" });
      setModal(null);
      setNote(`Thanks ${lead.name.split(" ")[0] || ""}. We will check ${lead.url} by hand and email you.`.replace("  ", " "));
      return;
    }
    leadSent.current = true;
    saveLead({ stage: "submitted", ...lead, source: "lab-home" });
    setUrl(lead.url);
    setModal(null);
    run(lead.url, tk);
  };

  const run = async (target, tk) => {
    if (busy) return;
    setErr("");
    setBusy(true);
    setPhrase(0);
    buzz(22);
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 58000);
    try {
      const r = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target.trim(), token: tk }),
        signal: ctl.signal,
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const e = new Error(d.error || "Could not read that store.");
        e.code = d.code;
        throw e;
      }
      // Drop look-alike products and lead with photos that have people in them.
      let made = d.brand;
      try {
        made = await curateBrand(d.brand);
      } catch {
        made = { ...d.brand, products: d.brand.products.slice(0, 12), banners: d.brand.banners.slice(0, 3) };
      }
      setCustom(made);
      setSlug("yours");
      buzz([24, 50, 36]);
      goRef.current?.(0);
      setTip(true);
    } catch (x) {
      if (x.code === "not_shopify") {
        // Keep the address, name and email before showing the notice.
        leadSent.current = true;
        saveLead({ stage: "not_shopify", ...lead, url: target, source: "lab-home" });
        setLead((l) => ({ ...l, url: target }));
        setModal("notshop");
      } else setErr(x.name === "AbortError" ? "That store took too long to read. Try again, or book a call and we will show yours." : x.message);
    } finally {
      clearTimeout(to);
      setBusy(false);
    }
  };

  const goTo = (i) => {
    buzz(14);
    goRef.current ? goRef.current(i) : rootRef.current.querySelector(`main [data-ch="${i}"]`)?.scrollIntoView({ behavior: "smooth" });
  };

  /* AR: on phones only. Google's model-viewer loads after the page settles and
     one hidden copy per store is used to open AR from the button. */
  useEffect(() => {
    if (!touch) return;
    const t = setTimeout(() => {
      if (customElements.get("model-viewer")) return setArLib(true);
      const sc = document.createElement("script");
      sc.type = "module";
      sc.src = "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js";
      sc.onload = () => customElements.whenDefined("model-viewer").then(() => setArLib(true));
      document.head.appendChild(sc);
    }, 2500);
    return () => clearTimeout(t);
  }, [touch]);

  useEffect(() => {
    if (!arLib) return;
    setArCan(null);
    const mv = mvRef.current;
    if (!mv) return;
    let dead = false;
    const ready = async () => {
      if (dead) return;
      if (brand.slug === "yours") {
        try {
          const url = await makeScreenTexture(brand);
          const tex = await mv.createTexture(url);
          const m = mv.model?.materials?.[1];
          m?.pbrMetallicRoughness?.baseColorTexture?.setTexture(tex);
          m?.emissiveTexture?.setTexture(tex);
        } catch {}
      }
      // The AR mode is picked a moment after the model loads, so wait for it.
      for (let i = 0; i < 20 && !dead && !mv.canActivateAR; i++) await new Promise((r) => setTimeout(r, 250));
      if (!dead) setArCan(!!mv.canActivateAR);
    };
    mv.addEventListener("load", ready);
    if (mv.loaded) ready();
    return () => {
      dead = true;
      mv.removeEventListener("load", ready);
    };
  }, [arLib, brand]);

  const openAr = async () => {
    buzz(22);
    const mv = mvRef.current;
    if (!mv) return;
    setArMsg("Opening AR...");
    // Give the viewer a moment if it is still deciding which AR mode to use.
    for (let i = 0; i < 12 && !mv.canActivateAR; i++) await new Promise((r) => setTimeout(r, 250));
    if (mv.canActivateAR) {
      setArMsg("");
      mv.activateAR();
    } else {
      setArMsg("This phone or browser cannot open AR. On Android it needs Chrome with Google Play Services for AR installed.");
    }
  };

  /* full screen app on phones */
  const [fsBox, setFsBox] = useState({ s: 1, x: 0, y: 0 });
  const fsEntered = useRef(false);
  const openFs = () => {
    const s = Math.min(window.innerWidth / 390, window.innerHeight / 844);
    setFsBox({ s, x: (window.innerWidth - 390 * s) / 2, y: (window.innerHeight - 844 * s) / 2 });
    setFs(true);
    buzz(22);
    // Desktop: also ask the browser for full screen (needs this click).
    if (!window.matchMedia("(pointer: coarse)").matches) {
      fsEntered.current = false;
      enterFullscreen().then((ok) => (fsEntered.current = ok));
    }
  };
  useEffect(() => {
    if (!fs) return;
    const esc = (e) => e.key === "Escape" && setFs(false);
    window.addEventListener("keydown", esc);
    // Leaving browser full screen (Escape, or the browser's own control) closes the view too.
    const off = onFullscreenChange((on) => {
      if (!on && fsEntered.current) setFs(false);
    });
    return () => {
      window.removeEventListener("keydown", esc);
      off();
      if (isFullscreen()) exitFullscreen();
    };
  }, [fs]);
  useEffect(() => {
    if (!fs) return;
    document.body.dataset.labFs = "1";
    return () => {
      delete document.body.dataset.labFs;
    };
  }, [fs]);
  useEffect(() => {
    if (!fs) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fs]);

  const startFsTour = () => setTour(0);
  const startTour = () => {
    goRef.current?.(0);
    setTimeout(() => setTour(0), 500);
  };

  const qrPath = brand.slug === "yours" ? `/try/custom?store=${encodeURIComponent(brand.domain || "")}` : `/try/${brand.slug}`;

  const appEl = useMemo(() => <BrandApp key={brand.slug} ref={appRef} brand={brand} liveReviews />, [brand]);

  const prods = brand.products;
  const stage = { "--ch": ch, "--sg": SIDE[ch] };

  return (
    <div className={`${styles.root} ${navLight ? styles.light : styles.dark} ${tourOn ? styles.touring : ""}`} ref={rootRef}>
      {/* background layers */}
      <div className={styles.bg} style={{ background: base || pal[0].bg }} />
      {wipe && (
        <div
          key={wipe.k}
          className={styles.wipe}
          style={{ background: wipe.bg, "--x": `${wipe.x}px`, "--y": `${wipe.y}px` }}
          onAnimationEnd={() => {
            setBase(wipe.bg);
            setWipe(null);
          }}
        />
      )}

      <ol className={styles.dots} aria-label="Sections">
        {NAMES.map((n, i) => (
          <li key={n}>
            <button className={i === ch ? styles.dotOn : ""} onClick={() => goTo(i)} aria-label={n} aria-current={i === ch}>
              <span>{n}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* persistent phone and the pieces that fly in and out of it */}
      <div className={styles.stage} data-ch={ch} data-side={SIDE[ch] < 0 ? "r" : "l"} data-work={ch === WORK ? "1" : undefined} style={stage}>
        <div className={styles.rig} ref={rigRef}>
          <div className={styles.tilt} ref={tiltRef}>
            <div className={styles.phoneWrap} ref={phoneRef} data-phone="" data-cursor={ch < PROOF ? "Tap" : undefined}>
              <Phone statusBar statusTone={brand.slug === "highfy" ? "light" : "dark"} label={`${brand.name} app, interactive preview`}>
                {appEl}
                {busy && (
                  <div style={{ "--app": brand.colors.primary }}>
                    <BonsifyLoader bar={false} label={PHRASES[phrase]} />
                  </div>
                )}
              </Phone>
              {!busy && (
                <>
                  <button className={styles.fsIcon} onClick={() => { setTip(false); openFs(); }} aria-label="Open the app full screen" title="Full screen">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                    </svg>
                  </button>
                  <button className={styles.tourIcon} onClick={() => { setTip(false); startTour(); }} aria-label="Take the full tour" title="Take the full tour">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 4l14 8-14 8z" /></svg>
                  </button>
                  {tip && !tourOn && (
                    <div className={styles.tip} role="status">
                      <button className={styles.tipX} onClick={() => setTip(false)} aria-label="Dismiss">&times;</button>
                      <b>Your app is ready</b>
                      <span>Take the full tour to see every feature.</span>
                      <button className={styles.tipGo} onClick={() => { setTip(false); startTour(); }}>Take the full tour</button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* hero: two loose chips */}
            <Piece show={[0]} ch={ch} x={0.62} y={-0.28} hideM r={-5} z={70} delay={100}>
              <div className={styles.note}>
                <NoteIcon brand={brand} />
                <span>
                  <b>Order shipped</b>
                  <small>Arrives tomorrow</small>
                </span>
              </div>
            </Piece>
            <Piece show={[0]} ch={ch} x={0.5} y={0.3} hideM r={4} z={90} delay={250}>
              <div className={styles.note}>
                <NoteIcon brand={brand} />
                <span>
                  <b>10% off, app only</b>
                  <small>Code APP10</small>
                </span>
              </div>
            </Piece>

            {/* catalogue: products leave the phone */}
            {[0, 1, 2].map((i) =>
              prods[i] ? (
                <Piece key={`c${i}`} show={[1]} ch={ch} x={0.64 - i * 0.04} y={-0.3 + i * 0.3} mx={i === 0 ? -0.34 : 0.34} my={i === 0 ? -0.6 : -0.52} hideM={i === 2} r={i === 1 ? 3 : -4} z={60 + i * 30} delay={i * 140}>
                  <div className={styles.pcard}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={prods[i].image} alt="" />
                    <span>
                      <b>{prods[i].title}</b>
                      <small>{money(prods[i].price)}</small>
                    </span>
                  </div>
                </Piece>
              ) : null
            )}

            {/* push: notifications drop in */}
            {[
              ["Back in stock", prods[0] ? prods[0].title : "Your favourite is back"],
              ["Order out for delivery", "Your parcel arrives today"],
              ["Price drop", prods[1] ? prods[1].title : "Something you saved just dropped"],
            ].map(([t, s], i) => (
              <Piece key={`n${i}`} show={[2]} ch={ch} x={0.66 - i * 0.06} y={-0.34 + i * 0.2} mx={0} my={-0.68 + i * 0.1} r={i === 1 ? 2 : -3} z={50 + i * 30} delay={650 + i * 500}>
                <div className={`${styles.note} ${styles.noteWide}`}>
                  <NoteIcon brand={brand} />
                  <span>
                    <b>{t}</b>
                    <small>{s}</small>
                  </span>
                  <em>now</em>
                </div>
              </Piece>
            ))}

            {/* wallet: voucher and tracking */}
            <Piece show={[3]} ch={ch} x={0.78} y={-0.22} mx={-0.2} my={-0.62} r={-6} z={80} delay={80}>
              <div className={styles.voucher}>
                <div>
                  <small>Welcome offer</small>
                  <b>10% off</b>
                  <code>APP10</code>
                </div>
                <div className={styles.stub}>
                  <small>Ends in</small>
                  <b>
                    <Countdown />
                  </b>
                </div>
              </div>
            </Piece>
            <Piece show={[4]} ch={ch} x={0.66} y={-0.05} mx={0} my={-0.55} r={3} z={55} delay={260}>
              <div className={styles.track}>
                <b>Order #4821</b>
                <div className={styles.rail}>
                  <i />
                  <span>
                    <svg width="18" height="14" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 2h14v11H1zM15 6h4l4 4v3h-8" /><circle cx="6" cy="15" r="2" /><circle cx="18" cy="15" r="2" /></svg>
                  </span>
                </div>
                <div className={styles.steps}>
                  <small>Packed</small>
                  <small>Shipped</small>
                  <small>Out today</small>
                </div>
              </div>
            </Piece>

            {/* bundles */}
            {[0, 1].map((i) =>
              prods[i + 1] ? (
                <Piece key={`b${i}`} show={[5]} ch={ch} x={0.82 - i * 0.05} y={-0.2 + i * 0.34} mx={i ? 0.3 : -0.3} my={-0.56} r={i ? 3 : -4} z={60 + i * 30} delay={i * 160}>
                  <div className={styles.pcard}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={prods[i + 1].image} alt="" />
                    <span>
                      <b>+ {prods[i + 1].title}</b>
                      <small>Added together</small>
                    </span>
                  </div>
                </Piece>
              ) : null
            )}

            {/* reviews */}
            <Piece show={[6]} ch={ch} x={0.82} y={-0.22} mx={-0.2} my={-0.6} r={-3} z={70} delay={100}>
              <div className={`${styles.note} ${styles.noteWide}`}>
                <NoteIcon brand={brand} />
                <span>
                  <b>&#9733;&#9733;&#9733;&#9733;&#9733; Worth it</b>
                  <small>Verified buyer</small>
                </span>
              </div>
            </Piece>
            <Piece show={[6]} ch={ch} x={0.78} y={0.22} mx={0.2} my={-0.46} r={3} z={50} delay={320}>
              <div className={`${styles.note} ${styles.noteWide}`}>
                <NoteIcon brand={brand} />
                <span>
                  <b>4.8 average</b>
                  <small>From your reviews app</small>
                </span>
              </div>
            </Piece>

            {/* loyalty */}
            <Piece show={[7]} ch={ch} x={0.8} y={-0.2} mx={-0.2} my={-0.6} r={-5} z={80} delay={100}>
              <div className={styles.voucher}>
                <div>
                  <small>Your points</small>
                  <b>1,240</b>
                  <code>Insider tier</code>
                </div>
                <div className={styles.stub}>
                  <small>Next reward</small>
                  <b>260 to go</b>
                </div>
              </div>
            </Piece>

            {/* support */}
            <Piece show={[8]} ch={ch} x={0.88} y={-0.24} mx={-0.2} my={-0.62} r={-3} z={70} delay={100}>
              <div className={`${styles.note} ${styles.noteWide}`}>
                <NoteIcon brand={brand} />
                <span>
                  <b>Where is my order?</b>
                  <small>Shopper</small>
                </span>
              </div>
            </Piece>
            <Piece show={[8]} ch={ch} x={0.84} y={0.16} mx={0.24} my={-0.5} r={3} z={50} delay={700}>
              <div className={`${styles.note} ${styles.noteWide}`}>
                <NoteIcon brand={brand} />
                <span>
                  <b>Out for delivery today</b>
                  <small>{brand.name}</small>
                </span>
              </div>
            </Piece>
          </div>
        </div>
      </div>

      <main className={styles.main}>
        {/* 0 hero */}
        <section className={`${styles.sec} ${styles.copyL}`} data-ch="0" id="start">
          <div className={styles.copy}>
            <p className={styles.kicker}>Done-for-you Shopify apps</p>
            <h1 className={styles.h1}>Your Shopify store, as an app.</h1>
            <p className={styles.lede}>Pick a store, or type yours. The phone becomes that app, and you can use it.</p>

            {custom && (
              <div className={styles.chips} role="group" aria-label="Choose a store">
                {brands.map((b) => (
                  <button
                    key={b.slug}
                    className={`${styles.chip} ${slug === b.slug ? styles.chipOn : ""}`}
                    onClick={() => {
                      buzz(18);
                      setSlug(b.slug);
                    }}
                    data-cursor="Show"
                  >
                    <i style={{ background: b.colors.accent || b.colors.primary }} />
                    {b.name}
                  </button>
                ))}
                <button className={`${styles.chip} ${slug === "yours" ? styles.chipOn : ""}`} onClick={() => setSlug("yours")}>
                  <i style={{ background: custom.colors.accent || custom.colors.primary }} />
                  {custom.name}
                </button>
              </div>
            )}

            <form className={styles.form} onSubmit={openIntake}>
              <label className={styles.field}>
                <span className={styles.sr}>Your store address</span>
                <input
                  ref={inputRef}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="yourstore.com"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={busy}
                />
                <button type="submit" disabled={busy} data-cursor="Go">
                  {busy ? "Working" : "Make my app"}
                </button>
              </label>
              {busy && (
                <p className={styles.working} role="status">
                  <span className={styles.spin} /> {PHRASES[phrase]}
                </p>
              )}
              {err && (
                <p className={styles.err} role="alert">
                  {err}
                </p>
              )}
              {note && (
                <p className={styles.ok} role="status">
                  {note}
                </p>
              )}
              {!busy && !note && <p className={styles.fine}>Reads only your public store pages.</p>}
            </form>

            {touch && (
              <div className={styles.phoneActs}>
                <button className={styles.btn} onClick={openFs} data-cursor="Go">
                  Full screen
                </button>
                {arLib && (
                  <button className={styles.btnGhost} onClick={openAr}>
                    Imagine it in your hands
                  </button>
                )}
              </div>
            )}
            {arMsg && <p className={styles.arNote}>{arMsg}</p>}

            {!touch && custom && slug === "yours" && (
              <div className={styles.qrWrap}>
                <AppQr path={qrPath} size={120} title="Try it on your phone" hint="Scan to open this app full screen on your own phone." />
              </div>
            )}

            {needsTiltTap && (
              <button className={styles.tiltBtn} onClick={enableTilt}>
                Enable tilt
              </button>
            )}
          </div>

          <div className={styles.ribbon} aria-label="Proof from our live apps">
            <div>
              {[0, 1].map((k) => (
                <ul key={k} aria-hidden={k === 1}>
                  {proof.map((p) => (
                    <li key={p.label}>
                      <b>{p.big}</b> {p.label}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </section>

        {/* 1 catalogue */}
        <section className={`${styles.sec} ${styles.copyR}`} data-ch="1">
          <div className={styles.copy}>
            <p className={styles.kicker}>01 Catalogue</p>
            <h2 className={styles.h2}>Every product, already in the app.</h2>
            <p className={styles.p}>
              We connect to Shopify, so products, prices, variants and stock show up on their own. Change something in your admin and the app follows.
            </p>
            {brand.productCount ? (
              <p className={styles.stat}>
                <b>{brand.productCount.toLocaleString("en")}</b> products in {brand.name}&rsquo;s catalogue
              </p>
            ) : null}
          </div>
        </section>

        {/* 2 push */}
        <section className={`${styles.sec} ${styles.copyL}`} data-ch="2">
          <div className={styles.copy}>
            <p className={styles.kicker}>02 Push</p>
            <h2 className={styles.h2}>Bring shoppers back without an ad.</h2>
            <p className={styles.p}>
              Restock alerts, price drops, cart reminders and delivery updates land on the lock screen. No ad spend, no algorithm in between.
            </p>
          </div>
        </section>

        <section className={`${styles.sec} ${styles.copyR}`} data-ch="3">
          <div className={styles.copy}>
            <p className={styles.kicker}>03 Offers</p>
            <h2 className={styles.h2}>Vouchers shoppers actually find.</h2>
            <p className={styles.p}>Welcome codes, free shipping and gifts live in an Offers tab, one tap from the home screen. No more digging through email.</p>
          </div>
        </section>

        <section className={`${styles.sec} ${styles.copyL}`} data-ch="4">
          <div className={styles.copy}>
            <p className={styles.kicker}>04 Orders</p>
            <h2 className={styles.h2}>Every order, tracked in the app.</h2>
            <p className={styles.p}>Packed, shipped, out today. Customers see where the parcel is without writing to support.</p>
          </div>
        </section>

        <section className={`${styles.sec} ${styles.copyR}`} data-ch="5">
          <div className={styles.copy}>
            <p className={styles.kicker}>05 Bundles</p>
            <h2 className={styles.h2}>Frequently bought together, one tap.</h2>
            <p className={styles.p}>The product page suggests what goes with it and adds the whole set to the cart at once. Bigger baskets, no discount needed.</p>
          </div>
        </section>

        <section className={`${styles.sec} ${styles.copyL}`} data-ch="6">
          <div className={styles.copy}>
            <p className={styles.kicker}>06 Reviews</p>
            <h2 className={styles.h2}>Reviews right on the product.</h2>
            <p className={styles.p}>Ratings and written reviews from your reviews app sit where the decision is made, so fewer shoppers leave to check elsewhere.</p>
          </div>
        </section>

        <section className={`${styles.sec} ${styles.copyR}`} data-ch="7">
          <div className={styles.copy}>
            <p className={styles.kicker}>07 Loyalty</p>
            <h2 className={styles.h2}>Points that bring people back.</h2>
            <p className={styles.p}>Tiers, points and rewards sit in the Account tab. Shoppers see what they have earned and what comes next.</p>
          </div>
        </section>

        <section className={`${styles.sec} ${styles.copyL}`} data-ch="8">
          <div className={styles.copy}>
            <p className={styles.kicker}>08 Support</p>
            <h2 className={styles.h2}>Chat with your store, in the app.</h2>
            <p className={styles.p}>One tap opens a chat with your team, with quick answers for delivery, returns and orders. WhatsApp can sit behind it.</p>
          </div>
        </section>

        {/* 4 proof */}
        <section className={`${styles.sec} ${styles.copyL}`} data-ch="9">
          <div className={styles.copy}>
            <p className={styles.kicker}>09 Proof</p>
            <h2 className={styles.h2}>Real apps, real installs.</h2>
            <p className={styles.p}>Numbers from the live store listings, checked on 20 October 2026.</p>
            <ul className={styles.counters}>
              {proof.map((p) => (
                <li key={p.label}>
                  <b>
                    <Counter value={p.big} />
                  </b>
                  <span>{p.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5 work */}
        <section className={`${styles.sec} ${styles.wide}`} data-ch="10">
          <div className={styles.workHead}>
            <p className={styles.kicker}>10 Work</p>
            <h2 className={styles.h2}>Apps we built and still run.</h2>
          </div>
          <div className={styles.row}>
            {apps.map((a, i) => (
              <WorkCard key={a.slug} app={a} on={act === i} onActivate={() => setAct(i)} />
            ))}
          </div>
          <Link href="/integrations" className={styles.intg} data-cursor="Go">
            <b>Works with the apps you already run</b>
            <span>Klaviyo, Recharge, Yotpo, Gorgias, Triple Whale, Judge.me, Rebuy and {INTEGRATION_COUNT - 7}+ more.</span>
            <i aria-hidden="true">&rarr;</i>
          </Link>
          <Link href="/contact" className={styles.bcta} data-cursor="Go">
            <b>Yours next?</b>
            <span>Send us your store. We will show you the app before you decide.</span>
            <i aria-hidden="true">&rarr;</i>
          </Link>
        </section>

      </main>

      {touch && arLib && (
        <model-viewer
          key={brand.slug}
          ref={mvRef}
          src={`/lab/phone-${brand.slug === "yours" ? "highfy" : brand.slug}.glb`}
          alt={`${brand.name} app on a phone`}
          ar
          ar-modes="scene-viewer webxr quick-look"
          ar-placement="floor"
          loading="eager"
          style={{ position: "fixed", left: 0, top: 0, width: 4, height: 4, opacity: 0, pointerEvents: "none" }}
        />
      )}

      {fs && (
        <div className={styles.fs} role="dialog" aria-label={`${brand.name} app, full screen`}>
          {touch ? (
            <div className={styles.fsApp} style={{ transform: `scale(${fsBox.s})`, left: fsBox.x, top: fsBox.y }}>
              <BrandApp key={`fs-${brand.slug}`} ref={fsAppRef} brand={brand} liveReviews />
            </div>
          ) : (
            // On a computer the app sits in a phone shell. On a phone, the phone is the shell.
            <>
            <div className={styles.fsArt} aria-hidden="true" style={{ "--fsc": `color-mix(in oklab, ${brand.colors.accent || brand.colors.primary} 70%, white)` }}>
              <span className={styles.fsGlow} />
              <BonsaiArt seed={brand.slug || brand.name} />
              <span className={styles.fsWord} style={{ fontFamily: brand.fonts?.heading ? `"${brand.fonts.heading}", system-ui, sans-serif` : undefined }}>
                {brand.name}
              </span>
              <span className={styles.fsCap}>{brand.name} app, made with Bonsify</span>
            </div>
            <div className={styles.fsShell}>
              <Phone statusBar statusTone={brand.slug === "highfy" ? "light" : "dark"} label={`${brand.name} app, full screen`}>
                <BrandApp key={`fs-${brand.slug}`} ref={fsAppRef} brand={brand} liveReviews />
              </Phone>
            </div>
            {brand.slug === "yours" && (
              <div className={styles.fsQr}>
                <AppQr path={qrPath} tone="dark" size={124} />
              </div>
            )}
            </>
          )}
          {!tourOn && (
            <button className={styles.fsTour} onClick={startFsTour}>
              Take the tour
            </button>
          )}
          <button className={styles.fsClose} onClick={() => setFs(false)}>
            Close
          </button>
        </div>
      )}

      {modal && (
        <StoreModal kind={modal === "notshop" ? "notshopify" : "intake"} values={lead} onChange={setLead} onClose={closeModal} onSubmit={submitModal} busy={busy} />
      )}

      {tourOn && <Tour step={tour} onStep={(n) => setTour(Math.max(0, Math.min(TOUR.length - 1, n)))} onClose={() => setTour(null)} inFull={fs} name={brand.name} onFull={() => { setTour(null); openFs(); }} />}

      <div className={styles.cursor} ref={cursorRef} aria-hidden="true" />
    </div>
  );
}


/* The store's own favicon on notifications. If it is missing or fails to load,
   the logo is tried, then a tile with the store's first letter. */
function NoteIcon({ brand }) {
  const srcs = [brand.icon, brand.logo].filter(Boolean);
  const [n, setN] = useState(0);
  if (n >= srcs.length) {
    return (
      <i className={styles.noteLetter} style={{ background: brand.colors.primary, color: brand.colors.onPrimary || "#fff" }}>
        {(brand.name || "A").slice(0, 1)}
      </i>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={styles.noteIco} src={srcs[n]} alt="" onError={() => setN(n + 1)} />
  );
}

/* ---------- work card with in-card motion ---------- */
function WorkCard({ app, on, onActivate }) {
  const ref = useRef(null);
  const shots = (app.screens || []).slice(0, 4);
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
    ref.current.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <Link
      href={app.caseStudy || "/work"}
      ref={ref}
      onPointerMove={move}
      onPointerEnter={(e) => e.pointerType === "mouse" && onActivate()}
      onFocus={onActivate}
      className={`${styles.bcard} ${on ? styles.bOn : ""}`}
      style={{ "--c": app.color }}
      data-cursor="Open"
    >
      <span className={styles.glow} />
      <span className={styles.btop}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {app.icon && <img src={app.icon} alt="" />}
        <b>{app.name}</b>
      </span>
      <span className={styles.bline}>{app.headline}</span>
      <span className={styles.btags}>
        {app.tags.slice(0, 4).map((t) => (
          <i key={t}>{t}</i>
        ))}
      </span>
      <span className={styles.shots} aria-hidden="true">
        {shots.map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={s.src} src={s.src} alt="" loading="lazy" style={{ "--i": i }} />
        ))}
      </span>
    </Link>
  );
}
