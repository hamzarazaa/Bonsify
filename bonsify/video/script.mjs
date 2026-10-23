// Narration for a personalised walkthrough video. One function turns a brand
// (the same JSON the lab apps use) into scenes. Each scene is spoken by the
// cloned voice and shown on the phone.
//
//   say    what the voice reads. Plain sentences, no markup: the engine splits
//          on full stops to time the captions.
//   title  the big heading on the left while the scene plays.
//   app    what the phone does. `at` is a fraction (0 to 1) of the scene's
//          length, so the actions stay in step whatever speed the voice runs at.
//          Calls: show(screen, index), scrollBy(px), add(index), click(label).
//          Screens: splash, home, shop, product, fbt, cart, reviews, chat.

const list = (a) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

export function scenesFor(brand) {
  const name = brand.name;
  const p0 = brand.products[0];
  const cats = [...new Set(brand.products.map((p) => p.type).filter(Boolean))].slice(0, 4).map((c) => c.toLowerCase());
  const item = p0?.title || "a product";
  return [
    {
      id: "hook",
      title: `${name}, as an app`,
      say: `This is ${name} as a mobile app. It is not a mockup. It is running on your real catalogue, and you can try it on your own phone at the end of this video.`,
      app: [{ at: 0, do: ["show", "splash"] }, { at: 0.55, do: ["show", "home"] }],
    },
    {
      id: "home",
      title: "A home screen that sells",
      say: `The home screen opens on your banners and your best sellers. Shoppers jump straight to ${cats.length ? list(cats) : "what they want"}, and today's deals sit right under the fold.`,
      app: [{ at: 0.05, do: ["scrollBy", 300] }, { at: 0.4, do: ["scrollBy", 320] }, { at: 0.75, do: ["scrollBy", -620] }],
    },
    {
      id: "product",
      title: "Product pages that convert",
      say: `Open ${item} and you get a full gallery, the price, the saving, and delivery dates. Pick an option, tap add to cart, and it is in the bag.`,
      app: [{ at: 0, do: ["show", "product", 0] }, { at: 0.35, do: ["scrollBy", 360] }, { at: 0.75, do: ["add", 0] }],
    },
    {
      id: "upsell",
      title: "Bigger baskets, built in",
      say: `Right below, frequently bought together puts the matching items one tap away. That is how a single order turns into a bigger one.`,
      app: [{ at: 0, do: ["show", "fbt", 0] }],
    },
    {
      id: "checkout",
      title: "Cart to checkout",
      say: `The cart shows loyalty points, instalments and your vouchers, and checkout stays short. Your existing payment setup keeps working as it does today.`,
      app: [{ at: 0, do: ["show", "cart"] }, { at: 0.7, do: ["click", "checkout"] }],
    },
    {
      id: "trust",
      title: "Reviews and live help",
      say: `Reviews sit on every product, and a chat button puts your team one tap from the shopper. Both are on screen when the doubt shows up.`,
      app: [{ at: 0, do: ["show", "reviews", 0] }, { at: 0.55, do: ["show", "chat"] }],
    },
    {
      id: "why",
      title: "Why an app",
      say: `An app lives on the home screen. You can send an order update, a restock alert or a sale as a push notification, and shoppers come back without paying for the click again.`,
      app: [{ at: 0, do: ["show", "home"] }, { at: 0.3, do: ["scrollBy", 500] }, { at: 0.7, do: ["scrollBy", -500] }],
    },
    {
      id: "how",
      title: "How we work",
      say: `We build it on top of your existing Shopify store. Products, orders and customers stay in Shopify, so there is nothing to migrate and nothing to rebuild. We keep it running afterwards.`,
      app: [{ at: 0, do: ["show", "home"] }],
    },
    {
      id: "try",
      title: "Try it on your phone",
      say: `Scan the code on screen, or use the link below, to open this exact app on your phone. Tap around. Then tell us what you would change.`,
      app: [{ at: 0, do: ["show", "home"] }],
    },
  ];
}
