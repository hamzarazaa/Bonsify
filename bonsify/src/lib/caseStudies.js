// Case study copy for the apps we have shipped. Numbers here are only ones
// that can be read from a public store listing (see `proof` in showcase.js);
// everything else is described in terms of what the app does, not invented
// results. Update `stats` when a client shares real figures.
export const CASE_STUDIES = {
  highfy: {
    lede: "A beauty marketplace that was paying to win every shopper twice. We gave it a home on their phone and a direct line back.",
    problem: {
      title: "Great at acquiring. Weak at bringing people back.",
      body: [
        "Highfy sells thousands of beauty and personal care products. Shoppers arrived through ads and search, bought once, and closed the tab. The next visit started from zero, and every re-engagement meant paying for the same person again.",
        "Offers and restock news went out by email, where most of it was never opened. Vouchers were buried in inboxes, and \"where is my order?\" turned into a support message.",
      ],
    },
    solution: {
      title: "An app built around coming back.",
      items: [
        ["Push that sells", "Restock alerts, offers and order updates reach the lock screen instead of the inbox."],
        ["Vouchers in one place", "Every active code sits in a wallet and applies at checkout, so offers get used."],
        ["Order tracking in the app", "Status is one tap away, which takes the \"where is my order\" message off the support queue."],
        ["A portal the team runs", "Banners, collections and promotions change from a dashboard, with no release and no ticket."],
      ],
    },
    stats: "proof",
    outcomes: [
      "An owned channel back to every shopper who installs, not another ad auction.",
      "Repeat visits start on the home screen, one tap from the catalogue.",
      "Marketing changes go live the same day, without waiting on a developer.",
    ],
    portal: { src: "/images/highfy/Highfy-Portal.png", caption: "Highfy's merchant portal: live content and promotions, updated by the team running the store." },
  },
  bachaparty: {
    lede: "A kids' clothing and toy store where parents shop with one hand and a child on the other arm. We made the app work that way.",
    problem: {
      title: "A loyal store on a surface people had to find again.",
      body: [
        "BachaParty's customers are busy parents shopping on phones, often for several children at once. Sizes change every season, so each purchase starts with working out what fits.",
        "There was no icon on the home screen and no way to tell a parent when a favourite item came back or a sale began. Every return visit began in a browser tab.",
      ],
    },
    solution: {
      title: "Shopping that remembers the kids.",
      items: [
        ["Who are you shopping for?", "The home screen opens by asking, and children's details shape what the app suggests."],
        ["Size and colour pickers", "Variant choices that work one-handed, so adding to cart takes two taps."],
        ["Welcome offer", "A first-order discount waiting after install gives people a reason to open the app."],
        ["Order history", "Parents can check and reorder what they bought last season."],
      ],
    },
    stats: null,
    outcomes: [
      "The store lives on the home screen, not in a bookmark.",
      "Drops, restocks and sales reach parents by push.",
      "Reordering for a growing child takes a few taps.",
    ],
    portal: { src: "/images/bachaparty/BP-Portal.png", caption: "BachaParty's merchant portal: live content and promotions, updated by the team running the store." },
  },
  creedvintage: {
    lede: "Wholesale vintage is bought by the bale, on trust and by the photo. We built an app where buyers can see, price and haggle in one place.",
    problem: {
      title: "Wholesale buying, squeezed through chat threads.",
      body: [
        "Creed Vintage sells graded vintage and upcycled clothing in bales and lots. Buyers need to see the grade, the piece count and the price per piece, and many want to negotiate or see the stock on video before committing.",
        "That conversation lived in messaging apps, spread across threads, with prices and photos scrolling out of sight.",
      ],
    },
    solution: {
      title: "A trading floor that fits in a pocket.",
      items: [
        ["Bundle pricing per piece", "Each lot shows its grade, piece count and per-piece price up front."],
        ["Make an offer", "Buyers propose a price inside the app instead of in a chat."],
        ["Video call to see the stock", "Book a call to look at a lot before buying."],
        ["Categories that match how buyers shop", "Vintage, reworked, brand collections and Y2K, each a tap away."],
      ],
    },
    stats: null,
    outcomes: [
      "Offers, questions and orders stay in one place instead of scattered threads.",
      "Buyers see grade and per-piece price before they ask.",
      "Available on the App Store and Google Play.",
    ],
    portal: null,
  },
};
