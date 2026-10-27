// Narration and layout for the "ideas style" walkthrough (engine2.mjs).
//
// A beat is one spoken block. It has:
//   say      what the cloned voice reads (full stops split it into sentences)
//   kicker   small label above the title
//   titles   one heading per sentence (the last one repeats)
//   subs     one sub line per sentence (optional)
//   panel    what sits under the heading: checks, chips, rows or steps
//   states   per sentence: how many panel items are visible and which one is lit
//   phone    mode "site" (the live store in a phone browser) or "app" (the Bonsify app)
//            steps: [{ at, do }] where `at` is a fraction of the beat (0 to 1)
//            Calls: show(screen, index), scrollBy(px), add(index), click(label)

const money = { PKR: "rupees", USD: "dollars", GBP: "pounds", EUR: "euros", AED: "dirhams", INR: "rupees", SAR: "riyals", CAD: "dollars", AUD: "dollars" };

// What the store already runs, turned into what happens to it inside the app.
const KNOWN = [
  { key: "reviews", re: /judge\.?me|yotpo|loox|stamped|okendo|reviews\.io|trustpilot|ali ?reviews/i, say: (n) => `${n} for reviews. Those ratings show up inside the app on every product.`, line: "Ratings show up inside the app on every product", screen: ["show", "reviews", 0] },
  { key: "chat", re: /live ?chat|tidio|gorgias|zendesk|intercom|whatsapp|tawk|crisp|chatra|freshchat/i, say: (n) => `${n} for chat. Customers can reach your team from the app.`, line: "Customers reach your team from the app", screen: ["show", "chat"] },
  { key: "search", re: /searchanise|algolia|klevu|boost.*search|smart ?search|instant ?search/i, say: (n) => `${n} for search. The same results power search inside the app.`, line: "The same results power search in the app", screen: ["show", "shop"] },
  { key: "email", re: /mailchimp|klaviyo|omnisend|brevo|sendinblue|privy|drip|postscript/i, say: (n) => `${n} for email. Your list keeps growing from sign ups in the app.`, line: "Your list keeps growing from sign ups in the app", screen: ["show", "account"] },
  { key: "analytics", re: /google analytics|ga4|tag manager|gtm|clarity|hotjar|pixel|analytics|lucky ?orange/i, say: (n) => `${n} for analytics. App events flow into the reports you already read.`, line: "App events flow into the reports you already read", screen: ["show", "home"] },
  { key: "feed", re: /instafeed|instagram|snapppt|foursixty/i, say: (n) => `${n}. Your Instagram feed gets its own place in the app.`, line: "Your Instagram feed gets its own place in the app", screen: ["show", "home"] },
];

function detect(storeApps) {
  const rows = [], seen = new Set();
  const analytics = [];
  for (const raw of storeApps || []) {
    const hit = KNOWN.find((k) => k.re.test(raw));
    if (!hit) continue;
    if (hit.key === "analytics") { analytics.push(raw); continue; }
    if (seen.has(hit.key)) continue;
    seen.add(hit.key);
    rows.push({ ...hit, name: raw });
  }
  if (analytics.length) {
    const hit = KNOWN.find((k) => k.key === "analytics");
    const names = analytics.slice(0, 2);
    const label = names.map((n) => n.replace(/microsoft |google /i, "").replace(/^analytics ?4$/i, "GA4").replace(/^google analytics.*$/i, "GA4")).join(" and ");
    rows.push({ ...hit, name: label, say: () => `${label} for analytics. App events flow into the reports you already read.` });
  }
  return rows.slice(0, 4);
}

const list = (a) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
export const sentences = (t) => t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

export function beatsFor(brand) {
  const name = brand.name;
  const n = brand.productCount || brand.products?.length || 0;
  const cn = n >= 100 ? n.toLocaleString("en-US") : "";
  const cur = money[brand.currency] || "your currency";
  const rows = detect(brand.storeApps);
  const gen = !rows.length;
  const cols = brand.colors || {};

  const beats = [];

  // 1. the store today, in a phone browser
  beats.push({
    id: "today", mode: "today", kicker: "Today", titles: ["Your store on a phone, today", "Your store on a phone, today", "Every visit starts cold"],
    subs: ["", "", ""],
    say: `First, here is ${name} as a customer sees it on a phone today. It is a good store${cn ? `, with a catalogue of ${cn} products` : " with a big catalogue"}. But it lives in a browser tab. Every visit starts cold, with no icon on the home screen, no push notifications, and nothing to bring a customer back once they leave.`,
    panel: { type: "checks", items: [{ ok: true, t: "A good store" }, { ok: true, t: cn ? `${cn} products` : "A big catalogue" }, { ok: true, t: "Strong collections" }, { ok: false, t: "No icon on the home screen" }, { ok: false, t: "No push notifications" }, { ok: false, t: "Nothing to bring a customer back" }] },
    states: [{ show: 0 }, { show: 3 }, { show: 3 }, { show: 6 }],
    titlesBy: [0, 0, 1, 2],
    phone: { mode: "site", steps: [{ at: 0.04, do: ["scrollBy", 520] }, { at: 0.22, do: ["scrollBy", 620] }, { at: 0.42, do: ["scrollBy", 640] }, { at: 0.62, do: ["scrollBy", 700] }, { at: 0.82, do: ["scrollBy", 700] }] },
  });

  // 2. the same store as an app
  beats.push({
    id: "now", kicker: "Now: your store as an app", titles: ["Your logo, your colours, your real products"],
    say: `Now, the same store as an app. It already uses your logo, your colours and your real products. Here is the home screen, with your banners and best sellers.`,
    panel: { type: "chips", items: [{ sw: cols.primary || "#111111", t: (cols.primary || "#111111").toUpperCase() }, { sw: cols.accent || "#d4202c", t: (cols.accent || "#d4202c").toUpperCase() }, { t: `${brand.currency || "PKR"} prices` }, { t: `${brand.products?.length || 12} real products` }] },
    states: [{ show: 0 }, { show: 4 }, { show: 4 }],
    phone: { mode: "app", steps: [{ at: 0, do: ["show", "splash"] }, { at: 0.16, do: ["show", "home"] }, { at: 0.5, do: ["scrollBy", 330] }, { at: 0.72, do: ["scrollBy", 360] }, { at: 0.92, do: ["scrollBy", -690] }] },
  });

  // 3. browsing
  beats.push({
    id: "browse", kicker: "Catalogue", titles: ["Browsing is fast"],
    subs: [`Search, filter and sort across your full catalogue${cn ? " of " + cn + " products" : ""}.`],
    say: `Browsing is fast. Search, filter and sort across your full catalogue${cn ? ` of ${cn} products` : ""}.`,
    panel: { type: "none" }, states: [{ show: 0 }, { show: 0 }],
    phone: { mode: "app", steps: [{ at: 0, do: ["show", "shop"] }, { at: 0.3, do: ["scrollBy", 520] }, { at: 0.55, do: ["scrollBy", 700] }, { at: 0.85, do: ["scrollBy", 600] }] },
  });

  // 4. product and bundles
  beats.push({
    id: "product", kicker: "Product", titles: [`Gallery, sizes and price in ${cur}`, "Add it, and bundles suggest the matching piece"],
    subs: ["Straight from your Shopify product data.", "Complete the look raises the basket."],
    say: `Open a product and you get the gallery, the sizes and the price in ${cur}, straight from your Shopify data. Add it to the bag, and bundles suggest the matching piece to go with it.`,
    panel: { type: "none" }, states: [{ show: 0 }, { show: 0 }],
    phone: { mode: "app", steps: [{ at: 0, do: ["show", "product", 0] }, { at: 0.18, do: ["scrollBy", 420] }, { at: 0.42, do: ["scrollBy", -420] }, { at: 0.5, do: ["add", 0] }, { at: 0.6, do: ["show", "fbt", 0] }, { at: 0.85, do: ["scrollBy", 320] }] },
  });

  // 5. checkout
  beats.push({
    id: "checkout", kicker: "Checkout", titles: ["Your own Shopify checkout", "Nothing moves"],
    subs: ["Secure checkout opens in the app.", "Your payment methods, shipping rules and orders all stay where they are today."],
    say: `Then the bag and checkout, which is your own Shopify checkout. Your payment methods, your shipping rules and your orders all stay exactly where they are today.`,
    panel: { type: "none" }, states: [{ show: 0 }, { show: 0 }],
    phone: { mode: "app", steps: [{ at: 0, do: ["show", "cart"] }, { at: 0.25, do: ["scrollBy", 260] }, { at: 0.45, do: ["scrollBy", -260] }, { at: 0.55, do: ["click", "checkout"] }] },
  });

  // 6. what the store already runs
  const rowsOrGeneric = gen
    ? [{ name: "Shopify checkout", line: "Stays exactly as it is", screen: ["show", "cart"], say: () => "Your Shopify checkout stays exactly as it is." },
       { name: "Products and orders", line: "Keep living in Shopify", screen: ["show", "shop"], say: () => "Your products and orders keep living in Shopify." }]
    : rows;
  const detSay = [`We also looked at what your store already runs.`, ...rowsOrGeneric.map((r) => r.say(r.name)), `Nothing gets replaced and nothing needs to be rebuilt.`].join(" ");
  const nD = rowsOrGeneric.length, shows = [{ show: 0, active: -1 }, ...rowsOrGeneric.map((_, i) => ({ show: nD, active: i })), { show: nD, active: -1 }];
  const sl = sentences(detSay).map((s) => s.length), slSum = sl.reduce((a, b) => a + b, 0);
  let acc = 0; const dsteps = [];
  sl.forEach((l, i) => {
    const at = acc / slSum + 0.02; acc += l;
    if (i >= 1 && i <= nD) dsteps.push({ at, do: rowsOrGeneric[i - 1].screen });
    if (i === 0) dsteps.push({ at: 0, do: ["show", "home"] });
    if (i >= 1 && i <= nD) dsteps.push({ at: at + 0.06, do: ["scrollBy", 260] });
  });
  dsteps.push({ at: 0.93, do: ["show", "home"] });
  beats.push({
    id: "detected", kicker: "What your store already runs", titles: ["Detected, then mapped into the app", "Detected, then mapped into the app", "Nothing replaced. Nothing rebuilt."],
    say: detSay,
    panel: { type: "rows", items: rowsOrGeneric.map((r) => ({ brand: r.key ? r.key : "store", name: r.name, t: r.line })) },
    states: shows, titlesBy: shows.map((_, i) => (i === shows.length - 1 ? 2 : 0)),
    phone: { mode: "app", steps: dsteps },
  });

  // 7. how we work
  beats.push({
    id: "how", kicker: "How we work", titles: ["Here is how we work"],
    say: `Here is how we work. We audit your store first, then give you one fixed quote for the build. There are no hourly surprises. After launch, the app belongs to you, and we only stay on if you want support.`,
    panel: { type: "steps", items: [{ t: "We audit your store", d: "Apps, theme, catalogue and checkout, before anything is built." }, { t: "One fixed quote", d: "A single price for the build. No hourly surprises." }, { t: "The app is yours", d: "After launch it belongs to you. We stay on only if you want support." }] },
    states: [{ show: 3, active: -1 }, { show: 3, active: 0 }, { show: 3, active: 1 }, { show: 3, active: 2 }],
    phone: { mode: "app", steps: [{ at: 0, do: ["show", "home"] }, { at: 0.2, do: ["scrollBy", 300] }, { at: 0.5, do: ["scrollBy", 400] }, { at: 0.8, do: ["scrollBy", -700] }] },
  });

  for (const b of beats) {
    b.sents = sentences(b.say);
    b.titlesBy ||= b.sents.map((_, i) => Math.min(i, b.titles.length - 1));
    while (b.states.length < b.sents.length) b.states.push(b.states[b.states.length - 1]);
  }
  return beats;
}

// Intro and outro: the recorded lines, shown as headings timed to what is said.
export function introStates(brand) {
  return [
    { t: 0, kicker: "Welcome", title: `Hi ${brand.name} team`, sub: "Shopify stores, turned into mobile apps" },
    { t: 7.8, kicker: "Your app", title: "Your app, built on your real products", sub: "Your catalogue, your colours, your logo" },
    { t: 13.4, kicker: "Walkthrough", title: "A quick walkthrough", sub: "Let us dive in" },
  ];
}
export function outroStates() {
  return [
    { t: 0, kicker: "Next step", title: "And that is your app", sub: "" },
    { t: 3.0, kicker: "Try it", title: "Scan the code to open it on your phone", sub: "", qr: true },
    { t: 7.0, kicker: "Bonsify", title: "We would love to hear from you", sub: "hello@bonsify.io", qr: true, cta: true },
  ];
}
