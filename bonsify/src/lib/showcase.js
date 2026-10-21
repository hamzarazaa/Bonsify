import fs from "fs";
import path from "path";
import { isClientVisible } from "@/lib/clients";

// Apps shown in the "Our apps" tab of every proposal. Screens are a curated
// handful per app, not every page. Anything listed here follows the same
// visibility switch as the public case studies (src/lib/clients.js), so a
// client who hasn't approved being shown is never shown in a proposal either.
//
// `color` is the app's own brand colour, used for its stage in "Our apps"
// and its card in the deck. Pick one that white text reads well on.
//
// `tall: true` marks a full-length capture; it scrolls inside the phone.
// `fallback` is used when `src` isn't in /public yet (e.g. a new Figma
// export that hasn't been added), so a missing file never breaks a page.
//
// `prototype` is the clickable Figma prototype shown in the phone: the file
// key (from the figma.com/design/<key>/... URL), the frame it starts on, and
// that frame's size in Figma (used to crop Figma's own padding off the embed).
// The Figma file must be shared as "Anyone with the link can view", and its
// prototype device set to the frame size, or long screens won't scroll.
//
// `stores` holds the App Store and Play Store links behind the "Try on
// iPhone" and "Try on Android" buttons and the QR code. Leave a link empty
// and its button is hidden. `storesSoon: true` shows both buttons disabled
// with "Coming soon" for an app that isn't live yet.
const APPS = [
  {
    slug: "highfy",
    name: "Highfy",
    color: "#6E1A8A",
    headline: "Beauty, restocked before they ask.",
    tags: ["Beauty marketplace", "Push campaigns", "Vouchers", "Order tracking"],
    icon: "/images/app-icons/HighFy.webp",
    category: "Beauty and personal care",
    platforms: "iOS and Android",
    summary:
      "A beauty marketplace app built to bring shoppers back: push for restocks and offers, vouchers in one place, and order tracking without digging through email.",
    caseStudy: "/work/highfy",
    // Read from the store listings on 20 Oct 2026. Update when the numbers move.
    proof: [
      { big: "10K+", label: "downloads on Google Play" },
      { big: "4.7", label: "on the App Store, from 23 ratings" },
      { big: "#7", label: "in Shopping, top free, App Store Pakistan" },
    ],
    prototype: { file: "7oJM5g6W9VKmv66Z2O6yj6", start: "3251:236", size: [393, 852] },
    stores: {
      ios: "https://apps.apple.com/pk/app/highfy-beauty-shopping/id6793152337",
      android: "https://play.google.com/store/apps/details?id=app.highfy.pk",
    },
    cover: { src: "/images/highfy/App_Home.webp", fallback: "/images/highfy/Home.webp" },
    screens: [
      { src: "/images/highfy/Splash.webp", label: "Launch" },
      { src: "/images/highfy/App_Home.webp", fallback: "/images/highfy/Home.webp", label: "Home" },
      { src: "/images/highfy/App_Product_Full.webp", fallback: "/images/highfy/Product_Page.webp", label: "Product", tall: true },
      { src: "/images/highfy/Voucher.webp", label: "Vouchers" },
      { src: "/images/highfy/Order_Tracking.webp", label: "Tracking" },
    ],
  },
  {
    slug: "bachaparty",
    name: "BachaParty",
    color: "#E8541C",
    headline: "Dress them up in two taps.",
    tags: ["Kids fashion and toys", "Size pickers", "Welcome offer", "Order history"],
    icon: "/images/app-icons/Bachaa_Party.webp",
    category: "Kids clothing and toys",
    platforms: "iOS and Android",
    summary:
      "A playful kids store app with size and colour pickers that work one-handed, a welcome discount on install, and order history parents can check in a tap.",
    caseStudy: "/work/bachaparty",
    prototype: { file: "vUVhFodVTxpyqqmzMWvaFQ", start: "88:1263", size: [440, 956] },
    // Not in the stores yet: the buttons show as "Coming soon". Add the links
    // and remove `storesSoon` once it's live.
    stores: { ios: "", android: "" },
    storesSoon: true,
    cover: { src: "/images/bachaparty/App_Home_Full.webp", fallback: "/images/bachaparty/Product_Detail.webp" },
    screens: [
      { src: "/images/bachaparty/App_Splash.webp", label: "Launch" },
      { src: "/images/bachaparty/App_Home_Full.webp", label: "Home", tall: true },
      { src: "/images/bachaparty/App_Categories.webp", label: "Categories" },
      { src: "/images/bachaparty/App_Product_Full.webp", fallback: "/images/bachaparty/Product_Detail.webp", label: "Product", tall: true },
      { src: "/images/bachaparty/Add_To_Cart.webp", label: "Cart" },
      { src: "/images/bachaparty/Discount.webp", label: "Welcome offer" },
    ],
  },
  {
    // No public case study, so it has its own switch instead of an entry in
    // src/lib/clients.js (which drives the /work pages and their next/prev
    // links). Set NEXT_PUBLIC_SHOW_CREEDVINTAGE=true in Vercel to show it.
    slug: "creedvintage",
    name: "Creed Vintage",
    color: "#A3151C",
    headline: "Vintage, bought by the bale.",
    tags: ["Wholesale", "Bundle pricing", "Make an offer", "Video calls"],
    visibleEnv: "NEXT_PUBLIC_SHOW_CREEDVINTAGE",
    icon: "/images/app-icons/CreedVintage.webp",
    category: "Vintage and upcycled clothing, wholesale",
    platforms: "iOS and Android",
    summary:
      "A wholesale app for vintage and upcycled clothing. Buyers pick bundles priced per piece, make an offer on a lot, or book a video call to see the stock before they pay.",
    caseStudy: "/work/creedvintage",
    prototype: { file: "idVtINPKoPUBJnHz0HAS3j", start: "202:14756", size: [440, 956] },
    stores: {
      ios: "https://apps.apple.com/pk/app/creed-vintage/id6807418808",
      android: "https://play.google.com/store/apps/details?id=com.creed.vintage",
    },
    cover: { src: "/images/creedvintage/App_Home_Full.webp" },
    screens: [
      { src: "/images/creedvintage/App_Splash.webp", label: "Launch" },
      { src: "/images/creedvintage/App_Home_Full.webp", label: "Home", tall: true },
      { src: "/images/creedvintage/App_Category.webp", label: "Category" },
      { src: "/images/creedvintage/App_Product_Full.webp", label: "Product", tall: true },
      { src: "/images/creedvintage/App_Make_Offer.webp", label: "Make an offer" },
      { src: "/images/creedvintage/App_Cart.webp", label: "Cart" },
    ],
  },
];

const PUBLIC = path.join(process.cwd(), "public");
const exists = (src) => src && fs.existsSync(path.join(PUBLIC, src));

function resolve(shot) {
  if (exists(shot.src)) return shot.src;
  if (exists(shot.fallback)) return shot.fallback;
  return null;
}

// Env vars are read by their literal names: Next only substitutes
// NEXT_PUBLIC_* values it can see written out, not dynamic lookups.
const ENV_FLAGS = {
  NEXT_PUBLIC_SHOW_CREEDVINTAGE: process.env.NEXT_PUBLIC_SHOW_CREEDVINTAGE,
};
const isVisible = (a) => (a.visibleEnv ? ENV_FLAGS[a.visibleEnv] === "true" : isClientVisible(a.slug));

const PROTO_PARAMS = [
  "embed-host=bonsify",
  "footer=false",
  "device-frame=false",
  "hotspot-hints=false",
  "viewport-controls=false",
  "disable-default-keyboard-nav=true",
  "scaling=contain",
  "hide-ui=1",
  "content-scaling=fixed",
].join("&");

function prototypeUrl(p) {
  if (!p?.file || !p?.start) return null;
  const node = p.start.replace(":", "-");
  return `https://embed.figma.com/proto/${p.file}/app?node-id=${node}&starting-point-node-id=${node}&${PROTO_PARAMS}`;
}

// Store links for the /get/<slug> redirect behind each app's QR code.
export function getStoreLinks(slug) {
  const app = APPS.find((a) => a.slug === slug && isVisible(a));
  return app ? { ...app.stores, caseStudy: app.caseStudy } : null;
}

export function getShowcaseApps() {
  return APPS.filter(isVisible)
    .map((a) => {
      const screens = a.screens
        .map((s) => {
          const src = resolve(s);
          return src ? { label: s.label, src, tall: Boolean(s.tall) && src === s.src } : null;
        })
        .filter(Boolean);
      const stores = { ios: a.stores?.ios || "", android: a.stores?.android || "" };
      return {
        ...a,
        cover: a.cover ? resolve(a.cover) : null,
        screens,
        prototype: prototypeUrl(a.prototype),
        protoSize: a.prototype?.size || [390, 844],
        stores,
        storesSoon: Boolean(a.storesSoon) && !stores.ios && !stores.android,
        getUrl: stores.ios || stores.android ? `https://bonsify.io/get/${a.slug}` : null,
      };
    })
    .filter((a) => a.screens.length > 0);
}
