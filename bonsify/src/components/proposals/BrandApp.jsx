"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { sampleReviews, ago } from "@/lib/reviews";
import { storeProfile } from "@/lib/storeProfile";
import { buzz, Svg } from "./appUi";
import { SizeSheet, AlertSheet, ChatSheet, FilterSheet, CompleteLook, StoresScreen, RewardsScreen, InviteScreen, GiftCardScreen, CheckoutOptions, Suggest, applyFilters, activeCount, pointsFor, storesFor, EMPTY_FILTERS, SORTS } from "./BrandFeatures";
import fx from "./BrandFeatures.module.css";
import styles from "./BrandApp.module.css";

// The prospect's own app, drawn as real UI from their crawled store data
// (logo, colours, fonts, products, collections, banners). One template,
// themed per brand through CSS variables, so every new brand gets an app
// that looks like theirs without designing it by hand.

// Prices can be missing when a store limited the crawl; show nothing rather
// than a made-up or zero price.
function moneyFormatter(currency) {
  let fmt;
  try {
    const f = new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency || "USD",
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    });
    fmt = (n) => f.format(Math.round(n));
  } catch {
    fmt = (n) => `${currency || ""} ${Math.round(n).toLocaleString("en")}`.trim();
  }
  return (n) => (n == null || Number.isNaN(n) ? "" : fmt(n));
}

const has = (brand, id) => brand.features.some((f) => f.id === id);

const BrandApp = forwardRef(function BrandApp({ brand, autoSplash = true, interactive = true, liveReviews = false }, ref) {
  const money = useMemo(() => moneyFormatter(brand.currency), [brand.currency]);
  const products = brand.products;
  const [splash, setSplash] = useState(autoSplash);
  const [tab, setTab] = useState("home");
  const [productIdx, setProductIdx] = useState(null);
  const [collection, setCollection] = useState(null);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState(null);
  const [bump, setBump] = useState(0);
  const [sheet, setSheet] = useState(null);
  const [fly, setFly] = useState(null);
  const [wished, setWished] = useState([]);
  const [recent, setRecent] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sub, setSub] = useState(null);
  const [query, setQuery] = useState("");
  const [focusSearch, setFocusSearch] = useState(0);
  const [dir, setDir] = useState("tab");
  const [scrolled, setScrolled] = useState(false);
  // The store engine: which features this store gets, from its category.
  const profile = useMemo(() => storeProfile(brand), [brand]);
  const [modal, setModal] = useState(null);
  const [alerts, setAlerts] = useState({});
  const [searches, setSearches] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState("featured");
  const [store, setStore] = useState(0);
  const [favBad, setFavBad] = useState(false);
  const scrollRef = useRef(null);
  const rootRef = useRef(null);
  const bagRef = useRef(null);

  useEffect(() => {
    if (!autoSplash) return;
    const t = setTimeout(() => setSplash(false), 1600);
    return () => clearTimeout(t);
  }, [autoSplash]);

  const scrollTop = () => scrollRef.current?.scrollTo({ top: 0 });

  const openProduct = useCallback(
    (i) => {
      if (i < 0 || i >= products.length) return;
      setDir("fwd");
      setProductIdx(i);
      setRecent((r) => [i, ...r.filter((x) => x !== i)].slice(0, 8));
      scrollTop();
      buzz(16);
    },
    [products.length]
  );

  const openSub = useCallback((s) => {
    setDir("fwd");
    setSheet(null);
    setModal(null);
    setTab("account");
    setProductIdx(null);
    setCollection(null);
    setSub(s);
    scrollTop();
    buzz(16);
  }, []);

  const go = useCallback((t) => {
    setDir("tab");
    setSheet(null);
    setModal(null);
    setTab(t);
    setProductIdx(null);
    setCollection(null);
    setSub(null);
    scrollTop();
  }, []);

  const addToCart = useCallback(
    (i, option, fromEl, quiet = false) => {
      if (i < 0 || i >= products.length) return;
      setCart((c) => {
        const key = `${i}:${option || ""}`;
        const found = c.find((x) => x.key === key);
        if (found) return c.map((x) => (x.key === key ? { ...x, qty: x.qty + 1 } : x));
        return [...c, { key, i, option, qty: 1 }];
      });
      if (quiet) {
        setBump((b) => b + 1);
        return;
      }
      buzz([24, 50, 30]);
      // Fly a copy of the product photo from the button to the bag.
      const root = rootRef.current;
      const bag = bagRef.current;
      if (root && bag && fromEl) {
        const r = root.getBoundingClientRect();
        const k = r.width / root.offsetWidth || 1;
        const a = fromEl.getBoundingClientRect();
        const b = bag.getBoundingClientRect();
        setFly({
          id: Date.now(),
          src: products[i].image,
          x: (a.left + a.width / 2 - r.left) / k - 28,
          y: (a.top + a.height / 2 - r.top) / k - 28,
          dx: (b.left + b.width / 2 - a.left - a.width / 2) / k,
          dy: (b.top + b.height / 2 - a.top - a.height / 2) / k,
        });
        setTimeout(() => setBump((n) => n + 1), 520);
      } else {
        setBump((n) => n + 1);
      }
      setSheet({ i, id: `s${Date.now()}` });
    },
    [products]
  );

  // Several items at once, for "complete the look".
  const addMany = useCallback(
    (list, option) => {
      list.forEach((i, k) => addToCart(i, k === 0 ? option : undefined, undefined, true));
      buzz([24, 50, 30]);
      setToast(`${list.length} items added to cart`);
    },
    [addToCart]
  );

  const addGift = useCallback((g) => {
    setCart((c) => {
      const key = `gift:${g.amount}:${g.to}:${g.msg}`;
      const found = c.find((x) => x.key === key);
      if (found) return c.map((x) => (x.key === key ? { ...x, qty: x.qty + 1 } : x));
      return [...c, { key, i: -1, gift: g, qty: 1 }];
    });
    buzz([24, 50, 30]);
    setBump((b) => b + 1);
    setToast("Gift card added to cart");
  }, []);

  const addSearch = useCallback((term) => {
    const t = (term || "").trim();
    if (t.length < 2) return;
    setSearches((r) => [t, ...r.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6));
  }, []);

  useEffect(() => {
    if (!sheet) return;
    const t = setTimeout(() => setSheet(null), 3200);
    return () => clearTimeout(t);
  }, [sheet]);

  useEffect(() => {
    if (!fly) return;
    const t = setTimeout(() => setFly(null), 760);
    return () => clearTimeout(t);
  }, [fly]);

  const toggleWish = useCallback((i) => {
    buzz(18);
    setWished((w) => {
      const on = w.includes(i);
      setToast(on ? "Removed from wishlist" : "Saved to wishlist");
      return on ? w.filter((x) => x !== i) : [...w, i];
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  // Control surface for the proposal shell and the video recorder.
  useImperativeHandle(ref, () => ({
    show(screen, index = 0) {
      setSplash(false);
      if (screen === "product") {
        setTab("home");
        openProduct(Math.min(index, products.length - 1));
      } else if (screen === "splash") {
        setSplash(true);
      } else if (screen === "vouchers") go("offers");
      else if (screen === "chat") {
        go("home");
        setModal({ type: "chat" });
      } else if (screen === "fbt" || screen === "reviews") {
        go("home");
        setTab("home");
        openProduct(Math.min(index, products.length - 1));
        setTimeout(() => {
          const el = rootRef.current?.querySelector(`[data-feature="${screen}"]`);
          const sc = scrollRef.current;
          if (el && sc) sc.scrollTo({ top: Math.max(0, el.offsetTop - 70), behavior: "smooth" });
        }, 520);
      } else if (["notifications", "rewards", "invite", "giftcards", "wishlist", "stores", "addresses"].includes(screen)) openSub(screen);
      else go(screen);
    },
    add(index = 0) {
      addToCart(Math.min(index, products.length - 1), undefined, undefined, true);
    },
    scrollBy(px) {
      scrollRef.current?.scrollBy({ top: px, behavior: "smooth" });
    },
  }));

  // The brand's own fonts, when they are on Google Fonts. Anything that does not
  // load falls back to the system font, so nothing breaks.
  useEffect(() => {
    const f = brand.fonts || {};
    const names = [...new Set([f.heading, f.body].filter(Boolean))].slice(0, 2);
    names.forEach((name) => {
      const id = `bfont-${name.replace(/\W+/g, "-")}`;
      if (document.getElementById(id)) return;
      const fam = encodeURIComponent(name).replace(/%20/g, "+");
      const l = document.createElement("link");
      l.id = id;
      l.rel = "stylesheet";
      l.href = `https://fonts.googleapis.com/css2?family=${fam}:wght@400;500;600;700;800&display=swap`;
      l.onerror = () => {
        const l2 = document.createElement("link");
        l2.rel = "stylesheet";
        l2.href = `https://fonts.googleapis.com/css2?family=${fam}&display=swap`;
        document.head.appendChild(l2);
      };
      document.head.appendChild(l);
    });
  }, [brand.fonts]);

  const cartCount = cart.reduce((n, x) => n + x.qty, 0);
  const subtotal = cart.reduce((n, x) => n + (x.gift ? x.gift.amount : products[x.i].price || 0) * x.qty, 0);

  const theme = {
    "--b-primary": brand.colors.primary,
    "--b-on-primary": brand.colors.onPrimary || "#fff",
    "--b-accent": brand.colors.accent || brand.colors.primary,
    "--b-head": brand.fonts?.heading ? `"${brand.fonts.heading}", var(--sans)` : "var(--sans)",
    "--b-body": brand.fonts?.body ? `"${brand.fonts.body}", var(--sans)` : "var(--sans)",
  };

  const skin = brand.slug === "highfy";
  const visibleProducts = collection ? matchCollection(products, collection) : products;

  return (
    <div
      className={`${styles.app} ${skin ? styles.hf : ""}`}
      style={theme}
      ref={rootRef}
      data-interactive={interactive ? "true" : "false"}
      data-scrolled={scrolled ? "true" : "false"}
    >
      {splash && (
        <div className={styles.splash} aria-label={`${brand.name} app opening`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {brand.logo && <img src={brand.logo} alt={brand.name} className={styles.splashLogo} />}
        </div>
      )}

      <header className={`${styles.top} ${skin ? styles.topHf : ""}`}>
        {skin && productIdx == null && !collection && !sub ? (
          <button className={styles.iconBtn} aria-label="Menu" onClick={() => go("account")}>
            <Svg name="menu" />
          </button>
        ) : productIdx != null || collection || sub ? (
          <button className={styles.iconBtn} onClick={() => {
              setDir("back");
              buzz(16);
              if (productIdx != null) setProductIdx(null);
              else if (collection) setCollection(null);
              else setSub(null);
            }}
            aria-label="Back"
          >
            <Svg name="back" />
          </button>
        ) : (
          <button className={styles.iconBtn} aria-label="Notifications" onClick={() => openSub("notifications")}>
            <Svg name="bell" />
            <span className={styles.dotBadge} />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {brand.logo ? <img src={brand.logo} alt={brand.name} className={styles.logo} /> : <strong className={styles.wordmark}>{brand.name}</strong>}
        <button className={`${styles.iconBtn} ${skin ? styles.bagHf : ""}`} ref={bagRef} onClick={() => go("cart")} aria-label={`Cart, ${cartCount} items`}>
          <Svg name="bag" />
          {cartCount > 0 && (
            <span key={bump} className={styles.badge}>
              {cartCount}
            </span>
          )}
        </button>
        {skin && tab === "home" && productIdx == null && !collection && !sub && (
          <button className={styles.hfSearch} onClick={() => { go("shop"); setFocusSearch((n) => n + 1); }}>
            <Svg name="search" size={20} />
            <span>What can we help you find</span>
          </button>
        )}
      </header>

      <div
        className={styles.body}
        ref={scrollRef}
        data-lenis-prevent
        onScroll={(e) => {
          const on = e.currentTarget.scrollTop > 6;
          setScrolled((v) => (v === on ? v : on));
        }}
      >
        <div key={productIdx != null ? `p${productIdx}` : `${tab}:${collection || ""}:${sub || ""}`} className={`${styles.screen} ${dir === "fwd" ? styles.inFwd : dir === "back" ? styles.inBack : styles.inTab}`}>
        {productIdx != null ? (
          <ProductScreen
            brand={brand}
            product={products[productIdx]}
            index={productIdx}
            money={money}
            onAdd={(i, o, el) => addToCart(i, o, el)}
            wished={wished.includes(productIdx)}
            onWish={() => toggleWish(productIdx)}
            related={relatedFor(products, productIdx)}
            wishedAll={wished}
            onWishCard={toggleWish}
            toast={setToast}
            live={liveReviews}
            onOpen={(p) => openProduct(products.indexOf(p))}
            profile={profile}
            store={store}
            alert={alerts[productIdx]}
            onAlert={() => setModal({ type: "alert", pi: productIdx })}
            onSize={(v) => setModal({ type: "size", ...v })}
            onAddAll={addMany}
          />
        ) : tab === "home" ? (
          <HomeScreen
            hf={skin}
            onGo={go}
            brand={brand}
            auto={interactive}
            onSearch={() => {
              go("shop");
              setFocusSearch((n) => n + 1);
            }}
            money={money}
            onOpen={openProduct}
            wished={wished}
            onWish={toggleWish}
            recent={recent}
            onSeeAll={() => go("shop")}
            onCollection={(c) => {
              setDir("fwd");
              setTab("shop");
              setCollection(c);
              scrollTop();
            }}
          />
        ) : tab === "shop" ? (
          <ShopScreen
            brand={brand}
            money={money}
            products={visibleProducts}
            title={collection}
            query={query}
            setQuery={setQuery}
            focusKey={focusSearch}
            wished={wished}
            onWish={toggleWish}
            onOpen={(p) => openProduct(products.indexOf(p))}
            profile={profile}
            searches={searches}
            addSearch={addSearch}
            dropSearch={(t) => setSearches((r) => r.filter((x) => x !== t))}
            clearSearches={() => setSearches([])}
            filters={filters}
            sort={sort}
            openFilter={() => setModal({ type: "filter" })}
          />
        ) : tab === "cart" ? (
          <CartScreen
            brand={brand}
            cart={cart}
            money={money}
            subtotal={subtotal}
            onQty={(key, d) => setCart((c) => c.map((x) => (x.key === key ? { ...x, qty: x.qty + d } : x)).filter((x) => x.qty > 0))}
            onBrowse={() => go("home")}
            onClear={() => setCart([])}
            profile={profile}
            store={store}
            onPlaced={(lines, total, mode) => setOrders((o) => [{ id: 1000 + Math.floor(Math.random() * 8999), at: Date.now(), lines, total, mode }, ...o])}
            onOrders={() => openSub("orders")}
          />
        ) : (
          <AccountScreen
            brand={brand}
            money={money}
            sub={tab === "offers" ? "vouchers" : tab === "orders" ? "orders" : sub}
            onSub={openSub}
            wished={wished}
            onWish={toggleWish}
            orders={orders}
            onOpen={openProduct}
            toast={setToast}
            onShop={() => go("shop")}
            profile={profile}
            alerts={alerts}
            store={store}
            setStore={setStore}
            onAddGift={addGift}
          />
        )}
        </div>
      </div>

      {productIdx == null && (
        <nav className={styles.tabs} aria-label="App sections">
          {[
            ["shop", "Shop", "grid"],
            ["offers", "Offers", "tag"],
            ["home", "Home", "home"],
            ["orders", "Orders", "box"],
            ["account", "Account", "user"],
          ].map(([id, label, icon]) => {
            const on = tab === id && !(id === "account" && false);
            if (id === "home")
              return (
                <button key={id} className={`${styles.tab} ${styles.tabHome} ${on ? styles.tabOn : ""}`} onClick={() => { if (id !== tab) buzz(16); go(id); }} aria-current={on ? "page" : undefined} aria-label="Home">
                  <span className={styles.homeBtn}>
                    {brand.icon && !favBad ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={brand.icon} alt="" onError={() => setFavBad(true)} />
                    ) : (
                      <Svg name="home" size={26} />
                    )}
                  </span>
                  <span>{label}</span>
                </button>
              );
            return (
              <button key={id} className={`${styles.tab} ${on ? styles.tabOn : ""}`} onClick={() => { if (id !== tab) buzz(16); go(id); }} aria-current={on ? "page" : undefined}>
                <span className={styles.tabIco}>
                  <Svg name={icon} size={22} />
                  {id === "account" && wished.length > 0 && <i className={styles.tabDot} />}
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {fly && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={fly.id}
          src={fly.src}
          alt=""
          className={styles.fly}
          style={{ left: fly.x, top: fly.y, "--dx": `${fly.dx}px`, "--dy": `${fly.dy}px` }}
        />
      )}

      {sheet && (
        <div className={styles.sheet} key={sheet.id} role="status">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={products[sheet.i].image} alt="" />
          <span>
            <strong>Added to cart</strong>
            <small>{products[sheet.i].title}</small>
          </span>
          <button className={styles.sheetGo} onClick={() => go("cart")}>
            View cart
          </button>
        </div>
      )}

      {toast && !sheet && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}

      {!modal && !splash && tab !== "cart" && !sub && (
        <button
          className={`${fx.fab} ${profile.whatsapp ? fx.fabWa : ""} ${productIdx != null ? fx.fabPdp : ""}`}
          aria-label={`Chat with ${brand.name}`}
          onClick={() => (buzz(16), setModal({ type: "chat" }))}
        >
          <Svg name={profile.whatsapp ? "phone" : "chat"} size={24} />
        </button>
      )}

      {modal?.type === "size" && <SizeSheet profile={profile} values={modal.values} onPick={modal.pick} onClose={() => setModal(null)} />}
      {modal?.type === "alert" && (
        <AlertSheet
          product={products[modal.pi]}
          state={alerts[modal.pi]}
          money={money}
          onClose={() => setModal(null)}
          onSave={(st) => {
            setAlerts((a) => {
              const n = { ...a };
              if (st.price || st.stock) n[modal.pi] = st;
              else delete n[modal.pi];
              return n;
            });
            setToast(st.price || st.stock ? "We will let you know (sample)" : "Alerts turned off");
          }}
        />
      )}
      {modal?.type === "chat" && <ChatSheet brand={brand} profile={profile} toast={setToast} onClose={() => setModal(null)} />}
      {modal?.type === "filter" && (
        <FilterSheet
          products={visibleProducts.length ? visibleProducts : products}
          filters={filters}
          sort={sort}
          money={money}
          onClose={() => setModal(null)}
          onApply={(f, so) => {
            setFilters(f);
            setSort(so);
          }}
        />
      )}
    </div>
  );
});

export default BrandApp;

// Highfy's home categories are broader than the product types, so each maps to a few.
const HF_CATS = [
  ["Skincare", "skincare", /serum|moistur|sunscreen|face|cream|skin|toner|cleans/i],
  ["Makeup", "makeup", /make|lip|foundation|mascara|kajal|blush/i],
  ["Haircare", "haircare", /hair mask|hair|shampoo|oil|conditioner/i],
  ["Fragrance", "fragrance", /perfume|fragrance|mist|deo|scent/i],
  ["Bodycare", "bodycare", /body|shower|wash|lotion|scrub/i],
  ["Hair Tools", "hair-tools", /brush|tool|dryer|straight|curl|iron/i],
  ["Nail Care", "nail-care", /nail|polish/i],
  ["K-Beauty", "k-beauty", /korea|k-?beauty|cosrx|anua|beauty of joseon|skin1004/i],
];

function matchCollection(products, collection) {
  const c = collection.toLowerCase();
  const exact = products.filter((p) => (p.type || "").toLowerCase() === c);
  if (exact.length) return exact;
  const cat = HF_CATS.find(([name]) => name.toLowerCase() === c);
  if (cat) {
    const hit = products.filter((p) => cat[2].test(`${p.type || ""} ${p.title || ""}`));
    if (hit.length) return hit;
  }
  return products;
}

// Same-type products first, so "You may also like" feels related.
function relatedFor(products, idx) {
  const me = products[idx];
  const rest = products.map((p, i) => ({ p, i })).filter(({ i }) => i !== idx);
  const same = rest.filter(({ p }) => me?.type && p.type === me.type);
  const other = rest.filter(({ p }) => !(me?.type && p.type === me.type));
  return [...same, ...other].slice(0, 8).map(({ p }) => p);
}

function useMidnightCountdown() {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      const s = Math.max(0, Math.floor((end - now) / 1000));
      const p = (n) => String(n).padStart(2, "0");
      setLeft(`${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return left;
}

function Heart({ on, onClick, label }) {
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={on}
      className={`${styles.heartBtn} ${on ? styles.heartOn : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <Svg name={on ? "heartFill" : "heart"} size={17} />
    </span>
  );
}

function ProductCard({ p, money, onOpen, wide = false, wished, onWish }) {
  const off = p.compareAt && p.compareAt > p.price ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  return (
    <button className={`${styles.card} ${wide ? styles.cardWide : ""}`} onClick={onOpen}>
      <span className={styles.cardImg}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image} alt="" loading="lazy" />
        {off > 0 && <span className={styles.off}>{off}% off</span>}
        {onWish && <Heart on={!!wished} onClick={onWish} label={wished ? "Remove from wishlist" : "Save to wishlist"} />}
      </span>
      <span className={styles.cardTitle}>{p.title}</span>
      <span className={styles.price}>
        {money(p.price)}
        {off > 0 && <s>{money(p.compareAt)}</s>}
      </span>
    </button>
  );
}

function SecHead({ title, onAll, children }) {
  return (
    <div className={styles.secHead}>
      <h3 className={styles.h}>{title}</h3>
      {children}
      {onAll && (
        <button className={styles.seeAll} onClick={onAll}>
          See all
        </button>
      )}
    </div>
  );
}

function HomeScreen({ hf, onGo, brand, money, onOpen, onCollection, onSearch, auto, wished, onWish, recent, onSeeAll }) {
  const [slide, setSlide] = useState(0);
  const bannersRef = useRef(null);
  const touched = useRef(false);
  const left = useMidnightCountdown();
  // Banners keep the shape of the source image instead of a fixed square.
  const [ratio, setRatio] = useState(null);
  const first = brand.banners[0];
  useEffect(() => {
    if (!first) return;
    const im = new Image();
    im.onload = () => {
      const r = im.naturalWidth / im.naturalHeight;
      if (r) setRatio(Math.min(2.6, Math.max(0.9, r)));
    };
    im.src = first;
  }, [first]);

  useEffect(() => {
    const n = brand.banners.length;
    if (!auto || n < 2) return;
    const t = setInterval(() => {
      const el = bannersRef.current;
      if (!el || touched.current) return;
      const next = (Math.round(el.scrollLeft / (el.clientWidth - 20)) + 1) % n;
      el.scrollTo({ left: next * (el.clientWidth - 20), behavior: "smooth" });
    }, 4200);
    return () => clearInterval(t);
  }, [auto, brand.banners.length]);

  const products = brand.products;
  const idx = products.map((p, i) => ({ p, i }));
  const types = [...new Set(products.map((p) => p.type).filter(Boolean))].slice(0, 8);
  const circles =
    types.length >= 3
      ? types.map((t) => ({ title: t, image: products.find((p) => p.type === t)?.image, filter: t }))
      : brand.collections
          .slice(0, 8)
          .map((c, i) => ({ title: c.title, image: c.image || products[i % Math.max(1, products.length)]?.image, filter: null }));
  const deals = idx.filter(({ p }) => p.compareAt && p.compareAt > p.price).slice(0, 8);
  const newIn = idx.slice(0, 8);
  const tiles = brand.collections.filter((c) => c.image).slice(0, 4);
  const seen = recent.map((i) => ({ p: products[i], i })).filter((x) => x.p);

  return (
    <div className={styles.home}>
      {!hf && (
        <button className={styles.search} onClick={onSearch}>
          <Svg name="search" size={18} />
          <span>Search {brand.name}</span>
        </button>
      )}

      {hf && <HighfyTop products={products} onCollection={onCollection} onGo={onGo} />}

      {!hf && brand.banners.length > 0 ? (
        <div className={styles.bannerWrap}>
          <div
            className={styles.banners}
            style={ratio ? { "--ar": ratio } : undefined}
            ref={bannersRef}
            onPointerDown={() => (touched.current = true)}
            onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.clientWidth - 20)))}
          >
            {brand.banners.map((b, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={b} src={b} alt="" className={styles.banner} loading={i ? "lazy" : "eager"} />
            ))}
          </div>
          {brand.banners.length > 1 && (
            <div className={styles.dots} aria-hidden="true">
              {brand.banners.map((b, i) => (
                <span key={b} className={i === slide ? styles.dotOn : ""} />
              ))}
            </div>
          )}
        </div>
      ) : hf ? null : (
        products[0] && (
          <button className={styles.hero} onClick={() => onOpen(0)}>
            <span>
              <strong>New in at {brand.name}</strong>
              <em>Shop now</em>
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={products[0].image} alt="" />
          </button>
        )
      )}

      {!hf && <div className={styles.reward}>
        <Svg name="gift" size={26} />
        <span>
          <strong>10% off your first app order</strong>
          <small>Unlocked when you install the app. Code APP10</small>
        </span>
      </div>}

      {!hf && circles.length > 0 && (
        <section>
          <SecHead title="Shop by category" />
          <div className={styles.circles} data-lenis-prevent>
            {circles.map((c) => (
              <button key={c.title} className={styles.circle} onClick={() => onCollection(c.filter || c.title)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span>{c.image && <img src={c.image} alt="" loading="lazy" />}</span>
                {c.title}
              </button>
            ))}
          </div>
        </section>
      )}

      {(deals.length >= 2 || newIn.length > 2) && (
        <section className={styles.dealBand}>
          <SecHead title={deals.length >= 2 ? "Today's deals" : "New in"}>
            {deals.length >= 2 && left && (
              <span className={styles.timer}>
                <Svg name="clock" size={14} /> {left}
              </span>
            )}
          </SecHead>
          <div className={styles.rail} data-lenis-prevent>
            {(deals.length >= 2 ? deals : newIn).map(({ p, i }) => (
              <ProductCard key={p.handle || i} p={p} money={money} onOpen={() => onOpen(i)} wide wished={wished.includes(i)} onWish={() => onWish(i)} />
            ))}
          </div>
        </section>
      )}

      {tiles.length >= 2 && (
        <section>
          <SecHead title="Shop collections" onAll={onSeeAll} />
          <div className={styles.tiles}>
            {tiles.map((c) => (
              <button key={c.handle || c.title} className={styles.tile} onClick={() => onCollection(c.title)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image} alt="" loading="lazy" />
                <span>{c.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section>
          <SecHead title="Best sellers" onAll={onSeeAll} />
          <div className={styles.grid}>
            {products.slice(0, 6).map((p, i) => (
              <ProductCard key={p.handle || i} p={p} money={money} onOpen={() => onOpen(i)} wished={wished.includes(i)} onWish={() => onWish(i)} />
            ))}
          </div>
        </section>
      )}

      {seen.length > 0 && (
        <section>
          <SecHead title="Recently viewed" />
          <div className={styles.rail} data-lenis-prevent>
            {seen.map(({ p, i }) => (
              <ProductCard key={p.handle || i} p={p} money={money} onOpen={() => onOpen(i)} wide wished={wished.includes(i)} onWish={() => onWish(i)} />
            ))}
          </div>
        </section>
      )}

      {products.length > 6 && (
        <section>
          <SecHead title="More to explore" />
          <div className={styles.rail} data-lenis-prevent>
            {products.slice(6).map((p, i) => (
              <ProductCard key={p.handle || i} p={p} money={money} onOpen={() => onOpen(i + 6)} wide wished={wished.includes(i + 6)} onWish={() => onWish(i + 6)} />
            ))}
          </div>
        </section>
      )}
      <div className={styles.spacer} />
    </div>
  );
}

function HighfyTop({ products, onCollection, onGo }) {
  const [closed, setClosed] = useState(false);
  return (
    <>
      <section>
        <div className={styles.secHead}>
          <h3 className={styles.hfH}>Categories</h3>
          <button className={styles.hfAll} onClick={() => onGo("shop")}>View All &rsaquo;</button>
        </div>
        <div className={styles.hfCats}>
          {HF_CATS.map(([name, file]) => (
            <button key={name} className={styles.hfCat} onClick={() => onCollection(name)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/proposals/highfy/app/cat-${file}.webp`} alt="" loading="lazy" />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </section>
      {!closed && (
        <div className={styles.hfPromo}>
          <span>
            <strong>Hi, There</strong>
            <small>Free shipping on all app orders</small>
            <small>CODE: APP-FREESHIP</small>
          </span>
          <svg width="76" height="62" viewBox="0 0 76 62" fill="none" aria-hidden="true"><path d="M6 50 2 14l20 16L38 4l16 26 20-16-4 36z" fill="#ffb347" stroke="#ff8a1f" strokeWidth="3" strokeLinejoin="round" /><rect x="8" y="50" width="60" height="9" rx="4" fill="#ff8a1f" /></svg>
          <button className={styles.hfX} aria-label="Dismiss" onClick={() => setClosed(true)}>&times;</button>
        </div>
      )}
      <section>
        <div className={styles.secHead}>
          <h3 className={styles.hfH}>Special Offers</h3>
        </div>
        <button className={styles.hfSpecial} onClick={() => onGo("shop")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/proposals/highfy/app/special.webp" alt="Special offer, just Rs 249 for today" />
        </button>
      </section>
    </>
  );
}

function ShopScreen({ brand, money, products, title, onOpen, query, setQuery, focusKey, wished, onWish, profile, searches, addSearch, dropSearch, clearSearches, filters, sort, openFilter }) {
  const inputRef = useRef(null);
  const [focus, setFocus] = useState(false);
  useEffect(() => {
    if (focusKey) inputRef.current?.focus({ preventScroll: true });
  }, [focusKey]);
  // A collection with no matching sample products falls back to everything.
  const base = products.length ? products : brand.products;
  const q = query.trim().toLowerCase();
  const found = q ? brand.products.filter((p) => p.title.toLowerCase().includes(q)) : base;
  const list = applyFilters(found, filters, sort);
  const nFilters = activeCount(filters);
  const open = (p) => {
    if (q) addSearch(query);
    onOpen(p);
  };
  return (
    <div className={styles.home}>
      <h2 className={styles.pageTitle}>{title || "All products"}</h2>
      <label className={styles.searchBox}>
        <Svg name="search" size={18} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${brand.name}`}
          enterKeyHint="search"
          aria-label="Search products"
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 160)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addSearch(query);
              e.currentTarget.blur();
            }
          }}
        />
        {query && (
          <button type="button" className={styles.clear} onClick={() => setQuery("")} aria-label="Clear search">
            <Svg name="plus" size={16} />
          </button>
        )}
      </label>
      {focus && (
        <Suggest
          brand={brand}
          query={query}
          recents={searches}
          onPick={(t) => {
            setQuery(t);
            addSearch(t);
            inputRef.current?.blur();
          }}
          onOpen={(i) => {
            addSearch(query);
            onOpen(brand.products[i]);
          }}
          onClear={clearSearches}
          onDrop={dropSearch}
        />
      )}
      {!focus && (
        <div className={fx.toolbar}>
          <button className={nFilters ? fx.on : ""} onClick={openFilter}>
            <Svg name="filter" size={16} /> Filter {nFilters > 0 && <em>{nFilters}</em>}
          </button>
          <button className={sort !== "featured" ? fx.on : ""} onClick={openFilter}>
            <Svg name="sort" size={16} /> {SORTS.find(([id]) => id === sort)?.[1] || "Sort"}
          </button>
        </div>
      )}
      {!(focus && !q) && (
      <p className={styles.muted}>
        {q || nFilters
          ? `${list.length} result${list.length === 1 ? "" : "s"} in the sample`
          : brand.productCount
            ? `${brand.productCount.toLocaleString("en")}${brand.productCount >= 5000 ? "+" : ""} products in the full catalogue`
            : `${list.length} products`}
      </p>
      )}
      {focus && !q ? null : list.length ? (
        <div className={styles.grid}>
          {list.map((p, i) => {
            const gi = brand.products.indexOf(p);
            return <ProductCard key={p.handle || i} p={p} money={money} onOpen={() => open(p)} wished={wished.includes(gi)} onWish={() => onWish(gi)} />;
          })}
        </div>
      ) : (
        <p className={styles.noHit}>Nothing matches that in the sample. The real app searches your whole catalogue.</p>
      )}
      <div className={styles.spacer} />
    </div>
  );
}

function Stars({ value, size = 14 }) {
  const row = (
    <span className={styles.starRow}>
      {[0, 1, 2, 3, 4].map((k) => (
        <Svg key={k} name="star" size={size} />
      ))}
    </span>
  );
  return (
    <span className={styles.starsBox} aria-hidden="true">
      <span className={styles.starsBack}>{row}</span>
      <span className={styles.starsFront} style={{ width: `${Math.max(0, Math.min(5, value)) * 20}%` }}>
        {row}
      </span>
    </span>
  );
}

function arrival() {
  const f = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" });
  };
  return `${f(2)} to ${f(5)}`;
}

function ProductScreen({ brand, product: p, index, money, onAdd, related, onOpen, wished, onWish, wishedAll, onWishCard, toast, live, profile, store, alert, onAlert, onSize, onAddAll }) {
  const [img, setImg] = useState(0);
  const opts = (p.options || []).filter((o) => o.values?.length > 1).slice(0, 2);
  const [choice, setChoice] = useState({});
  const off = p.compareAt && p.compareAt > p.price ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  const images = p.images?.length ? p.images : [p.image];
  const pick = (o) => choice[o.name] || o.values[0];
  const chosen = opts.map(pick).join(" / ") || undefined;
  const eta = useMemo(arrival, []);
  const reviewsRef = useRef(null);
  // Real reviews when the store publishes them; otherwise five labelled samples.
  const [real, setReal] = useState(null);
  useEffect(() => {
    setReal(null);
    if (!live || !p.handle || !brand.domain) return;
    let dead = false;
    fetch(`/api/reviews?domain=${encodeURIComponent(brand.domain)}&handle=${encodeURIComponent(p.handle)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!dead && (d.reviews?.length || d.rating)) setReal(d);
      })
      .catch(() => {});
    return () => {
      dead = true;
    };
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps
  const sample = useMemo(() => sampleReviews(p), [p]);
  // Three cases: real review text, a real rating with sample text, or all sample.
  const rv = real?.reviews?.length
    ? {
        sample: false,
        rating: real.rating || Math.round((real.reviews.reduce((n, x) => n + x.rating, 0) / real.reviews.length) * 10) / 10,
        count: real.count || real.reviews.length,
        reviews: real.reviews.map((x) => ({ ...x, daysAgo: x.date ? Math.max(0, Math.round((Date.now() - new Date(x.date)) / 864e5)) : null })),
      }
    : real?.rating
      ? { sample: true, scoreReal: true, rating: Math.round(real.rating * 10) / 10, count: real.count, reviews: sample.reviews }
      : sample;

  useEffect(() => {
    setImg(0);
    setChoice({});
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.pdp}>
      <div className={styles.galleryWrap}>
        <div
          className={styles.gallery}
          onScroll={(e) => setImg(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          data-lenis-prevent
        >
          {images.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt={p.title} />
          ))}
        </div>
        {images.length > 1 && <span className={styles.count}>{img + 1} / {images.length}</span>}
        <button className={styles.galShare} aria-label="Share" onClick={() => { buzz(14); toast("Link copied (sample)"); }}>
          <Svg name="share" size={18} />
        </button>
        <button className={`${fx.galAlert} ${alert ? fx.galAlertOn : ""}`} aria-label={alert ? "Edit alerts" : "Get alerts"} aria-pressed={!!alert} onClick={() => (buzz(14), onAlert())}>
          <Svg name={alert ? "bellFill" : "bell"} size={18} />
        </button>
      </div>
      {images.length > 1 && (
        <div className={styles.dots} aria-hidden="true">
          {images.map((s, i) => (
            <span key={s} className={i === img ? styles.dotOn : ""} />
          ))}
        </div>
      )}
      <div className={styles.pdpBody}>
        {p.vendor && p.vendor !== brand.name && <span className={styles.vendor}>{p.vendor}</span>}
        <h2 className={styles.pdpTitle}>{p.title}</h2>
        <button className={styles.stars} onClick={() => reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} aria-label={`Rated ${rv.rating} out of 5, ${rv.count} reviews`}>
          <Stars value={rv.rating} size={15} />
          <b>{rv.rating.toFixed(1)}</b>
          <small>({rv.count} {rv.sample && !rv.scoreReal ? "sample " : ""}reviews)</small>
        </button>
        <div className={styles.pdpPrice}>
          <strong>{money(p.price)}</strong>
          {off > 0 && (
            <>
              <s>{money(p.compareAt)}</s>
              <span className={styles.offPill}>{off}% off</span>
            </>
          )}
        </div>
        {has(brand, "bnpl") && p.price != null && <p className={styles.instal}>Or 3 instalments of {money(p.price / 3)}</p>}

        {opts.map((o) => (
          <div className={styles.options} key={o.name}>
            <span className={styles.optLabel}>
              {o.name}: <b>{pick(o)}</b>
            </span>
            <div className={styles.chips}>
              {o.values.map((v) => (
                <button key={v} className={`${styles.chip} ${v === pick(o) ? styles.chipOn : ""}`} onClick={() => { buzz(14); setChoice((c) => ({ ...c, [o.name]: v })); }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}

        {profile.sizing && (
          <button
            className={fx.sizeLink}
            onClick={() => {
              const so = opts.find((o) => /size/i.test(o.name));
              buzz(14);
              onSize({ values: so?.values, pick: (v) => setChoice((c) => ({ ...c, [so.name]: v })) });
            }}
          >
            <Svg name="ruler" size={16} /> Size guide and fit finder
          </button>
        )}

        <div className={styles.eta}>
          <Svg name="truck" size={20} />
          <span>
            <strong>Arrives {eta}</strong>
            <small>Delivery updates by push notification</small>
          </span>
        </div>

        <ul className={styles.perks}>
          <li>
            <Svg name="gift" size={18} /> Earns loyalty points
          </li>
          {profile.stores && (
            <li>
              <Svg name="store" size={18} /> Free pickup at {storesFor(brand, profile)[store]?.name}
            </li>
          )}
          {profile.cod && (
            <li>
              <Svg name="cash" size={18} /> Cash on delivery available
            </li>
          )}
        </ul>

        <div className={styles.acc}>
          {p.description && (
            <details open>
              <summary>Product details</summary>
              <p className={styles.desc}>{p.description}</p>
            </details>
          )}
          <details>
            <summary>Delivery and returns</summary>
            <p className={styles.desc}>Tracking is pushed to the customer's phone at every step. Returns are started from the Orders screen in two taps. Sample text; your own policy goes here.</p>
          </details>
        </div>

        <CompleteLook brand={brand} index={index} label={profile.look || "Frequently bought together"} money={money} chosen={chosen} onAddAll={onAddAll} />

        <section className={styles.reviews} ref={reviewsRef} data-feature="reviews">
          <div className={styles.revHead}>
            <h3 className={styles.h}>Reviews</h3>
            <span className={styles.revScore}>
              <Stars value={rv.rating} size={14} /> <b>{rv.rating.toFixed(1)}</b>
            </span>
          </div>
          <ul className={styles.revList}>
            {rv.reviews.slice(0, 5).map((x, k) => (
              <li key={k}>
                <div className={styles.revTop}>
                  <Stars value={x.rating} size={13} />
                  {x.daysAgo != null && <small>{ago(x.daysAgo)}</small>}
                </div>
                {x.title && <strong>{x.title}</strong>}
                {x.body && <p>{x.body}</p>}
                <span className={styles.revBy}>
                  <span className={styles.revAv}>{(x.name || "C").slice(0, 1)}</span>
                  {x.name}
                  {x.verified && (
                    <em>
                      <Svg name="check" size={12} /> Verified buyer
                    </em>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.muted}>{rv.scoreReal ? `The rating and count are from ${brand.domain}. The reviews below are samples.` : rv.sample ? "Sample reviews. Your real ones appear here from your reviews app." : `Reviews from ${brand.domain || "the store"}.`}</p>
        </section>

        {related.length > 0 && (
          <>
            <h3 className={styles.h}>You may also like</h3>
            <div className={styles.rail} data-lenis-prevent>
              {related.map((r, i) => {
                const gi = brand.products.indexOf(r);
                return <ProductCard key={r.handle || i} p={r} money={money} onOpen={() => onOpen(r)} wide wished={wishedAll.includes(gi)} onWish={() => onWishCard(gi)} />;
              })}
            </div>
          </>
        )}
        <div className={styles.spacerTall} />
      </div>
      <div className={styles.buyBar}>
        <button className={`${styles.wish} ${wished ? styles.wishOn : ""}`} aria-label={wished ? "Remove from wishlist" : "Save to wishlist"} aria-pressed={wished} onClick={onWish}>
          <Svg name={wished ? "heartFill" : "heart"} />
        </button>
        <button className={styles.buy} onClick={(e) => onAdd(index, chosen, e.currentTarget)}>
          Add to cart
        </button>
      </div>
    </div>
  );
}

function CartScreen({ brand, cart, money, subtotal, onQty, onBrowse, onClear, onPlaced, onOrders, profile, store }) {
  const [phase, setPhase] = useState("idle");
  const [opt, setOpt] = useState({ mode: "ship", gift: false, note: "" });
  useEffect(() => {
    if (phase !== "busy") return;
    const t = setTimeout(() => {
      setPhase("done");
      onPlaced?.(cart.map((x) => (x.gift ? { gift: x.gift.amount, qty: x.qty } : { i: x.i, qty: x.qty })), subtotal * 0.9, opt.mode);
      onClear();
      buzz([22, 60, 34]);
    }, 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  if (phase === "done") {
    return (
      <div className={styles.empty}>
        <span className={styles.tick}>
          <Svg name="check" size={34} />
        </span>
        <h2>Order placed</h2>
        <p>
          {opt.mode === "pickup" ? `We will message you when it is ready at ${storesFor(brand, profile)[store]?.name}. ` : ""}
          This is a demo, so nothing was charged. In the real app, checkout opens in the Shopify Checkout Sheet Kit, so payment stays with Shopify.
        </p>
        <button className={styles.buy} onClick={onBrowse}>
          Keep shopping
        </button>
        <button className={styles.ghost} onClick={onOrders}>
          Track this order
        </button>
      </div>
    );
  }
  if (!cart.length) {
    return (
      <div className={styles.empty}>
        <Svg name="bag" size={44} />
        <h2>Your cart is empty</h2>
        <p>Tap any product and add it here to see checkout.</p>
        <button className={styles.buy} onClick={onBrowse}>
          Browse best sellers
        </button>
      </div>
    );
  }
  return (
    <div className={styles.home}>
      <h2 className={styles.pageTitle}>Cart</h2>
      <ul className={styles.lines}>
        {cart.map((x) => {
          const p = x.gift ? null : brand.products[x.i];
          return (
            <li key={x.key}>
              {x.gift ? (
                <span className={fx.giftThumb}><Svg name="gift" size={22} /></span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt="" />
              )}
              <div>
                <span className={styles.cardTitle}>{x.gift ? "Gift card" : p.title}</span>
                {x.gift && <small className={styles.muted}>{x.gift.to ? `For ${x.gift.to}` : "Sent by email"}</small>}
                {x.option && <small className={styles.muted}>{x.option}</small>}
                <strong>{x.gift ? money(x.gift.amount * x.qty) : p.price != null ? money(p.price * x.qty) : ""}</strong>
              </div>
              <div className={styles.qty}>
                <button onClick={() => (buzz(14), onQty(x.key, -1))} aria-label="One fewer">
                  <Svg name="minus" size={16} />
                </button>
                <span>{x.qty}</span>
                <button onClick={() => (buzz(14), onQty(x.key, 1))} aria-label="One more">
                  <Svg name="plus" size={16} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <CheckoutOptions brand={brand} profile={profile} store={store} opt={opt} setOpt={setOpt} money={money} />
      <div className={styles.summary}>
        <span>Subtotal</span>
        <strong>{money(subtotal)}</strong>
      </div>
      <div className={styles.summary}>
        <span>App welcome offer (APP10)</span>
        <strong>-{money(subtotal * 0.1)}</strong>
      </div>
      <button className={`${styles.buy} ${styles.full}`} onClick={() => (buzz(20), setPhase("busy"))} disabled={phase === "busy"}>
        {phase === "busy" ? <span className={styles.spin} aria-label="Placing order" /> : <>Checkout {money(subtotal * 0.9)}</>}
      </button>
      <p className={styles.muted} style={{ textAlign: "center" }}>Secure Shopify checkout opens in the app.</p>
      <div className={styles.spacer} />
    </div>
  );
}

const STEPS = ["Packed", "Shipped", "Out today"];

function Tracker({ step }) {
  return (
    <div className={styles.track}>
      <div className={styles.trackBar}>
        <i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>
      <div className={styles.trackSteps}>
        {STEPS.map((s, k) => (
          <small key={s} className={k <= step ? styles.trackOn : ""}>
            {s}
          </small>
        ))}
      </div>
    </div>
  );
}

function AccountScreen({ brand, money, sub, onSub, wished, onWish, orders, onOpen, toast, onShop, profile, alerts, store, setStore, onAddGift }) {
  const products = brand.products;
  const at = (i) => products[i % Math.max(1, products.length)];
  const total = (lines) => lines.reduce((n, l) => n + (l.gift ?? (at(l.i).price || 0)) * (l.qty || 1), 0);

  // Placed orders come first, then two sample ones made from the catalogue.
  const sample = products.length
    ? [
        { id: 4821, status: "Out for delivery", step: 2, lines: [{ i: 0, qty: 1 }, { i: 1, qty: 1 }], sample: true },
        { id: 4755, status: "Delivered", step: 3, lines: [{ i: 2, qty: 1 }], sample: true },
      ]
    : [];
  const all = [...orders.map((o) => ({ id: o.id, status: o.mode === "pickup" ? "Ready soon" : "Packed", step: 0, lines: o.lines, total: o.total })), ...sample];

  if (sub === "orders") {
    return (
      <div className={styles.home}>
        <h2 className={styles.pageTitle}>Orders</h2>
        {all.length === 0 && <p className={styles.noHit}>No orders yet.</p>}
        <ul className={styles.orders}>
          {all.map((o) => (
            <li key={o.id}>
              <div className={styles.orderHead}>
                <strong>Order #{o.id}</strong>
                <span className={`${styles.pill} ${o.step >= 3 ? styles.pillDone : ""}`}>{o.status}</span>
              </div>
              <div className={styles.thumbs}>
                {o.lines.slice(0, 4).map((l, k) =>
                  l.gift != null ? (
                    <span key={k} className={fx.giftThumb}><Svg name="gift" size={20} /></span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={k} src={at(l.i).image} alt="" />
                  )
                )}
                <span className={styles.orderTotal}>{money(o.total ?? total(o.lines))}</span>
              </div>
              {o.step < 3 && <Tracker step={o.step} />}
            </li>
          ))}
        </ul>
        <p className={styles.muted}>{sample.length ? "Sample orders, plus anything you place here." : ""}</p>
        <div className={styles.spacer} />
      </div>
    );
  }

  if (sub === "rewards") return <RewardsScreen brand={brand} money={money} orders={orders} onInvite={() => onSub("invite")} toast={toast} />;
  if (sub === "invite") return <InviteScreen brand={brand} money={money} toast={toast} />;
  if (sub === "giftcards") return <GiftCardScreen brand={brand} money={money} onAdd={onAddGift} toast={toast} />;
  if (sub === "stores" && profile.stores) return <StoresScreen brand={brand} profile={profile} store={store} setStore={setStore} toast={toast} />;

  if (sub === "wishlist") {
    return (
      <div className={styles.home}>
        <h2 className={styles.pageTitle}>Wishlist</h2>
        {wished.length ? (
          <div className={styles.grid}>
            {wished.map((i) => (
              <ProductCard key={i} p={products[i]} money={money} onOpen={() => onOpen(i)} wished onWish={() => onWish(i)} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyIn}>
            <Svg name="heart" size={40} />
            <h2>Nothing saved yet</h2>
            <p>Tap the heart on any product to keep it here.</p>
            <button className={styles.buy} onClick={onShop}>
              Browse products
            </button>
          </div>
        )}
        <div className={styles.spacer} />
      </div>
    );
  }

  if (sub === "vouchers") {
    const v = [
      ["APP10", "10% off", "Your first app order"],
      ["FREESHIP", "Free delivery", "Your second app order"],
      ["WELCOME", "Welcome gift", "Added when you sign up"],
    ];
    return (
      <div className={styles.home}>
        <h2 className={styles.pageTitle}>Vouchers</h2>
        <ul className={styles.vouchers}>
          {v.map(([code, big, small]) => (
            <li key={code}>
              <span className={styles.vBig}>
                <b>{big}</b>
                <small>{small}</small>
              </span>
              <span className={styles.vCode}>
                <code>{code}</code>
                <button onClick={() => { buzz(16); toast("Code copied (sample)"); }}>Copy</button>
              </span>
            </li>
          ))}
        </ul>
        <p className={styles.muted}>Sample vouchers. Yours are set up in the store admin.</p>
        <div className={styles.spacer} />
      </div>
    );
  }

  if (sub === "notifications") {
    const items = [];
    Object.entries(alerts || {}).forEach(([pi, a]) => {
      const p = products[pi];
      if (!p) return;
      const what = [a.price ? (a.target ? `price drops ${a.target}%+` : "any price drop") : null, a.stock ? "back in stock" : null].filter(Boolean).join(" and ");
      items.push({ img: p.image, t: `Watching ${p.title}`, s: `You will be told about ${what}`, ago: "now", open: Number(pi) });
    });
    if (products[0]) items.push({ img: products[0].image, t: `Back in stock: ${products[0].title}`, s: "Tap to shop it before it goes again", ago: "2m", open: 0 });
    if (products[1]) items.push({ img: products[1].image, t: `Price drop on ${products[1].title}`, s: products[1].price != null ? `Now ${money(products[1].price)}` : "Now cheaper", ago: "1h", open: 1 });
    items.push({ img: products[2]?.image, t: "Order #4821 is out for delivery", s: "Arriving today", ago: "3h", open: null });
    items.push({ img: null, t: "10% off your first app order", s: "Use code APP10 at checkout", ago: "1d", open: null });
    return (
      <div className={styles.home}>
        <h2 className={styles.pageTitle}>Notifications</h2>
        <ul className={styles.notifs}>
          {items.map((n, k) => (
            <li key={k}>
              <button onClick={() => (n.open != null ? onOpen(n.open) : onSub("orders"))}>
                <span className={styles.nImg}>{n.img ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={n.img} alt="" /> : <Svg name="gift" size={22} />}</span>
                <span className={styles.nTxt}>
                  <strong>{n.t}</strong>
                  <small>{n.s}</small>
                </span>
                <em>{n.ago}</em>
              </button>
            </li>
          ))}
        </ul>
        <p className={styles.muted}>Sample alerts. The real ones are sent from your store's events.</p>
        <div className={styles.spacer} />
      </div>
    );
  }

  if (sub === "addresses") {
    return (
      <div className={styles.home}>
        <h2 className={styles.pageTitle}>Addresses</h2>
        <div className={styles.addr}>
          <Svg name="pin" size={22} />
          <span>
            <strong>Home</strong>
            <small>12 Example Street, Your City</small>
            <small>Default for one-tap checkout</small>
          </span>
        </div>
        <button className={`${styles.buy} ${styles.full}`} onClick={() => toast("Opens the address form in the real app")}>
          Add a new address
        </button>
        <div className={styles.spacer} />
      </div>
    );
  }

  const rows = [
    ["orders", "box", "Orders", "Track every order, no email digging", all.length],
    ["wishlist", "heart", "Wishlist", "Saved items, synced with the website", wished.length],
    ["rewards", "trophy", "Rewards", "Tiers, points and vouchers to spend", null],
    ["vouchers", "tag", "Vouchers", "Codes and gifts in one wallet", 3],
    ["giftcards", "gift", "Gift cards", "Send one, or add one to your wallet", null],
    ["invite", "users", "Invite friends", "Give and get a reward", null],
    ...(profile.stores ? [["stores", "store", "Stores and pickup", "Find a store, collect your order", null]] : []),
    ["notifications", "bell", "Notifications", "Restocks, drops and price alerts", Object.keys(alerts || {}).length || null],
    ["addresses", "pin", "Addresses", "Saved for one-tap checkout", null],
  ];
  return (
    <div className={styles.home}>
      <div className={styles.hi}>
        <span className={styles.avatar}>{(brand.name || "A").slice(0, 1)}</span>
        <span>
          <h2 className={styles.pageTitle}>Hi there</h2>
          <small className={styles.muted}>Signed in with your {brand.name} account</small>
        </span>
      </div>
      <button className={styles.points} onClick={() => onSub("rewards")} aria-label="Open rewards" style={{ width: "100%", textAlign: "left" }}>
        <span>{["Member", "Insider", "VIP"][pointsFor(orders) >= 1500 ? 2 : pointsFor(orders) >= 500 ? 1 : 0]} &middot; your points</span>
        <strong>{pointsFor(orders).toLocaleString("en")}</strong>
        <small>Tap for tiers, history and vouchers. Sample balance.</small>
      </button>
      <ul className={styles.menu}>
        {rows.map(([id, icon, t, s, n]) => (
          <li key={id}>
            <button className={styles.menuRow} onClick={() => onSub(id)}>
              <span className={styles.menuIco}>
                <Svg name={icon} size={20} />
              </span>
              <span className={styles.menuTxt}>
                <strong>{t}</strong>
                <small>{s}</small>
              </span>
              {n != null && <em className={styles.menuN}>{n}</em>}
              <Svg name="chev" size={16} />
            </button>
          </li>
        ))}
      </ul>
      <div className={styles.spacer} />
    </div>
  );
}
