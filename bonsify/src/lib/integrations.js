// Shopify apps and services a Bonsify app connects to. The list mirrors what
// the leading Shopify mobile app builders (Tapcart, MobiLoud) publish, so a
// store never loses a tool by moving to a done-for-you app. Exact support is
// confirmed per store during the free audit.
export const INTEGRATION_GROUPS = [
  { id: "reviews", title: "Reviews & UGC", apps: ["Yotpo Reviews", "Yotpo UGC", "Okendo", "Judge.me", "Loox", "Stamped Reviews", "Bazaarvoice", "Reviews.io", "Junip", "Foursixty", "Instafeed", "Trustpilot", "Trustspot", "Fera"] },
  { id: "loyalty", title: "Loyalty & referrals", apps: ["Smile.io", "LoyaltyLion", "Rivo", "Yotpo Loyalty & Referrals", "Rise.ai", "Growave", "Inveterate", "ReferralCandy", "Stamped Loyalty", "Okendo Loyalty", "Joy Loyalty", "BON Loyalty", "Bubblehouse", "Talkable"] },
  { id: "subscriptions", title: "Subscriptions", apps: ["Recharge", "Skio", "Stay Ai", "Loop Subscriptions", "Smartrr", "Ordergroove", "Awtomic", "Bold Subscriptions", "Appstle Subscriptions", "Seal Subscriptions", "PayWhirl", "Yotpo Subscriptions", "Shopify Subscriptions"] },
  { id: "bundles", title: "Bundles, upsells & merchandising", apps: ["Rebuy", "Nosto", "Bold Bundles", "BOGOS", "Kimonix", "AfterSell", "Shopify Bundles", "Bundle Builder", "ReConvert", "Zipify OneClickUpsell", "CartHook", "Selleasy", "Purple Dot"] },
  { id: "search", title: "Search & personalization", apps: ["Algolia", "Boost AI", "Klevu", "Searchspring", "Constructor", "Octane AI", "Searchanise", "Doofinder", "Fast Simon", "Findify", "Tagalys", "Dynamic Yield", "Bloomreach"] },
  { id: "wishlist", title: "Wishlists", apps: ["Swish (Wishlist King)", "Wishlist Plus by Swym", "The Wishlist Company", "Flits Wishlist"] },
  { id: "marketing", title: "Email, SMS & push", apps: ["Klaviyo", "Attentive", "Postscript", "Omnisend", "Mailchimp", "Braze", "Listrak", "Dotdigital", "Iterable", "Ometria", "Yotpo SMS & Email", "Drip", "OneSignal", "Salesforce Marketing Cloud", "Redo"] },
  { id: "support", title: "Customer support & chat", apps: ["Gorgias", "Zendesk", "Gladly", "Intercom", "Re:amaze", "Kustomer", "Rep AI", "Tidio", "Richpanel", "Freshdesk", "Help Scout", "LiveChat", "Zowie"] },
  { id: "payments", title: "Payments & checkout", apps: ["Shop Pay", "Apple Pay", "Google Pay", "Klarna", "Afterpay", "Affirm", "Sezzle", "Zip", "PayPal", "Stripe", "Bolt", "Global-e", "Address Autocomplete", "EcoCart"] },
  { id: "shipping", title: "Shipping, tracking & returns", apps: ["AfterShip", "Narvar", "Malomo", "Route", "Loop Returns", "Happy Returns", "ReturnGO", "ReturnLogic", "ShipBob", "ShipStation", "Sorted", "Parcel Panel", "LyveCom", "Order Protection"] },
  { id: "analytics", title: "Analytics, attribution & CRO", apps: ["Google Analytics 4", "Firebase Analytics", "Triple Whale", "Elevar", "Northbeam", "Littledata", "Fairing", "Hotjar", "Microsoft Clarity", "Heap", "AppsFlyer", "Adjust", "Branch", "Google Tag Manager", "Meta Pixel", "TikTok Pixel", "Pinterest Tag", "Justuno", "Digioh"] },
  { id: "video", title: "Video, live & shoppable content", apps: ["Tolstoy", "Firework", "Videowise", "Smartzer", "LiveMeUp", "Influence.io", "CreatorCommerce", "Shared Sweeps"] },
  { id: "fit", title: "Size, fit & try-on", apps: ["TrueFit", "Wair", "Swapt", "DressX"] },
  { id: "store", title: "Storefront, languages & compliance", apps: ["Shopify Markets", "Weglot", "PageFly", "Shogun", "Replo", "GemPages", "LayoutHub", "EComposer", "Zipify Pages", "accessiBe", "Consentmo", "OneTrust"] },
  { id: "native", title: "Native app features", apps: ["Sign in with Apple", "Sign in with Google", "Sign in with Facebook", "Face ID", "Barcode / QR scanner", "Facebook"] },
];

export const INTEGRATION_COUNT = new Set(
  INTEGRATION_GROUPS.flatMap((g) => g.apps)
).size;

export function integrationsByStoreApps(names = []) {
  const wanted = names.map((n) => n.toLowerCase());
  const out = [];
  for (const g of INTEGRATION_GROUPS)
    for (const a of g.apps)
      if (wanted.some((w) => a.toLowerCase().includes(w) || w.includes(a.toLowerCase()))) out.push(a);
  return out;
}
