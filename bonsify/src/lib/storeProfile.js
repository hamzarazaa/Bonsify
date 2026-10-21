// Decides which app features a store gets. The decision is made from what the
// store SELLS (its category), never from which features its website happens to
// have today: an electronics store gets no "complete the look", a clothing
// store gets a size guide, and everyone gets the universal set.
//
// Three layers:
//   1. classify(): a category from product types, titles, vendors, collection
//      names, brand name and domain. `brand.category` overrides it.
//   2. MATRIX: what each category adds on top of the universal set.
//   3. market rules: cash on delivery, WhatsApp and miles vs km follow the
//      store's currency and domain, because those are about where the store
//      sells, not what it sells.

const KEYWORDS = {
  footwear: "shoe shoes sneaker sneakers trainer trainers boot boots sandal sandals slipper slippers loafer loafers heel heels flip flop slides khussa clog clogs runner runners",
  fashion:
    "shirt shirts tee tees t-shirt hoodie hoodies jacket jackets dress dresses jeans pants trousers shorts skirt skirts sweater sweatshirt jumper coat legging leggings bra bras tank cardigan blazer kurta kurti shalwar kameez abaya hijab lawn suit saree scarf apparel clothing fleece joggers crop bodysuit swimsuit bikini underwear boxers socks beanie polo vest tracksuit kaftan dupatta",
  beauty:
    "pencil stix shadow shade matte brush kohl kajal eyeliner lash lashes lipstick lip mascara foundation concealer blush eyeshadow palette serum moisturizer moisturiser cleanser skincare makeup perfume fragrance shampoo conditioner cream lotion nail polish brow highlighter primer sunscreen spf cosmetic cosmetics bronzer gloss liner toner mist fragrance cologne attar",
  electronics:
    "phone iphone android laptop earbuds headphone headphones speaker charger cable usb tablet camera monitor keyboard mouse router drone console gaming powerbank battery tv bluetooth wireless smartwatch airpods adapter processor gpu ssd webcam microphone projector soundbar earphones gadget",
  home: "sofa chair table lamp rug curtain curtains cushion pillow bedding duvet sheets mattress vase candle decor furniture shelf mirror cookware towel basket planter throw blanket dinnerware mug kitchen bedsheet comforter ottoman stool wardrobe bookcase",
  kids: "kids kid baby toddler infant toy toys onesie nursery stroller diaper newborn children boys girls plush puzzle lego romper",
  food: "coffee tea chocolate snack snacks honey sauce spice spices organic granola cookie cookies jam nuts oil protein-bar juice sweets mithai dates biscuit gourmet jerky pasta cereal syrup",
  jewelry: "ring rings necklace bracelet bracelets earring earrings pendant bangle bangles chain jewelry jewellery gold silver diamond anklet charm choker brooch",
  sports: "gym yoga fitness dumbbell dumbbells cycling football cricket bat workout training sportswear activewear equipment mat bike treadmill racket kettlebell resistance",
  health: "vitamin vitamins supplement supplements wellness herbal capsule capsules pharmacy medical health probiotic collagen",
  pets: "dog cat pet pets puppy kitten collar leash kibble litter",
  books: "book books novel journal planner stationery notebook pen art-supplies sketchbook",
};

const NAME_STEMS = {
  beauty: ["beauty", "cosmetic", "skin", "glow", "makeup", "colourpop", "glossier", "nyx", "sephora", "lipstick", "perfume"],
  footwear: ["shoe", "sneaker", "footwear", "boots"],
  fashion: ["apparel", "clothing", "fashion", "wear", "threads", "denim"],
  jewelry: ["jewel", "gems", "diamond"],
  electronics: ["tech", "gadget", "electronics", "mobile"],
  home: ["furniture", "homeware", "decor", "living"],
  kids: ["kids", "baby", "tots", "junior"],
  food: ["coffee", "tea", "foods", "snack", "chocolate", "kitchen"],
  sports: ["fitness", "gym", "sport"],
  pets: ["pet", "paws"],
};

const WORDS = Object.fromEntries(Object.entries(KEYWORDS).map(([k, v]) => [k, new Set(v.split(/\s+/))]));

const tokens = (s) => (s || "").toLowerCase().replace(/[^a-z0-9\-\s]/g, " ").split(/\s+/).filter(Boolean);

export function classify(brand) {
  if (brand.category && (WORDS[brand.category] || brand.category === "general")) {
    return { category: brand.category, scores: {}, forced: true };
  }
  const scores = {};
  const bump = (cat, n = 1) => (scores[cat] = (scores[cat] || 0) + n);
  const scan = (text, weight) => {
    const seen = new Set();
    for (const t of tokens(text)) {
      for (const cat of Object.keys(WORDS)) {
        if (!seen.has(cat) && (WORDS[cat].has(t) || WORDS[cat].has(t.replace(/s$/, "")))) {
          seen.add(cat); // one hit per category per text, so one long title cannot swamp the rest
          bump(cat, weight);
        }
      }
    }
  };
  for (const p of brand.products || []) {
    scan(p.title, 1);
    scan(p.type, 2);
    scan(p.description, 0.5); // brand-named products ("Bae", "Drift") are explained here
  }
  for (const c of brand.collections || []) scan(c.title, 1);
  const ident = `${brand.name || ""} ${brand.domain || ""}`.toLowerCase();
  scan(ident.replace(/\./g, " "), 2);
  // Names are often one word: "ColourPop", "shoegrid", "babyhaven".
  for (const [cat, stems] of Object.entries(NAME_STEMS)) if (stems.some((s) => ident.includes(s))) bump(cat, 2);

  let best = "general";
  let top = 0;
  for (const [cat, n] of Object.entries(scores)) {
    if (n > top) {
      top = n;
      best = cat;
    }
  }
  // Footwear stores often also list socks and tees. Footwear leads when it
  // is at least as strong as clothing.
  if (best === "fashion" && (scores.footwear || 0) >= top) best = "footwear";
  if (top < 2) best = "general";
  return { category: best, scores, forced: false };
}

// What each category adds. `sizing` names the size guide variant,
// `look` is the heading of the bundle row, `stores` turns on the locator and pickup.
const MATRIX = {
  fashion: { sizing: "apparel", look: "Complete the look", stores: true },
  footwear: { sizing: "shoe", look: "Complete the look", stores: true },
  beauty: { look: "Complete the routine", stores: true },
  jewelry: { look: "Style it with", stores: true },
  home: { look: "Complete the room", stores: true },
  kids: { sizing: "kids", look: "Complete the set", stores: true },
  sports: { stores: true },
  electronics: { stores: true },
  food: { stores: true },
  health: { stores: true },
  pets: { stores: true },
  books: { stores: true },
  general: {},
};

export const CATEGORY_LABEL = {
  fashion: "Fashion and apparel",
  footwear: "Footwear",
  beauty: "Beauty and personal care",
  jewelry: "Jewellery and accessories",
  home: "Home and living",
  kids: "Kids and baby",
  sports: "Sports and fitness",
  electronics: "Electronics",
  food: "Food and drink",
  health: "Health and wellness",
  pets: "Pets",
  books: "Books and stationery",
  general: "General store",
};

const COD = new Set("PKR INR BDT LKR NPR EGP AED SAR QAR KWD OMR BHD JOD NGN KES GHS MAD IDR PHP VND".split(" "));
const WA = new Set([...COD, ..."BRL MXN COP ARS CLP PEN TRY ZAR".split(" ")]);

export function storeProfile(brand) {
  const { category, scores, forced } = classify(brand);
  const m = MATRIX[category] || {};
  const cur = (brand.currency || "").toUpperCase();
  const domain = (brand.domain || "").toLowerCase();
  const cod = COD.has(cur) || /\.(pk|in|bd|lk|eg|ae|sa)$/.test(domain);
  const whatsapp = cod || WA.has(cur);

  let sizing = m.sizing || null;
  const text = (brand.products || []).map((p) => `${p.title} ${p.type || ""}`).join(" ").toLowerCase();
  // Sports stores only get a guide when they sell wearable kit, not just equipment.
  if (category === "sports" && ((scores.fashion || 0) >= 2 || (scores.footwear || 0) >= 2)) {
    sizing = (scores.footwear || 0) > (scores.fashion || 0) ? "shoe" : "apparel";
  }
  // Jewellery only needs sizing when it sells rings or bangles.
  if (category === "jewelry" && /\b(rings?|bangles?)\b/.test(text)) sizing = "ring";

  return {
    category,
    label: CATEGORY_LABEL[category],
    forced,
    scores,
    sizing,
    look: m.look || null,
    stores: !!m.stores,
    cod,
    whatsapp,
    imperial: cur === "USD" || cur === "GBP",
    // Everyone gets these. They do not depend on the category.
    universal: ["rewards", "referral", "giftCards", "giftNote", "wallet", "filters", "sort", "searchHistory", "alerts", "chat"],
  };
}

// Round to a price a person would actually pick for a gift card.
const NICE = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000, 15000, 20000, 25000, 50000];
const nearest = (n) => NICE.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));

export function giftAmounts(products) {
  const prices = (products || []).map((p) => p.price).filter((n) => n > 0).sort((a, b) => a - b);
  const mid = prices.length ? prices[Math.floor(prices.length / 2)] : 50;
  const set = [...new Set([0.5, 1, 2, 4].map((k) => nearest(mid * k)))];
  return set.slice(0, 4);
}

// Searches worth suggesting: product types first, then the commonest title words.
const STOP = new Set("the and for with new set pack of in a an to by from your our men women mens womens unisex size colour color black white blue red green pink grey gray small medium large xl".split(" "));
export function trending(brand, n = 6) {
  const own = new Set(tokens(`${brand.name || ""} ${(brand.domain || "").replace(/\..*$/, "")}`));
  const out = [];
  const add = (t) => {
    const s = (t || "").trim();
    if (s && s.length > 2 && !out.some((o) => o.toLowerCase() === s.toLowerCase())) out.push(s);
  };
  const types = {};
  for (const p of brand.products || []) if (p.type) types[p.type] = (types[p.type] || 0) + 1;
  Object.entries(types).sort((a, b) => b[1] - a[1]).forEach(([t]) => add(t));
  const words = {};
  for (const p of brand.products || []) {
    for (const w of new Set(tokens(p.title))) if (w.length > 3 && !own.has(w) && !STOP.has(w) && !/^\d/.test(w)) words[w] = (words[w] || 0) + 1;
  }
  Object.entries(words).sort((a, b) => b[1] - a[1]).forEach(([w]) => add(w.charAt(0).toUpperCase() + w.slice(1)));
  return out.slice(0, n);
}
