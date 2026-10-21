// Sample reviews for products with no real ones to show. They are generated
// from the product and are always labelled "Sample" in the app. The same
// product always gets the same five, so a demo looks the same on every visit.

const NAMES = ["Ayesha K.", "Daniel M.", "Sara L.", "Omar R.", "Hina S.", "Jake T.", "Maria P.", "Bilal A.", "Emily W.", "Zainab F.", "Chris D.", "Noor H.", "Hamid Q.", "Lena V.", "Usman J."];

const BANK = {
  5: [
    ["Exactly what I wanted", "Arrived quickly and looks even better in person. I would happily order it again."],
    ["Love it", "Great quality for the price. I have already recommended it to a friend."],
    ["Worth every penny", "I was unsure at first, but it has become a daily favourite."],
    ["Better than the photos", "Well made and finished. The packaging was neat too."],
    ["Five stars", "Fast delivery and exactly as described. Very happy with this one."],
  ],
  4: [
    ["Very good", "Does the job well. Delivery was on time and the packaging was fine."],
    ["Happy with it", "Matches the photos. A small wait on delivery, but no complaints about the product itself."],
    ["Solid choice", "Good quality and good value. I would buy from here again."],
  ],
  3: [["Decent", "It is fine for the price. Not amazing, but it works and arrived safely."]],
};

const PATTERNS = [
  [5, 5, 4, 5, 4],
  [5, 4, 5, 5, 5],
  [5, 5, 5, 4, 3],
  [4, 5, 5, 5, 4],
  [5, 5, 4, 4, 5],
];
const DAYS = [3, 8, 15, 27, 49];

function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function sampleReviews(product) {
  const r = rng(`${product.handle || ""}|${product.title || ""}`);
  const pattern = PATTERNS[Math.floor(r() * PATTERNS.length)];
  const names = [...NAMES].sort(() => r() - 0.5).slice(0, 5);
  const used = {};
  const reviews = pattern.map((rating, i) => {
    const pool = BANK[rating];
    let k = Math.floor(r() * pool.length);
    while (used[`${rating}${k}`] && pool.length > 1) k = (k + 1) % pool.length;
    used[`${rating}${k}`] = true;
    const [title, body] = pool[k];
    return { name: names[i], rating, title, body, daysAgo: DAYS[i], verified: true };
  });
  const avg = reviews.reduce((n, x) => n + x.rating, 0) / reviews.length;
  return { sample: true, rating: Math.round(avg * 10) / 10, count: reviews.length, reviews };
}

export function ago(days) {
  if (days < 1) return "Today";
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? "" : "s"} ago`;
  if (days < 365) return `${Math.round(days / 30)} month${Math.round(days / 30) === 1 ? "" : "s"} ago`;
  return `${Math.round(days / 365)} year${Math.round(days / 365) === 1 ? "" : "s"} ago`;
}
